-- Comprobaciones de aislamiento entre cuentas. Se ejecutan tras el esquema (nuevo o migrado).
-- Supone dos cuentas: a@x.es (con datos) y b@x.es. Cualquier fallo aborta con un error.
\set ON_ERROR_STOP on

-- Reglas que toda tabla de public debe cumplir (cubren también las tablas futuras)
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'blocks_of_a' loop
    assert (select relrowsecurity from pg_class where oid = format('public.%I', r.relname)::regclass), r.relname || ' sin RLS';
    assert exists (select 1 from pg_policies where schemaname = 'public' and tablename = r.relname and policyname = 'own_rows'), r.relname || ' sin política own_rows';
    assert not has_table_privilege('anon', format('public.%I', r.relname), 'select'), r.relname || ' legible por anon';
    assert exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = r.relname and column_name = 'user_id'), r.relname || ' sin user_id';
  end loop;
  -- Toda referencia entre tablas de public incluye user_id, para no poder mezclar cuentas.
  for r in select con.conname, con.conrelid::regclass as tbl from pg_constraint con
           join pg_class t on t.oid = con.confrelid join pg_namespace n on n.oid = t.relnamespace
           where con.contype = 'f' and n.nspname = 'public'
             and not exists (select 1 from pg_attribute a where a.attrelid = con.conrelid and a.attnum = any (con.conkey) and a.attname = 'user_id') loop
    raise exception 'La referencia % de % no incluye user_id', r.conname, r.tbl;
  end loop;
end $$;

-- b recibió áreas por defecto al registrarse
select public.as_user('b@x.es');
do $$ begin
  assert (select count(*) from public.areas) = 5, 'b debería tener 5 áreas por defecto';
  assert (select kind from public.areas where id = 'lectura') = 'reading', 'el área de lectura de b debería tener tipo reading';
  assert (select count(*) from public.blocks) = 0, 'b no debería ver bloques de a';
  assert (select count(*) from public.tasks) = 0, 'b no debería ver tareas de a';
end $$;

-- b crea sus cosas sin indicar user_id
insert into public.blocks (date, start_time, end_time, area_id, title) values ('2026-10-05', '09:00', '10:00', 'trabajo', 'Bloque de b');
insert into public.weeks (start_date, number) values ('2026-10-05', 1);

-- copy_week copia solo lo de b, con sus tareas sin marcar, y numera la semana siguiente
insert into public.block_tasks (block_id, title, done) values ((select id from public.blocks where title = 'Bloque de b'), 'Subtarea', true);
do $$ begin
  assert public.copy_week('2026-10-05', '2026-10-12') = 1, 'copy_week debería copiar 1 bloque (el de b, no el de a)';
  assert (select count(*) from public.blocks where date = '2026-10-12') = 1, 'falta el bloque copiado';
  assert (select done from public.block_tasks bt join public.blocks b on b.id = bt.block_id where b.date = '2026-10-12') = false, 'la subtarea copiada debería estar sin marcar';
  assert (select number from public.weeks where start_date = '2026-10-12') = 2, 'la semana copiada debería ser la 2';
end $$;

-- una tarea semanal atrasada: al hacerla, la siguiente cae en el futuro; al desmarcarla, se borra
insert into public.tasks (title, due_date, repeat) values ('Regar plantas', current_date - 10, 'weekly');
update public.tasks set done = true where title = 'Regar plantas';
do $$ begin
  assert (select due_date from public.tasks where title = 'Regar plantas' and not done) = current_date + 4, 'la siguiente debería ser dentro de 4 días';
end $$;
update public.tasks set done = false where title = 'Regar plantas' and done;
do $$ begin
  assert (select count(*) from public.tasks where title = 'Regar plantas') = 1, 'al desmarcar debería borrarse la siguiente';
end $$;

-- b no puede colgar una subtarea de un bloque de a aunque conozca su id
do $$ begin
  insert into public.block_tasks (block_id, title) values ((select id from public.blocks_of_a), 'intruso');
  raise exception 'b pudo insertar en un bloque de a';
exception when foreign_key_violation then null;
end $$;

-- b puede asignar sus proyectos a sus áreas
insert into public.projects (name, area_id) values ('Proyecto de b', 'trabajo');
do $$ begin
  assert (select area_id from public.project_summary) = 'trabajo', 'project_summary debería incluir area_id';
end $$;

-- una tarea con proyecto tiene que ser de trabajo
do $$ begin
  insert into public.tasks (title, kind, project_id) values ('incoherente', 'personal', (select id from public.projects where name = 'Proyecto de b'));
  raise exception 'se aceptó una tarea cotidiana con proyecto';
exception when check_violation then null;
end $$;

-- b no puede escribir filas a nombre de a
do $$ begin
  insert into public.notes (user_id, title) values ((select id from auth.users where email = 'a@x.es'), 'falsa');
  raise exception 'b pudo escribir a nombre de a';
exception when insufficient_privilege then null;
end $$;
reset role;

-- a: proyectos, horas y borrado
select public.as_user('a@x.es');
insert into public.projects (name, client) values ('Web', 'Cliente');
update public.blocks set project_id = (select id from public.projects), actual_minutes = 90 where title = 'Bloque de a';
insert into public.tasks (title, kind, project_id) values ('Tarea abierta', 'work', (select id from public.projects)), ('Otra', 'work', (select id from public.projects));
update public.tasks set done = true where title = 'Otra';
do $$ begin
  assert (select count(*) from public.weeks) = 1, 'a debería ver solo su semana';
  assert (select minutes from public.project_summary) = 90, 'project_summary debería sumar 90 minutos';
  assert (select open_tasks from public.project_summary) = 1, 'project_summary debería contar 1 tarea abierta';
end $$;
delete from public.projects;
do $$ begin
  assert (select count(*) from public.blocks where project_id is null) = 1, 'el bloque debería quedarse sin proyecto';
  assert (select count(*) from public.tasks) = 2, 'las tareas no se borran con el proyecto';
end $$;
reset role;

select public.as_user('b@x.es');
do $$ begin
  assert (select array_agg(name) from public.project_summary) = array['Proyecto de b'], 'b debería ver solo su proyecto';
end $$;
reset role;

select 'OK' as resultado;
