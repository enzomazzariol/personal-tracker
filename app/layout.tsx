import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import Shell from '@/components/Shell'
import Veil from '@/components/Veil'

// ponytail: Manrope stands in for Roobert (paid); drop the licensed woff2 into next/font/local if you buy it
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Tracker',
  description: 'Tracker personal',
  appleWebApp: { capable: true, title: 'Tracker', statusBarStyle: 'black-translucent' },
}
export const viewport: Viewport = { themeColor: '#000000', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={sans.variable}>
      <body>
        <Veil />
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
