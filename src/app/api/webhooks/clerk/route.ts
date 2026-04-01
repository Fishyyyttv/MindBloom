import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const headerPayload = headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()

  let event: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: Record<string, unknown> }
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  const { type, data } = event

  if (type === 'user.created') {
    const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address
    await supabaseAdmin.from('users').upsert({
      clerk_id: data.id as string,
      email: email ?? '',
    }, { onConflict: 'clerk_id' })
  }

  if (type === 'user.deleted') {
    await supabaseAdmin.from('users').delete().eq('clerk_id', data.id as string)
  }

  return Response.json({ received: true })
}
