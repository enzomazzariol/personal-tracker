'use client'

import { useState } from 'react'
import Check from './Check'
import TaskForm from './TaskForm'
import { Area, Project, Task, dueLabel } from '@/lib/db'
import { TaskDraft, toDraft } from '@/lib/useTasks'

type Props = {
  task: Task
  today: string
  areas: Area[]
  projects: Project[]
  /** Oculta el nombre del proyecto, p. ej. dentro de la ficha de ese proyecto. */
  hideProject?: boolean
  onToggle: (t: Task) => void
  onSave: (id: string, d: TaskDraft) => void
  onRemove: (t: Task) => void
}

/** Una tarea en una lista: marcar, editar al pulsar el título y borrar. */
export default function TaskRow({ task: t, today, areas, projects, hideProject, onToggle, onSave, onRemove }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing)
    return (
      <div style={{ padding: '8px 0' }}>
        <TaskForm
          id={t.id}
          areas={areas}
          projects={projects}
          submit="Guardar"
          chooseKind
          initial={toDraft(t)}
          onSave={(d) => {
            setEditing(false)
            onSave(t.id, d)
          }}
        />
      </div>
    )

  const meta = [
    areas.find((a) => a.id === t.area_id)?.name,
    hideProject ? null : projects.find((p) => p.id === t.project_id)?.name,
    dueLabel(t, today),
  ]
  return (
    <div className="item">
      <Check on={t.done} label={t.done ? 'Marcar como pendiente' : 'Marcar como hecha'} onClick={() => onToggle(t)} />
      <button className="grow sm" style={{ background: 'none', border: 0, padding: '10px 0', textAlign: 'left' }} onClick={() => setEditing(true)} aria-label={`Editar: ${t.title}`}>
        <span className={t.done ? 'strike' : ''}>{t.title}</span>
      </button>
      <span className="mono muted" style={{ textAlign: 'right' }}>{meta.filter(Boolean).join(' · ')}</span>
      <button className="x" aria-label={`Borrar: ${t.title}`} onClick={() => onRemove(t)}>×</button>
    </div>
  )
}
