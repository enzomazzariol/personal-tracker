'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import WeekSummary from '@/components/WeekSummary'
import { supabase, write, Block, Area, ymd, mondayOf, addDays, loadWeekBlocks, loadWeek, loadAreas, dateLabel, dayLabel, plannedMin, hours } from '@/lib/db'

function Revision() {
  const params = useSearchParams()
  const monday = mondayOf(params.get('w') || ymd(new Date()))
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [number, setNumber] = useState<number | null>(null)
  const [wins, setWins] = useState(['', '', ''])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    const retry = () => load()
    const [b, w, a] = await Promise.all([loadWeekBlocks(monday, retry), loadWeek(monday, retry), loadAreas(retry)])
    if (!b || !a) return
    setBlocks(b)
    setAreas(a)
    setNumber(w?.number ?? null)
    setWins([0, 1, 2].map((i) => w?.wins?.[i] ?? ''))
    setNotes(w?.review_notes ?? '')
  }, [monday])
  useEffect(() => {
    load()
  }, [load])

  if (!blocks) return null
  const done = blocks.filter((b) => b.status === 'done')
  const missed = blocks.filter((b) => b.status !== 'done')
  const sum = (list: Block[], f: (b: Block) => number) => list.reduce((s, b) => s + f(b), 0)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Guardando')
    const { ok } = await write(supabase.from('weeks').upsert({ start_date: monday, number: number ?? 1, wins: wins.map((w) => w.trim()).filter(Boolean), review_notes: notes, reviewed_at: new Date().toISOString() }))
    setStatus(ok ? 'Revisión guardada' : 'No se pudo guardar')
  }

  return (
    <>
      <section className="stack">
        <h1 className="title">Revisión</h1>
        <span className="label">
          {number ? `Semana ${number} · ` : ''}
          {dateLabel(monday)} – {dateLabel(addDays(monday, 6))}
        </span>
      </section>

      <section className="tiles three">
        <div className="tile">
          <span className="label">Bloques hechos</span>
          <div className="big">
            {done.length}
            <small> / {blocks.length}</small>
          </div>
        </div>
        <div className="tile">
          <span className="label">Horas</span>
          <div className="big">
            {hours(sum(blocks, (b) => b.actual_minutes))}
            <small> / {hours(sum(blocks, plannedMin))} h</small>
          </div>
        </div>
        <div className="tile desk">
          <span className="label">Sin hacer</span>
          <div className="big">{missed.length}</div>
        </div>
      </section>

      <section className="stack">
        <span className="label">Por área</span>
        <div className="list">
          {areas.map((a) => {
            const list = blocks.filter((b) => b.area_id === a.id)
            return (
              <div key={a.id} className="item between">
                <span>{a.name}</span>
                <span className="mono muted">
                  {hours(sum(list, (b) => b.actual_minutes))} / {hours(sum(list, plannedMin))} h · {list.filter((b) => b.status === 'done').length}/{list.length} bloques
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <WeekSummary monday={monday} />

      {missed.length > 0 && (
        <section className="stack">
          <span className="label">Quedó sin hacer</span>
          <div className="list">
            {missed.map((b) => (
              <div key={b.id} className="item">
                <span className="mono time" style={{ width: 52 }}>{dayLabel(b.date)}</span>
                <span className="sm grow">{b.title}</span>
                <span className="mono muted">{b.status === 'skipped' ? 'saltado' : 'pendiente'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <form className="stack" style={{ gap: 12 }} onSubmit={save}>
        <span className="label">Tres cosas que salieron bien</span>
        {wins.map((w, i) => (
          <div key={i}>
            <label className="sr" htmlFor={`win-${i}`}>Cosa {i + 1}</label>
            <input id={`win-${i}`} className="input" style={{ width: '100%' }} placeholder={`${i + 1}.`} value={w} onChange={(e) => setWins(wins.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
        <label className="label" htmlFor="rev-notes" style={{ marginTop: 12 }}>Qué cambiarías la semana que viene</label>
        <textarea id="rev-notes" className="textarea" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="row">
          <button className="btn primary">Guardar revisión</button>
          <span className="mono green" role="status">{status}</span>
        </div>
        <p className="sm muted">Con la revisión guardada, pídele a Claude la semana siguiente y aparecerá aquí.</p>
      </form>
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Revision />
    </Suspense>
  )
}
