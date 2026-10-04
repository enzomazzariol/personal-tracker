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

-- b no puede escribir filas a nombre de a
do $$ begin
  insert into public.notes (user_id, title) values ((select id from auth.users where email = 'a@x.es'), 'falsa');
  raise exception 'b pudo escribir a nombre de a';
exception when insufficient_privilege then null;
end $$;
reset role;

-- a solo ve lo suyo
select public.as_user('a@x.es');
do $$ begin
  assert (select count(*) from public.weeks) = 1, 'a debería ver solo su semana';
  assert (select count(*) from public.blocks) = 1, 'a debería ver solo su bloque';
end $$;
reset role;

select 'OK' as resultado;
