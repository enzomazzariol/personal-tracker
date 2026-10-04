-- Tracker: esquema completo. Crea la base de datos desde cero; los cambios incrementales están en migrations/.
-- Multiusuario: cada fila pertenece a una cuenta (user_id, por defecto auth.uid()) y RLS solo deja ver las propias.

create schema if not exists private;

create table public.areas (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  sort int not null default 0,
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
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  due_date date,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index projects_user_idx on public.projects (user_id);

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
  area_id text,
  project_id uuid,
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (user_id, area_id) references public.areas (user_id, id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id)
);
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

do $$
declare t text;
begin
  foreach t in array array['areas', 'weeks', 'projects', 'blocks', 'block_tasks', 'tasks', 'notes', 'reminders'] loop
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
  insert into public.areas (user_id, id, name, sort) values
    (new.id, 'trabajo', 'Trabajo', 1),
    (new.id, 'estudio', 'Estudio', 2),
    (new.id, 'lectura', 'Lectura', 3),
    (new.id, 'ejercicio', 'Ejercicio', 4),
    (new.id, 'colchon', 'Colchón', 5);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.seed_new_user();
