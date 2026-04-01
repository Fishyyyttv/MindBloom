import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return Response.json({ logs: [] })

  const { data } = await supabaseAdmin
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return Response.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('clerk_id', userId).single()
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const { data, error } = await supabaseAdmin.from('mood_logs').insert({
    user_id: user.id,
    score: body.score,
    emotions: body.emotions ?? [],
    note: body.note ?? null,
  }).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ log: data })
}
