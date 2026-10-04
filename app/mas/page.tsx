'use client'

import Link from 'next/link'
import { supabase } from '@/lib/db'

export default function Mas() {
  return (
    <>
      <h1 className="title">Más</h1>
      <div className="list">
        <Link className="item between" href="/proyectos">
          <span>Proyectos</span>
          <span className="muted">→</span>
        </Link>
        <Link className="item between" href="/recordatorios">
          <span>Recordatorios</span>
          <span className="muted">→</span>
        </Link>
        <Link className="item between" href="/revision">
          <span>Revisión de la semana</span>
          <span className="muted">→</span>
        </Link>
        <button className="item between" onClick={() => supabase.auth.signOut()}>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  )
}
