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

-- RLS Policies
alter table public.users enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.diary_entries enable row level security;
alter table public.mood_logs enable row level security;
alter table public.worksheet_completions enable row level security;
alter table public.skill_sessions enable row level security;

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

-- Worksheets
create policy "Users own worksheet completions" on public.worksheet_completions for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

-- Skills
create policy "Users own skill sessions" on public.skill_sessions for all using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

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
