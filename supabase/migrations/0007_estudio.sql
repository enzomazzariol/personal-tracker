-- 0007: estudio. Materias con su temario y el estado de cada tema.

begin;

create table public.study_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name <> ''),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index study_tracks_user_idx on public.study_tracks (user_id);

create table public.study_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  track_id uuid not null,
  title text not null check (title <> ''),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'mastered')),
  sort int not null default 0,
  foreign key (track_id, user_id) references public.study_tracks (id, user_id) on delete cascade
);
create index study_topics_track_idx on public.study_topics (track_id);
create index study_topics_user_idx on public.study_topics (user_id);

alter table public.study_tracks enable row level security;
create policy "own_rows" on public.study_tracks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.study_tracks to authenticated;
revoke all on public.study_tracks from anon;

alter table public.study_topics enable row level security;
create policy "own_rows" on public.study_topics for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.study_topics to authenticated;
revoke all on public.study_topics from anon;

commit;
