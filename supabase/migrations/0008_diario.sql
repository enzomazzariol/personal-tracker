-- 0008: diario. Una entrada corta al día con el estado de ánimo.

begin;

create table public.journal (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  body text not null default '',
  mood smallint check (mood between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.journal enable row level security;
create policy "own_rows" on public.journal for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.journal to authenticated;
revoke all on public.journal from anon;

commit;
