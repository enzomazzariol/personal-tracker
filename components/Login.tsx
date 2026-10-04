'use client'

import { useState } from 'react'
import { supabase } from '@/lib/db'

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setBusy(true)
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message === 'Email not confirmed' ? 'Confirma tu correo con el enlace que te llegó y vuelve a entrar.' : error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      if (error) setErr(error.message)
      else if (!data.session) {
        setMsg('Te llegó un correo de confirmación. Ábrelo, pulsa el enlace y luego entra aquí.')
        setMode('in')
      }
    }
    setBusy(false)
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1 className="title">tracker</h1>
        <span className="label">{mode === 'in' ? 'Entrar' : 'Crear cuenta'}</span>
        <label className="sr" htmlFor="email">Correo</label>
        <input id="email" className="input" type="email" required autoComplete="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="sr" htmlFor="password">Contraseña</label>
        <input id="password" className="input" type="password" required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="err" role="alert">{err}</p>}
        {msg && <p className="sm" role="status">{msg}</p>}
        <button className="btn primary" disabled={busy}>
          {mode === 'in' ? 'Entrar' : 'Crear cuenta'}
        </button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr('') }}>
          {mode === 'in' ? 'Primera vez: crear cuenta' : 'Ya tengo cuenta: entrar'}
        </button>
      </form>
    </div>
  )
}
