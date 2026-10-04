-- Tracker: esquema de la etapa 1
-- Un solo dueño. Solo el correo listado en private.owners puede leer o escribir.

create schema if not exists private;

create table private.owners (email text primary key);

create function private.is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.owners o
    where o.email = (select auth.jwt() ->> 'email')
  );
$$;

revoke all on function private.is_owner() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_owner() to authenticated;

create table public.areas (
  id text primary key,
  name text not null,
  sort int not null default 0
);

create table public.weeks (
  start_date date primary key,
  number int not null,
  goal text not null default '',
  wins text[] not null default '{}',
  review_notes text not null default '',
  reviewed_at timestamptz
);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  area_id text not null references public.areas (id),
  tag text not null default '',
  title text not null,
  why text not null default '',
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  actual_minutes int not null default 0,
  started_at timestamptz
);
create index blocks_date_idx on public.blocks (date);
create index blocks_area_idx on public.blocks (area_id);

create table public.block_tasks (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.blocks (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort int not null default 0
);
create index block_tasks_block_idx on public.block_tasks (block_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area_id text references public.areas (id),
  due_date date,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index tasks_area_idx on public.tasks (area_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  remind_at timestamptz not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['areas', 'weeks', 'blocks', 'block_tasks', 'tasks', 'notes', 'reminders'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()))', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

alter table private.owners enable row level security;

insert into public.areas (id, name, sort) values
  ('dev', 'Empleo dev', 1),
  ('guarapo', 'Guarapo Media', 2),
  ('estudio', 'Otros estudios', 3),
  ('lectura', 'Lectura', 4),
  ('ejercicio', 'Ejercicio', 5),
  ('colchon', 'Colchón', 6);
