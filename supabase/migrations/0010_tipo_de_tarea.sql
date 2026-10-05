-- 0010: tareas cotidianas y de trabajo.
-- Las existentes con proyecto o área pasan a trabajo; las que no tienen ninguno, a cotidianas.
-- Una tarea con proyecto siempre es de trabajo.

begin;

alter table public.tasks add column kind text not null default 'personal' check (kind in ('personal', 'work'));
update public.tasks set kind = 'work' where project_id is not null or area_id is not null;
alter table public.tasks add constraint tasks_project_is_work check (project_id is null or kind = 'work');

commit;
