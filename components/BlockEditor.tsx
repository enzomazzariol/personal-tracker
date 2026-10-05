'use client'

import { useEffect, useRef, useState } from 'react'
import Check from './Check'
import ConfirmButton from './ConfirmButton'
import { supabase, write, Area, Block, BlockTask, Project, hm, plannedMin } from '@/lib/db'

const STATUS: Record<Block['status'], string> = { pending: 'Pendiente', done: 'Hecho', skipped: 'Saltado' }
const STATUSES = Object.keys(STATUS) as Block['status'][]

type Draft = { title: string; date: string; start: string; end: string; area_id: string; project_id: string; why: string; status: Block['status'] }

type Props = {
  /** El bloque a editar, o null para crear uno nuevo en `date`. */
  block: Block | null
  date: string
  areas: Area[]
  projects: Project[]
  onClose: () => void
  /** Se llama al cerrar si algo cambió, para que la página recargue. */
  onChanged: () => void
}

const toDraft = (b: Block | null, date: string, areas: Area[]): Draft => ({
  title: b?.title ?? '',
  date: b?.date ?? date,
  start: b ? hm(b.start_time) : '11:00',
  end: b ? hm(b.end_time) : '12:00',
  area_id: b?.area_id ?? areas[0]?.id ?? '',
  project_id: b?.project_id ?? '',
  why: b?.why ?? '',
  status: b?.status ?? 'pending',
})

/** Minutos trabajados al cambiar de estado: hecho sin cronómetro cuenta lo planificado; saltado cuenta cero. */
function minutesFor(status: Block['status'], b: Block | null, d: Draft) {
  if (status === 'skipped') return 0
  if (status === 'done') return b?.actual_minutes || plannedMin({ start_time: d.start, end_time: d.end })
  return b?.actual_minutes ?? 0
}

