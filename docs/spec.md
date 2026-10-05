# Especificación

## Propósito

Una sola app que, al abrirla, dice qué toca hoy y permite registrar todo lo demás. No es solo una lista de tareas: el objetivo es llevar el seguimiento de las distintas áreas de la vida del usuario y ver su evolución.

## Principios

- Multiusuario: cada cuenta ve solo sus datos. No hay equipos, compartir ni roles.
- Primero el móvil, y que funcione igual de bien en escritorio.
- El plan semanal se compone de bloques con día, hora, área y tareas. El tiempo real se mide con el cronómetro de cada bloque.
- El plan de cada semana se escribe directamente en la base de datos después de la revisión del domingo.
- Los recordatorios se muestran dentro de la app; no hay notificaciones.

## Estructura

La app tiene dos propósitos y la navegación los separa:

- **Plan**: cuándo trabajas y hacia dónde vas. Hoy, Semana y Revisión, con los bloques de tiempo, y Metas.
- **Trabajo**: qué hay que hacer. Tareas (todas, en dos listas: cotidianas y de trabajo), Proyectos (cada uno con sus tareas) y Ofertas (búsqueda de empleo).
- **Vida**: Lectura, Estudio y Diario.
- **Apuntes**: Notas y Recordatorios.

Los dos se unen en los bloques: la tarjeta del bloque en Hoy muestra las tareas abiertas de los proyectos que tocan en él (el proyecto asignado al bloque o, si no tiene, los proyectos activos de su área). Una tarea de proyecto aparece además en la lista de Hoy cuando vence hoy o está atrasada. Una tarea de proyecto es una sola tarea: aparece en Tareas (en la lista de trabajo) y en la ficha de su proyecto, y tacharla en un sitio la tacha en los dos.

La misma idea sirve para el resto de secciones: según el tipo de su área (`areas.kind`), la tarjeta de un bloque de lectura muestra los libros en curso para apuntar páginas, y la de un bloque de estudio los temas en curso. Hoy enseña también los seguimientos de ofertas que tocan y, desde las 19:00, una invitación a escribir el diario. La revisión semanal resume lo que pasó en cada sección.

## Áreas

Cada cuenta empieza con Trabajo, Estudio, Lectura, Ejercicio y Colchón (hueco semanal para imprevistos o para recuperar un bloque). Viven en la tabla `areas`; todavía no hay pantalla para editarlas, se cambian desde la base de datos.

## Etapa 1: núcleo (hecha)

| Sección | Qué hace |
|---|---|
| Hoy | Bloque actual en tarjeta clara con sus tareas, cronómetro (empezar, pausar, terminar, saltar, reabrir), resto del día, tareas y recordatorios pendientes, captura rápida de tarea o nota, horas hechas contra planeadas de hoy y de la semana |
| Semana | Horas por área, los siete días con el estado de cada bloque, cambio de estado con un toque, navegación entre semanas, alta de bloques |
| Tareas | Dos listas, cotidianas y de trabajo, ordenadas por fecha; las de trabajo con área y proyecto opcionales; hechas plegadas; edición (incluido cambiar de lista) y borrado |
| Notas | Título y cuerpo con guardado automático, fijar, borrar |
| Recordatorios | Con fecha y hora; los vencidos aparecen en Hoy |
| Revisión semanal | Bloques y horas por área, lo que quedó sin hacer, tres cosas que salieron bien y qué cambiar |

Reglas del cronómetro: al terminar un bloque se guarda el tiempo trabajado; si se marca como hecho sin haber usado el cronómetro, cuenta la duración planificada. Un bloque saltado cuenta cero.

## Etapa 2: la vida por áreas (hecha)

Los campos son una propuesta inicial; se ajustan al construir cada sección.

| Sección | Qué hace | Datos previstos |
|---|---|---|
| Proyectos (hecha) | Cada cliente o proyecto con su área, sus tareas, horas dedicadas y fechas de entrega | `projects` (nombre, cliente, área, estado, entrega); `tasks.project_id`; `blocks.project_id` para sumar horas |
| Ofertas (hecha) | Registro de candidaturas | `job_applications` (empresa, puesto, enlace, fecha, estado: guardada, aplicada, entrevista, oferta, descartada; notas) |
| Metas (hecha) | Objetivos por trimestre o año con hitos y avance | `goals` (título, periodo, fecha límite, estado); `goal_milestones` (título, hecho) |
| Lectura (hecha) | Libros leídos y en curso, páginas por día, notas de cada libro | `books` (título, autor, páginas, estado, inicio, fin, notas); `reading_log` (libro, fecha, páginas) |
| Estudio (hecha) | Temario por materia con lo dominado y lo pendiente | `study_tracks` (nombre); `study_topics` (materia, título, estado: pendiente, en curso, dominado) |
| Diario (hecha) | Una entrada corta al día y estado de ánimo | `journal` (fecha única, texto, ánimo de 1 a 5) |

## Mejoras (en curso)

Se hacen por bloques, en orden. Cada bloque se cierra con build, pruebas y revisión en el navegador.

**Bloque A: robustez**
- [x] A1. Errores visibles: aviso cuando falla una carga o un guardado, con opción de reintentar, y vuelta al estado real si un guardado optimista falla.
- [x] A2. Editar y borrar bloques y sus tareas desde Semana.
- [x] A3. Recuperar la contraseña.

**Bloque B: secciones conectadas**
- [x] B1. Bloque de Lectura: el libro en curso y apuntar páginas desde la tarjeta.
- [x] B2. Bloque de Estudio: los temas en curso de su materia.
- [x] B3. Revisión semanal con datos de todas las secciones.
- [x] B4. Ofertas con fecha de seguimiento que aparece en Hoy.
- [x] B5. Diario desde Hoy al final del día.

**Bloque C: planificar más rápido**
- [x] C1. Copiar la semana anterior.
- [x] C2. Tareas que se repiten.

**Bloque D: mantenibilidad**
- [ ] D1. Tipos generados desde el esquema de Supabase.
- [ ] D2. Comprobación automática en GitHub (build y pruebas en cada push).

**Bloque E: preparar la venta**
- [ ] E1. Pantalla para editar áreas.
- [ ] E2. Borrar la cuenta.
- [ ] E3. Exportar los datos.
- [ ] E4. Página de presentación y política de privacidad.

## Etapa 3: vista de conjunto (pendiente)

| Sección | Qué hace |
|---|---|
| Estadísticas | Horas por área, constancia y tendencias por semana y por mes |
| Revisión mensual | Resumen del mes con lo logrado y qué ajustar |
| Cuerpo | Entrenos importados de Strava (distancia, tiempo, pulso). El reloj es un Garmin, que no ofrece acceso para uso personal, así que los datos llegan a través de Strava. El sueño no pasa por Strava: se apunta a mano o se importa de una exportación |

## Más adelante

- Dinero: gastos, ingresos y presupuesto. Se definirá a partir de una exportación de la app que se usa ahora.
- Mover un bloque no hecho al colchón con un toque.
- Rachas de hábitos.
- Notificaciones push.

## Fuera de alcance

Equipos, compartir, modo sin conexión, apps nativas.
