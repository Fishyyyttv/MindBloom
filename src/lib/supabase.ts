import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase (uses anon key - safe for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side only Supabase (uses service role key - never use in client components)
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : createClient(supabaseUrl, supabaseAnonKey)