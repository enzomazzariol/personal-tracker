'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  supabase, Block, Week, Area, Project,
  ymd, mondayOf, addDays, loadWeekBlocks, loadWeek, loadAreas, loadProjects,
  dayLabel, dateLabel, hm, plannedMin, doneMin, hours,
} from '@/lib/db'

const NEXT: Record<Block['status'], Block['status']> = { pending: 'done', done: 'skipped', skipped: 'pending' }

export default function Semana() {
  const today = ymd(new Date())
  const [monday, setMonday] = useState(() => mondayOf(today))
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [week, setWeek] = useState<Week | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState({ date: today, start: '11:00', end: '12:00', area: '', project: '', title: '' })
  const now = Date.now()

  const load = useCallback(async () => {
    const [b, w, a, p] = await Promise.all([loadWeekBlocks(monday), loadWeek(monday), loadAreas(), loadProjects()])
    setBlocks(b)
    setWeek(w)
    setAreas(a)
    setProjects(p.filter((x) => x.status !== 'done'))
  }, [monday])
  useEffect(() => {
    load()
  }, [load])

  if (!blocks) return null

  const sum = (list: Block[], f: (b: Block) => number) => list.reduce((s, b) => s + f(b), 0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  async function cycle(b: Block) {
    const status = NEXT[b.status]
    const changes: Partial<Block> = { status, started_at: null }
    if (status === 'done' && !b.actual_minutes) changes.actual_minutes = plannedMin(b)
    if (status === 'skipped') changes.actual_minutes = 0
    setBlocks((bs) => bs!.map((x) => (x.id === b.id ? { ...x, ...changes } : x)))
    await supabase.from('blocks').update(changes).eq('id', b.id)
  }
  async function addBlock(e: React.FormEvent) {
    e.preventDefault()
    const area = form.area || areas[0]?.id
    if (!form.title.trim() || form.end <= form.start || !area) return
    await supabase.from('blocks').insert({ date: form.date, start_time: form.start, end_time: form.end, area_id: area, project_id: form.project || null, title: form.title.trim(), tag: '' })
    setForm({ ...form, title: '' })
    load()
  }

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <h1 className="title">{week ? `Semana ${week.number}` : 'Semana'}</h1>
        <div className="big">
          {hours(sum(blocks, (b) => doneMin(b, now)))}
          <small> / {hours(sum(blocks, plannedMin))} h</small>
        </div>
      </section>

      <div className="between">
        <button className="btn ghost" onClick={() => setMonday(addDays(monday, -7))} aria-label="Semana anterior">←</button>
        <span className="label">
          {dateLabel(monday)} – {dateLabel(addDays(monday, 6))}
        </span>
        <button className="btn ghost" onClick={() => setMonday(addDays(monday, 7))} aria-label="Semana siguiente">→</button>
      </div>

      <section className="stack">
        <span className="label mob">Por área · hecho / plan</span>
        <div className="areas">
          {areas.map((a) => {
            const list = blocks.filter((b) => b.area_id === a.id)
            const done = sum(list, (b) => doneMin(b, now))
            const plan = sum(list, plannedMin)
            return (
              <div key={a.id} className="area">
                <span className="label">{a.name}</span>
                <div className="mid">
                  {hours(done)}
                  <small> / {hours(plan)} h</small>
                </div>
                <div className="bar">
                  <i style={{ width: plan ? `${(done / plan) * 100}%` : 0 }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="days">
        {days.map((day) => {
          const list = blocks.filter((b) => b.date === day)
          const done = list.filter((b) => b.status === 'done').length
          const isToday = day === today
          return (
            <div key={day} className={`day ${isToday ? 'today' : ''}`}>
              <div className="between mono" style={{ textTransform: 'uppercase', paddingBottom: 6 }}>
                <span>{isToday ? `Hoy ${day.slice(8)}` : dayLabel(day)}</span>
                <span className={list.length && done === list.length ? 'green' : 'muted'}>
                  {done}/{list.length}
                </span>
              </div>
              {list.map((b) => (
                <button key={b.id} className="blk" onClick={() => cycle(b)} aria-label={`${b.title}: ${b.status === 'done' ? 'hecho' : b.status === 'skipped' ? 'saltado' : 'pendiente'}. Cambiar estado`}>
                  <span className={`mono ${b.status === 'done' ? 'green' : 'muted'}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {b.started_at && <span className="dot" />}
                    {hm(b.start_time)}
                    {b.status === 'done' ? ' · hecho' : b.status === 'skipped' ? ' · saltado' : ''}
                  </span>
                  <span className={`t ${b.status === 'skipped' ? 'strike' : ''}`}>{b.title}</span>
                </button>
              ))}
              {list.length === 0 && <span className="sm muted">Libre</span>}
            </div>
          )
        })}
      </section>
      <p className="sm muted" style={{ marginTop: -16 }}>Pulsa un bloque para cambiarlo entre pendiente, hecho y saltado.</p>

      <section className="panel between" style={{ flexWrap: 'wrap' }}>
        <div className="stack">
          <span className="label">Revisión de la semana</span>
          <p className="sm muted">{week?.reviewed_at ? 'Revisión guardada. Puedes editarla.' : 'Marca qué hiciste y apunta tres cosas que salieron bien.'}</p>
        </div>
        <Link className="btn" href={`/revision?w=${monday}`}>Abrir revisión</Link>
      </section>

      <section className="stack">
        <span className="label">Añadir bloque</span>
        <form className="form" onSubmit={addBlock}>
          <label className="sr" htmlFor="b-title">Título</label>
          <input id="b-title" className="input grow" placeholder="Título del bloque" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="sr" htmlFor="b-date">Día</label>
          <input id="b-date" className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label className="sr" htmlFor="b-start">Inicio</label>
          <input id="b-start" className="input" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          <label className="sr" htmlFor="b-end">Fin</label>
          <input id="b-end" className="input" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          <label className="sr" htmlFor="b-area">Área</label>
          <select id="b-area" className="select" value={form.area || areas[0]?.id} onChange={(e) => setForm({ ...form, area: e.target.value })}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {projects.length > 0 && (
            <>
              <label className="sr" htmlFor="b-project">Proyecto</label>
              <select id="b-project" className="select" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </>
          )}
          <button className="btn primary">Añadir</button>
        </form>
      </section>
    </>
  )
}
