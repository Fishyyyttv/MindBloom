import 'server-only'
import { auth, currentUser } from '@clerk/nextjs/server'
import { isAdminEmail, isAdminUserId } from '@/lib/admin-users'
import { getRequestIp, getRequestPath } from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface AdminAuthSuccess {
  ok: true
  userId: string
}

interface AdminAuthFailure {
  ok: false
  response: Response
}

type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure

interface RequireAdminOptions {
  action: string
  req: Request
}

function extractEmailFromClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== 'object') return null
  const record = claims as Record<string, unknown>
  const raw =
    record.email ??
    record.email_address ??
    record.primary_email_address ??
    null

  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim().toLowerCase() : null
}

export async function requireAdmin({ action, req }: RequireAdminOptions): Promise<AdminAuthResult> {
  const authResult = await auth()
  const { userId } = authResult
  const route = getRequestPath(req)
  const ip = getRequestIp(req)

  if (!userId) {
    await logEvent({
      level: 'warn',
      category: 'auth',
      action: `${action}.unauthenticated`,
      route,
      ip,
    })
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let isAdmin = isAdminUserId(userId)

  if (!isAdmin) {
    const emailFromClaims = extractEmailFromClaims((authResult as { sessionClaims?: unknown }).sessionClaims)
    if (isAdminEmail(emailFromClaims)) {
      isAdmin = true
    } else {
      try {
        const supabaseAdmin = getSupabaseAdmin()
        const { data } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('clerk_id', userId)
          .maybeSingle()

        if (isAdminEmail(data?.email ?? null)) {
          isAdmin = true
        }
      } catch {
        // If lookup fails, continue to forbidden response below.
      }

      if (!isAdmin) {
        try {
          const user = await currentUser()
          const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null
          if (isAdminEmail(primaryEmail)) {
            isAdmin = true
          }
        } catch {
          // If Clerk user lookup fails, continue to forbidden response below.
        }
      }
    }
  }

  if (!isAdmin) {
    await logEvent({
      level: 'warn',
      category: 'auth',
      action: `${action}.forbidden`,
      userId,
      route,
      ip,
    })
    return {
      ok: false,
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, userId }
}
