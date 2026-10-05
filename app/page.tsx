'use client'

import { useCallback, useEffect, useState } from 'react'
import Check from '@/components/Check'
import BlockProjectTasks from '@/components/BlockProjectTasks'
import BlockEditor from '@/components/BlockEditor'
import BlockReading from '@/components/BlockReading'
import BlockStudy from '@/components/BlockStudy'
import FollowUps from '@/components/FollowUps'
import JournalPrompt, { JOURNAL_PROMPT_HOUR } from '@/components/JournalPrompt'
import {
  supabase, read, write, Changes, Block, Task, Reminder, Week, Area, Project,
  ymd, mondayOf, loadWeekBlocks, loadWeek, loadAreas, loadProjects, projectsForBlock, dueLabel,
  DAYS, MONTHS, hm, plannedMin, doneMin, runningMin, hours, duration, clock,
} from '@/lib/db'

export default function Hoy() {
  const [now, setNow] = useState(() => Date.now())
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [week, setWeek] = useState<Week | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  /** Tareas sin proyecto (cotidianas y de trabajo) para hoy o sin fecha. */
  const [tasks, setTasks] = useState<Task[]>([])
  /** Tareas abiertas de todos los proyectos: salen en su bloque o, si vencen, en la lista. */
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [capture, setCapture] = useState('')
  const [kind, setKind] = useState<'task' | 'note'>('task')
  const [saved, setSaved] = useState('')

  const today = ymd(new Date(now))
  const monday = mondayOf(today)

  const load = useCallback(async () => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const retry = () => load()
    const openTasks = () => supabase.from('tasks').select('*').eq('done', false)
    const [b, w, a, p, t, pt, r] = await Promise.all([
      loadWeekBlocks(monday, retry),
      loadWeek(monday, retry),
      loadAreas(retry),
      loadProjects(retry),
      read(openTasks().is('project_id', null).or(`due_date.is.null,due_date.lte.${today}`).order('due_date', { nullsFirst: false }).order('created_at').limit(12), retry),
      read(openTasks().not('project_id', 'is', null).order('due_date', { nullsFirst: false }).order('created_at').limit(200), retry),
      read(supabase.from('reminders').select('*').eq('done', false).lte('remind_at', end.toISOString()).order('remind_at'), retry),
    ])
    if (!b || !a || !p || !t || !pt || !r) return
    setBlocks(b)
    setWeek(w)
    setAreas(a)
    setProjects(p)
    setTasks(t as Task[])
    setProjectTasks(pt as Task[])
    setReminders(r as Reminder[])
  }, [monday, today])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!blocks) return null

  const d = new Date(now)
  const nowHm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const todays = blocks.filter((b) => b.date === today)
  const pending = todays.filter((b) => b.status === 'pending')
  const running = todays.find((b) => b.started_at)
  const current = todays.find((b) => b.id === picked) ?? running ?? pending.find((b) => hm(b.end_time) > nowHm) ?? pending[0] ?? null
  const others = todays.filter((b) => b.id !== current?.id)
  const sum = (list: Block[], f: (b: Block) => number) => list.reduce((s, b) => s + f(b), 0)
  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? id
  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.name
  const blockProjects = current ? projectsForBlock(current, projects) : []
  const blockKind = current ? areas.find((a) => a.id === current.area_id)?.kind : null
  const inBlock = (t: Task) => blockProjects.some((p) => p.id === t.project_id)
  // La lista: tareas personales y las de proyecto que vencen, salvo las que ya están en la tarjeta.
  const dueProjectTasks = projectTasks.filter((t) => t.due_date && t.due_date <= today && !inBlock(t))
  const listTasks = [...dueProjectTasks, ...tasks]

  async function patch(b: Block, changes: Changes<Block, 'block_tasks'>) {
    setBlocks((bs) => bs!.map((x) => (x.id === b.id ? { ...x, ...changes } : x)))
    await write(supabase.from('blocks').update(changes).eq('id', b.id), load)
  }
  const start = (b: Block) => patch(b, { started_at: new Date().toISOString(), status: 'pending' })
  const pause = (b: Block) => patch(b, { started_at: null, actual_minutes: Math.round(doneMin(b, Date.now())) })
  const finish = (b: Block) => {
    const worked = Math.round(doneMin(b, Date.now()))
    setPicked(null)
    return patch(b, { started_at: null, status: 'done', actual_minutes: worked || plannedMin(b) })
  }
  const skip = (b: Block) => {
    setPicked(null)
    return patch(b, { started_at: null, status: 'skipped' })
  }
  const reopen = (b: Block) => patch(b, { status: 'pending' })

  async function toggleBlockTask(b: Block, id: string, done: boolean) {
    setBlocks((bs) => bs!.map((x) => (x.id === b.id ? { ...x, block_tasks: x.block_tasks?.map((t) => (t.id === id ? { ...t, done } : t)) } : x)))
    await write(supabase.from('block_tasks').update({ done }).eq('id', id), load)
  }
  async function doneTask(t: Task) {
    setTasks((ts) => ts.filter((x) => x.id !== t.id))
    setProjectTasks((ts) => ts.filter((x) => x.id !== t.id))
    const { ok } = await write(supabase.from('tasks').update({ done: true, done_at: new Date().toISOString() }).eq('id', t.id), load)
    if (ok && t.repeat) load() // aparece la siguiente repetición si ya toca
  }
  async function doneReminder(r: Reminder) {
    setReminders((rs) => rs.filter((x) => x.id !== r.id))
    await write(supabase.from('reminders').update({ done: true }).eq('id', r.id), load)
  }
  async function addCapture(e: React.FormEvent) {
    e.preventDefault()
    const text = capture.trim()
    if (!text) return
    const { ok } = await write(kind === 'task' ? supabase.from('tasks').insert({ title: text }) : supabase.from('notes').insert({ title: text }))
    if (!ok) return // el texto se queda en el campo para reintentar
    setCapture('')
    setSaved(kind === 'task' ? 'Tarea guardada' : 'Nota guardada')
    setTimeout(() => setSaved(''), 2000)
    load()
  }

  const isRunning = Boolean(current?.started_at)
  const inWindow = current && hm(current.start_time) <= nowHm && hm(current.end_time) > nowHm

  return (
    <>
      <section className="stack" style={{ gap: 16 }}>
        <div className="between" style={{ alignItems: 'flex-end' }}>
          <h1 className="title">{DAYS[d.getDay()]}</h1>
          <span className="label desk" style={{ paddingBottom: 8 }}>
            {String(d.getDate()).padStart(2, '0')} {MONTHS[d.getMonth()]} · {nowHm}
            {week ? ` · Semana ${week.number}` : ''}
          </span>
        </div>
        {week?.goal && (
          <div className="stack">
            <span className="label">Meta de la semana</span>
            <p className="sm muted">{week.goal}</p>
          </div>
        )}
      </section>

      <section className="tiles three">
        <div className="tile">
          <span className="label">Hoy</span>
          <div className="big">
            {hours(sum(todays, (b) => doneMin(b, now)))}
            <small> / {hours(sum(todays, plannedMin))} h</small>
          </div>
        </div>
        <div className="tile">
          <span className="label">Semana</span>
          <div className="big">
            {hours(sum(blocks, (b) => doneMin(b, now)))}
            <small> / {hours(sum(blocks, plannedMin))} h</small>
          </div>
        </div>
        <div className="tile desk">
          <span className="label">Bloques de hoy</span>
          <div className="big">
            {todays.filter((b) => b.status === 'done').length}
            <small> / {todays.length}</small>
          </div>
        </div>
      </section>

      <div className="cols stack-lg">
        {current ? (
          <section className="card" aria-label="Bloque actual">
            <div className="between">
              <div className="row" style={{ gap: 8 }}>
                {isRunning && <span className="dot" />}
                <span className="label">
                  {current.status === 'done' ? 'Hecho' : current.status === 'skipped' ? 'Saltado' : isRunning ? 'En curso' : inWindow ? 'Ahora' : 'Siguiente'} · {hm(current.start_time)}–{hm(current.end_time)}
                </span>
              </div>
              <div className="row" style={{ gap: 12 }}>
                <span className="label dim">{areaName(current.area_id)}</span>
                <button className="link" style={{ color: 'inherit' }} onClick={() => setEditing(true)}>Editar</button>
              </div>
            </div>
            <h2 className={current.status === 'pending' ? '' : 'strike'}>{current.title}</h2>
            {Boolean(current.block_tasks?.length) && (
              <div>
                {current.block_tasks!.map((t) => (
                  <div key={t.id} className="line row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <Check on={t.done} label={t.done ? 'Desmarcar tarea' : 'Marcar tarea'} onClick={() => toggleBlockTask(current, t.id, !t.done)} />
                    <span className={`sm grow ${t.done ? 'dim' : ''}`} style={{ padding: '12px 0', textDecoration: t.done ? 'line-through' : undefined }}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <BlockProjectTasks projects={blockProjects} tasks={projectTasks} today={today} onDone={doneTask} />
            {blockKind === 'reading' && <BlockReading today={today} />}
            {blockKind === 'study' && <BlockStudy />}
            {current.why && <p className="sm dim">{current.why}</p>}
            {current.status === 'pending' ? (
              <div className="between" style={{ flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 16 }}>{clock(doneMin(current, now))}</span>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {isRunning ? (
                    <>
                      <button className="btn ghost" onClick={() => pause(current)}>Pausar</button>
                      <button className="btn primary" onClick={() => finish(current)}>Terminar bloque</button>
                    </>
                  ) : (
                    <>
                      <button className="btn ghost" onClick={() => skip(current)}>Saltar</button>
                      <button className="btn ghost" onClick={() => finish(current)}>Marcar hecho</button>
                      <button className="btn primary" onClick={() => start(current)}>{current.actual_minutes ? 'Reanudar' : 'Empezar bloque'}</button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="between">
                <span className="mono" style={{ fontSize: 16 }}>{duration(current.actual_minutes)}</span>
                <button className="btn ghost" onClick={() => reopen(current)}>Reabrir</button>
              </div>
            )}
          </section>
        ) : (
          <section className="panel stack">
            <span className="label">{todays.length ? 'Día completado' : 'Sin bloques hoy'}</span>
            <p className="sm muted">{todays.length ? 'No queda ningún bloque pendiente para hoy.' : 'No hay nada planificado para hoy.'}</p>
          </section>
        )}

        {editing && current && (
          <BlockEditor key={current.id} block={current} date={current.date} areas={areas} projects={projects} onClose={() => setEditing(false)} onChanged={load} />
        )}

        <div className="stack-lg">
          {others.length > 0 && (
            <section className="stack">
              <span className="label">Resto del día</span>
              <div className="list">
                {others.map((b) => (
                  <button key={b.id} className="item" onClick={() => setPicked(b.id)}>
                    <span className="mono time">{hm(b.start_time)}</span>
                    <span className={`grow ${b.status === 'pending' ? '' : 'strike'}`}>{b.title}</span>
                    <span className={`mono ${b.status === 'done' ? 'green' : 'muted'}`}>
                      {b.status === 'done' ? 'hecho' : b.status === 'skipped' ? 'saltado' : b.started_at ? clock(runningMin(b, now) + b.actual_minutes) : duration(plannedMin(b))}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {d.getHours() >= JOURNAL_PROMPT_HOUR && <JournalPrompt today={today} />}
          <FollowUps today={today} />

          <section className="stack">
            <div className="between">
              <span className="label">Tareas y recordatorios</span>
              <span className="mono muted">{listTasks.length + reminders.length}</span>
            </div>
            <div className="list">
              {reminders.map((r) => (
                <div key={r.id} className="item">
                  <Check on={false} label="Marcar recordatorio como hecho" onClick={() => doneReminder(r)} />
                  <span className="dot" />
                  <span className="sm grow">{r.title}</span>
                  <span className="mono" style={{ color: 'var(--muted)' }}>
                    {new Date(r.remind_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {listTasks.map((t) => (
                <div key={t.id} className="item">
                  <Check on={false} label="Marcar tarea como hecha" onClick={() => doneTask(t)} />
                  <span className="sm grow">{t.title}</span>
                  <span className="mono muted" style={{ textAlign: 'right' }}>{[projectName(t.project_id), t.due_date && t.due_date <= today ? dueLabel(t, today) : null].filter(Boolean).join(' · ')}</span>
                </div>
              ))}
              {listTasks.length + reminders.length === 0 && <p className="empty">Nada pendiente para hoy.</p>}
            </div>
          </section>

          <form className="form" onSubmit={addCapture}>
            <label className="sr" htmlFor="captura">Captura rápida</label>
            <input id="captura" className="input grow" placeholder={kind === 'task' ? 'Apunta una tarea' : 'Apunta una nota'} value={capture} onChange={(e) => setCapture(e.target.value)} />
            <div className="seg mono" role="group" aria-label="Tipo">
              <button type="button" aria-pressed={kind === 'task'} onClick={() => setKind('task')}>Tarea</button>
              <button type="button" aria-pressed={kind === 'note'} onClick={() => setKind('note')}>Nota</button>
            </div>
            <button className="btn primary">Añadir</button>
            <span className="mono green" role="status" style={{ flexBasis: '100%', minHeight: 14 }}>{saved}</span>
          </form>
        </div>
      </div>
    </>
  )
}
