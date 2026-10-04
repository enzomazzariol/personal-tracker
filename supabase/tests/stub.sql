-- Lo mínimo de Supabase para probar el esquema en un Postgres normal: roles, auth.users y auth.uid().
-- Los roles son de todo el servidor: se crean una vez aunque haya varias bases de datos.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable
as $$ select jsonb_build_object('email', (select email from auth.users where id = auth.uid())) $$;
grant usage on schema auth to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Actuar como una cuenta: as_user('a@x.es') cambia al rol authenticated con su id.
create function public.as_user(mail text) returns void language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', (select id::text from auth.users where email = mail), false);
  set role authenticated;
end $$;
grant execute on function public.as_user(text) to authenticated;
