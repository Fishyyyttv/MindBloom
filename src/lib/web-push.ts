import 'server-only'
import webpush, { PushSubscription } from 'web-push'
import { getOptionalEnv, getRequiredEnv } from '@/lib/env'

let configured = false

function ensureConfigured() {
  if (configured) return

  const publicKey = getRequiredEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY')
  const privateKey = getRequiredEnv('VAPID_PRIVATE_KEY')
  const subject = getOptionalEnv('VAPID_SUBJECT') || 'mailto:support@mindbloom.app'

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export function isWebPushConfigured() {
  return Boolean(getOptionalEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY') && getOptionalEnv('VAPID_PRIVATE_KEY'))
}

export async function sendWebPush(subscription: PushSubscription, payload: Record<string, unknown>) {
  ensureConfigured()
  return webpush.sendNotification(subscription, JSON.stringify(payload))
}
