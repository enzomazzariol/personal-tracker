import { createClient } from '@supabase/supabase-js'
import { notify } from './notify'
import type { CSSProperties } from 'react'
import type { Database } from './database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
export const configured = Boolean(url && key)
export const supabase = createClient<Database>(url || 'http://localhost:54321', key || 'missing')

/** Carga: devuelve los datos o, si falla, avisa (con «Reintentar» si se pasa `retry`) y devuelve null. */
export async function read<T>(query: PromiseLike<{ data: T | null; error: unknown }>, retry?: () => void): Promise<T | null> {
  const { data, error } = await query
  if (!error) return data
  notify('No se han podido cargar los datos. Revisa la conexión.', retry && { label: 'Reintentar', run: retry })
  return null
}

/**
 * Escritura: si falla, avisa y llama a `onFail`, normalmente la recarga de la página,
 * para que un cambio optimista que no se guardó no se quede en pantalla.
 * Devuelve si fue bien y, si la consulta pide filas (`.select()`), los datos.
 */
export async function write<T = unknown>(query: PromiseLike<{ data?: T | null; error: unknown }>, onFail?: () => void) {
  const { data, error } = await query
  if (!error) return { ok: true, data: (data ?? null) as T | null }
  notify('No se ha podido guardar. Revisa la conexión e inténtalo de nuevo.')
  onFail?.()
  return { ok: false, data: null }
}

/** La fila de una tabla, tal como la genera `npm run types` en lib/database.types.ts. */
type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
/** La fila con los textos que la base de datos limita con `check` precisados como uniones de TypeScript. */
type Narrow<R, N> = Omit<R, keyof N> & N
/** Cambios para `update`: solo columnas, sin las relaciones anidadas que trae un `select` (p. ej. `block_tasks`). */
export type Changes<T, Nested extends keyof T = never> = Partial<Omit<T, Nested>>

export type BlockStatus = 'pending' | 'done' | 'skipped'
export type BlockTask = Row<'block_tasks'>
export type Block = Narrow<Row<'blocks'>, { status: BlockStatus }> & { block_tasks?: BlockTask[] }
/** `kind` decide qué muestra la tarjeta de un bloque del área en Hoy (el libro en curso, los temas de estudio). */
export type Area = Narrow<Row<'areas'>, { kind: 'reading' | 'study' | null }>
/** Pasa el color del área a CSS como `--area` (lo usan `.swatch`, `.blk` y la barra de `.area`). */
export const areaColor = (a?: Area) => ({ '--area': a?.color }) as CSSProperties
export type Week = Row<'weeks'>
export type TaskKind = 'personal' | 'work'
export const TASK_KIND: Record<TaskKind, string> = { personal: 'Cotidianas', work: 'Trabajo' }
export type TaskRepeat = 'daily' | 'weekly' | 'monthly'
export const TASK_REPEAT: Record<TaskRepeat, string> = { daily: 'Cada día', weekly: 'Cada semana', monthly: 'Cada mes' }
export type Task = Narrow<Row<'tasks'>, { kind: TaskKind; repeat: TaskRepeat | null }>
export type Note = Row<'notes'>
export type Reminder = Row<'reminders'>
export type ProjectStatus = 'active' | 'paused' | 'done'
export type Project = Narrow<Row<'projects'>, { status: ProjectStatus }>
/** Fila de la vista project_summary: el proyecto con sus totales. */
export type ProjectSummary = Project & { minutes: number; open_tasks: number }
export const PROJECT_STATUS: Record<ProjectStatus, string> = { active: 'Activo', paused: 'En pausa', done: 'Terminado' }

export type JobStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
export type JobApplication = Narrow<Row<'job_applications'>, { status: JobStatus }>
export const JOB_STATUS: Record<JobStatus, string> = { saved: 'Guardada', applied: 'Aplicada', interview: 'Entrevista', offer: 'Oferta', rejected: 'Descartada' }

export type GoalStatus = 'active' | 'done' | 'dropped'
export type GoalMilestone = Row<'goal_milestones'>
export type Goal = Narrow<Row<'goals'>, { status: GoalStatus }> & { goal_milestones?: GoalMilestone[] }
export const GOAL_STATUS: Record<GoalStatus, string> = { active: 'En curso', done: 'Lograda', dropped: 'Descartada' }

