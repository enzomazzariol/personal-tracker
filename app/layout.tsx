import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Shell from '@/components/Shell'

export const metadata: Metadata = {
  title: 'Tracker',
  description: 'Tracker personal',
  appleWebApp: { capable: true, title: 'Tracker', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { themeColor: '#101010', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
