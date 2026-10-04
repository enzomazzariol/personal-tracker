'use client'

import { useEffect, useState } from 'react'
import TaskForm from '@/components/TaskForm'
import TaskRow from '@/components/TaskRow'
import { Area, Project, Task, ymd, loadAreas, loadProjects } from '@/lib/db'
import { EMPTY_TASK, useTasks } from '@/lib/useTasks'

export default function Tareas() {
  const today = ymd(new Date())
  const { tasks, add, save, toggle, remove } = useTasks(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    loadAreas().then(setAreas)
    loadProjects().then((ps) => setProjects(ps.filter((p) => p.status !== 'done')))
  }, [])

  if (!tasks) return null

  const open = tasks.filter((t) => !t.done)
  const groups = [
    { label: 'Bandeja', list: open.filter((t) => !t.due_date) },
    { label: 'Con fecha', list: open.filter((t) => t.due_date) },
  ]
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))
  const row = (t: Task) => <TaskRow key={t.id} task={t} today={today} areas={areas} projects={projects} onToggle={toggle} onSave={save} onRemove={remove} />

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Tareas</h1>
        <div className="big">
          {open.length}
          <small> pendientes</small>
        </div>
      </section>
      <p className="sm muted" style={{ marginTop: -24 }}>Tu lista personal. Las tareas de cada proyecto están en su ficha y aparecen en Hoy dentro de sus bloques.</p>
      <TaskForm id="new" areas={areas} projects={[]} submit="Añadir" initial={EMPTY_TASK} onSave={add} />
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
            {showDone ? 'Ocultar' : 'Ver'} hechas ({done.length})
          </button>
          {showDone && <div className="list">{done.slice(0, 50).map(row)}</div>}
        </section>
      )}
    </>
  )
}
