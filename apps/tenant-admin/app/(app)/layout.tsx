import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { ClientLayout } from '../ClientLayout'

export const metadata: Metadata = {
  title: 'Akademate — Plataforma Educativa',
  description: 'Gestion academica, operaciones y campus virtual para centros de formacion.',
  icons: {
    icon: [
      { url: '/logos/akademate-favicon.svg', type: 'image/svg+xml' },
      { url: '/logos/akademate-logo-official.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/logos/akademate-logo-official.png',
    shortcut: '/logos/akademate-favicon.svg',
  },
  openGraph: {
    title: 'Akademate — Plataforma Educativa',
    description: 'SaaS multitenant para gestion academica y operativa.',
    url: 'https://akademate.com',
    siteName: 'Akademate',
    images: [
      {
        url: 'https://akademate.com/og-image.png',
        width: 1000,
        height: 1000,
        alt: 'Akademate',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akademate — Plataforma Educativa',
    description: 'SaaS multitenant para centros de formacion.',
    images: ['https://akademate.com/og-image.png'],
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
