'use client'

import { useEffect, useState } from 'react'
import TaskForm from '@/components/TaskForm'
import TaskRow from '@/components/TaskRow'
import { Area, Project, Task, TaskKind, TASK_KIND, ymd, loadAreas, loadProjects } from '@/lib/db'
import { emptyTask, useTasks } from '@/lib/useTasks'

const KINDS: TaskKind[] = ['personal', 'work']

/** Todas las tareas, en dos listas: cotidianas y de trabajo (incluidas las de cada proyecto). */
export default function Tareas() {
  const today = ymd(new Date())
  const { tasks, add, save, toggle, remove } = useTasks()
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    loadAreas().then((a) => a && setAreas(a))
    loadProjects().then((ps) => ps && setProjects(ps))
  }, [])

  if (!tasks) return null

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))
  const activeProjects = projects.filter((p) => p.status !== 'done')
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

      <div className="split">
        {KINDS.map((kind) => {
          const list = open.filter((t) => t.kind === kind)
          return (
            <section key={kind} className="stack">
              <div className="between">
                <span className="label">{TASK_KIND[kind]}</span>
                <span className="mono muted">{list.length}</span>
              </div>
              <TaskForm id={`new-${kind}`} areas={areas} projects={activeProjects} submit="Añadir" initial={emptyTask(kind)} onSave={add} />
              <div className="list">
                {list.map(row)}
                {list.length === 0 && <p className="empty">Nada pendiente.</p>}
              </div>
            </section>
          )
        })}
      </div>

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
