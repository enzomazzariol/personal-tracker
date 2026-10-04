'use client'

import Link from 'next/link'
import { supabase } from '@/lib/db'
import { MORE_GROUPS } from '@/lib/nav'

export default function Mas() {
  return (
    <>
      <h1 className="title">Más</h1>
      {MORE_GROUPS.map((g) => (
        <section key={g.label} className="stack">
          <span className="label">{g.label}</span>
          <div className="list">
            {g.items.map((i) => (
              <Link key={i.href} className="item between" href={i.href}>
                <span>{i.label}</span>
                <span className="muted">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <div className="list">
        <button className="item between" onClick={() => supabase.auth.signOut()}>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  )
}
