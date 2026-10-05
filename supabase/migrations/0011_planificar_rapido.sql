-- 0011: planificar más rápido.
-- - copy_week: copia los bloques (y sus tareas, sin marcar) de una semana a otra, todo o nada.
-- - Tareas que se repiten: al marcar una como hecha se crea la siguiente; al desmarcarla, se borra.

begin;

-- Copia los bloques de la semana que empieza en `from_monday` a la que empieza en `to_monday`.
-- security invoker: se ejecuta con los permisos de quien llama, así que RLS solo deja copiar lo propio.
create function public.copy_week(from_monday date, to_monday date) returns int
language plpgsql security invoker set search_path = ''
as $$
declare
  shift int := to_monday - from_monday;
  b record;
  new_id uuid;
  copied int := 0;
begin
  for b in
    select * from public.blocks where date between from_monday and from_monday + 6 order by date, start_time
  loop
    insert into public.blocks (date, start_time, end_time, area_id, project_id, tag, title, why)
    values (b.date + shift, b.start_time, b.end_time, b.area_id, b.project_id, b.tag, b.title, b.why)
    returning id into new_id;
    insert into public.block_tasks (block_id, title, sort)
    select new_id, t.title, t.sort from public.block_tasks t where t.block_id = b.id;
    copied := copied + 1;
  end loop;

  -- La semana nueva hereda la numeración: si la anterior era la 3, esta es la 4.
  insert into public.weeks (start_date, number)
  select to_monday, w.number + (shift / 7) from public.weeks w where w.start_date = from_monday
  on conflict do nothing;

  return copied;
end;
$$;
revoke all on function public.copy_week(date, date) from public, anon;
grant execute on function public.copy_week(date, date) to authenticated;

alter table public.tasks
  add column repeat text check (repeat in ('daily', 'weekly', 'monthly')),
  add column repeat_from uuid, -- la tarea de la que salió
  add unique (id, user_id);
alter table public.tasks
  add foreign key (repeat_from, user_id) references public.tasks (id, user_id) on delete set null (repeat_from);
create index tasks_repeat_from_idx on public.tasks (repeat_from);

-- Siguiente fecha de una tarea que se repite: un intervalo después de la última, sin quedarse en el pasado.
create function public.next_due(last date, repeat text) returns date
language sql stable set search_path = ''
as $$
  select min(d)::date
  from generate_series(
    last + case repeat when 'daily' then interval '1 day' when 'weekly' then interval '1 week' else interval '1 month' end,
    greatest(last, current_date) + interval '1 month',
    case repeat when 'daily' then interval '1 day' when 'weekly' then interval '1 week' else interval '1 month' end
  ) as d
  where d > current_date
$$;
revoke all on function public.next_due(date, text) from public, anon;
grant execute on function public.next_due(date, text) to authenticated;

create function private.repeat_task() returns trigger
language plpgsql security invoker set search_path = ''
as $$
begin
  if new.repeat is null or new.done = old.done then
    return new;
  end if;
  if new.done then
    insert into public.tasks (user_id, title, kind, area_id, project_id, due_date, repeat, repeat_from)
    values (new.user_id, new.title, new.kind, new.area_id, new.project_id,
            public.next_due(coalesce(new.due_date, current_date), new.repeat), new.repeat, new.id);
  else
    -- Desmarcada: se quita la siguiente que había creado, si aún no se ha hecho.
    delete from public.tasks where repeat_from = new.id and not done;
  end if;
  return new;
end;
$$;

create trigger tasks_repeat
  after update of done on public.tasks
  for each row execute function private.repeat_task();

commit;
