'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Check from './Check'
import { supabase, read, write, JobApplication, dateLabel } from '@/lib/db'

/** En Hoy: las ofertas a las que toca volver a escribir. Marcarlas quita la fecha de seguimiento. */
export default function FollowUps({ today }: { today: string }) {
  const [apps, setApps] = useState<JobApplication[]>([])

  const load = useCallback(async () => {
    const data = await read(
      supabase.from('job_applications').select('*').lte('follow_up_on', today).in('status', ['applied', 'interview']).order('follow_up_on'),
      () => load(),
    )
    if (data) setApps(data as JobApplication[])
  }, [today])
  useEffect(() => {
    load()
  }, [load])

  if (apps.length === 0) return null

  async function done(a: JobApplication) {
    setApps((as) => as.filter((x) => x.id !== a.id))
    await write(supabase.from('job_applications').update({ follow_up_on: null }).eq('id', a.id), load)
  }

  return (
    <section className="stack">
      <div className="between">
        <span className="label">Seguimiento de ofertas</span>
        <Link className="mono muted" href="/ofertas">{apps.length}</Link>
      </div>
      <div className="list">
        {apps.map((a) => (
          <div key={a.id} className="item">
            <Check on={false} label={`Hecho el seguimiento de ${a.company}`} onClick={() => done(a)} />
            <span className="sm grow">Escribir a {a.company}{a.role && <span className="muted"> · {a.role}</span>}</span>
            {a.follow_up_on! < today && <span className="mono muted">desde {dateLabel(a.follow_up_on!)}</span>}
          </div>
        ))}
      </div>
    </section>
  )
}
