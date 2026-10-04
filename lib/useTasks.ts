'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase, Task } from './db'

/** Lo que edita el formulario de tareas. Los campos opcionales vacíos son ''. */
export type TaskDraft = { title: string; area_id: string; project_id: string; due_date: string }
export const EMPTY_TASK: TaskDraft = { title: '', area_id: '', project_id: '', due_date: '' }

const toRow = (d: TaskDraft) => ({
  title: d.title,
  area_id: d.area_id || null,
  project_id: d.project_id || null,
  due_date: d.due_date || null,
})

/**
 * Tareas de un proyecto, o las personales (sin proyecto) si `projectId` es null, con sus operaciones.
 * Escrituras optimistas salvo al crear.
 */
export function useTasks(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[] | null>(null)

  const load = useCallback(async () => {
    const all = supabase.from('tasks').select('*')
    const query = projectId ? all.eq('project_id', projectId) : all.is('project_id', null)
    const { data } = await query.order('due_date', { nullsFirst: false }).order('created_at', { ascending: false }).limit(300)
    setTasks((data ?? []) as Task[])
  }, [projectId])
  useEffect(() => {
    load()
  }, [load])

  const patch = (id: string, changes: Partial<Task>) => setTasks((ts) => ts!.map((t) => (t.id === id ? { ...t, ...changes } : t)))

  const add = async (d: TaskDraft) => {
    await supabase.from('tasks').insert(toRow(d))
    load()
  }
  const save = async (id: string, d: TaskDraft) => {
    const row = toRow(d)
    patch(id, row)
    await supabase.from('tasks').update(row).eq('id', id)
    if (row.project_id !== projectId) load() // ha cambiado de lista
  }
  const toggle = async (t: Task) => {
    const changes = { done: !t.done, done_at: t.done ? null : new Date().toISOString() }
    patch(t.id, changes)
    await supabase.from('tasks').update(changes).eq('id', t.id)
  }
  const remove = async (t: Task) => {
    setTasks((ts) => ts!.filter((x) => x.id !== t.id))
    await supabase.from('tasks').delete().eq('id', t.id)
  }

  return { tasks, add, save, toggle, remove }
}
