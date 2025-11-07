-- Update policies to allow public read access for roadmap tables
-- This keeps insert/delete restricted to authenticated users

-- Suggestions: drop previous select policy and allow public select
drop policy if exists roadmap_suggestions_select on public.roadmap_suggestions;
create policy roadmap_suggestions_select_public on public.roadmap_suggestions
  for select using (true);

-- Votes: drop previous select policy and allow public select
drop policy if exists roadmap_votes_select on public.roadmap_votes;
create policy roadmap_votes_select_public on public.roadmap_votes
  for select using (true);

-- Keep existing insert/delete policies intact
-- insert: authenticated users only (already defined in previous migration)
-- delete: only owner (already defined in previous migration)