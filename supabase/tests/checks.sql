-- Comprobaciones de aislamiento entre cuentas. Se ejecutan tras el esquema (nuevo o migrado).
-- Supone dos cuentas: a@x.es (con datos) y b@x.es. Cualquier fallo aborta con un error.
\set ON_ERROR_STOP on

-- b recibió áreas por defecto al registrarse
select public.as_user('b@x.es');
do $$ begin
  assert (select count(*) from public.areas) = 5, 'b debería tener 5 áreas por defecto';
  assert (select count(*) from public.blocks) = 0, 'b no debería ver bloques de a';
  assert (select count(*) from public.tasks) = 0, 'b no debería ver tareas de a';
end $$;

-- b crea sus cosas sin indicar user_id
insert into public.blocks (date, start_time, end_time, area_id, title) values ('2026-10-05', '09:00', '10:00', 'trabajo', 'Bloque de b');
insert into public.weeks (start_date, number) values ('2026-10-05', 1);

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
insert into public.tasks (title, project_id) values ('Tarea abierta', (select id from public.projects)), ('Otra', (select id from public.projects));
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
