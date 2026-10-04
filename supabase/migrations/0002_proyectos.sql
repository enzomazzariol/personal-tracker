-- 0002: proyectos. Cada cliente o proyecto con sus tareas, sus bloques (horas) y su fecha de entrega.

begin;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name <> ''),
  client text not null default '',
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index projects_user_idx on public.projects (user_id);

alter table public.projects enable row level security;
create policy "own_rows" on public.projects for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.projects to authenticated;
revoke all on public.projects from anon;

-- Borrar un proyecto no borra su trabajo: tareas y bloques se quedan sin proyecto.
alter table public.tasks add column project_id uuid,
  add foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id);
alter table public.blocks add column project_id uuid,
  add foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id);
create index tasks_project_idx on public.tasks (project_id);
create index blocks_project_idx on public.blocks (project_id);

-- Totales por proyecto. security_invoker hace que la vista respete el RLS de quien la consulta.
create view public.project_summary with (security_invoker = true) as
select
  p.*,
  coalesce((select sum(b.actual_minutes) from public.blocks b where b.project_id = p.id), 0)::int as minutes,
  (select count(*) from public.tasks t where t.project_id = p.id and not t.done)::int as open_tasks
from public.projects p;
grant select on public.project_summary to authenticated;
revoke all on public.project_summary from anon;

commit;
