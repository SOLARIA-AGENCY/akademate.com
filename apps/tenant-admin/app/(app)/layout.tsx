import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { ClientLayout } from '../ClientLayout'

export const metadata: Metadata = {
  title: 'Akademate | Gestor SaaS',
  description: 'Gestor SaaS para academias y centros de formación',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
