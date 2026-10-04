'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import ProjectForm, { EMPTY_PROJECT, ProjectDraft, toProjectRow } from '@/components/ProjectForm'
import { supabase, Area, ProjectSummary, ymd, loadAreas, dateLabel, hours } from '@/lib/db'

/** "Guarapo Media · Cliente · entrega 12 oct · 3,5 h · 2 tareas" */
function meta(p: ProjectSummary, areas: Area[], today: string) {
  const due = p.due_date && (p.due_date < today && p.status !== 'done' ? `atrasado · ${dateLabel(p.due_date)}` : `entrega ${dateLabel(p.due_date)}`)
  const tasks = p.open_tasks ? `${p.open_tasks} ${p.open_tasks === 1 ? 'tarea' : 'tareas'}` : null
  return [areas.find((a) => a.id === p.area_id)?.name, p.client, due, `${hours(p.minutes)} h`, tasks].filter(Boolean).join(' · ')
}

export default function Proyectos() {
  const today = ymd(new Date())
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [showDone, setShowDone] = useState(false)

  const load = useCallback(async () => {
    const [{ data }, a] = await Promise.all([supabase.from('project_summary').select('*').order('due_date', { nullsFirst: false }).order('name'), loadAreas()])
    setProjects((data ?? []) as ProjectSummary[])
    setAreas(a)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!projects) return null

  async function add(d: ProjectDraft) {
    await supabase.from('projects').insert(toProjectRow(d))
    load()
  }

  const groups = [
    { label: 'Activos', list: projects.filter((p) => p.status === 'active') },
    { label: 'En pausa', list: projects.filter((p) => p.status === 'paused') },
  ]
  const done = projects.filter((p) => p.status === 'done')
  const row = (p: ProjectSummary) => (
    <Link key={p.id} href={`/proyectos/${p.id}`} className="item between">
      <span className="grow">{p.name}</span>
      <span className="mono muted" style={{ textAlign: 'right' }}>{meta(p, areas, today)}</span>
    </Link>
  )

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Proyectos</h1>
        <div className="big">
          {groups[0].list.length}
          <small> activos</small>
        </div>
      </section>
      <ProjectForm id="new" areas={areas} initial={EMPTY_PROJECT} submit="Añadir" onSave={add} />
      {groups.map((g) => (
        <section key={g.label} className="stack">
          <div className="between">
            <span className="label">{g.label}</span>
            <span className="mono muted">{g.list.length}</span>
          </div>
          <div className="list">
            {g.list.map(row)}
            {g.list.length === 0 && <p className="empty">Nada aquí.</p>}
          </div>
        </section>
      ))}
      {done.length > 0 && (
        <section className="stack">
          <button className="link" style={{ textAlign: 'left' }} onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
            {showDone ? 'Ocultar' : 'Ver'} terminados ({done.length})
          </button>
          {showDone && <div className="list">{done.map(row)}</div>}
        </section>
      )}
    </>
  )
}
