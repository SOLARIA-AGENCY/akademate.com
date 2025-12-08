import type { Metadata } from 'next'
import React from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'Akademate Ops',
  description: 'Panel global de operaciones y soporte multitenant para Akademate.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased">
        <div className="layout-shell">
          <header className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Ops dashboard</span>
              <span className="text-lg font-semibold">Akademate</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">tenant-aware</span>
              <span className="rounded-full bg-secondary/20 px-3 py-1 text-secondary">audit ready</span>
            </div>
          </header>
          <main className="mt-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
