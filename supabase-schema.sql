-- MindBloom Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (synced from Clerk via webhooks)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique not null,
  email text not null,
  stripe_customer_id text unique,
  subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  subscription_id text,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat sessions
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null default 'Conversation',
  mood_before int check (mood_before between 1 and 10),
  mood_after int check (mood_after between 1 and 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.chat_sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Diary entries
create table if not exists public.diary_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  title text,
  content text not null,
  mood int check (mood between 1 and 5),
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mood logs
create table if not exists public.mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  score int check (score between 1 and 10) not null,
  emotions text[] default '{}',
  note text,
  created_at timestamptz default now()
);

-- Bug reports
create table if not exists public.bug_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  title text not null,
  description text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'triaged', 'in_progress', 'resolved')),
  page_url text,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feature requests
create table if not exists public.feature_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  title text not null,
  description text not null,
  impact text not null default 'helpful' check (impact in ('nice_to_have', 'helpful', 'high_impact', 'game_changer')),
  category text not null default 'other' check (category in ('ai', 'wellness_tools', 'journal', 'mood', 'design', 'integrations', 'other')),
  status text not null default 'open' check (status in ('open', 'under_review', 'planned', 'in_progress', 'shipped', 'declined')),
  page_url text,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Worksheet completions
create table if not exists public.worksheet_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  worksheet_type text not null,
  responses jsonb default '{}',
  created_at timestamptz default now()
);

-- Skill sessions (tracking which skills users complete)
create table if not exists public.skill_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  skill_type text not null,
  duration_seconds int,
  created_at timestamptz default now()
);

-- Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  endpoint text unique not null,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notification preferences
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  push_enabled boolean not null default false,
  daily_reminder boolean not null default true,
  weekly_summary boolean not null default false,
  last_daily_sent_at timestamptz,
  last_weekly_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Data deletion requests (GDPR / CCPA)
create table if not exists public.data_deletion_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  clerk_id text,
  email_snapshot text,
  reason text,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  failure_reason text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Security / monitoring events (server-side telemetry)
create table if not exists public.security_events (
  id uuid primary key default uuid_generate_v4(),
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  category text not null,
  action text not null,
  user_id text,
  route text,
  ip text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_created_at on public.security_events(created_at desc);
create index if not exists idx_security_events_category on public.security_events(category);
create index if not exists idx_security_events_level on public.security_events(level);

-- RLS Policies
alter table public.users enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.diary_entries enable row level security;
alter table public.mood_logs enable row level security;
alter table public.bug_reports enable row level security;
alter table public.feature_requests enable row level security;
alter table public.worksheet_completions enable row level security;
alter table public.skill_sessions enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.data_deletion_requests enable row level security;
alter table public.security_events enable row level security;

-- Users can only see their own data
create policy "Users can view own profile" on public.users for select using (clerk_id = auth.uid()::text);
create policy "Users can update own profile" on public.users for update using (clerk_id = auth.uid()::text);

-- Chat
create policy "Users own chat sessions" on public.chat_sessions for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));
create policy "Users own messages" on public.messages for all using (session_id in (select id from public.chat_sessions where user_id in (select id from public.users where clerk_id = auth.uid()::text)));

-- Diary
create policy "Users own diary entries" on public.diary_entries for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Mood
create policy "Users own mood logs" on public.mood_logs for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Bug reports
create policy "Users can read own bug reports" on public.bug_reports for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));
create policy "Users can create own bug reports" on public.bug_reports for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Feature requests
create policy "Users can read own feature requests" on public.feature_requests for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));
create policy "Users can create own feature requests" on public.feature_requests for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Worksheets
create policy "Users own worksheet completions" on public.worksheet_completions for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Skills
create policy "Users own skill sessions" on public.skill_sessions for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Push subscriptions
create policy "Users own push subscriptions" on public.push_subscriptions for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Notification preferences
create policy "Users own notification preferences" on public.notification_preferences for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Data deletion requests
create policy "Users can read own deletion requests" on public.data_deletion_requests for select using (user_id in (select id from public.users where clerk_id = auth.uid()::text));
create policy "Users can create own deletion requests" on public.data_deletion_requests for insert with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at before update on public.users for each row execute procedure public.handle_updated_at();
create trigger handle_diary_updated_at before update on public.diary_entries for each row execute procedure public.handle_updated_at();
create trigger handle_sessions_updated_at before update on public.chat_sessions for each row execute procedure public.handle_updated_at();
create trigger handle_bug_reports_updated_at before update on public.bug_reports for each row execute procedure public.handle_updated_at();
create trigger handle_feature_requests_updated_at before update on public.feature_requests for each row execute procedure public.handle_updated_at();
create trigger handle_push_subscriptions_updated_at before update on public.push_subscriptions for each row execute procedure public.handle_updated_at();
create trigger handle_notification_preferences_updated_at before update on public.notification_preferences for each row execute procedure public.handle_updated_at();
create trigger handle_data_deletion_requests_updated_at before update on public.data_deletion_requests for each row execute procedure public.handle_updated_at();
