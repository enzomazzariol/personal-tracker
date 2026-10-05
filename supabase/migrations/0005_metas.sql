-- 0005: metas. Objetivos por trimestre o año, con hitos para medir el avance.

begin;

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (title <> ''),
  period text not null, -- '2026' o '2026-T4'
  due_date date,
  status text not null default 'active' check (status in ('active', 'done', 'dropped')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index goals_user_idx on public.goals (user_id);

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id uuid not null,
  title text not null check (title <> ''),
  done boolean not null default false,
  sort int not null default 0,
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);
create index goal_milestones_goal_idx on public.goal_milestones (goal_id);
create index goal_milestones_user_idx on public.goal_milestones (user_id);

alter table public.goals enable row level security;
create policy "own_rows" on public.goals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.goals to authenticated;
revoke all on public.goals from anon;

alter table public.goal_milestones enable row level security;
create policy "own_rows" on public.goal_milestones for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.goal_milestones to authenticated;
revoke all on public.goal_milestones from anon;

commit;
