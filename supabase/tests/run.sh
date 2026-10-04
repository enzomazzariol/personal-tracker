#!/bin/sh
# Prueba el esquema en un Postgres desechable (Docker), en dos casos:
#   migrated: esquema de la etapa 1 con datos + todas las migraciones
#   fresh:    schema.sql desde cero
# Uso: sh supabase/tests/run.sh
set -e
cd "$(dirname "$0")/.."

STAGE1_COMMIT=605d2d2 # primer commit: esquema de la etapa 1, punto de partida de las migraciones
NAME=tracker-schema-test

docker run -d --rm --name $NAME -e POSTGRES_PASSWORD=test postgres:17 >/dev/null
trap 'docker stop $NAME >/dev/null' EXIT
# La imagen arranca un servidor temporal para inicializarse y luego el definitivo: esperar al segundo.
until [ "$(docker logs $NAME 2>&1 | grep -c 'ready to accept connections')" -ge 2 ]; do sleep 1; done

sql() { docker exec -i $NAME psql -qtA -v ON_ERROR_STOP=1 -U postgres -d "$1"; }
prepare() {
  docker exec $NAME createdb -U postgres "$1"
  sql "$1" < tests/stub.sql
}
share_block_of_a() {
  # Un id de bloque de a, visible para b, para intentar colarse en él.
  echo "create table public.blocks_of_a as select id from public.blocks where title = 'Bloque de a';
        grant select on public.blocks_of_a to authenticated;" | sql "$1"
}

echo '== migrated'
prepare migrated
git show $STAGE1_COMMIT:supabase/schema.sql | sql migrated
sql migrated <<'SQL'
insert into auth.users (email) values ('a@x.es');
insert into private.owners (email) values ('a@x.es');
insert into public.weeks (start_date, number) values ('2026-10-05', 1);
insert into public.blocks (date, start_time, end_time, area_id, title) values ('2026-10-05', '11:00', '13:00', 'dev', 'Bloque de a');
SQL
for f in migrations/*.sql; do sql migrated < "$f"; done
echo "insert into auth.users (email) values ('b@x.es');" | sql migrated
share_block_of_a migrated
sql migrated < tests/checks.sql

echo '== fresh'
prepare fresh
sql fresh < schema.sql
sql fresh <<'SQL'
insert into auth.users (email) values ('a@x.es'), ('b@x.es');
select public.as_user('a@x.es');
insert into public.weeks (start_date, number) values ('2026-10-05', 1);
insert into public.blocks (date, start_time, end_time, area_id, title) values ('2026-10-05', '11:00', '13:00', 'trabajo', 'Bloque de a');
reset role;
SQL
share_block_of_a fresh
sql fresh < tests/checks.sql
