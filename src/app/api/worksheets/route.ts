import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import {
  buildRateLimitHeaders,
  buildRateLimitKey,
  checkRateLimit,
  getRequestPath,
  validateMutationOrigin,
} from '@/lib/api-security'
import { logEvent } from '@/lib/monitoring'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ensureAppUser } from '@/lib/server-user'

const WORKSHEET_TABLES = ['worksheet_completions', 'worksheets_completions'] as const

function isMissingRelationError(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false
  return error.code === '42P01' || /does not exist/i.test(error.message ?? '')
}

async function insertWorksheetCompletion(
  userId: string,
  worksheetType: string,
  responses: Record<string, string>
) {
  const supabaseAdmin = getSupabaseAdmin()
  let lastError: { message?: string | null } | null = null

  for (const tableName of WORKSHEET_TABLES) {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert({
        user_id: userId,
        worksheet_type: worksheetType,
        responses,
      })
      .select()
      .single()

    if (!error) {
      return { data, tableName, error: null }
    }

    lastError = error
    if (!isMissingRelationError(error)) {
      break
    }
  }

  return { data: null, tableName: null, error: lastError }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'worksheets.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = checkRateLimit({
    key: buildRateLimitKey('worksheets:write', req, userId),
    limit: 80,
    windowMs: 60_000,
  })
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many writes. Please slow down for a moment.' }, { status: 429, headers })
  }

  const user = await ensureAppUser({ clerkId: userId })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const worksheetType = typeof body?.worksheetType === 'string' ? body.worksheetType.trim() : ''
  if (!worksheetType) {
    return Response.json({ error: 'Worksheet type is required' }, { status: 400, headers })
  }

  if (worksheetType.length > 80) {
    return Response.json({ error: 'Worksheet type is too long' }, { status: 400, headers })
  }

  const rawResponses = body?.responses
  if (!rawResponses || typeof rawResponses !== 'object' || Array.isArray(rawResponses)) {
    return Response.json({ error: 'Responses must be an object' }, { status: 400, headers })
  }

  const responses: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawResponses as Record<string, unknown>)) {
    if (typeof value !== 'string') continue
    const normalizedKey = key.trim().slice(0, 200)
    if (!normalizedKey) continue
    responses[normalizedKey] = value.trim().slice(0, 4000)
  }

  const { data, error, tableName } = await insertWorksheetCompletion(user.id, worksheetType, responses)

  if (error) {
    await logEvent({
      level: 'error',
      category: 'worksheets',
      action: 'save_failed',
      userId,
      route,
      metadata: { message: error.message ?? 'unknown_error', worksheetType },
    })
    return Response.json({ error: error.message ?? 'Failed to save worksheet' }, { status: 500, headers })
  }

  return Response.json({ completion: data, table: tableName }, { headers })
}
