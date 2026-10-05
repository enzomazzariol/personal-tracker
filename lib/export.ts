import { supabase, ymd } from './db'
import { notify } from './notify'
import type { Database } from './database.types'

type Table = keyof Database['public']['Tables']

/** Cada tabla con una columna única para paginar en orden estable. Si falta una tabla del esquema, el build falla. */
const TABLES: Record<Table, string> = {
  areas: 'id',
  weeks: 'start_date',
  projects: 'id',
  blocks: 'id',
  block_tasks: 'id',
  tasks: 'id',
  notes: 'id',
  reminders: 'id',
  job_applications: 'id',
  goals: 'id',
  goal_milestones: 'id',
  books: 'id',
  reading_log: 'id',
  study_tracks: 'id',
  study_topics: 'id',
  journal: 'date',
}

const PAGE = 1000 // límite de filas por consulta de Supabase

/** Descarga todos los datos de la cuenta en un JSON. RLS ya limita las filas a las del usuario. */
export async function exportData() {
  const out: Record<string, unknown[]> = {}
  for (const [table, key] of Object.entries(TABLES) as [Table, string][]) {
    out[table] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase.from(table).select('*').order(key).range(from, from + PAGE - 1)
      if (error) return notify('No se ha podido exportar. Revisa la conexión e inténtalo de nuevo.')
      out[table].push(...data)
      if (data.length < PAGE) break
    }
  }
  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), ...out }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `tracker-${ymd(new Date())}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000) // Safari necesita el enlace vivo un momento tras el clic
}
