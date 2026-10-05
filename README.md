# Tracker

Tracker personal: plan semanal por bloques, modo foco, tareas, notas, recordatorios y revisión semanal.
Next.js (App Router) + Supabase. Un solo usuario.

## Puesta en marcha

1. **Base de datos.** En un proyecto de Supabase, abre el editor SQL y ejecuta en este orden:
   - `supabase/schema.sql` (tablas y permisos)
   - Si la base de datos ya existía con el esquema de la etapa 1, en lugar de `schema.sql` ejecuta los archivos de `supabase/migrations/` en orden.
2. **Variables de entorno.** Copia `.env.example` a `.env.local` y pon la URL del proyecto y la clave pública (publishable key).
3. **Local.** `npm install` y `npm run dev`.
4. **Vercel.** Importa el repositorio y añade las mismas dos variables en Settings → Environment Variables.
5. **Primera entrada.** En la pantalla de acceso pulsa "Primera vez: crear cuenta", confirma el correo que te llega y entra.
   Para que el enlace de confirmación vuelva a la app, pon su dirección en Supabase → Authentication → URL Configuration → Site URL.
6. **Datos iniciales (opcional).** Los planes semanales se cargan desde el editor SQL; mira «Cargar una semana» en `docs/data-model.md`.

## Permisos

Multiusuario: cada cuenta ve y escribe solo sus datos (RLS por `user_id`). Cualquiera puede registrarse;
para cerrar el registro, desactívalo en Supabase → Authentication. Detalles en `docs/data-model.md`.

## Estructura

- `app/page.tsx`: Hoy (bloque en curso, cronómetro, resto del día, tareas y recordatorios, captura rápida)
- `app/semana`: horas por área, los siete días y alta de bloques
- `app/tareas`, `app/proyectos`, `app/ofertas`: trabajo
- `app/metas`, `app/revision`: plan a medio plazo
- `app/lectura`, `app/estudio`, `app/diario`: vida
- `app/notas`, `app/recordatorios`: apuntes
- `components/Shell.tsx`: sesión y navegación (barra inferior en móvil, columna lateral en escritorio)
- `lib/db.ts`: cliente de Supabase, tipos y utilidades de fechas y horas
- `supabase/`: esquema, migraciones y la prueba del esquema (`sh supabase/tests/run.sh`, necesita Docker)
