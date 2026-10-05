'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase, JournalEntry, ymd, addDays, parseYmd, DAYS, dateLabel } from '@/lib/db'

const MOODS = [1, 2, 3, 4, 5]
const SAVE_DELAY_MS = 600
const RECENT = 30

function Diario() {
  const params = useSearchParams()
  const today = ymd(new Date())
  const date = params.get('d') || today
  const [entry, setEntry] = useState<{ body: string; mood: number | null } | null>(null)
  const [recent, setRecent] = useState<JournalEntry[]>([])
  const [status, setStatus] = useState('')
  const pending = useRef<(() => void) | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const [e, r] = await Promise.all([
      supabase.from('journal').select('*').eq('date', date).maybeSingle(),
      supabase.from('journal').select('*').order('date', { ascending: false }).limit(RECENT),
    ])
    setEntry({ body: e.data?.body ?? '', mood: e.data?.mood ?? null })
    setRecent((r.data ?? []) as JournalEntry[])
    setStatus('')
  }, [date])
  useEffect(() => {
    load()
  }, [load])

  // Al cambiar de día o salir de la página, guarda lo que quede pendiente.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      pending.current?.()
    },
    [date],
  )

  if (!entry) return null

  function edit(changes: Partial<{ body: string; mood: number | null }>) {
    const next = { ...entry!, ...changes }
    setEntry(next)
    setStatus('Guardando')
    const save = async () => {
      pending.current = null
      const empty = !next.body.trim() && next.mood === null
      const { error } = empty
        ? await supabase.from('journal').delete().eq('date', date)
        : await supabase.from('journal').upsert({ date, body: next.body, mood: next.mood, updated_at: new Date().toISOString() })
      setStatus(error ? 'No se pudo guardar' : 'Guardado')
    }
    pending.current = save
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(save, SAVE_DELAY_MS)
  }

  const day = parseYmd(date)
  const dayLink = (d: string) => (d === today ? '/diario' : `/diario?d=${d}`)

  return (
    <>
      <section className="stack" style={{ gap: 16 }}>
        <h1 className="title">Diario</h1>
        <div className="between">
          <Link className="btn ghost" href={dayLink(addDays(date, -1))} aria-label="Día anterior">←</Link>
          <span className="label">{date === today ? 'Hoy' : DAYS[day.getDay()]} · {dateLabel(date)} {date.slice(0, 4)}</span>
          {date < today ? <Link className="btn ghost" href={dayLink(addDays(date, 1))} aria-label="Día siguiente">→</Link> : <span style={{ width: 44 }} />}
        </div>
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <div className="between" style={{ flexWrap: 'wrap' }}>
          <div className="seg mono" role="group" aria-label="Estado de ánimo, de 1 (mal) a 5 (muy bien)">
            {MOODS.map((m) => (
              <button key={m} type="button" aria-pressed={entry.mood === m} aria-label={`Ánimo ${m} de 5`} onClick={() => edit({ mood: entry.mood === m ? null : m })}>
                {m}
              </button>
            ))}
          </div>
          <span className="mono muted" role="status">{status}</span>
        </div>
        <label className="sr" htmlFor="j-body">Entrada del día</label>
        <textarea id="j-body" className="note-body" style={{ minHeight: '30dvh' }} placeholder="¿Qué tal ha ido el día?" value={entry.body} onChange={(e) => edit({ body: e.target.value })} />
      </section>

      {recent.length > 0 && (
        <section className="stack">
          <span className="label">Entradas recientes</span>
          <div className="list">
            {recent.map((r) => (
              <Link key={r.date} className="item" href={dayLink(r.date)} aria-current={r.date === date ? 'true' : undefined}>
                <span className="mono time" style={{ width: 64 }}>{dateLabel(r.date)}</span>
                <span className="sm muted grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body.split('\n')[0] || 'Sin texto'}</span>
                {r.mood && <span className="mono">{r.mood}/5</span>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Diario />
    </Suspense>
  )
}
