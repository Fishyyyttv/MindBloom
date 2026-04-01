import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const clerkId = req.nextUrl.searchParams.get('clerk_id')

  if (clerkId) {
    await supabaseAdmin
      .from('users')
      .update({ subscription_status: 'active' })
      .eq('clerk_id', clerkId)
  }

  redirect('/app/chat')
}