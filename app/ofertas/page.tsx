'use client'

import { useCallback, useEffect, useState } from 'react'
import ConfirmButton from '@/components/ConfirmButton'
import { supabase, read, write, JobApplication, JobStatus, JOB_STATUS, ymd, dateLabel } from '@/lib/db'

/** Orden de las secciones: lo más avanzado primero. Las descartadas van plegadas al final. */
const PIPELINE: JobStatus[] = ['offer', 'interview', 'applied', 'saved']
const STATUSES = Object.keys(JOB_STATUS) as JobStatus[]
const SECTION: Record<JobStatus, string> = { offer: 'Ofertas recibidas', interview: 'En entrevista', applied: 'Aplicadas', saved: 'Guardadas', rejected: 'Descartadas' }
const EMPTY = { company: '', role: '', url: '' }

export default function Ofertas() {
  const today = ymd(new Date())
  const [apps, setApps] = useState<JobApplication[] | null>(null)
  const [draft, setDraft] = useState(EMPTY)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showRejected, setShowRejected] = useState(false)

  const load = useCallback(async () => {
    const data = await read(supabase.from('job_applications').select('*').order('created_at', { ascending: false }), () => load())
    if (data) setApps(data as JobApplication[])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!apps) return null

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.company.trim()) return
    const { ok } = await write(supabase.from('job_applications').insert({ company: draft.company.trim(), role: draft.role.trim(), url: draft.url.trim() }))
    if (!ok) return
    setDraft(EMPTY)
    load()
  }
  async function update(id: string, changes: Partial<JobApplication>) {
    setApps((as) => as!.map((a) => (a.id === id ? { ...a, ...changes } : a)))
    await write(supabase.from('job_applications').update(changes).eq('id', id), load)
  }
  /** Al pasar a «Aplicada» por primera vez se apunta la fecha. */
  const setStatus = (a: JobApplication, status: JobStatus) =>
    update(a.id, status === 'applied' && !a.applied_on ? { status, applied_on: today } : { status })
  async function remove(id: string) {
    setOpenId(null)
    setApps((as) => as!.filter((a) => a.id !== id))
    await write(supabase.from('job_applications').delete().eq('id', id), load)
  }

  const inProgress = apps.filter((a) => a.status === 'applied' || a.status === 'interview').length
  const rejected = apps.filter((a) => a.status === 'rejected')

  const row = (a: JobApplication) => (
    <div key={a.id}>
      <div className="item">
        <button className="grow" style={{ background: 'none', border: 0, padding: '10px 0', textAlign: 'left' }} onClick={() => setOpenId(openId === a.id ? null : a.id)} aria-expanded={openId === a.id}>
          <span>{a.company}</span>
          {a.role && <span className="sm muted"> · {a.role}</span>}
        </button>
        {a.applied_on && <span className="mono muted desk">aplicada {dateLabel(a.applied_on)}</span>}
        <label className="sr" htmlFor={`st-${a.id}`}>Estado de {a.company}</label>
        <select id={`st-${a.id}`} className="select" value={a.status} onChange={(e) => setStatus(a, e.target.value as JobStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{JOB_STATUS[s]}</option>
          ))}
        </select>
      </div>
      {openId === a.id && <ApplicationEditor app={a} onChange={(c) => update(a.id, c)} onRemove={() => remove(a.id)} />}
    </div>
  )

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Ofertas</h1>
        <div className="big">
          {inProgress}
          <small> en curso</small>
        </div>
      </section>

      <form className="form" onSubmit={add}>
        <label className="sr" htmlFor="o-company">Empresa</label>
        <input id="o-company" className="input grow" placeholder="Empresa" value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
        <label className="sr" htmlFor="o-role">Puesto</label>
        <input id="o-role" className="input" placeholder="Puesto" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
        <label className="sr" htmlFor="o-url">Enlace</label>
        <input id="o-url" className="input" type="url" placeholder="Enlace a la oferta" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
        <button className="btn primary">Añadir</button>
      </form>

      {PIPELINE.map((status) => {
        const list = apps.filter((a) => a.status === status)
        if (list.length === 0 && status !== 'saved') return null
        return (
          <section key={status} className="stack">
            <div className="between">
              <span className="label">{SECTION[status]}</span>
              <span className="mono muted">{list.length}</span>
            </div>
            <div className="list">
              {list.map(row)}
              {list.length === 0 && <p className="empty">Guarda aquí las ofertas que te interesen.</p>}
            </div>
          </section>
        )
      })}

      {rejected.length > 0 && (
        <section className="stack">
          <button className="link" style={{ textAlign: 'left' }} onClick={() => setShowRejected(!showRejected)} aria-expanded={showRejected}>
            {showRejected ? 'Ocultar' : 'Ver'} descartadas ({rejected.length})
          </button>
          {showRejected && <div className="list">{rejected.map(row)}</div>}
        </section>
      )}
    </>
  )
}

function ApplicationEditor({ app, onChange, onRemove }: { app: JobApplication; onChange: (c: Partial<JobApplication>) => void; onRemove: () => void }) {
  const [notes, setNotes] = useState(app.notes)
  const id = app.id
  return (
    <div className="stack" style={{ gap: 14, padding: '8px 0 24px' }}>
      <div className="form">
        <label className="sr" htmlFor={`url-${id}`}>Enlace</label>
        <input id={`url-${id}`} className="input grow" type="url" placeholder="Enlace a la oferta" defaultValue={app.url} onBlur={(e) => e.target.value !== app.url && onChange({ url: e.target.value.trim() })} />
        {app.url && <a className="link" href={app.url} target="_blank" rel="noreferrer">Abrir oferta ↗</a>}
        <label className="sr" htmlFor={`ap-${id}`}>Fecha de candidatura</label>
        <input id={`ap-${id}`} className="input" type="date" value={app.applied_on ?? ''} onChange={(e) => onChange({ applied_on: e.target.value || null })} />
      </div>
      <label className="sr" htmlFor={`notes-${id}`}>Notas</label>
      <textarea id={`notes-${id}`} className="textarea" rows={4} placeholder="Notas: contacto, salario, impresiones de la entrevista…" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== app.notes && onChange({ notes })} />
      <div>
        <ConfirmButton label="Borrar" onConfirm={onRemove} />
      </div>
    </div>
  )
}
