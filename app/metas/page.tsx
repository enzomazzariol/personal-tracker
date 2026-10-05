'use client'

import { useCallback, useEffect, useState } from 'react'
import Check from '@/components/Check'
import ConfirmButton from '@/components/ConfirmButton'
import { supabase, Goal, GoalMilestone, GoalStatus, GOAL_STATUS, ymd, dateLabel } from '@/lib/db'
import { periodLabel, periodOptions } from '@/lib/periods'

const STATUSES = Object.keys(GOAL_STATUS) as GoalStatus[]

export default function Metas() {
  const today = ymd(new Date())
  const periods = periodOptions(today)
  const [goals, setGoals] = useState<Goal[] | null>(null)
  const [draft, setDraft] = useState({ title: '', period: periods[0], due_date: '' })
  const [showClosed, setShowClosed] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('goals').select('*, goal_milestones(*)').order('period').order('created_at')
    const list = (data ?? []) as Goal[]
    list.forEach((g) => g.goal_milestones?.sort((a, b) => a.sort - b.sort))
    setGoals(list)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!goals) return null

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) return
    await supabase.from('goals').insert({ title: draft.title.trim(), period: draft.period, due_date: draft.due_date || null })
    setDraft({ ...draft, title: '', due_date: '' })
    load()
  }
  const patchGoal = (id: string, f: (g: Goal) => Goal) => setGoals((gs) => gs!.map((g) => (g.id === id ? f(g) : g)))
  async function update(id: string, changes: Partial<Goal>) {
    patchGoal(id, (g) => ({ ...g, ...changes }))
    await supabase.from('goals').update(changes).eq('id', id)
  }
  async function remove(id: string) {
    setGoals((gs) => gs!.filter((g) => g.id !== id))
    await supabase.from('goals').delete().eq('id', id)
  }
  async function addMilestone(goal: Goal, title: string) {
    const sort = (goal.goal_milestones ?? []).reduce((max, m) => Math.max(max, m.sort + 1), 0)
    const { data } = await supabase.from('goal_milestones').insert({ goal_id: goal.id, title, sort }).select().single()
    if (data) patchGoal(goal.id, (g) => ({ ...g, goal_milestones: [...(g.goal_milestones ?? []), data as GoalMilestone] }))
  }
  async function toggleMilestone(goal: Goal, m: GoalMilestone) {
    patchGoal(goal.id, (g) => ({ ...g, goal_milestones: g.goal_milestones!.map((x) => (x.id === m.id ? { ...x, done: !m.done } : x)) }))
    await supabase.from('goal_milestones').update({ done: !m.done }).eq('id', m.id)
  }
  async function removeMilestone(goal: Goal, m: GoalMilestone) {
    patchGoal(goal.id, (g) => ({ ...g, goal_milestones: g.goal_milestones!.filter((x) => x.id !== m.id) }))
    await supabase.from('goal_milestones').delete().eq('id', m.id)
  }

  const active = goals.filter((g) => g.status === 'active')
  const closed = goals.filter((g) => g.status !== 'active')
  const byPeriod = [...new Set(active.map((g) => g.period))]
  const item = (g: Goal) => (
    <GoalItem
      key={g.id}
      goal={g}
      onStatus={(status) => update(g.id, { status })}
      onRemove={() => remove(g.id)}
      onAddMilestone={(t) => addMilestone(g, t)}
      onToggleMilestone={(m) => toggleMilestone(g, m)}
      onRemoveMilestone={(m) => removeMilestone(g, m)}
    />
  )

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Metas</h1>
        <div className="big">
          {active.length}
          <small> en curso</small>
        </div>
      </section>

      <form className="form" onSubmit={add}>
        <label className="sr" htmlFor="g-title">Meta</label>
        <input id="g-title" className="input grow" placeholder="Nueva meta" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <label className="sr" htmlFor="g-period">Periodo</label>
        <select id="g-period" className="select" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })}>
          {periods.map((p) => (
            <option key={p} value={p}>{periodLabel(p)}</option>
          ))}
        </select>
        <label className="sr" htmlFor="g-due">Fecha límite</label>
        <input id="g-due" className="input" type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
        <button className="btn primary">Añadir</button>
      </form>

      {byPeriod.map((period) => (
        <section key={period} className="stack" style={{ gap: 16 }}>
          <span className="label">{periodLabel(period)}</span>
          {active.filter((g) => g.period === period).map(item)}
        </section>
      ))}
      {active.length === 0 && <p className="empty">Sin metas en curso. Apunta una para este trimestre.</p>}

      {closed.length > 0 && (
        <section className="stack" style={{ gap: 16 }}>
          <button className="link" style={{ textAlign: 'left' }} onClick={() => setShowClosed(!showClosed)} aria-expanded={showClosed}>
            {showClosed ? 'Ocultar' : 'Ver'} cerradas ({closed.length})
          </button>
          {showClosed && closed.map(item)}
        </section>
      )}
    </>
  )
}

type ItemProps = {
  goal: Goal
  onStatus: (s: GoalStatus) => void
  onRemove: () => void
  onAddMilestone: (title: string) => void
  onToggleMilestone: (m: GoalMilestone) => void
  onRemoveMilestone: (m: GoalMilestone) => void
}

function GoalItem({ goal: g, onStatus, onRemove, onAddMilestone, onToggleMilestone, onRemoveMilestone }: ItemProps) {
  const [milestone, setMilestone] = useState('')
  const milestones = g.goal_milestones ?? []
  const done = milestones.filter((m) => m.done).length

  return (
    <div className="panel stack" style={{ gap: 14 }}>
      <div className="between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="stack" style={{ gap: 4 }}>
          <h2 className="mid">{g.title}</h2>
          <span className="mono muted">
            {[periodLabel(g.period), g.due_date && `límite ${dateLabel(g.due_date)}`, milestones.length > 0 && `${done}/${milestones.length} hitos`].filter(Boolean).join(' · ')}
          </span>
        </div>
        <label className="sr" htmlFor={`gs-${g.id}`}>Estado</label>
        <select id={`gs-${g.id}`} className="select" value={g.status} onChange={(e) => onStatus(e.target.value as GoalStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{GOAL_STATUS[s]}</option>
          ))}
        </select>
      </div>
      {milestones.length > 0 && (
        <div className="bar">
          <i style={{ width: `${(done / milestones.length) * 100}%` }} />
        </div>
      )}
      <div className="list">
        {milestones.map((m) => (
          <div key={m.id} className="item">
            <Check on={m.done} label={m.done ? 'Desmarcar hito' : 'Marcar hito'} onClick={() => onToggleMilestone(m)} />
            <span className={`sm grow ${m.done ? 'strike' : ''}`}>{m.title}</span>
            <button className="x" aria-label={`Borrar hito: ${m.title}`} onClick={() => onRemoveMilestone(m)}>×</button>
          </div>
        ))}
      </div>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!milestone.trim()) return
          onAddMilestone(milestone.trim())
          setMilestone('')
        }}
      >
        <label className="sr" htmlFor={`m-${g.id}`}>Nuevo hito</label>
        <input id={`m-${g.id}`} className="input grow" placeholder="Nuevo hito" value={milestone} onChange={(e) => setMilestone(e.target.value)} />
        <button className="btn">Añadir hito</button>
      </form>
      <div>
        <ConfirmButton label="Borrar meta" note="Se borran también sus hitos." onConfirm={onRemove} />
      </div>
    </div>
  )
}
