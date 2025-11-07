-- Create tables for roadmap suggestions and votes
create table if not exists public.roadmap_suggestions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists public.roadmap_votes (
  suggestion_id uuid not null references public.roadmap_suggestions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (suggestion_id, user_id)
);

alter table public.roadmap_suggestions enable row level security;
alter table public.roadmap_votes enable row level security;

-- Policies: authenticated users can read all suggestions
create policy roadmap_suggestions_select on public.roadmap_suggestions
  for select using (auth.role() = 'authenticated');

-- Authenticated users can insert suggestions for themselves
create policy roadmap_suggestions_insert on public.roadmap_suggestions
  for insert with check (auth.uid() = user_id);

-- Authenticated users can delete their own suggestions
create policy roadmap_suggestions_delete on public.roadmap_suggestions
  for delete using (auth.uid() = user_id);

-- Votes policies
create policy roadmap_votes_select on public.roadmap_votes
  for select using (auth.role() = 'authenticated');

create policy roadmap_votes_insert on public.roadmap_votes
  for insert with check (auth.uid() = user_id);

create policy roadmap_votes_delete on public.roadmap_votes
  for delete using (auth.uid() = user_id);