'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, read, write, Task, TaskKind, TaskRepeat } from './db'

/** Lo que edita el formulario de tareas. Los campos opcionales vacíos son ''. */
export type TaskDraft = { title: string; kind: TaskKind; area_id: string; project_id: string; due_date: string; repeat: TaskRepeat | '' }
export const emptyTask = (kind: TaskKind, project_id = ''): TaskDraft => ({ title: '', kind, area_id: '', project_id, due_date: '', repeat: '' })
export const toDraft = (t: Task): TaskDraft => ({ title: t.title, kind: t.kind, area_id: t.area_id ?? '', project_id: t.project_id ?? '', due_date: t.due_date ?? '', repeat: t.repeat ?? '' })

/** Una tarea con proyecto siempre es de trabajo; una cotidiana no lleva proyecto (lo exige también la base de datos). */
const toRow = (d: TaskDraft) => ({
  title: d.title,
  kind: d.project_id ? 'work' : d.kind,
  area_id: d.area_id || null,
  project_id: d.kind === 'personal' ? null : d.project_id || null,
  due_date: d.due_date || null,
  repeat: d.repeat || null,
})

/**
 * Todas las tareas o, con `projectId`, solo las de ese proyecto, con sus operaciones.
 * Es la misma tarea en Tareas y en la ficha del proyecto. Escrituras optimistas salvo al crear.
 */
export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[] | null>(null)

  const load = useCallback(async () => {
    const all = supabase.from('tasks').select('*')
    const query = projectId ? all.eq('project_id', projectId) : all
    const data = await read(query.order('due_date', { nullsFirst: false }).order('created_at', { ascending: false }).limit(300), () => load())
    if (data) setTasks(data as Task[])
  }, [projectId])
  useEffect(() => {
    load()
  }, [load])

  const patch = (id: string, changes: Partial<Task>) => setTasks((ts) => ts!.map((t) => (t.id === id ? { ...t, ...changes } : t)))

  const add = async (d: TaskDraft) => {
    await write(supabase.from('tasks').insert(toRow(d)))
    load()
  }
  const save = async (id: string, d: TaskDraft) => {
    const row = toRow(d)
    patch(id, row)
    const { ok } = await write(supabase.from('tasks').update(row).eq('id', id), load)
    if (ok && projectId && row.project_id !== projectId) load() // ha salido de este proyecto
  }
  const toggle = async (t: Task) => {
    const changes = { done: !t.done, done_at: t.done ? null : new Date().toISOString() }
    patch(t.id, changes)
    const { ok } = await write(supabase.from('tasks').update(changes).eq('id', t.id), load)
    if (ok && t.repeat) load() // la base de datos crea (o quita) la siguiente repetición
  }
  const remove = async (t: Task) => {
    setTasks((ts) => ts!.filter((x) => x.id !== t.id))
    await write(supabase.from('tasks').delete().eq('id', t.id), load)
  }

  return { tasks, add, save, toggle, remove }
}
