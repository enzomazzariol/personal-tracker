/** Periodos de las metas: un año ('2026') o un trimestre ('2026-T4'). */

export const quarterOf = (ymd: string) => `${ymd.slice(0, 4)}-T${Math.floor((Number(ymd.slice(5, 7)) - 1) / 3) + 1}`

export const nextQuarter = (quarter: string) => {
  const year = Number(quarter.slice(0, 4))
  const q = Number(quarter.slice(6))
  return q === 4 ? `${year + 1}-T1` : `${year}-T${q + 1}`
}

/** '2026-T4' -> 'T4 2026', '2026' -> '2026' */
export const periodLabel = (period: string) => (period.includes('-T') ? `${period.slice(5)} ${period.slice(0, 4)}` : period)

/** Lo que se ofrece al crear una meta: este trimestre, el siguiente, este año y el siguiente. */
export const periodOptions = (today: string) => {
  const quarter = quarterOf(today)
  const year = Number(today.slice(0, 4))
  return [quarter, nextQuarter(quarter), String(year), String(year + 1)]
}
