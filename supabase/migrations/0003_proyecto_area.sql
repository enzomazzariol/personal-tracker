-- 0003: cada proyecto puede pertenecer a un área. Así un bloque genérico del área
-- (p. ej. «Guarapo Media: proyectos») muestra las tareas de los proyectos de esa área.

begin;

alter table public.projects add column area_id text,
  add foreign key (user_id, area_id) references public.areas (user_id, id);
create index projects_user_area_idx on public.projects (user_id, area_id);

-- La vista se crea con las columnas de p.* de ese momento: hay que rehacerla para incluir area_id.
drop view public.project_summary;
create view public.project_summary with (security_invoker = true) as
select
  p.*,
  coalesce((select sum(b.actual_minutes) from public.blocks b where b.project_id = p.id), 0)::int as minutes,
  (select count(*) from public.tasks t where t.project_id = p.id and not t.done)::int as open_tasks
from public.projects p;
grant select on public.project_summary to authenticated;
revoke all on public.project_summary from anon;

commit;
