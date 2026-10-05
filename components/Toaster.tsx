'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { dismiss, getNotices, subscribe } from '@/lib/notify'

const NONE: never[] = []

/**
 * Muestra los avisos de lib/notify. Es un popover para estar en la capa superior del navegador:
 * así queda por encima de un <dialog> modal abierto. Se vuelve a mostrar con cada aviso para quedar delante.
 */
export default function Toaster() {
  const notices = useSyncExternalStore(subscribe, getNotices, () => NONE)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el?.showPopover) return
    if (el.matches(':popover-open')) el.hidePopover()
    if (notices.length > 0) el.showPopover()
  }, [notices])

  return (
    <div ref={ref} popover="manual" className="toaster" role="status" aria-live="polite">
      {notices.map((n) => (
        <div key={n.id} className="toast">
          <span className="sm grow">{n.text}</span>
          {n.action && (
            <button
              className="link"
              onClick={() => {
                dismiss(n.id)
                n.action!.run()
              }}
            >
              {n.action.label}
            </button>
          )}
          <button className="x" aria-label="Cerrar aviso" onClick={() => dismiss(n.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
