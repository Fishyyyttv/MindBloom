-- Incremental migration: Feature Requests
-- Safe to run on an existing MindBloom database.

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

alter table public.feature_requests enable row level security;

drop policy if exists "Users can read own feature requests" on public.feature_requests;
create policy "Users can read own feature requests"
  on public.feature_requests
  for select
  using (user_id in (select id from public.users where clerk_id = auth.uid()::text));

drop policy if exists "Users can create own feature requests" on public.feature_requests;
create policy "Users can create own feature requests"
  on public.feature_requests
  for insert
  with check (user_id in (select id from public.users where clerk_id = auth.uid()::text));

drop trigger if exists handle_feature_requests_updated_at on public.feature_requests;
create trigger handle_feature_requests_updated_at
  before update on public.feature_requests
  for each row
  execute procedure public.handle_updated_at();
