'use client'

import { useEffect, useState } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { CreditCard, LogOut, Shield, Bell, Trash2, Bot, Save, Bug } from 'lucide-react'
import { toast } from 'sonner'
import {
  AI_CONFIG_STORAGE_KEY,
  DEFAULT_AI_CONFIG,
  normalizeAIConfig,
  type AICompanionConfig,
} from '@/lib/ai-config'

interface NotificationPreferences {
  pushEnabled: boolean
  dailyReminder: boolean
  weeklySummary: boolean
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: false,
  dailyReminder: true,
  weeklySummary: false,
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function AccountPage() {
  const router = useRouter()
  const { user } = useUser()
  const { status, loading, openPortal } = useSubscription()

  const [aiConfig, setAiConfig] = useState<AICompanionConfig>(DEFAULT_AI_CONFIG)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsSaving, setNotificationsSaving] = useState(false)
  const [sendingTestNotification, setSendingTestNotification] = useState(false)
  const [deletingData, setDeletingData] = useState(false)
  const [pushSupportChecked, setPushSupportChecked] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setPushSupported(supported)
    setPushSupportChecked(true)
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY)
      if (!raw) return
      setAiConfig(normalizeAIConfig(JSON.parse(raw)))
    } catch {
      setAiConfig(DEFAULT_AI_CONFIG)
    }
  }, [])

  useEffect(() => {
    const loadNotificationPreferences = async () => {
      setNotificationsLoading(true)
      try {
        const response = await fetch('/api/notifications/preferences')
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || 'Failed to load notifications')
        setNotificationPreferences({
          pushEnabled: Boolean(payload.pushEnabled),
          dailyReminder: Boolean(payload.dailyReminder),
          weeklySummary: Boolean(payload.weeklySummary),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load notifications'
        toast.error(message)
      } finally {
        setNotificationsLoading(false)
      }
    }

    void loadNotificationPreferences()
  }, [])

  const updateAiConfig = (patch: Partial<AICompanionConfig>) => {
    setAiConfig((prev) => ({ ...prev, ...patch }))
  }

  const saveAiConfig = () => {
    const normalized = normalizeAIConfig(aiConfig)
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(normalized))
    setAiConfig(normalized)
    toast.success('AI settings saved')
  }

  const saveNotificationPreferences = async (next: NotificationPreferences) => {
    setNotificationsSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to save notification preferences')
      setNotificationPreferences(next)
    } finally {
      setNotificationsSaving(false)
    }
  }

  const subscribeCurrentDevice = async (): Promise<boolean> => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported on this device/browser.')
      return false
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      toast.error('Push notifications are not configured yet.')
      return false
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      toast.error('Notification permission was not granted.')
      return false
    }

    await navigator.serviceWorker.register('/sw.js')
    const registration = await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
    }

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      }),
    })

    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.error || 'Could not register this device for push notifications')

    return true
  }

  const disablePushOnDevice = async () => {
    if (!pushSupported) return

    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      const endpoint = existingSubscription?.endpoint ?? null
      if (existingSubscription) {
        await existingSubscription.unsubscribe()
      }

      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })

      const next = {
        ...notificationPreferences,
        pushEnabled: false,
      }
      await saveNotificationPreferences(next)
      toast.success('Push notifications disabled on this device')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not disable push notifications'
      toast.error(message)
    }
  }

  const updateNotificationToggle = async (patch: Partial<NotificationPreferences>) => {
    try {
      let next: NotificationPreferences = {
        ...notificationPreferences,
        ...patch,
      }

      if ((next.dailyReminder || next.weeklySummary) && !next.pushEnabled) {
        const enabled = await subscribeCurrentDevice()
        if (!enabled) return
        next = { ...next, pushEnabled: true }
      }

      await saveNotificationPreferences(next)
      toast.success('Notification settings updated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update notification settings'
      toast.error(message)
    }
  }

  const sendTestNotification = async () => {
    setSendingTestNotification(true)
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'This is a test notification from MindBloom.' }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to send test notification')

      if (payload?.sent > 0) {
        toast.success('Test notification sent')
      } else {
        toast.error('No active subscriptions were found for this account')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send test notification'
      toast.error(message)
    } finally {
      setSendingTestNotification(false)
    }
  }

  const requestDataDeletion = async () => {
    const confirmed = window.confirm(
      'This permanently deletes your account and all data (journal, chat, mood logs, worksheets, and profile). This cannot be undone. Continue?'
    )
    if (!confirmed) return

    setDeletingData(true)
    try {
      const response = await fetch('/api/account/delete-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'User requested account deletion from account settings.',
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to delete account data')

      toast.success('Your account data has been deleted.')
      router.replace('/')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account data'
      toast.error(message)
    } finally {
      setDeletingData(false)
    }
  }

  const statusBadge = () => {
    if (loading) return <span className="badge bg-gray-100 text-gray-500">Loading...</span>
    if (status === 'active') return <span className="badge bg-green-100 text-green-700">Active</span>
    if (status === 'trialing') return <span className="badge bg-blue-100 text-blue-700">Trial</span>
    if (status === 'past_due') return <span className="badge bg-yellow-100 text-yellow-700">Past due</span>
    if (status === 'canceled') return <span className="badge bg-red-100 text-red-700">Canceled</span>
    return <span className="badge bg-gray-100 text-gray-500">None</span>
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Account</h1>
        <p className="text-muted text-sm">Manage your profile, subscription, and AI companion settings</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-charcoal">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center">
            <span className="font-serif text-2xl text-sage-600">{user?.firstName?.[0] ?? '?'}</span>
          </div>
          <div>
            <p className="font-medium text-charcoal">{user?.fullName ?? '-'}</p>
            <p className="text-sm text-muted">{user?.emailAddresses[0]?.emailAddress ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">Subscription</h2>
          {statusBadge()}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          <CreditCard className="w-4 h-4" />
          MindBloom Monthly - $9.99 / month
        </div>
        <button onClick={openPortal} className="btn-secondary flex items-center gap-2 w-full justify-center">
          <CreditCard className="w-4 h-4" />
          Manage billing and cancel
        </button>
        <p className="text-xs text-muted">You will be redirected to Stripe&apos;s secure billing portal.</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-charcoal flex items-center gap-2">
          <Bot className="w-4 h-4 text-sage-500" /> AI Companion Settings
        </h2>
        <p className="text-xs text-muted">These settings are used whenever you chat with your AI companion.</p>

        <div>
          <label className="label">Companion name</label>
          <input
            value={aiConfig.name}
            onChange={(event) => updateAiConfig({ name: event.target.value })}
            className="input"
            maxLength={40}
            placeholder="Bloom"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Tone</label>
            <select
              value={aiConfig.tone}
              onChange={(event) => updateAiConfig({ tone: event.target.value as AICompanionConfig['tone'] })}
              className="input"
            >
              <option value="gentle">Gentle</option>
              <option value="balanced">Balanced</option>
              <option value="direct">Direct</option>
              <option value="motivational">Motivational</option>
            </select>
          </div>

          <div>
            <label className="label">Response depth</label>
            <select
              value={aiConfig.responseStyle}
              onChange={(event) => updateAiConfig({ responseStyle: event.target.value as AICompanionConfig['responseStyle'] })}
              className="input"
            >
              <option value="brief">Brief</option>
              <option value="balanced">Balanced</option>
              <option value="deep">Deep</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Focus areas (optional)</label>
          <textarea
            value={aiConfig.focus}
            onChange={(event) => updateAiConfig({ focus: event.target.value })}
            className="textarea"
            rows={2}
            maxLength={400}
            placeholder="Examples: anxiety in relationships, sleep routines, emotional regulation"
          />
        </div>

        <div>
          <label className="label">Custom instructions (optional)</label>
          <textarea
            value={aiConfig.customInstructions}
            onChange={(event) => updateAiConfig({ customInstructions: event.target.value })}
            className="textarea"
            rows={3}
            maxLength={400}
            placeholder="Example: Ask me one question at a time and keep suggestions practical"
          />
        </div>

        <button onClick={saveAiConfig} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Save AI settings
        </button>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-charcoal">Privacy and Data</h2>
        <div className="flex items-start gap-3 text-sm text-muted">
          <Shield className="w-4 h-4 mt-0.5 text-sage-500 shrink-0" />
          <p>Your journal entries and chat sessions are stored securely. We never sell your data or use it for advertising.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/privacy" className="btn-secondary flex-1 text-center">
            Privacy Policy
          </Link>
          <Link href="/terms" className="btn-secondary flex-1 text-center">
            Terms of Service
          </Link>
        </div>
        <button
          onClick={() => void requestDataDeletion()}
          disabled={deletingData}
          className="btn-ghost flex items-center gap-2 text-red-500 hover:bg-red-50 text-sm w-full justify-center"
        >
          <Trash2 className="w-4 h-4" />
          {deletingData ? 'Deleting account data...' : 'Request data deletion'}
        </button>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-charcoal">Support</h2>
        <p className="text-sm text-muted">Found a bug or have a feature idea? Send feedback so it appears in your admin dashboard.</p>
        <Link href="/app/report-bug" className="btn-secondary w-full flex items-center justify-center gap-2">
          <Bug className="w-4 h-4" />
          Send feedback
        </Link>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-charcoal flex items-center gap-2">
          <Bell className="w-4 h-4 text-sage-500" /> Notifications
        </h2>

        {!pushSupportChecked ? (
          <p className="text-sm text-muted">Checking notification support...</p>
        ) : !pushSupported ? (
          <p className="text-sm text-muted">Push notifications are not supported on this browser/device.</p>
        ) : notificationsLoading ? (
          <p className="text-sm text-muted">Loading notification preferences...</p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Device push status: <span className={notificationPreferences.pushEnabled ? 'text-green-700' : 'text-muted'}>{notificationPreferences.pushEnabled ? 'enabled' : 'disabled'}</span>
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-charcoal">Daily mood check-in reminder</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.dailyReminder}
                    onChange={(event) => void updateNotificationToggle({ dailyReminder: event.target.checked })}
                    disabled={notificationsSaving}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-sage-100 peer-checked:bg-sage-400 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-charcoal">Weekly wellness summary</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.weeklySummary}
                    onChange={(event) => void updateNotificationToggle({ weeklySummary: event.target.checked })}
                    disabled={notificationsSaving}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-sage-100 peer-checked:bg-sage-400 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <button
                onClick={() => void sendTestNotification()}
                disabled={sendingTestNotification || notificationsSaving || !notificationPreferences.pushEnabled}
                className="btn-secondary w-full text-sm"
              >
                {sendingTestNotification ? 'Sending test...' : 'Send test notification'}
              </button>
              <button
                onClick={() => void disablePushOnDevice()}
                disabled={notificationsSaving || !notificationPreferences.pushEnabled}
                className="btn-ghost w-full text-sm"
              >
                Disable push on this device
              </button>
            </div>
          </>
        )}
      </div>

      <SignOutButton redirectUrl="/">
        <button className="btn-secondary w-full flex items-center justify-center gap-2 text-muted">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </SignOutButton>

      <p className="text-center text-xs text-muted pb-8">
        MindBloom is not a licensed therapy service. If you are in crisis, call or text <strong>988</strong>.
      </p>
    </div>
  )
}
