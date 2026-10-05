'use client'

import { useCallback, useEffect, useState } from 'react'
import ConfirmButton from '@/components/ConfirmButton'
import { supabase, StudyTopic, StudyTrack, TopicStatus, TOPIC_STATUS } from '@/lib/db'

/** Un toque en el estado avanza al siguiente: pendiente → en curso → dominado → pendiente. */
const NEXT: Record<TopicStatus, TopicStatus> = { pending: 'in_progress', in_progress: 'mastered', mastered: 'pending' }
const nextSort = (items: { sort: number }[]) => items.reduce((max, x) => Math.max(max, x.sort + 1), 0)

export default function Estudio() {
  const [tracks, setTracks] = useState<StudyTrack[] | null>(null)
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('study_tracks').select('*, study_topics(*)').order('sort').order('created_at')
    const list = (data ?? []) as StudyTrack[]
    list.forEach((t) => t.study_topics?.sort((a, b) => a.sort - b.sort))
    setTracks(list)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!tracks) return null

  const patchTrack = (id: string, f: (t: StudyTrack) => StudyTrack) => setTracks((ts) => ts!.map((t) => (t.id === id ? f(t) : t)))

  async function addTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('study_tracks').insert({ name: name.trim(), sort: nextSort(tracks!) })
    setName('')
    load()
  }
  async function removeTrack(id: string) {
    setTracks((ts) => ts!.filter((t) => t.id !== id))
    await supabase.from('study_tracks').delete().eq('id', id)
  }
  async function addTopic(track: StudyTrack, title: string) {
    const { data } = await supabase.from('study_topics').insert({ track_id: track.id, title, sort: nextSort(track.study_topics ?? []) }).select().single()
    if (data) patchTrack(track.id, (t) => ({ ...t, study_topics: [...(t.study_topics ?? []), data as StudyTopic] }))
  }
  async function cycleTopic(track: StudyTrack, topic: StudyTopic) {
    const status = NEXT[topic.status]
    patchTrack(track.id, (t) => ({ ...t, study_topics: t.study_topics!.map((x) => (x.id === topic.id ? { ...x, status } : x)) }))
    await supabase.from('study_topics').update({ status }).eq('id', topic.id)
  }
  async function removeTopic(track: StudyTrack, topic: StudyTopic) {
    patchTrack(track.id, (t) => ({ ...t, study_topics: t.study_topics!.filter((x) => x.id !== topic.id) }))
    await supabase.from('study_topics').delete().eq('id', topic.id)
  }

  const topics = tracks.flatMap((t) => t.study_topics ?? [])
  const mastered = topics.filter((t) => t.status === 'mastered').length

  return (
    <>
      <section className="between" style={{ alignItems: 'flex-end' }}>
        <h1 className="title">Estudio</h1>
        <div className="big">
          {mastered}
          <small> / {topics.length} dominados</small>
        </div>
      </section>

      <form className="form" onSubmit={addTrack}>
        <label className="sr" htmlFor="s-track">Materia</label>
        <input id="s-track" className="input grow" placeholder="Nueva materia (p. ej. Java, Inglés)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary">Añadir materia</button>
      </form>

      {tracks.map((track) => (
        <TrackSection
          key={track.id}
          track={track}
          onAddTopic={(title) => addTopic(track, title)}
          onCycle={(topic) => cycleTopic(track, topic)}
          onRemoveTopic={(topic) => removeTopic(track, topic)}
          onRemove={() => removeTrack(track.id)}
        />
      ))}
      {tracks.length === 0 && <p className="empty">Añade una materia y después su temario.</p>}
      {tracks.length > 0 && <p className="sm muted" style={{ marginTop: -24 }}>Pulsa el estado de un tema para pasarlo a en curso, dominado o pendiente.</p>}
    </>
  )
}

type SectionProps = {
  track: StudyTrack
  onAddTopic: (title: string) => void
  onCycle: (t: StudyTopic) => void
  onRemoveTopic: (t: StudyTopic) => void
  onRemove: () => void
}

function TrackSection({ track, onAddTopic, onCycle, onRemoveTopic, onRemove }: SectionProps) {
  const [title, setTitle] = useState('')
  const topics = track.study_topics ?? []
  const mastered = topics.filter((t) => t.status === 'mastered').length

  return (
    <section className="stack">
      <div className="between">
        <span className="label">{track.name}</span>
        <span className="mono muted">{mastered}/{topics.length}</span>
      </div>
      {topics.length > 0 && (
        <div className="bar">
          <i style={{ width: `${(mastered / topics.length) * 100}%` }} />
        </div>
      )}
      <div className="list">
        {topics.map((t) => (
          <div key={t.id} className="item">
            <span className={`sm grow ${t.status === 'mastered' ? 'muted' : ''}`}>{t.title}</span>
            <button className="link mono" style={{ minWidth: 88, textAlign: 'right', textTransform: 'uppercase', color: t.status === 'pending' ? undefined : 'var(--fg)' }} onClick={() => onCycle(t)} aria-label={`${t.title}: ${TOPIC_STATUS[t.status]}. Cambiar estado`}>
              {TOPIC_STATUS[t.status]}
            </button>
            <button className="x" aria-label={`Borrar tema: ${t.title}`} onClick={() => onRemoveTopic(t)}>×</button>
          </div>
        ))}
      </div>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          onAddTopic(title.trim())
          setTitle('')
        }}
      >
        <label className="sr" htmlFor={`topic-${track.id}`}>Nuevo tema de {track.name}</label>
        <input id={`topic-${track.id}`} className="input grow" placeholder="Nuevo tema" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn">Añadir tema</button>
      </form>
      <div>
        <ConfirmButton label="Borrar materia" note="Se borra también su temario." onConfirm={onRemove} />
      </div>
    </section>
  )
}
