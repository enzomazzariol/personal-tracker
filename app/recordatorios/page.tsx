'use client'

import { useCallback, useEffect, useState } from 'react'
import Check from '@/components/Check'
import { supabase, Reminder } from '@/lib/db'

const fmt = (iso: string) => new Date(iso).toLocaleString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Recordatorios() {
  const [items, setItems] = useState<Reminder[] | null>(null)
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('reminders').select('*').order('remind_at').limit(200)
    setItems((data ?? []) as Reminder[])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!items) return null
  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !when) return
    await supabase.from('reminders').insert({ title: title.trim(), remind_at: new Date(when).toISOString() })
    setTitle('')
    setWhen('')
    load()
  }
  const toggle = async (r: Reminder) => {
    setItems((rs) => rs!.map((x) => (x.id === r.id ? { ...x, done: !r.done } : x)))
    await supabase.from('reminders').update({ done: !r.done }).eq('id', r.id)
  }
  const remove = async (r: Reminder) => {
    setItems((rs) => rs!.filter((x) => x.id !== r.id))
    await supabase.from('reminders').delete().eq('id', r.id)
  }
  const now = new Date().toISOString()
  const pending = items.filter((r) => !r.done)
  const done = items.filter((r) => r.done).reverse().slice(0, 20)
  const row = (r: Reminder) => (
    <div key={r.id} className="item">
      <Check on={r.done} label={r.done ? 'Marcar como pendiente' : 'Marcar como hecho'} onClick={() => toggle(r)} />
      {!r.done && r.remind_at <= now && <span className="dot" />}
      <span className={`sm grow ${r.done ? 'strike' : ''}`}>{r.title}</span>
      <span className="mono muted">{fmt(r.remind_at)}</span>
      <button className="x" aria-label={`Borrar: ${r.title}`} onClick={() => remove(r)}>×</button>
    </div>
  )

  return (
    <>
      <h1 className="title">Recordatorios</h1>
      <form className="form" onSubmit={add}>
        <label className="sr" htmlFor="r-title">Recordatorio</label>
        <input id="r-title" className="input grow" placeholder="Nuevo recordatorio" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="sr" htmlFor="r-when">Fecha y hora</label>
        <input id="r-when" className="input" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
        <button className="btn light">Añadir</button>
      </form>
      <section className="stack">
        <span className="label">Pendientes</span>
        <div className="list">
          {pending.map(row)}
          {pending.length === 0 && <p className="empty">No hay recordatorios pendientes.</p>}
        </div>
        <p className="sm muted">Los que ya tocan aparecen en Hoy con un punto naranja.</p>
      </section>
      {done.length > 0 && (
        <section className="stack">
          <span className="label">Hechos</span>
          <div className="list">{done.map(row)}</div>
        </section>
      )}
    </>
  )
}
