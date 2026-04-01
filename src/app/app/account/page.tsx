'use client'

import { useUser, SignOutButton } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'
import { CreditCard, LogOut, Shield, Bell, Trash2 } from 'lucide-react'

export default function AccountPage() {
  const { user } = useUser()
  const { status, loading, openPortal } = useSubscription()

  const statusBadge = () => {
    if (loading) return <span className="badge bg-gray-100 text-gray-500">Loading…</span>
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
        <p className="text-muted text-sm">Manage your profile and subscription</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-charcoal">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center">
            <span className="font-serif text-2xl text-sage-600">{user?.firstName?.[0] ?? '?'}</span>
          </div>
          <div>
            <p className="font-medium text-charcoal">{user?.fullName ?? '—'}</p>
            <p className="text-sm text-muted">{user?.emailAddresses[0]?.emailAddress ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-charcoal">Subscription</h2>
          {statusBadge()}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          <CreditCard className="w-4 h-4" />
          MindBloom Monthly — $9.99 / month
        </div>
        <button
          onClick={openPortal}
          className="btn-secondary flex items-center gap-2 w-full justify-center"
        >
          <CreditCard className="w-4 h-4" />
          Manage billing & cancel
        </button>
        <p className="text-xs text-muted">You'll be redirected to Stripe's secure billing portal.</p>
      </div>

      {/* Privacy */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-charcoal">Privacy & Data</h2>
        <div className="flex items-start gap-3 text-sm text-muted">
          <Shield className="w-4 h-4 mt-0.5 text-sage-500 shrink-0" />
          <p>Your journal entries and chat sessions are stored securely. We never sell your data or use it for advertising.</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-red-500 hover:bg-red-50 text-sm w-full justify-center">
          <Trash2 className="w-4 h-4" />
          Request data deletion
        </button>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-charcoal flex items-center gap-2">
          <Bell className="w-4 h-4 text-sage-500" /> Notifications
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Daily mood check-in reminder', default: true },
            { label: 'Weekly wellness summary', default: false },
          ].map(item => (
            <label key={item.label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-charcoal">{item.label}</span>
              <div className="relative">
                <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                <div className="w-10 h-5 bg-sage-100 peer-checked:bg-sage-400 rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <SignOutButton redirectUrl="/">
        <button className="btn-secondary w-full flex items-center justify-center gap-2 text-muted">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </SignOutButton>

      <p className="text-center text-xs text-muted pb-8">
        MindBloom is not a licensed therapy service. If you're in crisis, call or text <strong>988</strong>.
      </p>
    </div>
  )
}
