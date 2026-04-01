export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          stripe_customer_id: string | null
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_id: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          mood_before: number | null
          mood_after: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          mood: number | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['diary_entries']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['diary_entries']['Insert']>
      }
      mood_logs: {
        Row: {
          id: string
          user_id: string
          score: number
          emotions: string[]
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mood_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['mood_logs']['Insert']>
      }
      worksheet_completions: {
        Row: {
          id: string
          user_id: string
          worksheet_type: string
          responses: Record<string, string>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['worksheet_completions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['worksheet_completions']['Insert']>
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row']
export type MoodLog = Database['public']['Tables']['mood_logs']['Row']