export type BookStatus = 'want' | 'reading' | 'done'
export type ReadingLog = Row<'reading_log'>
export type Book = Narrow<Row<'books'>, { status: BookStatus }> & { reading_log?: ReadingLog[] }
export const BOOK_STATUS: Record<BookStatus, string> = { reading: 'Leyendo', want: 'Por leer', done: 'Leído' }
export const pagesRead = (b: Book) => (b.reading_log ?? []).reduce((sum, l) => sum + l.pages, 0)

export type TopicStatus = 'pending' | 'in_progress' | 'mastered'
export type StudyTopic = Narrow<Row<'study_topics'>, { status: TopicStatus }>
export type StudyTrack = Row<'study_tracks'> & { study_topics?: StudyTopic[] }
export const TOPIC_STATUS: Record<TopicStatus, string> = { pending: 'Pendiente', in_progress: 'En curso', mastered: 'Dominado' }

export type JournalEntry = Row<'journal'>

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parseYmd(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
export const mondayOf = (s: string) => addDays(s, -((parseYmd(s).getDay() + 6) % 7))

export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const dayLabel = (s: string) => {
  const d = parseYmd(s)
  return `${DAYS_SHORT[d.getDay()]} ${pad(d.getDate())}`
}
export const dateLabel = (s: string) => {
  const d = parseYmd(s)
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`
}

export const hm = (t: string) => t.slice(0, 5)
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
export const plannedMin = (b: Pick<Block, 'start_time' | 'end_time'>) => toMin(b.end_time) - toMin(b.start_time)
export const runningMin = (b: Block, now: number) => (b.started_at ? Math.max(0, (now - new Date(b.started_at).getTime()) / 60000) : 0)
export const doneMin = (b: Block, now: number) => b.actual_minutes + runningMin(b, now)

/** 90 -> "1,5", 120 -> "2" */
export const hours = (min: number) => {
  const h = Math.round((min / 60) * 10) / 10
  return String(h).replace('.', ',')
}
/** Vencimiento de una tarea: "atrasada · 12 oct", "hoy", "12 oct" o null si no tiene fecha. */
export const dueLabel = (t: Pick<Task, 'due_date' | 'done'>, today: string) => {
  if (!t.due_date) return null
  if (t.due_date < today && !t.done) return `atrasada · ${dateLabel(t.due_date)}`
  return t.due_date === today ? 'hoy' : dateLabel(t.due_date)
}
export const duration = (min: number) => (min < 60 ? `${min} min` : `${hours(min)} h`)
export const clock = (min: number) => {
  const s = Math.floor(min * 60)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

// Los cargadores devuelven null si la consulta falla (ya avisado por read); `retry` se ofrece en el aviso.
export async function loadWeekBlocks(monday: string, retry?: () => void) {
  const data = await read(
    supabase.from('blocks').select('*, block_tasks(*)').gte('date', monday).lte('date', addDays(monday, 6)).order('date').order('start_time'),
    retry,
  )
  if (!data) return null
  const blocks = data as Block[]
  blocks.forEach((b) => b.block_tasks?.sort((a, c) => a.sort - c.sort))
  return blocks
}
/** La semana que empieza en `monday`, o null si no existe todavía (o si falla la carga). */
export async function loadWeek(monday: string, retry?: () => void) {
  return (await read(supabase.from('weeks').select('*').eq('start_date', monday).maybeSingle(), retry)) as Week | null
}
export async function loadAreas(retry?: () => void) {
  return (await read(supabase.from('areas').select('*').order('sort'), retry)) as Area[] | null
}
export async function loadProjects(retry?: () => void) {
  return (await read(supabase.from('projects').select('*').order('name'), retry)) as Project[] | null
}

/**
 * Proyectos cuyo trabajo toca en un bloque: el suyo si tiene proyecto asignado; si no,
 * los proyectos activos de su área (un bloque genérico como «Guarapo Media: proyectos»).
 */
export const projectsForBlock = (b: Pick<Block, 'project_id' | 'area_id'>, projects: Project[]) =>
  b.project_id ? projects.filter((p) => p.id === b.project_id) : projects.filter((p) => p.status === 'active' && p.area_id === b.area_id)
