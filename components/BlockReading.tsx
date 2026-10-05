'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import LogPages from './LogPages'
import { supabase, read, write, pagesRead, Book, ReadingLog } from '@/lib/db'

/** En la tarjeta de un bloque de lectura: los libros en curso y apuntar las páginas de hoy. */
export default function BlockReading({ today }: { today: string }) {
  const [books, setBooks] = useState<Book[] | null>(null)

  const load = useCallback(async () => {
    const data = await read(supabase.from('books').select('*, reading_log(id, book_id, date, pages)').eq('status', 'reading').order('started_on'), () => load())
    if (data) setBooks(data as Book[])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!books) return null
  if (books.length === 0)
    return (
      <p className="sm dim">
        No estás leyendo ningún libro. <Link href="/lectura" style={{ textDecoration: 'underline' }}>Elige uno en Lectura</Link>.
      </p>
    )

  async function logPages(b: Book, pages: number) {
    const { data } = await write<ReadingLog>(supabase.from('reading_log').insert({ book_id: b.id, pages, date: today }).select().single())
    if (data) setBooks((bs) => bs!.map((x) => (x.id === b.id ? { ...x, reading_log: [...(x.reading_log ?? []), data] } : x)))
  }

  return (
    <div>
      {books.map((b) => {
        const done = pagesRead(b)
        const todayPages = (b.reading_log ?? []).filter((l) => l.date === today).reduce((s, l) => s + l.pages, 0)
        return (
          <div key={b.id} className="line between" style={{ flexWrap: 'wrap', padding: '8px 0' }}>
            <div className="stack" style={{ gap: 2 }}>
              <span className="sm">{b.title}</span>
              <span className="mono dim">
                {[b.pages ? `${Math.min(done, b.pages)} / ${b.pages} págs.` : `${done} págs.`, todayPages > 0 && `hoy ${todayPages}`].filter(Boolean).join(' · ')}
              </span>
            </div>
            <LogPages id={`blk-${b.id}`} onLog={(n) => logPages(b, n)} />
          </div>
        )
      })}
    </div>
  )
}