/** Crear o editar un bloque y sus tareas, en un diálogo modal. */
export default function BlockEditor({ block: initial, date, areas, projects, onClose, onChanged }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [block, setBlock] = useState(initial)
  const [d, setD] = useState(() => toDraft(initial, date, areas))
  const [tasks, setTasks] = useState<BlockTask[]>(() => [...(initial?.block_tasks ?? [])].sort((a, b) => a.sort - b.sort))
  const [newTask, setNewTask] = useState('')
  const [error, setError] = useState('')
  const changed = useRef(false)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  function close() {
    if (changed.current) onChanged()
    onClose()
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!d.title.trim()) return setError('Ponle un título.')
    if (d.end <= d.start) return setError('La hora de fin tiene que ser posterior a la de inicio.')
    setError('')
    const row = {
      title: d.title.trim(),
      date: d.date,
      start_time: d.start,
      end_time: d.end,
      area_id: d.area_id,
      project_id: d.project_id || null,
      why: d.why.trim(),
      status: d.status,
      actual_minutes: minutesFor(d.status, block, d),
      ...(d.status !== 'pending' || !block ? { started_at: null } : {}),
    }
    const query = block ? supabase.from('blocks').update(row).eq('id', block.id).select().single() : supabase.from('blocks').insert(row).select().single()
    const { ok, data } = await write(query)
    if (!ok) return
    changed.current = true
    if (block) return close()
    setBlock(data as Block) // recién creado: el diálogo sigue abierto para añadirle tareas
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!block || !newTask.trim()) return
    const sort = tasks.reduce((max, t) => Math.max(max, t.sort + 1), 0)
    const { data } = await write<BlockTask>(supabase.from('block_tasks').insert({ block_id: block.id, title: newTask.trim(), sort }).select().single())
    if (!data) return
    changed.current = true
    setTasks([...tasks, data])
    setNewTask('')
  }
  async function updateTask(t: BlockTask, changes: Partial<BlockTask>) {
    const previous = tasks
    setTasks(tasks.map((x) => (x.id === t.id ? { ...x, ...changes } : x)))
    const { ok } = await write(supabase.from('block_tasks').update(changes).eq('id', t.id), () => setTasks(previous))
    if (ok) changed.current = true
  }
  async function removeTask(t: BlockTask) {
    const previous = tasks
    setTasks(tasks.filter((x) => x.id !== t.id))
    const { ok } = await write(supabase.from('block_tasks').delete().eq('id', t.id), () => setTasks(previous))
    if (ok) changed.current = true
  }
  async function removeBlock() {
    if (!block) return
    const { ok } = await write(supabase.from('blocks').delete().eq('id', block.id))
    if (!ok) return
    changed.current = true
    close()
  }

  const field = (key: keyof Draft) => ({ value: d[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setD({ ...d, [key]: e.target.value }) })

  return (
    <dialog ref={dialog} className="dialog" aria-labelledby="be-title" onCancel={(e) => (e.preventDefault(), close())}>
      <div className="between">
        <h2 id="be-title" className="mid">{block ? 'Editar bloque' : 'Nuevo bloque'}</h2>
        <button className="x" aria-label="Cerrar" onClick={close}>×</button>
      </div>

      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <label className="sr" htmlFor="be-name">Título</label>
        <input id="be-name" className="input" placeholder="Título del bloque" {...field('title')} />
        <div className="form">
          <label className="sr" htmlFor="be-date">Día</label>
          <input id="be-date" className="input" type="date" required {...field('date')} />
          <label className="sr" htmlFor="be-start">Inicio</label>
          <input id="be-start" className="input" type="time" required {...field('start')} />
          <label className="sr" htmlFor="be-end">Fin</label>
          <input id="be-end" className="input" type="time" required {...field('end')} />
        </div>
        <div className="form">
          <label className="sr" htmlFor="be-area">Área</label>
          <select id="be-area" className="select" {...field('area_id')}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {projects.length > 0 && (
            <>
              <label className="sr" htmlFor="be-project">Proyecto</label>
              <select id="be-project" className="select" {...field('project_id')}>
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <label className="sr" htmlFor="be-why">Por qué importa</label>
        <textarea id="be-why" className="textarea" rows={2} placeholder="Por qué importa (opcional)" {...field('why')} />
        {block && (
          <div className="seg mono" role="group" aria-label="Estado" style={{ alignSelf: 'flex-start' }}>
            {STATUSES.map((s) => (
              <button key={s} type="button" aria-pressed={d.status === s} onClick={() => setD({ ...d, status: s })}>{STATUS[s]}</button>
            ))}
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn ghost" onClick={close}>{block && !initial ? 'Listo' : 'Cancelar'}</button>
          <button className="btn primary">{block ? 'Guardar' : 'Crear bloque'}</button>
        </div>
      </form>

      <section className="stack">
        <span className="label">Tareas del bloque</span>
        {block ? (
          <>
            <div className="list">
              {tasks.map((t) => (
                <div key={t.id} className="item">
                  <Check on={t.done} label={t.done ? 'Desmarcar tarea' : 'Marcar tarea'} onClick={() => updateTask(t, { done: !t.done })} />
                  <label className="sr" htmlFor={`bt-${t.id}`}>Tarea</label>
                  <input id={`bt-${t.id}`} className="input grow" style={{ borderBottomColor: 'transparent' }} defaultValue={t.title} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== t.title && updateTask(t, { title: e.target.value.trim() })} />
                  <button className="x" aria-label={`Borrar tarea: ${t.title}`} onClick={() => removeTask(t)}>×</button>
                </div>
              ))}
            </div>
            <form className="form" onSubmit={addTask}>
              <label className="sr" htmlFor="be-task">Nueva tarea</label>
              <input id="be-task" className="input grow" placeholder="Nueva tarea" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
              <button className="btn">Añadir</button>
            </form>
          </>
        ) : (
          <p className="sm muted">Crea el bloque para añadirle tareas.</p>
        )}
      </section>

      {initial && (
        <div>
          <ConfirmButton label="Borrar bloque" note="Se borran también sus tareas." onConfirm={removeBlock} />
        </div>
      )}
    </dialog>
  )
}
