'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured, DAYS_SHORT, MONTHS } from '@/lib/db'
import { NAV, MOBILE_ITEMS, MORE_GROUPS, isIn } from '@/lib/nav'
import Login from './Login'
import NewPassword from './NewPassword'
import Toaster from './Toaster'
import ExportButton from './ExportButton'

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  // Al volver del enlace de recuperación hay que pedir la contraseña nueva antes de entrar.
  // El evento puede llegar antes de suscribirse, así que también se mira la URL del enlace.
  const [recovering, setRecovering] = useState(() => typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(s)
    })
    // Si el enlace se abre en la pestaña donde ya está la app, el navegador solo cambia el fragmento (#) sin recargar,
    // y ni Supabase ni el estado inicial lo ven. Recargar hace que lo procesen.
    const onHash = () => window.location.hash.includes('type=recovery') && window.location.reload()
    window.addEventListener('hashchange', onHash)
    return () => {
      data.subscription.unsubscribe()
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  if (!configured)
    return (
      <div className="login">
        <p className="sm muted">Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_KEY.</p>
      </div>
    )
  if (session === undefined) return null
  if (!session) return <Login />
  if (recovering) return <NewPassword onDone={() => setRecovering(false)} />

  const now = new Date()
  const current = (href: string) => (isIn(path, href) ? 'page' : undefined)
  const inMore = isIn(path, '/mas') || MORE_GROUPS.some((g) => g.items.some((i) => isIn(path, i.href)))

  return (
    <div className="shell">
      <aside className="side">
        <span className="wordmark">tracker</span>
        <nav aria-label="Secciones" className="mono">
          {NAV.map((g) => (
            <div key={g.label} className="navgroup" role="group" aria-label={g.label}>
              <span className="navlabel" aria-hidden="true">{g.label}</span>
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} aria-current={current(i.href)}>
                  {i.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <ExportButton className="link">Exportar datos</ExportButton>
        <button className="link" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </aside>
      <header className="topbar between">
        <span className="wordmark">tracker</span>
        <span className="label">
          {DAYS_SHORT[now.getDay()]} {String(now.getDate()).padStart(2, '0')} {MONTHS[now.getMonth()]}
        </span>
      </header>
      <main className="main">{children}</main>
      <Toaster />
      <nav aria-label="Secciones" className="bottomnav mono">
        {MOBILE_ITEMS.map((i) => (
          <Link key={i.href} href={i.href} aria-current={current(i.href)}>
            {i.label}
          </Link>
        ))}
        <Link href="/mas" aria-current={inMore ? 'page' : undefined}>
          Más
        </Link>
      </nav>
    </div>
  )
}
