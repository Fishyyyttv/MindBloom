import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface EnsureAppUserParams {
  clerkId: string
  email?: string | null
}

interface AppUserRow {
  id: string
  clerk_id: string
  email: string
}

function getFallbackEmail(clerkId: string): string {
  const safeId = clerkId.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${safeId}@users.mindbloom.local`
}

export async function ensureAppUser({ clerkId, email }: EnsureAppUserParams): Promise<AppUserRow> {
  const supabaseAdmin = getSupabaseAdmin()
  const normalizedEmail = email?.trim() || getFallbackEmail(clerkId)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email')
    .eq('clerk_id', clerkId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    if (normalizedEmail && existing.email !== normalizedEmail) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ email: normalizedEmail })
        .eq('id', existing.id)

      if (!updateError) {
        existing.email = normalizedEmail
      }
    }
    return existing
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ clerk_id: clerkId, email: normalizedEmail })
    .select('id, clerk_id, email')
    .single()

  if (!insertError && inserted) {
    return inserted
  }

  // Handle race condition where another request created the row first.
  const { data: retried, error: retryError } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email')
    .eq('clerk_id', clerkId)
    .maybeSingle()

  if (retryError || !retried) {
    throw insertError ?? retryError ?? new Error('Failed to create user')
  }

  return retried
}

