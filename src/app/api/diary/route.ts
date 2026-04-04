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

const MAX_CONTENT_LENGTH = 10000
const MAX_TITLE_LENGTH = 200

function rateLimitForRead(req: Request, userId: string) {
  return checkRateLimit({
    key: buildRateLimitKey('diary:list', req, userId),
    limit: 120,
    windowMs: 60_000,
  })
}

function rateLimitForWrite(req: Request, userId: string) {
  return checkRateLimit({
    key: buildRateLimitKey('diary:write', req, userId),
    limit: 60,
    windowMs: 60_000,
  })
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = rateLimitForRead(req, userId)
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const user = await ensureAppUser({ clerkId: userId })

  const { data, error } = await supabaseAdmin
    .from('diary_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    await logEvent({
      level: 'error',
      category: 'diary',
      action: 'list_failed',
      userId,
      route: getRequestPath(req),
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json({ entries: data ?? [] }, { headers })
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
      action: 'diary.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = rateLimitForWrite(req, userId)
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many writes. Please slow down for a moment.' }, { status: 429, headers })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const user = await ensureAppUser({ clerkId: userId })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  if (!body.content || typeof body.content !== 'string') {
    return Response.json({ error: 'Content is required' }, { status: 400, headers })
  }
  if (body.content.length > MAX_CONTENT_LENGTH) {
    return Response.json({ error: 'Content too long' }, { status: 400, headers })
  }
  if (body.title && body.title.length > MAX_TITLE_LENGTH) {
    return Response.json({ error: 'Title too long' }, { status: 400, headers })
  }
  if (body.mood !== undefined && (typeof body.mood !== 'number' || body.mood < 1 || body.mood > 5)) {
    return Response.json({ error: 'Invalid mood value' }, { status: 400, headers })
  }

  const { data, error } = await supabaseAdmin
    .from('diary_entries')
    .insert({
      user_id: user.id,
      title: body.title?.trim() ?? null,
      content: body.content.trim(),
      mood: body.mood ?? null,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
    })
    .select()
    .single()

  if (error) {
    await logEvent({
      level: 'error',
      category: 'diary',
      action: 'create_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json({ entry: data }, { headers })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const route = getRequestPath(req)
  const originCheck = validateMutationOrigin(req)
  if (!originCheck.ok) {
    await logEvent({
      level: 'warn',
      category: 'security',
      action: 'diary.delete.origin_blocked',
      userId,
      route,
      metadata: { reason: originCheck.reason },
    })
    return Response.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  const rateLimit = rateLimitForWrite(req, userId)
  const headers = buildRateLimitHeaders(rateLimit)
  if (!rateLimit.allowed) {
    return Response.json({ error: 'Too many writes. Please slow down for a moment.' }, { status: 429, headers })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const user = await ensureAppUser({ clerkId: userId })

  const { searchParams } = new URL(req.url)
  const entryId = searchParams.get('id')
  if (!entryId) return Response.json({ error: 'Missing entry ID' }, { status: 400, headers })

  const { error } = await supabaseAdmin.from('diary_entries').delete().eq('id', entryId).eq('user_id', user.id)

  if (error) {
    await logEvent({
      level: 'error',
      category: 'diary',
      action: 'delete_failed',
      userId,
      route,
      metadata: { message: error.message, code: error.code, entryId },
    })
    return Response.json({ error: error.message }, { status: 500, headers })
  }

  return Response.json({ success: true }, { headers })
}
