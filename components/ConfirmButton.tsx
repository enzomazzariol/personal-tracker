'use client'

import { useState } from 'react'

type Props = { label: string; /** Qué pasa al confirmar, p. ej. «Las tareas se conservan». */ note?: string; onConfirm: () => void }

/** Botón para acciones que no se pueden deshacer: el primer toque pide confirmación. */
export default function ConfirmButton({ label, note, onConfirm }: Props) {
  const [asking, setAsking] = useState(false)

  if (!asking) return <button className="btn ghost" onClick={() => setAsking(true)}>{label}</button>
  return (
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      {note && <span className="sm muted">{note}</span>}
      <button className="btn ghost" onClick={() => setAsking(false)}>Cancelar</button>
      <button className="btn primary" onClick={onConfirm}>{label}</button>
    </div>
  )
}
