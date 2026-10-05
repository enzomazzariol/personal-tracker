/** Avisos breves para toda la app (p. ej. «No se ha podido guardar»). Los muestra components/Toaster.tsx. */
export type Notice = { id: number; text: string; action?: { label: string; run: () => void } }

const DURATION_MS = 6000
let notices: Notice[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismiss(id: number) {
  notices = notices.filter((n) => n.id !== id)
  emit()
}

export function notify(text: string, action?: Notice['action']) {
  if (notices.some((n) => n.text === text)) return // no apilar el mismo aviso
  const id = nextId++
  notices = [...notices, { id, text, action }]
  emit()
  // Un aviso con acción («Reintentar») se queda hasta que se usa o se cierra: la página depende de él.
  if (!action) setTimeout(() => dismiss(id), DURATION_MS)
}

export const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getNotices = () => notices
