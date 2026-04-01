import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

const MAX_CONTENT_LENGTH = 10000
const MAX_TITLE_LENGTH = 200

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return Response.json({ entries: [] })

  const { data, error } = await supabaseAdmin
    .from('diary_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100) // Cap how many entries we return at once

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ entries: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate content
  if (!body.content || typeof body.content !== 'string') {
    return Response.json({ error: 'Content is required' }, { status: 400 })
  }
  if (body.content.length > MAX_CONTENT_LENGTH) {
    return Response.json({ error: 'Content too long' }, { status: 400 })
  }
  if (body.title && body.title.length > MAX_TITLE_LENGTH) {
    return Response.json({ error: 'Title too long' }, { status: 400 })
  }
  if (body.mood !== undefined && (typeof body.mood !== 'number' || body.mood < 1 || body.mood > 5)) {
    return Response.json({ error: 'Invalid mood value' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin.from('diary_entries').insert({
    user_id: user.id,
    title: body.title?.trim() ?? null,
    content: body.content.trim(),
    mood: body.mood ?? null,
    tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ entry: data })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const entryId = searchParams.get('id')
  if (!entryId) return Response.json({ error: 'Missing entry ID' }, { status: 400 })

  // Make sure the entry belongs to this user before deleting
  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('diary_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id) // Critical: scope delete to this user only

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}