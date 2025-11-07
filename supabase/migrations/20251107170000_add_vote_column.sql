-- Add vote polarity to roadmap_votes and allow updating own vote
alter table if exists public.roadmap_votes
  add column if not exists vote smallint not null default 1 check (vote in (-1, 1));

-- Create update policy so users can change their own vote
drop policy if exists roadmap_votes_update on public.roadmap_votes;
create policy roadmap_votes_update on public.roadmap_votes
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Ensure select is public (keeps insert/delete restricted)
drop policy if exists roadmap_votes_select on public.roadmap_votes;
drop policy if exists roadmap_votes_select_public on public.roadmap_votes;
create policy roadmap_votes_select_public on public.roadmap_votes
  for select using (true);

-- Optional: backfill default to 1 on existing rows (safe no-op if none)
update public.roadmap_votes set vote = coalesce(vote, 1);