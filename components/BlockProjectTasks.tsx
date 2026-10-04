import Check from './Check'
import { Project, Task, dueLabel } from '@/lib/db'

type Props = { projects: Project[]; tasks: Task[]; today: string; onDone: (t: Task) => void }

/** Dentro de la tarjeta del bloque: las tareas abiertas de los proyectos que tocan en él, agrupadas por proyecto. */
export default function BlockProjectTasks({ projects, tasks, today, onDone }: Props) {
  const groups = projects.map((p) => ({ project: p, list: tasks.filter((t) => t.project_id === p.id) })).filter((g) => g.list.length > 0)
  if (groups.length === 0) return null

  return (
    <div className="stack" style={{ gap: 16 }}>
      {groups.map(({ project, list }) => (
        <div key={project.id}>
          <span className="label dim">{project.name}</span>
          <div style={{ marginTop: 8 }}>
            {list.map((t) => (
              <div key={t.id} className="line row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <Check on={false} label={`Marcar como hecha: ${t.title}`} onClick={() => onDone(t)} />
                <span className="sm grow" style={{ padding: '12px 0' }}>{t.title}</span>
                {t.due_date && <span className="mono dim" style={{ padding: '14px 0' }}>{dueLabel(t, today)}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
