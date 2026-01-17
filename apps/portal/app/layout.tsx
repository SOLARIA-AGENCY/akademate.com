import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Akademate - Portal',
  description: 'Portal de acceso para academias y alumnos en Akademate.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="canonical" href="https://akademate.com/portal" />
      </head>
      <body>{children}</body>
    </html>
  )
}
