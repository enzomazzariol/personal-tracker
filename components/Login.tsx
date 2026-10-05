'use client'

import { useState } from 'react'
import { supabase } from '@/lib/db'

type Mode = 'in' | 'up' | 'reset'
const TITLES: Record<Mode, string> = { in: 'Entrar', up: 'Crear cuenta', reset: 'Recuperar la contraseña' }
const SUBMIT: Record<Mode, string> = { in: 'Entrar', up: 'Crear cuenta', reset: 'Enviar enlace' }

function authError(message: string) {
  if (message === 'Invalid login credentials') return 'Correo o contraseña incorrectos.'
  if (message === 'Email not confirmed') return 'Confirma tu correo con el enlace que te llegó y vuelve a entrar.'
  return message
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  function switchTo(next: Mode) {
    setMode(next)
    setErr('')
    setMsg('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    setBusy(true)
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr(authError(error.message))
    } else if (mode === 'up') {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      if (error) setErr(authError(error.message))
      else if (!data.session) {
        setMsg('Te llegó un correo de confirmación. Ábrelo, pulsa el enlace y luego entra aquí.')
        setMode('in')
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) setErr(authError(error.message))
      // El mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
      else setMsg('Si hay una cuenta con ese correo, te llegará un enlace para elegir una contraseña nueva. Ábrelo en este mismo navegador.')
    }
    setBusy(false)
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1 className="title">tracker</h1>
        <span className="label">{TITLES[mode]}</span>
        <label className="sr" htmlFor="email">Correo</label>
        <input id="email" className="input" type="email" required autoComplete="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== 'reset' && (
          <>
            <label className="sr" htmlFor="password">Contraseña</label>
            <input id="password" className="input" type="password" required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}
        {err && <p className="err" role="alert">{err}</p>}
        {msg && <p className="sm" role="status">{msg}</p>}
        <button className="btn primary" disabled={busy}>{SUBMIT[mode]}</button>
        {mode === 'in' && (
          <>
            <button type="button" className="link" onClick={() => switchTo('reset')}>He olvidado la contraseña</button>
            <button type="button" className="link" onClick={() => switchTo('up')}>Primera vez: crear cuenta</button>
          </>
        )}
        {mode !== 'in' && <button type="button" className="link" onClick={() => switchTo('in')}>Ya tengo cuenta: entrar</button>}
      </form>
    </div>
  )
}
