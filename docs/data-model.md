# Modelo de datos

Postgres en Supabase. El esquema completo está en `supabase/schema.sql`; los cambios posteriores, en `supabase/migrations/`.

## Permisos

- `private.owners (email)`: el único correo autorizado. El esquema `private` no se expone por la API.
- `private.is_owner()`: devuelve verdadero si el correo de la sesión está en `private.owners`.
- Todas las tablas de `public` tienen RLS con una política `owner_all` para el rol `authenticated` que exige `is_owner()` tanto para leer como para escribir. El rol `anon` no tiene ningún permiso.
- No hay columna de usuario en las tablas: todos los datos son del dueño.

Consecuencia: cualquiera puede registrarse en Supabase Auth, pero una cuenta cuyo correo no esté en `owners` no ve ni escribe nada.

## Tablas

### areas

| Campo | Tipo | Notas |
|---|---|---|
| id | text, clave | `dev`, `guarapo`, `estudio`, `lectura`, `ejercicio`, `colchon` |
| name | text | Nombre visible |
| sort | int | Orden |

### weeks

Una fila por semana, identificada por su lunes.

| Campo | Tipo | Notas |
|---|---|---|
| start_date | date, clave | Lunes de la semana |
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

Una fila en `weeks` y, por cada bloque, una fila en `blocks` con sus `block_tasks`:

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
  created_at timestamptz not null default now()
);

alter table public.ejemplo enable row level security;
create policy "owner_all" on public.ejemplo for all to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));
grant select, insert, update, delete on public.ejemplo to authenticated;
revoke all on public.ejemplo from anon;
```
