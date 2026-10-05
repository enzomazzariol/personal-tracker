# Modelo de datos

Postgres en Supabase. El esquema completo está en `supabase/schema.sql`; los cambios posteriores, en `supabase/migrations/`.

## Permisos

Multiusuario: cada cuenta ve y escribe solo sus datos. La app es de uso personal; las cuentas separadas son por seguridad.

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
| kind | text, opcional | `reading` o `study`: la tarjeta de un bloque del área en Hoy muestra el libro en curso o los temas de estudio. No depende del id ni del nombre |
| name | text | Nombre visible |
| sort | int | Orden |
| color | text | Color del área en hexadecimal en minúsculas (`#7aa2ff`); por defecto blanco |

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
| project_id | uuid, opcional | Referencia a `projects`; queda nulo si se borra el proyecto |
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
| kind | text | `personal` (cotidiana) o `work` (trabajo). Con proyecto, siempre `work` (restricción `tasks_project_is_work`) |
| repeat | text, opcional | `daily`, `weekly` o `monthly` |
| repeat_from | uuid, opcional | La tarea de la que salió esta repetición |
| area_id | text, opcional | |
| project_id | uuid, opcional | Referencia a `projects`; queda nulo si se borra el proyecto |
| due_date | date, opcional | Sin fecha: bandeja |
| done | boolean | |
| done_at | timestamptz | |
| created_at | timestamptz | |

### projects

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| name | text | No vacío |
| client | text | Opcional (cadena vacía) |
| area_id | text, opcional | Referencia a `areas`. Un bloque sin proyecto muestra en Hoy las tareas de los proyectos activos de su área |
| status | text | `active`, `paused` o `done` |
| due_date | date, opcional | Fecha de entrega |
| created_at | timestamptz | |

### project_summary (vista)

Cada fila de `projects` con `minutes` (suma de `actual_minutes` de sus bloques) y `open_tasks` (tareas sin hacer). Es `security_invoker`, así que respeta el RLS de quien la consulta.

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

### job_applications

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, clave | |
| company | text | No vacío |
| role, url, notes | text | Opcionales (cadena vacía) |
| status | text | `saved`, `applied`, `interview`, `offer` o `rejected` |
| applied_on | date, opcional | Se pone sola al pasar a `applied` por primera vez |
| follow_up_on | date, opcional | Volver a escribir; aparece en Hoy ese día mientras siga `applied` o `interview` |
| created_at | timestamptz | |

### goals y goal_milestones

| Campo | Tipo | Notas |
|---|---|---|
| goals.id | uuid, clave | |
| goals.title | text | No vacío |
| goals.period | text | `2026` (año) o `2026-T4` (trimestre); utilidades en `lib/periods.ts` |
| goals.due_date | date, opcional | Fecha límite |
| goals.status | text | `active`, `done` o `dropped` |
| goal_milestones.goal_id | uuid | Referencia a `goals`, borrado en cascada |
| goal_milestones.title, done, sort | text, boolean, int | El avance de la meta es hitos hechos / total |
| goal_milestones.done_at | timestamptz, opcional | Cuándo se cumplió (revisión semanal) |

### books y reading_log

| Campo | Tipo | Notas |
|---|---|---|
| books.id | uuid, clave | |
| books.title | text | No vacío |
| books.author, notes | text | Opcionales; `notes` son las notas del libro |
| books.pages | int, opcional | Total de páginas, para la barra de avance |
| books.status | text | `want`, `reading` o `done` |
| books.started_on, finished_on | date, opcionales | Se ponen al empezar y al terminar |
| reading_log.book_id | uuid | Referencia a `books`, borrado en cascada |
| reading_log.date, pages | date, int | Páginas leídas ese día; puede haber varias filas por día |

### study_tracks y study_topics

| Campo | Tipo | Notas |
|---|---|---|
| study_tracks.id, name, sort | uuid, text, int | Una materia |
| study_topics.track_id | uuid | Referencia a `study_tracks`, borrado en cascada |
| study_topics.title, sort | text, int | |
| study_topics.status | text | `pending`, `in_progress` o `mastered` |
| study_topics.mastered_at | timestamptz, opcional | Cuándo se dominó (revisión semanal); `lib/study.ts` lo mantiene |

### journal

| Campo | Tipo | Notas |
|---|---|---|
| user_id, date | uuid y date, clave | Una entrada por día; se guarda con `upsert` |
| body | text | |
| mood | smallint, opcional | De 1 a 5 |
| updated_at | timestamptz | |

Si se vacían el texto y el ánimo, la entrada se borra.

## Funciones y disparadores

Lo que toca varias filas a la vez y tiene que hacerse entero o nada vive en la base de datos:

- `copy_week(from_monday, to_monday)`: copia los bloques de una semana a otra con sus tareas sin marcar, y crea la semana nueva con el número siguiente. Se llama con `supabase.rpc('copy_week', …)`. Es `security invoker`: RLS solo deja copiar lo propio.
- Disparador `tasks_repeat` (`private.repeat_task`): al marcar como hecha una tarea con `repeat`, crea la siguiente con `next_due(fecha, repeat)`, un intervalo después y nunca en el pasado. Al desmarcarla, borra esa siguiente si aún no se ha hecho.
- Disparador `on_auth_user_created` (`private.seed_new_user`): áreas por defecto para cada cuenta nueva.

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

Si otra tabla va a apuntar a esta, añade `unique (id, user_id)` y referencia ese par, como hace `projects`.

## Pruebas

`sh supabase/tests/run.sh` levanta un Postgres desechable en Docker y comprueba dos casos: el esquema de la etapa 1 con todas las migraciones aplicadas y `schema.sql` desde cero. En ambos verifica que una cuenta no ve ni toca los datos de otra y que toda tabla de `public` cumple las reglas: `user_id`, RLS con `own_rows`, sin permisos para `anon` y referencias entre tablas que incluyen `user_id`. Esas reglas se comprueban solas para las tablas nuevas. Ejecútalo tras cualquier cambio de esquema (`npm test` lo incluye).

`npm run types` genera `lib/database.types.ts` a partir de `schema.sql` con la CLI de Supabase. Los tipos de `lib/db.ts` salen de ahí, así que el compilador comprueba las columnas de cada consulta y de cada escritura. GitHub Actions falla si los tipos no coinciden con el esquema.
