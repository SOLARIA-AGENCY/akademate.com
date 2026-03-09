import type React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { ClientLayout } from './ClientLayout'

export const metadata: Metadata = {
  title: 'Akademate | Gestor SaaS',
  description: 'Gestor SaaS para academias y centros de formación',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning data-oid="eoaxa-2">
      <body data-oid="2nhc25q">
        <ClientLayout data-oid="gzykiwt">{children}</ClientLayout>
      </body>
    </html>
  )
}
