# Modelo de datos

Postgres en Supabase. El esquema completo está en `supabase/schema.sql`; los cambios posteriores, en `supabase/migrations/`.

## Permisos

Multiusuario: cada cuenta ve y escribe solo sus datos.

- Todas las tablas de `public` tienen `user_id uuid not null default auth.uid()`, con referencia a `auth.users` y borrado en cascada. Desde la app no hace falta enviarlo: lo pone la base de datos.
- Cada tabla tiene RLS con la política `own_rows` para `authenticated`: `user_id = (select auth.uid())` para leer y escribir. El rol `anon` no tiene ningún permiso.
- Las referencias entre tablas incluyen `user_id` (por ejemplo, `block_tasks (block_id, user_id)` apunta a `blocks (id, user_id)`), para que nadie pueda colgar filas de datos de otra cuenta aunque conozca su id.
- Las claves naturales son por usuario: `areas (user_id, id)` y `weeks (user_id, start_date)`.
- Al registrarse, el disparador `on_auth_user_created` (función `private.seed_new_user`) crea las áreas por defecto. El esquema `private` no se expone por la API.
- Cualquiera puede registrarse. Para cerrar el registro, desactívalo en Supabase → Authentication → Sign In / Providers.

## Tablas

### areas

| Campo | Tipo | Notas |
|---|---|---|
| user_id, id | uuid y text, clave | Por defecto: `trabajo`, `estudio`, `lectura`, `ejercicio`, `colchon` |
| name | text | Nombre visible |
| sort | int | Orden |

### weeks

Una fila por semana, identificada por su lunes.

| Campo | Tipo | Notas |
|---|---|---|
| user_id, start_date | uuid y date, clave | Lunes de la semana |
| number | int | Número de semana del plan |
| goal | text | Meta de la semana, visible en Hoy y en la columna lateral |
| wins | text[] | Cosas que salieron bien (revisión) |
| review_notes | text | Qué cambiar (revisión) |
| reviewed_at | timestamptz | Nulo si no se ha hecho la revisión |

### blocks

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| date | date | Día del bloque |
| start_time, end_time | time | La duración planificada es la diferencia |
| area_id | text | Referencia a `areas` |
| tag | text | Etiqueta corta opcional |
| title | text | |
| why | text | Frase de contexto que se muestra bajo las tareas |
| status | text | `pending`, `done` o `skipped` |
| actual_minutes | int | Minutos trabajados acumulados |
| started_at | timestamptz | Con valor si el cronómetro está en marcha |

Tiempo real de un bloque: `actual_minutes` más el tiempo transcurrido desde `started_at` si está en marcha. Al pausar o terminar se suma a `actual_minutes` y `started_at` vuelve a nulo.

### block_tasks

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| block_id | uuid | Referencia a `blocks`, borrado en cascada |
| title | text | |
| done | boolean | |
| sort | int | Orden dentro del bloque |

### tasks

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| title | text | |
| area_id | text, opcional | |
| due_date | date, opcional | Sin fecha: bandeja |
| done | boolean | |
| done_at | timestamptz | |
| created_at | timestamptz | |

### notes

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| title, body | text | |
| pinned | boolean | Las fijadas van primero |
| created_at, updated_at | timestamptz | |

### reminders

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| title | text | |
| remind_at | timestamptz | Aparece en Hoy cuando llega el momento |
| done | boolean | |
| created_at | timestamptz | |

## Cargar una semana

Desde el editor SQL no hay sesión, así que `auth.uid()` es nulo. La primera línea del script indica a qué cuenta van los datos:

```sql
select set_config('request.jwt.claim.sub', (select id::text from auth.users where email = 'tu-correo@ejemplo.com'), false);
```

Después, una fila en `weeks` y, por cada bloque, una fila en `blocks` con sus `block_tasks`:

```sql
insert into public.weeks (start_date, number, goal)
values ('2026-10-12', 2, 'Meta de la semana');

with b as (
  insert into public.blocks (date, start_time, end_time, area_id, tag, title, why)
  values ('2026-10-12', '11:00', '13:00', 'dev', 'JAVA', 'Título del bloque', 'Por qué importa')
  returning id
)
insert into public.block_tasks (block_id, title, sort)
select b.id, v.title, v.sort
from b, (values ('Primera tarea', 0), ('Segunda tarea', 1)) as v(title, sort);
```

Los archivos con planes reales (`supabase/seed_*.sql`) no se suben al repositorio.

## Plantilla para una tabla nueva

```sql
create table public.ejemplo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index ejemplo_user_idx on public.ejemplo (user_id);

alter table public.ejemplo enable row level security;
create policy "own_rows" on public.ejemplo for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.ejemplo to authenticated;
revoke all on public.ejemplo from anon;
```

Si otra tabla va a apuntar a esta, añade `unique (id, user_id)` y referencia ese par, como hace `blocks`.

## Pruebas

`sh supabase/tests/run.sh` levanta un Postgres desechable en Docker y comprueba dos casos: el esquema de la etapa 1 con todas las migraciones aplicadas y `schema.sql` desde cero. En ambos verifica que una cuenta no ve ni toca los datos de otra. Ejecútalo tras cualquier cambio de esquema.
