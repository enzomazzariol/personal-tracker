#!/bin/sh
# Genera lib/database.types.ts a partir de supabase/schema.sql, en un Postgres desechable (Docker).
# Uso: npm run types   (necesita Docker y la CLI de Supabase)
set -e
cd "$(dirname "$0")"

NAME=tracker-types
PORT=55439

docker run -d --rm --name $NAME -e POSTGRES_PASSWORD=types -p $PORT:5432 postgres:17 >/dev/null
trap 'docker stop $NAME >/dev/null' EXIT
until [ "$(docker logs $NAME 2>&1 | grep -c 'ready to accept connections')" -ge 2 ]; do sleep 1; done

sql() { docker exec -i $NAME psql -q -v ON_ERROR_STOP=1 -U postgres; }
sql < tests/stub.sql
sql < schema.sql

supabase gen types typescript --db-url "postgresql://postgres:types@localhost:$PORT/postgres" --schema public > ../lib/database.types.ts
echo "lib/database.types.ts actualizado"
