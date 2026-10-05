-- 0004: ofertas. Registro de candidaturas a empleo con su estado.

begin;

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (company <> ''),
  role text not null default '',
  url text not null default '',
  status text not null default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  applied_on date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index job_applications_user_idx on public.job_applications (user_id);

alter table public.job_applications enable row level security;
create policy "own_rows" on public.job_applications for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.job_applications to authenticated;
revoke all on public.job_applications from anon;

commit;
