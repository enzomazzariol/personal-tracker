'use client'

import { useState } from 'react'

export type ProjectDraft = { name: string; client: string; due_date: string }
export const EMPTY_PROJECT: ProjectDraft = { name: '', client: '', due_date: '' }

export const toProjectRow = (d: ProjectDraft) => ({ name: d.name.trim(), client: d.client.trim(), due_date: d.due_date || null })

type Props = { id: string; initial: ProjectDraft; submit: string; onSave: (d: ProjectDraft) => void }

/** Alta y edición de proyectos. Al crear se vacía; al editar se conservan los valores guardados. */
export default function ProjectForm({ id, initial, submit, onSave }: Props) {
  const [d, setD] = useState(initial)
  const editing = Boolean(initial.name)

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!d.name.trim()) return
        onSave(d)
        if (!editing) setD(EMPTY_PROJECT)
      }}
    >
      <label className="sr" htmlFor={`${id}-n`}>Nombre</label>
      <input id={`${id}-n`} className="input grow" placeholder="Nombre del proyecto" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      <label className="sr" htmlFor={`${id}-c`}>Cliente</label>
      <input id={`${id}-c`} className="input" placeholder="Cliente" value={d.client} onChange={(e) => setD({ ...d, client: e.target.value })} />
      <label className="sr" htmlFor={`${id}-d`}>Entrega</label>
      <input id={`${id}-d`} className="input" type="date" value={d.due_date} onChange={(e) => setD({ ...d, due_date: e.target.value })} />
      <button className="btn primary">{submit}</button>
    </form>
  )
}
