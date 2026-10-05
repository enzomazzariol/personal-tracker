'use client'

import { useState } from 'react'
import { supabase } from '@/lib/db'

/** Tras abrir el enlace de recuperación: la sesión ya está iniciada y falta elegir la contraseña nueva. */
export default function NewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setErr(error.message)
    onDone()
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <h1 className="title">tracker</h1>
        <span className="label">Contraseña nueva</span>
        <label className="sr" htmlFor="new-password">Contraseña nueva</label>
        <input id="new-password" className="input" type="password" required minLength={8} autoComplete="new-password" placeholder="Contraseña nueva (mínimo 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>Guardar y entrar</button>
      </form>
    </div>
  )
}
