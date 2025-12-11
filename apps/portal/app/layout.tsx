import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Akademate - Portal de Desarrollo',
  description: 'Centro de control y acceso a todos los dashboards del proyecto Akademate',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
