'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured, DAYS_SHORT, MONTHS } from '@/lib/db'
import Login from './Login'

const NAV = [
  { href: '/', label: 'Hoy' },
  { href: '/semana', label: 'Semana' },
  { href: '/tareas', label: 'Tareas' },
  { href: '/notas', label: 'Notas' },
  { href: '/proyectos', label: 'Proyectos', deskOnly: true },
  { href: '/recordatorios', label: 'Recordatorios', deskOnly: true },
  { href: '/revision', label: 'Revisión', deskOnly: true },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configured)
    return (
      <div className="login">
        <p className="sm muted">Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_KEY.</p>
      </div>
    )
  if (session === undefined) return null
  if (!session) return <Login />

  const now = new Date()
  const isIn = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`))
  const current = (href: string) => (isIn(href) ? 'page' : undefined)
  const inMore = isIn('/mas') || NAV.some((n) => n.deskOnly && isIn(n.href))

  return (
    <div className="shell">
      <header className="topbar between">
        <span className="wordmark">tracker</span>
        <span className="label mob">
          {DAYS_SHORT[now.getDay()]} {String(now.getDate()).padStart(2, '0')} {MONTHS[now.getMonth()]}
        </span>
        <nav aria-label="Secciones" className="mono">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}>
              {n.label}
            </Link>
          ))}
          <button onClick={() => supabase.auth.signOut()}>Salir</button>
        </nav>
      </header>
      <main className="main">{children}</main>
      <nav aria-label="Secciones" className="bottomnav mono">
        {NAV.filter((n) => !n.deskOnly).map((n) => (
          <Link key={n.href} href={n.href} aria-current={current(n.href)}>
            {n.label}
          </Link>
        ))}
        <Link href="/mas" aria-current={inMore ? 'page' : undefined}>
          Más
        </Link>
      </nav>
    </div>
  )
}
