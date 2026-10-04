import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
export const configured = Boolean(url && key)
export const supabase = createClient(url || 'http://localhost:54321', key || 'missing')

export type BlockTask = { id: string; block_id: string; title: string; done: boolean; sort: number }
export type Block = {
  id: string
  date: string
  start_time: string
  end_time: string
  area_id: string
  tag: string
  title: string
  why: string
  status: 'pending' | 'done' | 'skipped'
  actual_minutes: number
  started_at: string | null
  block_tasks?: BlockTask[]
}
export type Area = { id: string; name: string; sort: number }
export type Week = { start_date: string; number: number; goal: string; wins: string[]; review_notes: string; reviewed_at: string | null }
export type Task = { id: string; title: string; area_id: string | null; due_date: string | null; done: boolean; done_at: string | null; created_at: string }
export type Note = { id: string; title: string; body: string; pinned: boolean; updated_at: string }
export type Reminder = { id: string; title: string; remind_at: string; done: boolean }

const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parseYmd(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
export const mondayOf = (s: string) => addDays(s, -((parseYmd(s).getDay() + 6) % 7))

export const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const dayLabel = (s: string) => {
  const d = parseYmd(s)
  return `${DAYS_SHORT[d.getDay()]} ${pad(d.getDate())}`
}
export const dateLabel = (s: string) => {
  const d = parseYmd(s)
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`
}

export const hm = (t: string) => t.slice(0, 5)
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
export const plannedMin = (b: Pick<Block, 'start_time' | 'end_time'>) => toMin(b.end_time) - toMin(b.start_time)
export const runningMin = (b: Block, now: number) => (b.started_at ? Math.max(0, (now - new Date(b.started_at).getTime()) / 60000) : 0)
export const doneMin = (b: Block, now: number) => b.actual_minutes + runningMin(b, now)

/** 90 -> "1,5", 120 -> "2" */
export const hours = (min: number) => {
  const h = Math.round((min / 60) * 10) / 10
  return String(h).replace('.', ',')
}
export const duration = (min: number) => (min < 60 ? `${min} min` : `${hours(min)} h`)
export const clock = (min: number) => {
  const s = Math.floor(min * 60)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export async function loadWeekBlocks(monday: string) {
  const { data, error } = await supabase
    .from('blocks')
    .select('*, block_tasks(*)')
    .gte('date', monday)
    .lte('date', addDays(monday, 6))
    .order('date')
    .order('start_time')
  if (error) throw error
  const blocks = (data ?? []) as Block[]
  blocks.forEach((b) => b.block_tasks?.sort((a, c) => a.sort - c.sort))
  return blocks
}
export async function loadWeek(monday: string) {
  const { data } = await supabase.from('weeks').select('*').eq('start_date', monday).maybeSingle()
  return data as Week | null
}
export async function loadAreas() {
  const { data } = await supabase.from('areas').select('*').order('sort')
  return (data ?? []) as Area[]
}
