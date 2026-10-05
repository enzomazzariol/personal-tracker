'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, read, write } from '@/lib/db'

/** A partir de esta hora, Hoy invita a escribir en el diario si aún no hay entrada. */
export const JOURNAL_PROMPT_HOUR = 19
const MOODS = [1, 2, 3, 4, 5]

/** En Hoy, al final del día: ánimo y una línea para el diario, sin salir de la pantalla. */
export default function JournalPrompt({ today }: { today: string }) {
  const [state, setState] = useState<'loading' | 'empty' | 'saved' | 'exists'>('loading')
  const [mood, setMood] = useState<number | null>(null)
  const [body, setBody] = useState('')

  useEffect(() => {
    supabase
      .from('journal')
      .select('date')
      .eq('date', today)
      .maybeSingle()
      .then((res) => {
        // null es «aún no hay entrada»; un error se avisa y el recordatorio no aparece.
        if (res.error) return void read(Promise.resolve(res))
        setState(res.data ? 'exists' : 'empty')
      })
  }, [today])

  if (state === 'loading' || state === 'exists') return null
  if (state === 'saved')
    return (
      <section className="panel stack">
        <span className="label">Diario</span>
        <p className="sm muted">Guardado. <Link href="/diario" style={{ textDecoration: 'underline' }}>Seguir escribiendo</Link></p>
      </section>
    )

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() && mood === null) return
    const { ok } = await write(supabase.from('journal').upsert({ date: today, body: body.trim(), mood, updated_at: new Date().toISOString() }))
    if (ok) setState('saved')
  }

  return (
    <form className="panel stack" style={{ gap: 14 }} onSubmit={save}>
      <span className="label">¿Qué tal ha ido el día?</span>
      <div className="seg mono" role="group" aria-label="Estado de ánimo, de 1 (mal) a 5 (muy bien)" style={{ alignSelf: 'flex-start' }}>
        {MOODS.map((m) => (
          <button key={m} type="button" aria-pressed={mood === m} aria-label={`Ánimo ${m} de 5`} onClick={() => setMood(mood === m ? null : m)}>{m}</button>
        ))}
      </div>
      <div className="form">
        <label className="sr" htmlFor="jp-body">Una línea sobre el día</label>
        <input id="jp-body" className="input grow" placeholder="Una línea sobre el día" value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn primary">Guardar</button>
      </div>
    </form>
  )
}
