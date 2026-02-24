import type React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { ClientLayout } from './ClientLayout'

export const metadata: Metadata = {
  title: 'AKADEMATE Cliente - Admin',
  description: 'Plataforma de gestión para clientes AKADEMATE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
