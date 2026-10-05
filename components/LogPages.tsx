'use client'

import { useState } from 'react'

/** Apuntar las páginas leídas hoy de un libro. */
export default function LogPages({ id, onLog }: { id: string; onLog: (pages: number) => void }) {
  const [pages, setPages] = useState('')
  return (
    <form
      className="row"
      style={{ gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault()
        const n = Math.round(Number(pages))
        if (n > 0) onLog(n)
        setPages('')
      }}
    >
      <label className="sr" htmlFor={`log-${id}`}>Páginas leídas hoy</label>
      <input id={`log-${id}`} className="input" type="number" min={1} inputMode="numeric" placeholder="Págs." style={{ width: 72 }} value={pages} onChange={(e) => setPages(e.target.value)} />
      <button className="btn">Apuntar</button>
    </form>
  )
}
