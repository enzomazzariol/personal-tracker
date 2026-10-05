'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, read, addDays, parseYmd } from '@/lib/db'

type Summary = { pages: number; tasks: number; books: number; applications: number; topics: number; milestones: number; moodAvg: number | null; journalDays: number }

/** «La semana en cifras» de la revisión: lo que pasó esa semana en cada sección. */
export default function WeekSummary({ monday }: { monday: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)

  const load = useCallback(async () => {
    const sunday = addDays(monday, 6)
    // Las fechas con hora se comparan en hora local: del lunes 00:00 al lunes siguiente 00:00.
    const from = parseYmd(monday).toISOString()
    const to = parseYmd(addDays(monday, 7)).toISOString()
    const retry = () => load()
    const [logs, tasks, books, apps, topics, milestones, journal] = await Promise.all([
      read(supabase.from('reading_log').select('pages').gte('date', monday).lte('date', sunday), retry),
      read(supabase.from('tasks').select('id').gte('done_at', from).lt('done_at', to), retry),
      read(supabase.from('books').select('id').gte('finished_on', monday).lte('finished_on', sunday), retry),
      read(supabase.from('job_applications').select('id').gte('applied_on', monday).lte('applied_on', sunday), retry),
      read(supabase.from('study_topics').select('id').gte('mastered_at', from).lt('mastered_at', to), retry),
      read(supabase.from('goal_milestones').select('id').gte('done_at', from).lt('done_at', to), retry),
      read(supabase.from('journal').select('mood').gte('date', monday).lte('date', sunday), retry),
    ])
    if (!logs || !tasks || !books || !apps || !topics || !milestones || !journal) return
    const moods = (journal as { mood: number | null }[]).map((j) => j.mood).filter((m): m is number => m !== null)
    setSummary({
      pages: (logs as { pages: number }[]).reduce((s, l) => s + l.pages, 0),
      tasks: tasks.length,
      books: books.length,
      applications: apps.length,
      topics: topics.length,
      milestones: milestones.length,
      moodAvg: moods.length ? moods.reduce((s, m) => s + m, 0) / moods.length : null,
      journalDays: journal.length,
    })
  }, [monday])
  useEffect(() => {
    load()
  }, [load])

  if (!summary) return null
  const rows: [string, string][] = [
    ['Tareas hechas', String(summary.tasks)],
    ['Hitos de metas cumplidos', String(summary.milestones)],
    ['Páginas leídas', String(summary.pages)],
    ['Libros terminados', String(summary.books)],
    ['Temas dominados', String(summary.topics)],
    ['Candidaturas enviadas', String(summary.applications)],
    ['Ánimo medio', summary.moodAvg === null ? '—' : `${summary.moodAvg.toFixed(1).replace('.', ',')} / 5 · ${summary.journalDays} ${summary.journalDays === 1 ? 'día escrito' : 'días escritos'}`],
  ]

  return (
    <section className="stack">
      <span className="label">La semana en cifras</span>
      <div className="list">
        {rows.map(([label, value]) => (
          <div key={label} className="item between">
            <span>{label}</span>
            <span className="mono muted">{value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
