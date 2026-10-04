'use client'

import { useCallback, useEffect, useState } from 'react'
import Check from '@/components/Check'
import { supabase, Task, Area, ymd, loadAreas, dateLabel } from '@/lib/db'

type Draft = { title: string; area_id: string; due_date: string }
const EMPTY: Draft = { title: '', area_id: '', due_date: '' }

function TaskForm({ areas, initial, submit, onSave, id }: { areas: Area[]; initial: Draft; submit: string; onSave: (d: Draft) => void; id: string }) {
  const [d, setD] = useState(initial)
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!d.title.trim()) return
        onSave({ ...d, title: d.title.trim() })
        setD(initial.title ? d : EMPTY)
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
      <label className="sr" htmlFor={`${id}-d`}>Fecha</label>
      <input id={`${id}-d`} className="input" type="date" value={d.due_date} onChange={(e) => setD({ ...d, due_date: e.target.value })} />
      <button className="btn primary">{submit}</button>
    </form>
  )
}

export default function Tareas() {
  const today = ymd(new Date())
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)

  const load = useCallback(async () => {
    const [t, a] = await Promise.all([supabase.from('tasks').select('*').order('due_date', { nullsFirst: false }).order('created_at', { ascending: false }).limit(300), loadAreas()])
    setTasks((t.data ?? []) as Task[])
    setAreas(a)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!tasks) return null
  const row = (d: Draft) => ({ title: d.title, area_id: d.area_id || null, due_date: d.due_date || null })
  const add = async (d: Draft) => {
    await supabase.from('tasks').insert(row(d))
    load()
  }
  const save = async (id: string, d: Draft) => {
    setEditing(null)
    await supabase.from('tasks').update(row(d)).eq('id', id)
    load()
  }
  const toggle = async (t: Task) => {
    const changes = { done: !t.done, done_at: t.done ? null : new Date().toISOString() }
    setTasks((ts) => ts!.map((x) => (x.id === t.id ? { ...x, ...changes } : x)))
    await supabase.from('tasks').update(changes).eq('id', t.id)
  }
  const remove = async (t: Task) => {
    setTasks((ts) => ts!.filter((x) => x.id !== t.id))
    await supabase.from('tasks').delete().eq('id', t.id)
  }
  const areaName = (id: string | null) => areas.find((a) => a.id === id)?.name

  const open = tasks.filter((t) => !t.done)
  const groups = [
    { label: 'Bandeja', hint: 'Sin fecha', list: open.filter((t) => !t.due_date) },
    { label: 'Con fecha', hint: '', list: open.filter((t) => t.due_date) },
  ]
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? ''))

  const item = (t: Task) =>
    editing === t.id ? (
      <div key={t.id} style={{ padding: '8px 0' }}>
        <TaskForm id={t.id} areas={areas} submit="Guardar" initial={{ title: t.title, area_id: t.area_id ?? '', due_date: t.due_date ?? '' }} onSave={(d) => save(t.id, d)} />
      </div>
    ) : (
      <div key={t.id} className="item">
        <Check on={t.done} label={t.done ? 'Marcar como pendiente' : 'Marcar como hecha'} onClick={() => toggle(t)} />
        <button className="grow sm" style={{ background: 'none', border: 0, padding: '10px 0', textAlign: 'left' }} onClick={() => setEditing(t.id)} aria-label={`Editar: ${t.title}`}>
          <span className={t.done ? 'strike' : ''}>{t.title}</span>
        </button>
        <span className="mono muted" style={{ textAlign: 'right' }}>
          {[areaName(t.area_id), t.due_date ? (t.due_date < today && !t.done ? `atrasada · ${dateLabel(t.due_date)}` : t.due_date === today ? 'hoy' : dateLabel(t.due_date)) : null].filter(Boolean).join(' · ')}
        </span>
        <button className="x" aria-label={`Borrar: ${t.title}`} onClick={() => remove(t)}>×</button>
      </div>
    )

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Tareas</h1>
        <div className="big">
          {open.length}
          <small> pendientes</small>
        </div>
      </section>
      <TaskForm id="new" areas={areas} submit="Añadir" initial={EMPTY} onSave={add} />
      {groups.map((g) => (
        <section key={g.label} className="stack">
          <div className="between">
            <span className="label">{g.label}</span>
            <span className="mono muted">{g.list.length}</span>
          </div>
          <div className="list">
            {g.list.map(item)}
            {g.list.length === 0 && <p className="empty">Nada aquí.</p>}
          </div>
        </section>
      ))}
      {done.length > 0 && (
        <section className="stack">
          <button className="link" style={{ textAlign: 'left' }} onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
            {showDone ? 'Ocultar' : 'Ver'} hechas ({done.length})
          </button>
          {showDone && <div className="list">{done.slice(0, 50).map(item)}</div>}
        </section>
      )}
    </>
  )
}
