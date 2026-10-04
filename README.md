# Tracker

Tracker personal: plan semanal por bloques, modo foco, tareas, notas, recordatorios y revisión semanal.
Next.js (App Router) + Supabase. Un solo usuario.

## Puesta en marcha

1. **Base de datos.** En un proyecto de Supabase, abre el editor SQL y ejecuta en este orden:
   - `supabase/schema.sql` (tablas y permisos)
   - `insert into private.owners (email) values ('tu-correo@ejemplo.com');` con el correo con el que vas a entrar
   - `supabase/seed_semana1.sql` (plan de la semana del 5 al 11 de octubre de 2026)
2. **Variables de entorno.** Copia `.env.example` a `.env.local` y pon la URL del proyecto y la clave pública (publishable key).
3. **Local.** `npm install` y `npm run dev`.
4. **Vercel.** Importa el repositorio y añade las mismas dos variables en Settings → Environment Variables.
5. **Primera entrada.** En la pantalla de acceso pulsa "Primera vez: crear cuenta", confirma el correo que te llega y entra.
   Para que el enlace de confirmación vuelva a la app, pon su dirección en Supabase → Authentication → URL Configuration → Site URL.

## Permisos

Todas las tablas tienen RLS. Solo puede leer o escribir la sesión cuyo correo esté en `private.owners`;
cualquier otra cuenta que se registre no ve ningún dato.

## Estructura

- `app/page.tsx`: Hoy (bloque en curso, cronómetro, resto del día, tareas y recordatorios, captura rápida)
- `app/semana`: horas por área, los siete días y alta de bloques
- `app/tareas`, `app/notas`, `app/recordatorios`, `app/revision`
- `components/Shell.tsx`: sesión y navegación (barra inferior en móvil, menú superior en escritorio)
- `lib/db.ts`: cliente de Supabase, tipos y utilidades de fechas y horas
- `supabase/`: esquema y datos iniciales
