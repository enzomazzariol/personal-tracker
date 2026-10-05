# Tracker

App personal de un solo usuario para llevar el plan semanal por bloques, tareas, notas, recordatorios y, más adelante, otras áreas de la vida (proyectos, metas, lectura, estudio, diario, entrenos, dinero). Se usa en móvil y en escritorio.

Lee `docs/spec.md` antes de añadir una sección, `docs/design.md` antes de tocar la interfaz y `docs/data-model.md` antes de tocar la base de datos.

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # compila y comprueba tipos; debe pasar antes de cada commit
```

Variables en `.env.local` (ver `.env.example`): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_KEY` (clave pública).

## Arquitectura

- Next.js 16 (App Router) y React 19. Es una versión reciente: si dudas de una API, consulta la documentación incluida en `node_modules/next/dist/docs/` en lugar de fiarte de la memoria.
- Todas las páginas son componentes de cliente (`'use client'`) que hablan con Supabase directamente desde el navegador con `supabase-js`. No hay rutas de API, server actions ni middleware.
- Multiusuario. La seguridad la pone la base de datos: cada fila tiene `user_id` (por defecto `auth.uid()`) y RLS en todas las tablas.
- `components/Shell.tsx` gestiona la sesión (muestra `Login` si no hay) y la navegación: barra inferior en móvil, columna lateral desde 900 px.
- Las secciones se definen una sola vez en `lib/nav.ts`, agrupadas por propósito: Plan (Hoy, Semana, Revisión, Metas), Trabajo (Tareas, Proyectos, Ofertas), Vida (Lectura, Estudio, Diario) y Apuntes (Notas, Recordatorios). La columna lateral de escritorio, la barra inferior y «Más» salen de ahí.
- `lib/db.ts` contiene el cliente, los tipos de cada tabla y las utilidades de fechas y horas. Reutilízalas; no dupliques.
- Lo que usan varias páginas va en un componente (`components/TaskForm.tsx`, `TaskRow.tsx`, `ProjectForm.tsx`, `ConfirmButton.tsx` para borrados, `BlockEditor.tsx` para crear y editar bloques) o en un hook (`lib/useTasks.ts`), no copiado.
- La lógica pura con casos límite (fechas, periodos) va en `lib/` con una prueba `*.test.mjs` al lado que se ejecuta con `node`.
- Los estilos están en `app/globals.css`, sin Tailwind ni librerías de componentes.

```
app/page.tsx             Hoy
app/semana/              Semana
app/tareas/              Tareas
app/notas/               Notas
app/proyectos/           Proyectos y ficha de cada proyecto ([id])
app/ofertas/ metas/ lectura/ estudio/ diario/   Resto de la etapa 2
app/recordatorios/       Recordatorios
app/revision/            Revisión semanal
app/mas/                 Menú "Más" (solo móvil)
components/              Shell, Login, Check, Veil, formularios y filas compartidas
lib/db.ts                Cliente, tipos, utilidades
lib/useTasks.ts          Datos y operaciones de tareas
lib/nav.ts               Secciones y grupos de la navegación
lib/periods.ts           Periodos de las metas (prueba: node lib/periods.test.mjs)
supabase/schema.sql      Esquema completo y permisos
supabase/migrations/     Cambios posteriores al esquema inicial
supabase/tests/          Prueba del esquema en Docker (run.sh)
docs/                    Especificación, diseño y modelo de datos
```

## Convenciones de código

- Soluciones directas. Nada de capas de abstracción, gestores de estado ni dependencias nuevas sin una razón clara.
- Cada página carga sus datos en un `load()` con `useCallback` y `useEffect`, y devuelve `null` mientras no hay datos.
- Ninguna consulta va suelta: las cargas pasan por `read(consulta, load)` y las escrituras por `write(consulta, load)` (`lib/db.ts`). Si fallan, avisan con `lib/notify.ts` (las cargas ofrecen «Reintentar») y la página recarga para que no quede en pantalla un cambio que no se guardó. En textos largos con guardado automático (notas, diario) se omite la recarga para no perder lo escrito.
- Las escrituras son optimistas: primero se actualiza el estado local y después se llama a Supabase con `write`.
- Los formularios que tapan la página son un `<dialog>` nativo (ver `components/BlockEditor.tsx`).
- Lo que una sección aporta a otra pantalla (la tarjeta del bloque en Hoy, la revisión) va en un componente que carga sus propios datos: `BlockReading`, `BlockStudy`, `FollowUps`, `JournalPrompt`, `WeekSummary`. La página solo decide dónde mostrarlo.
- Fechas como texto `YYYY-MM-DD` en hora local (`ymd`, `addDays`, `mondayOf`). La semana empieza en lunes. No uses `toISOString()` para obtener un día.
- Horas con coma decimal y un decimal como máximo (`hours`). Duración planificada con `plannedMin`, tiempo real con `doneMin`.
- Toda la interfaz en español de España, con tuteo.
- Accesibilidad: `button` y `a` reales, `label` para cada campo (clase `.sr` si no debe verse), `aria-label` en botones de solo icono, objetivos táctiles de 44 px.

## Reglas de la base de datos

- Cada tabla nueva lleva `user_id`, RLS activado, la política `own_rows` y los permisos para `authenticated` (plantilla en `docs/data-model.md`). Nunca des permisos a `anon`.
- Las referencias entre tablas incluyen `user_id` para que no se puedan mezclar datos de cuentas distintas.
- Lo que escribe varias filas y tiene que hacerse entero (copiar una semana, repetir una tarea) va en una función o un disparador de Postgres, no en varias llamadas desde el navegador. Las funciones que la app llama son `security invoker`, para que RLS siga aplicando. Ver «Funciones y disparadores» en `docs/data-model.md`.
- Los cambios de esquema van como archivo nuevo en `supabase/migrations/` con nombre `NNNN_descripcion.sql`, y además se reflejan en `schema.sql` para que siga creando la base de datos completa desde cero.
- Si añades una tabla, añade su tipo en `lib/db.ts` y documenta sus campos en `docs/data-model.md`.
- Tras cualquier cambio de esquema, `sh supabase/tests/run.sh` debe terminar en OK. Si la tabla es nueva, añade una comprobación de aislamiento en `supabase/tests/checks.sql`.

## Qué no debe entrar en el repositorio

El repositorio es público.

- Claves secretas de Supabase (`service_role`, `sb_secret_...`) o la contraseña de la base de datos. La app no las necesita.
- Datos personales: correos, planes semanales, nombres de clientes, notas. Los archivos `supabase/seed_*.sql` están ignorados por esa razón.
- Archivos `.env*`, salvo `.env.example`.

## Cómo añadir una sección

1. Define las tablas en una migración y actualiza `schema.sql`, `lib/db.ts` y `docs/data-model.md`. Pasa la prueba del esquema.
2. Crea `app/<seccion>/page.tsx` siguiendo el patrón de `app/proyectos/` (lista con alta y ficha en `[id]`).
3. Añádela a su grupo en `lib/nav.ts`. En móvil la barra inferior tiene cinco huecos (cuatro secciones con `mobile: true` y «Más»); las demás aparecen solas en «Más».
4. Usa las clases existentes de `globals.css` antes de crear otras nuevas.
5. Comprueba a 390 px y a 1280 px, y que `npm run build` pasa.
6. Marca la sección como hecha en `docs/spec.md`.
