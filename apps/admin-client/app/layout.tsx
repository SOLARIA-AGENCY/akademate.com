import type { Metadata } from 'next'
import React from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'Akademate Ops | Dashboard multitenant',
  description: 'Panel superadmin para tenants, facturación y soporte multitenant.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
