import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_USER_ID = 'user_3Bk4ej2PiqeNmdL7Y9obghgEAXt'

export async function GET() {
  const { userId } = await auth()

  // Double check — never expose this data to non-admins
  if (!userId || userId !== ADMIN_USER_ID) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [
      { data: users,      error: e1 },
      { data: messages,   error: e2 },
      { data: diary,      error: e3 },
      { data: moods,      error: e4 },
      { data: worksheets, error: e5 },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('messages').select('id'),
      supabaseAdmin.from('diary_entries').select('id'),
      supabaseAdmin.from('mood_logs').select('score, created_at').order('created_at', { ascending: false }).limit(200),
      supabaseAdmin.from('worksheet_completions').select('id'),
    ])

    if (e1 || e2 || e3 || e4 || e5) {
      console.error('Admin stats error:', e1 ?? e2 ?? e3 ?? e4 ?? e5)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }

    return Response.json({ users, messages, diary, moods, worksheets })
  } catch (err) {
    console.error('Admin stats exception:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}