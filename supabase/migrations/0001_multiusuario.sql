-- 0001: de un solo dueño a multiusuario.
-- Cada fila pasa a pertenecer a una cuenta (user_id, que por defecto es auth.uid()) y RLS solo deja ver las propias.
-- Las filas que ya existen se asignan a la cuenta cuyo correo está en private.owners.
-- Las cuentas nuevas reciben un juego de áreas por defecto.

begin;

do $$
declare
  owner_id uuid;
  t text;
begin
  select u.id into owner_id
  from auth.users u join private.owners o on o.email = u.email
  limit 1;
  if owner_id is null then
    raise exception 'Ninguna cuenta de auth.users tiene el correo de private.owners';
  end if;

  foreach t in array array['areas', 'weeks', 'blocks', 'block_tasks', 'tasks', 'notes', 'reminders'] loop
    execute format('drop policy "owner_all" on public.%I', t);
    execute format('alter table public.%I add column user_id uuid default auth.uid() references auth.users (id) on delete cascade', t);
    execute format('update public.%I set user_id = %L', t, owner_id);
    execute format('alter table public.%I alter column user_id set not null', t);
    execute format(
      'create policy "own_rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Claves por usuario: dos cuentas pueden tener un área 'dev' o una semana que empieza el mismo lunes.
alter table public.blocks drop constraint blocks_area_id_fkey;
alter table public.tasks drop constraint tasks_area_id_fkey;
alter table public.areas drop constraint areas_pkey, add primary key (user_id, id);
alter table public.weeks drop constraint weeks_pkey, add primary key (user_id, start_date);

-- Las referencias incluyen user_id para que nadie pueda colgar filas de datos de otra cuenta.
alter table public.blocks add unique (id, user_id);
alter table public.blocks add foreign key (user_id, area_id) references public.areas (user_id, id);
alter table public.tasks add foreign key (user_id, area_id) references public.areas (user_id, id);
alter table public.block_tasks drop constraint block_tasks_block_id_fkey,
  add foreign key (block_id, user_id) references public.blocks (id, user_id) on delete cascade;

drop index public.blocks_date_idx;
drop index public.blocks_area_idx;
create index blocks_user_date_idx on public.blocks (user_id, date);
create index blocks_user_area_idx on public.blocks (user_id, area_id);
create index block_tasks_user_idx on public.block_tasks (user_id);
create index tasks_user_area_idx on public.tasks (user_id, area_id);
create index notes_user_idx on public.notes (user_id);
create index reminders_user_idx on public.reminders (user_id);

drop function private.is_owner();
drop table private.owners;
revoke usage on schema private from authenticated;

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

commit;
