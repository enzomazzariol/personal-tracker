'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, read, write, StudyTopic, StudyTrack, TOPIC_STATUS } from '@/lib/db'
import { advanceTopic } from '@/lib/study'

/** Lo que toca estudiar en una materia: los temas en curso o, si no hay, el siguiente pendiente. */
const focus = (topics: StudyTopic[]) => {
  const inProgress = topics.filter((t) => t.status === 'in_progress')
  if (inProgress.length > 0) return inProgress
  const next = topics.find((t) => t.status === 'pending')
  return next ? [next] : []
}

/** En la tarjeta de un bloque de estudio: los temas que tocan, con el estado a un toque. */
export default function BlockStudy() {
  const [tracks, setTracks] = useState<StudyTrack[] | null>(null)

  const load = useCallback(async () => {
    const data = await read(supabase.from('study_tracks').select('*, study_topics(*)').order('sort'), () => load())
    if (!data) return
    const list = data as StudyTrack[]
    list.forEach((t) => t.study_topics?.sort((a, b) => a.sort - b.sort))
    setTracks(list)
  }, [])
  useEffect(() => {
    load()
  }, [load])

  if (!tracks) return null

  async function advance(topic: StudyTopic) {
    const changes = advanceTopic(topic)
    setTracks((ts) => ts!.map((t) => ({ ...t, study_topics: t.study_topics?.map((x) => (x.id === topic.id ? { ...x, ...changes } : x)) })))
    await write(supabase.from('study_topics').update(changes).eq('id', topic.id), load)
  }

  const groups = tracks.map((t) => ({ track: t, topics: focus(t.study_topics ?? []) })).filter((g) => g.topics.length > 0)
  if (groups.length === 0)
    return (
      <p className="sm dim">
        No hay temas pendientes. <Link href="/estudio" style={{ textDecoration: 'underline' }}>Añade temario en Estudio</Link>.
      </p>
    )

  return (
    <div className="stack" style={{ gap: 16 }}>
      {groups.map(({ track, topics }) => (
        <div key={track.id}>
          <span className="label dim">{track.name}</span>
          <div style={{ marginTop: 8 }}>
            {topics.map((t) => (
              <div key={t.id} className="line between">
                <span className="sm" style={{ padding: '12px 0' }}>{t.title}</span>
                <button className="link mono" style={{ color: 'inherit', textTransform: 'uppercase' }} onClick={() => advance(t)} aria-label={`${t.title}: ${TOPIC_STATUS[t.status]}. Cambiar estado`}>
                  {TOPIC_STATUS[t.status]}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
