'use client'

import { useState } from 'react'
import { exportData } from '@/lib/export'

export default function ExportButton({ className, children }: { className: string; children: React.ReactNode }) {
  const [busy, setBusy] = useState(false)
  return (
    <button className={className} disabled={busy} onClick={async () => {
      setBusy(true)
      await exportData()
      setBusy(false)
    }}>
      {busy ? 'Exportando…' : children}
    </button>
  )
}
