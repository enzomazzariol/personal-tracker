'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, Note } from '@/lib/db'

export default function Notas() {
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false })
    setNotes((data ?? []) as Note[])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!notes) return null
  const note = notes.find((n) => n.id === openId) ?? null

  async function create() {
    const { data } = await supabase.from('notes').insert({ title: '', body: '' }).select().single()
    if (data) {
      setNotes([data as Note, ...notes!])
      setOpenId(data.id)
    }
  }
  function edit(changes: Partial<Note>) {
    if (!note) return
    const id = note.id
    setNotes((ns) => ns!.map((n) => (n.id === id ? { ...n, ...changes } : n)))
    setStatus('Guardando')
    if (timer.current) clearTimeout(timer.current)
    const next = { ...note, ...changes }
    timer.current = setTimeout(async () => {
      const { error } = await supabase.from('notes').update({ title: next.title, body: next.body, pinned: next.pinned, updated_at: new Date().toISOString() }).eq('id', id)
      setStatus(error ? 'No se pudo guardar' : 'Guardado')
    }, 500)
  }
  async function remove() {
    if (!note) return
    const id = note.id
    setOpenId(null)
    setNotes((ns) => ns!.filter((n) => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Notas</h1>
        <button className="btn primary" onClick={create}>Nueva nota</button>
      </section>
      <div className="notes">
        <div className="list mob-hide" style={{ display: note ? 'none' : 'block' }}>
          {notes.map((n) => (
            <button key={n.id} className="item" onClick={() => { setOpenId(n.id); setStatus('') }} aria-current={n.id === openId ? 'true' : undefined} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '10px 0', color: n.id === openId ? 'var(--muted)' : undefined }}>
              <span className="row" style={{ gap: 8 }}>
                {n.pinned && <span className="dot" />}
                <span>{n.title || 'Sin título'}</span>
              </span>
              <span className="sm muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{n.body.split('\n')[0] || 'Vacía'}</span>
            </button>
          ))}
          {notes.length === 0 && <p className="empty">Todavía no hay notas.</p>}
        </div>
        {note ? (
          <section className="stack" style={{ gap: 16 }}>
            <div className="between" style={{ flexWrap: 'wrap' }}>
              <button className="link mob" onClick={() => setOpenId(null)}>← Notas</button>
              <span className="mono muted" role="status">{status}</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn ghost" aria-pressed={note.pinned} onClick={() => edit({ pinned: !note.pinned })}>{note.pinned ? 'Quitar fijada' : 'Fijar'}</button>
                <button className="btn ghost" onClick={remove}>Borrar</button>
              </div>
            </div>
            <label className="sr" htmlFor="n-title">Título</label>
            <input id="n-title" className="note-title" placeholder="Título" value={note.title} onChange={(e) => edit({ title: e.target.value })} />
            <label className="sr" htmlFor="n-body">Contenido</label>
            <textarea id="n-body" className="note-body" placeholder="Escribe aquí" value={note.body} onChange={(e) => edit({ body: e.target.value })} />
          </section>
        ) : (
          <p className="sm muted desk">Elige una nota o crea una nueva.</p>
        )}
      </div>
    </>
  )
}
