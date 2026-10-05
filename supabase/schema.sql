-- Tracker: esquema completo. Crea la base de datos desde cero; los cambios incrementales están en migrations/.
-- Multiusuario: cada fila pertenece a una cuenta (user_id, por defecto auth.uid()) y RLS solo deja ver las propias.

create schema if not exists private;

create table public.areas (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  sort int not null default 0,
  kind text check (kind in ('reading', 'study')), -- qué muestra la tarjeta del bloque en Hoy
  primary key (user_id, id)
);

create table public.weeks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  start_date date not null,
  number int not null,
  goal text not null default '',
  wins text[] not null default '{}',
  review_notes text not null default '',
  reviewed_at timestamptz,
  primary key (user_id, start_date)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name <> ''),
  client text not null default '',
  area_id text,
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (user_id, area_id) references public.areas (user_id, id)
);
create index projects_user_idx on public.projects (user_id);
create index projects_user_area_idx on public.projects (user_id, area_id);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  area_id text not null,
  project_id uuid,
  tag text not null default '',
  title text not null,
  why text not null default '',
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  actual_minutes int not null default 0,
  started_at timestamptz,
  unique (id, user_id),
  foreign key (user_id, area_id) references public.areas (user_id, id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id)
);
create index blocks_user_date_idx on public.blocks (user_id, date);
create index blocks_user_area_idx on public.blocks (user_id, area_id);
create index blocks_project_idx on public.blocks (project_id);

create table public.block_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  block_id uuid not null,
  title text not null,
  done boolean not null default false,
  sort int not null default 0,
  foreign key (block_id, user_id) references public.blocks (id, user_id) on delete cascade
);
create index block_tasks_block_idx on public.block_tasks (block_id);
create index block_tasks_user_idx on public.block_tasks (user_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  kind text not null default 'personal' check (kind in ('personal', 'work')), -- cotidiana o de trabajo
  area_id text,
  project_id uuid,
  due_date date,
  repeat text check (repeat in ('daily', 'weekly', 'monthly')),
  repeat_from uuid, -- la tarea de la que salió, si se repite
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (user_id, area_id) references public.areas (user_id, id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  foreign key (repeat_from, user_id) references public.tasks (id, user_id) on delete set null (repeat_from),
  constraint tasks_project_is_work check (project_id is null or kind = 'work')
);
create index tasks_repeat_from_idx on public.tasks (repeat_from);
create index tasks_user_area_idx on public.tasks (user_id, area_id);
create index tasks_project_idx on public.tasks (project_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_user_idx on public.notes (user_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index reminders_user_idx on public.reminders (user_id);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (company <> ''),
  role text not null default '',
  url text not null default '',
  status text not null default 'saved' check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  applied_on date,
  follow_up_on date, -- volver a escribir; aparece en Hoy
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index job_applications_user_idx on public.job_applications (user_id);

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
  done_at timestamptz,
  sort int not null default 0,
  foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade
);
create index goal_milestones_goal_idx on public.goal_milestones (goal_id);
create index goal_milestones_user_idx on public.goal_milestones (user_id);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (title <> ''),
  author text not null default '',
  pages int check (pages > 0),
  status text not null default 'want' check (status in ('want', 'reading', 'done')),
  started_on date,
  finished_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index books_user_idx on public.books (user_id);

create table public.reading_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id uuid not null,
  date date not null default current_date,
  pages int not null check (pages > 0),
  created_at timestamptz not null default now(),
  foreign key (book_id, user_id) references public.books (id, user_id) on delete cascade
);
create index reading_log_book_idx on public.reading_log (book_id);
create index reading_log_user_date_idx on public.reading_log (user_id, date);

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
  mastered_at timestamptz,
  sort int not null default 0,
  foreign key (track_id, user_id) references public.study_tracks (id, user_id) on delete cascade
);
create index study_topics_track_idx on public.study_topics (track_id);
create index study_topics_user_idx on public.study_topics (user_id);

create table public.journal (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  body text not null default '',
  mood smallint check (mood between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

do $$
declare t text;
begin
  foreach t in array array[
    'areas', 'weeks', 'projects', 'blocks', 'block_tasks', 'tasks', 'notes', 'reminders',
    'job_applications', 'goals', 'goal_milestones', 'books', 'reading_log', 'study_tracks', 'study_topics', 'journal'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own_rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- Totales por proyecto. security_invoker hace que la vista respete el RLS de quien la consulta.
create view public.project_summary with (security_invoker = true) as
select
  p.*,
  coalesce((select sum(b.actual_minutes) from public.blocks b where b.project_id = p.id), 0)::int as minutes,
  (select count(*) from public.tasks t where t.project_id = p.id and not t.done)::int as open_tasks
from public.projects p;
grant select on public.project_summary to authenticated;
revoke all on public.project_summary from anon;

-- Cada cuenta nueva empieza con unas áreas por defecto.
create function private.seed_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.areas (user_id, id, name, sort, kind) values
    (new.id, 'trabajo', 'Trabajo', 1, null),
    (new.id, 'estudio', 'Estudio', 2, 'study'),
    (new.id, 'lectura', 'Lectura', 3, 'reading'),
    (new.id, 'ejercicio', 'Ejercicio', 4, null),
    (new.id, 'colchon', 'Colchón', 5, null);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.seed_new_user();

-- Planificar más rápido: copiar una semana y tareas que se repiten.
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
