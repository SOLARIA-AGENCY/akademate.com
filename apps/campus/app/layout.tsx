import type { Metadata } from 'next'
import React from 'react'

import { SessionProvider } from '../lib/session-context'
import { RealtimeProvider } from '../providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Akademate Campus',
  description: 'Campus alumno con acceso a cursos, materiales y certificados por tenant.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased">
        <SessionProvider>
          <RealtimeProvider>
            <div className="layout-shell">{children}</div>
          </RealtimeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
