'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import BlockEditor from '@/components/BlockEditor'
import { notify } from '@/lib/notify'
import {
  supabase, write, Block, Week, Area, areaColor, Project,
  ymd, mondayOf, addDays, loadWeekBlocks, loadWeek, loadAreas, loadProjects,
  dayLabel, dateLabel, hm, plannedMin, doneMin, hours,
} from '@/lib/db'

export default function Semana() {
  const today = ymd(new Date())
  const [monday, setMonday] = useState(() => mondayOf(today))
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [week, setWeek] = useState<Week | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  /** Bloque abierto en el editor: uno existente, o null para crear uno nuevo en `date`. */
  const [editing, setEditing] = useState<{ block: Block | null; date: string } | null>(null)
  const now = Date.now()

  const load = useCallback(async () => {
    const retry = () => load()
    const [b, w, a, p] = await Promise.all([loadWeekBlocks(monday, retry), loadWeek(monday, retry), loadAreas(retry), loadProjects(retry)])
    if (!b || !a || !p) return
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

  async function copyPreviousWeek() {
    const { ok, data } = await write<number>(supabase.rpc('copy_week', { from_monday: addDays(monday, -7), to_monday: monday }))
    if (!ok) return
    if (data === 0) notify('La semana anterior también está vacía: no hay nada que copiar.')
    load()
  }
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

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
              <div key={a.id} className="area" style={areaColor(a)}>
                <span className="label row" style={{ gap: 6 }}><span className="swatch" />{a.name}</span>
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

      {blocks.length === 0 && (
        <section className="panel between" style={{ flexWrap: 'wrap' }}>
          <div className="stack">
            <span className="label">Semana sin planificar</span>
            <p className="sm muted">Empieza desde la anterior: se copian sus bloques y sus tareas, sin marcar.</p>
          </div>
          <button className="btn primary" onClick={copyPreviousWeek}>Copiar la semana anterior</button>
        </section>
      )}

      <section className="days">
        {days.map((day) => {
          const list = blocks.filter((b) => b.date === day)
          const done = list.filter((b) => b.status === 'done').length
          const isToday = day === today
          return (
            <div key={day} className={`day ${isToday ? 'today' : ''}`}>
              <div className="between mono" style={{ textTransform: 'uppercase' }}>
                <span>{isToday ? `Hoy ${day.slice(8)}` : dayLabel(day)}</span>
                <span className="row" style={{ gap: 4 }}>
                  <span className={list.length && done === list.length ? 'green' : 'muted'}>
                    {done}/{list.length}
                  </span>
                  <button className="x" style={{ marginRight: -14 }} onClick={() => setEditing({ block: null, date: day })} aria-label={`Añadir bloque el ${dayLabel(day)}`}>+</button>
                </span>
              </div>
              {list.map((b) => (
                <button key={b.id} className="blk" style={areaColor(areas.find((a) => a.id === b.area_id))} onClick={() => setEditing({ block: b, date: b.date })} aria-label={`${b.title}: ${b.status === 'done' ? 'hecho' : b.status === 'skipped' ? 'saltado' : 'pendiente'}. Editar`}>
                  <span className={`mono ${b.status === 'done' ? 'green' : 'muted'}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {b.started_at && <span className="dot" />}
                    {hm(b.start_time)}
                    {b.status === 'done' ? ' · hecho' : b.status === 'skipped' ? ' · saltado' : ''}
                  </span>
                  <span className={`t ${b.status === 'pending' ? '' : 'strike'}`}>{b.title}</span>
                </button>
              ))}
              {list.length === 0 && <span className="sm muted">Libre</span>}
            </div>
          )
        })}
      </section>
      <p className="sm muted" style={{ marginTop: -16 }}>Pulsa un bloque para editarlo, cambiar su estado o sus tareas; «+» añade uno ese día.</p>

      <section className="panel between" style={{ flexWrap: 'wrap' }}>
        <div className="stack">
          <span className="label">Revisión de la semana</span>
          <p className="sm muted">{week?.reviewed_at ? 'Revisión guardada. Puedes editarla.' : 'Marca qué hiciste y apunta tres cosas que salieron bien.'}</p>
        </div>
        <Link className="btn" href={`/revision?w=${monday}`}>Abrir revisión</Link>
      </section>

      {editing && (
        <BlockEditor
          key={editing.block?.id ?? `new-${editing.date}`}
          block={editing.block}
          date={editing.date}
          areas={areas}
          projects={projects}
          onClose={() => setEditing(null)}
          onChanged={load}
        />
      )}
    </>
  )
}
