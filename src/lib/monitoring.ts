import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type MonitoringLevel = 'info' | 'warn' | 'error'

interface MonitoringEvent {
  level?: MonitoringLevel
  category: string
  action: string
  userId?: string | null
  route?: string | null
  ip?: string | null
  metadata?: Record<string, unknown> | null
}

function isMissingTableError(error: any): boolean {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message ?? '')
}

function clampText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function sanitizeMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!metadata) return null
  try {
    return JSON.parse(
      JSON.stringify(metadata, (_key, value) => {
        if (typeof value === 'string') return value.slice(0, 800)
        return value
      })
    ) as Record<string, unknown>
  } catch {
    return { note: 'metadata_sanitization_failed' }
  }
}

export async function logEvent(event: MonitoringEvent): Promise<void> {
  const level = event.level ?? 'info'
  const payload = {
    level,
    category: clampText(event.category, 80) ?? 'general',
    action: clampText(event.action, 120) ?? 'unspecified',
    user_id: clampText(event.userId ?? null, 120),
    route: clampText(event.route ?? null, 240),
    ip: clampText(event.ip ?? null, 120),
    metadata: sanitizeMetadata(event.metadata),
    created_at: new Date().toISOString(),
  }

  const consoleMessage = `[${payload.level}] ${payload.category}.${payload.action}`
  const consoleDetails = {
    userId: payload.user_id,
    route: payload.route,
    ip: payload.ip,
    metadata: payload.metadata,
  }

  if (payload.level === 'error') {
    console.error(consoleMessage, consoleDetails)
  } else if (payload.level === 'warn') {
    console.warn(consoleMessage, consoleDetails)
  } else {
    console.info(consoleMessage, consoleDetails)
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin.from('security_events').insert(payload)
    if (error && !isMissingTableError(error)) {
      console.error('Failed to insert security event:', error)
    }
  } catch (error) {
    console.error('Failed to persist security event:', error)
  }
}
