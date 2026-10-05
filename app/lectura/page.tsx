'use client'

import { useCallback, useEffect, useState } from 'react'
import ConfirmButton from '@/components/ConfirmButton'
import LogPages from '@/components/LogPages'
import { supabase, read, write, pagesRead, Book, BookStatus, BOOK_STATUS, ReadingLog, ymd, mondayOf, dateLabel } from '@/lib/db'

const EMPTY = { title: '', author: '', pages: '' }

export default function Lectura() {
  const today = ymd(new Date())
  const monday = mondayOf(today)
  const year = today.slice(0, 4)
  const [books, setBooks] = useState<Book[] | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    // ponytail: trae todo el registro de páginas con cada libro; paginar o agregar en SQL si crece mucho
    const data = await read(supabase.from('books').select('*, reading_log(id, book_id, date, pages)').order('created_at', { ascending: false }), () => load())
    if (data) setBooks(data as Book[])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!books) return null

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) return
    const { ok } = await write(supabase.from('books').insert({ title: draft.title.trim(), author: draft.author.trim(), pages: Number(draft.pages) || null }))
    if (!ok) return
    setDraft(EMPTY)
    load()
  }
  async function update(id: string, changes: Partial<Book>) {
    setBooks((bs) => bs!.map((b) => (b.id === id ? { ...b, ...changes } : b)))
    await write(supabase.from('books').update(changes).eq('id', id), load)
  }
  const setStatus = (b: Book, status: BookStatus) =>
    update(b.id, {
      status,
      ...(status === 'reading' && !b.started_on ? { started_on: today } : {}),
      ...(status === 'done' ? { finished_on: today } : {}),
    })
  async function logPages(b: Book, pages: number) {
    const { data } = await write<ReadingLog>(supabase.from('reading_log').insert({ book_id: b.id, pages, date: today }).select().single(), load)
    if (data) setBooks((bs) => bs!.map((x) => (x.id === b.id ? { ...x, reading_log: [...(x.reading_log ?? []), data as ReadingLog] } : x)))
  }
  async function remove(id: string) {
    setOpenId(null)
    setBooks((bs) => bs!.filter((b) => b.id !== id))
    await write(supabase.from('books').delete().eq('id', id), load)
  }

  const logs = books.flatMap((b) => b.reading_log ?? [])
  const sumPages = (from: string) => logs.filter((l) => l.date >= from).reduce((s, l) => s + l.pages, 0)
  const readThisYear = books.filter((b) => b.status === 'done' && b.finished_on?.startsWith(year)).length
  const editor = (b: Book) => openId === b.id && <BookEditor book={b} onChange={(c) => update(b.id, c)} onRemove={() => remove(b.id)} />
  const titleButton = (b: Book) => (
    <button className="grow" style={{ background: 'none', border: 0, padding: '10px 0', textAlign: 'left' }} onClick={() => setOpenId(openId === b.id ? null : b.id)} aria-expanded={openId === b.id}>
      <span>{b.title}</span>
      {b.author && <span className="sm muted"> · {b.author}</span>}
    </button>
  )

  const reading = books.filter((b) => b.status === 'reading')
  const want = books.filter((b) => b.status === 'want')
  const done = books.filter((b) => b.status === 'done').sort((a, b) => (b.finished_on ?? '').localeCompare(a.finished_on ?? ''))

  return (
    <>
      <h1 className="title">Lectura</h1>

      <section className="tiles three">
        <div className="tile">
          <span className="label">Hoy</span>
          <div className="big">{sumPages(today)}<small> págs.</small></div>
        </div>
        <div className="tile">
          <span className="label">Esta semana</span>
          <div className="big">{sumPages(monday)}<small> págs.</small></div>
        </div>
        <div className="tile desk">
          <span className="label">Leídos en {year}</span>
          <div className="big">{readThisYear}</div>
        </div>
      </section>

      <form className="form" onSubmit={add}>
        <label className="sr" htmlFor="b-title">Título</label>
        <input id="b-title" className="input grow" placeholder="Título del libro" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <label className="sr" htmlFor="b-author">Autor</label>
        <input id="b-author" className="input" placeholder="Autor" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
        <label className="sr" htmlFor="b-pages">Páginas</label>
        <input id="b-pages" className="input" type="number" min={1} inputMode="numeric" placeholder="Páginas" style={{ width: 100 }} value={draft.pages} onChange={(e) => setDraft({ ...draft, pages: e.target.value })} />
        <button className="btn primary">Añadir</button>
      </form>

      <section className="stack">
        <span className="label">{BOOK_STATUS.reading}</span>
        <div className="list">
          {reading.map((b) => {
            const done = pagesRead(b)
            return (
              <div key={b.id}>
                <div className="item" style={{ flexWrap: 'wrap' }}>
                  {titleButton(b)}
                  <span className="mono muted">{b.pages ? `${Math.min(done, b.pages)} / ${b.pages}` : `${done} págs.`}</span>
                  <LogPages id={b.id} onLog={(n) => logPages(b, n)} />
                  <button className="btn ghost" onClick={() => setStatus(b, 'done')}>Terminado</button>
                </div>
                {b.pages && (
                  <div className="bar" style={{ marginBottom: 8 }}>
                    <i style={{ width: `${Math.min(100, (done / b.pages) * 100)}%` }} />
                  </div>
                )}
                {editor(b)}
              </div>
            )
          })}
          {reading.length === 0 && <p className="empty">No estás leyendo nada. Empieza uno de la lista.</p>}
        </div>
      </section>

      <section className="stack">
        <span className="label">{BOOK_STATUS.want}</span>
        <div className="list">
          {want.map((b) => (
            <div key={b.id}>
              <div className="item">
                {titleButton(b)}
                <button className="btn ghost" onClick={() => setStatus(b, 'reading')}>Empezar</button>
              </div>
              {editor(b)}
            </div>
          ))}
          {want.length === 0 && <p className="empty">Nada en la lista.</p>}
        </div>
      </section>

      {done.length > 0 && (
        <section className="stack">
          <span className="label">Leídos</span>
          <div className="list">
            {done.map((b) => (
              <div key={b.id}>
                <div className="item">
                  {titleButton(b)}
                  {b.finished_on && <span className="mono muted">{dateLabel(b.finished_on)} {b.finished_on.slice(0, 4)}</span>}
                </div>
                {editor(b)}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function BookEditor({ book, onChange, onRemove }: { book: Book; onChange: (c: Partial<Book>) => void; onRemove: () => void }) {
  const [notes, setNotes] = useState(book.notes)
  const id = book.id
  return (
    <div className="stack" style={{ gap: 14, padding: '8px 0 24px' }}>
      <div className="form">
        <label className="sr" htmlFor={`au-${id}`}>Autor</label>
        <input id={`au-${id}`} className="input grow" placeholder="Autor" defaultValue={book.author} onBlur={(e) => e.target.value !== book.author && onChange({ author: e.target.value.trim() })} />
        <label className="sr" htmlFor={`pg-${id}`}>Páginas</label>
        <input id={`pg-${id}`} className="input" type="number" min={1} placeholder="Páginas" style={{ width: 100 }} defaultValue={book.pages ?? ''} onBlur={(e) => onChange({ pages: Number(e.target.value) || null })} />
      </div>
      <label className="sr" htmlFor={`bn-${id}`}>Notas del libro</label>
      <textarea id={`bn-${id}`} className="textarea" rows={5} placeholder="Ideas, citas, qué te llevas del libro…" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== book.notes && onChange({ notes })} />
      <div>
        <ConfirmButton label="Borrar libro" note="Se borra también su registro de páginas." onConfirm={onRemove} />
      </div>
    </div>
  )
}
