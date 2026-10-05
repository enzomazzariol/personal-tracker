'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ConfirmButton from '@/components/ConfirmButton'
import ProjectForm, { ProjectDraft, toProjectRow } from '@/components/ProjectForm'
import TaskForm from '@/components/TaskForm'
import TaskRow from '@/components/TaskRow'
import {
  supabase, read, write, Area, Block, Project, ProjectStatus, ProjectSummary, PROJECT_STATUS,
  ymd, loadAreas, loadProjects, dateLabel, hm, hours, duration, plannedMin,
} from '@/lib/db'
import { emptyTask, useTasks } from '@/lib/useTasks'

const RECENT_BLOCKS = 20
const STATUSES = Object.keys(PROJECT_STATUS) as ProjectStatus[]

export default function Proyecto() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const today = ymd(new Date())
  const { tasks, add, save, toggle, remove } = useTasks(id)
  const [project, setProject] = useState<ProjectSummary | null | undefined>(undefined)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const load = useCallback(async () => {
    const retry = () => load()
    const [p, b, a, ps] = await Promise.all([
      // Sin read(): aquí null significa «no existe», no «ha fallado».
      supabase.from('project_summary').select('*').eq('id', id).maybeSingle(),
      read(supabase.from('blocks').select('*').eq('project_id', id).order('date', { ascending: false }).order('start_time', { ascending: false }).limit(RECENT_BLOCKS), retry),
      loadAreas(retry),
      loadProjects(retry),
    ])
    if (p.error) return void read(Promise.resolve(p), retry) // muestra el aviso con «Reintentar»
    if (!b || !a || !ps) return
    setProject(p.data as ProjectSummary | null)
    setBlocks(b as Block[])
    setAreas(a)
    setProjects(ps)
  }, [id])
  useEffect(() => {
    load()
  }, [load])

  if (project === undefined || !tasks) return null
  if (project === null)
    return (
      <section className="stack">
        <h1 className="title">Proyecto</h1>
        <p className="sm muted">Este proyecto no existe o se ha borrado.</p>
        <Link className="link" href="/proyectos">← Proyectos</Link>
      </section>
    )

  async function update(changes: Partial<Project>) {
    setProject((p) => p && { ...p, ...changes })
    await write(supabase.from('projects').update(changes).eq('id', id), load)
  }
  async function destroy() {
    const { ok } = await write(supabase.from('projects').delete().eq('id', id))
    if (ok) router.push('/proyectos')
  }

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)
  const row = (t: (typeof tasks)[number]) => (
    <TaskRow key={t.id} task={t} today={today} areas={areas} projects={projects} hideProject onToggle={toggle} onSave={save} onRemove={remove} />
  )

  return (
    <>
      <section className="stack" style={{ gap: 16 }}>
        <Link className="link" href="/proyectos" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center' }}>← Proyectos</Link>
        <h1 className="title">{project.name}</h1>
        <span className="label">{[areas.find((a) => a.id === project.area_id)?.name, project.client].filter(Boolean).join(' · ')}</span>
      </section>

      <section className="tiles three">
        <div className="tile">
          <span className="label">Horas</span>
          <div className="big">
            {hours(project.minutes)}
            <small> h</small>
          </div>
        </div>
        <div className="tile">
          <span className="label">Tareas abiertas</span>
          <div className="big">{open.length}</div>
        </div>
        <div className="tile desk">
          <span className="label">Entrega</span>
          <div className="big">{project.due_date ? dateLabel(project.due_date) : '—'}</div>
        </div>
      </section>

      <div className="seg mono" role="group" aria-label="Estado" style={{ alignSelf: 'flex-start' }}>
        {STATUSES.map((s) => (
          <button key={s} type="button" aria-pressed={project.status === s} onClick={() => update({ status: s })}>
            {PROJECT_STATUS[s]}
          </button>
        ))}
      </div>

      <section className="stack">
        <div className="between">
          <span className="label">Tareas</span>
          <span className="mono muted">{open.length}</span>
        </div>
        <TaskForm id="new" areas={areas} projects={projects} submit="Añadir" initial={emptyTask('work', id)} onSave={add} />
        <div className="list">
          {open.map(row)}
          {open.length === 0 && <p className="empty">No hay tareas pendientes.</p>}
        </div>
        {done.length > 0 && <div className="list">{done.slice(0, 20).map(row)}</div>}
      </section>

      <section className="stack">
        <span className="label">Bloques recientes</span>
        <div className="list">
          {blocks.map((b) => (
            <div key={b.id} className="item">
              <span className="mono time" style={{ width: 80 }}>{dateLabel(b.date)} {hm(b.start_time)}</span>
              <span className={`sm grow ${b.status === 'skipped' ? 'strike' : ''}`}>{b.title}</span>
              <span className="mono muted">{b.status === 'done' ? duration(b.actual_minutes) : b.status === 'skipped' ? 'saltado' : `plan ${duration(plannedMin(b))}`}</span>
            </div>
          ))}
          {blocks.length === 0 && <p className="empty">Ningún bloque asignado. Asígnalos al crearlos en Semana; los bloques del área del proyecto también muestran sus tareas en Hoy.</p>}
        </div>
      </section>

      <section className="stack">
        <span className="label">Datos del proyecto</span>
        <ProjectForm
          id="edit"
          areas={areas}
          submit="Guardar"
          initial={{ name: project.name, client: project.client, area_id: project.area_id ?? '', due_date: project.due_date ?? '' }}
          onSave={(d: ProjectDraft) => update(toProjectRow(d))}
        />
      </section>

      <section>
        <ConfirmButton label="Borrar proyecto" note="Las tareas y los bloques se conservan sin proyecto." onConfirm={destroy} />
      </section>
    </>
  )
}
