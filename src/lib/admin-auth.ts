import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { isAdminUserId } from '@/lib/admin-users'
import { getRequestIp, getRequestPath } from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'

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

export async function requireAdmin({ action, req }: RequireAdminOptions): Promise<AdminAuthResult> {
  const { userId } = await auth()
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

  if (!isAdminUserId(userId)) {
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
