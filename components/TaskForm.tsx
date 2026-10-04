'use client'

import { useState } from 'react'
import { Area, Project } from '@/lib/db'
import { TaskDraft } from '@/lib/useTasks'

type Props = { id: string; areas: Area[]; projects: Project[]; initial: TaskDraft; submit: string; onSave: (d: TaskDraft) => void }

/** Alta y edición de tareas. Al crear se vacía el título y se conservan los valores iniciales (p. ej. el proyecto). */
export default function TaskForm({ id, areas, projects, initial, submit, onSave }: Props) {
  const [d, setD] = useState(initial)
  const editing = Boolean(initial.title)

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!d.title.trim()) return
        onSave({ ...d, title: d.title.trim() })
        if (!editing) setD(initial)
      }}
    >
      <label className="sr" htmlFor={`${id}-t`}>Tarea</label>
      <input id={`${id}-t`} className="input grow" placeholder="Nueva tarea" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
      <label className="sr" htmlFor={`${id}-a`}>Área</label>
      <select id={`${id}-a`} className="select" value={d.area_id} onChange={(e) => setD({ ...d, area_id: e.target.value })}>
        <option value="">Sin área</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      {projects.length > 0 && (
        <>
          <label className="sr" htmlFor={`${id}-p`}>Proyecto</label>
          <select id={`${id}-p`} className="select" value={d.project_id} onChange={(e) => setD({ ...d, project_id: e.target.value })}>
            <option value="">Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.status === 'done' ? `${p.name} (terminado)` : p.name}</option>
            ))}
          </select>
        </>
      )}
      <label className="sr" htmlFor={`${id}-d`}>Fecha</label>
      <input id={`${id}-d`} className="input" type="date" value={d.due_date} onChange={(e) => setD({ ...d, due_date: e.target.value })} />
      <button className="btn primary">{submit}</button>
    </form>
  )
}
