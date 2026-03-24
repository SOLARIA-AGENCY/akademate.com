import type React from 'react'
import type { Metadata } from 'next'
import '../globals.css'
import { ClientLayout } from '../ClientLayout'

export const metadata: Metadata = {
  title: 'CEP Formacion — Centro de Formacion Profesional',
  description: 'Ciclos formativos oficiales de Grado Medio y Superior en Tenerife. Modalidad semipresencial, practicas en empresa, financiacion disponible.',
  icons: {
    icon: '/logos/cep-formacion-logo.png',
    apple: '/logos/cep-formacion-logo.png',
    shortcut: '/logos/cep-formacion-logo.png',
  },
  openGraph: {
    title: 'CEP Formacion — Formacion Profesional en Tenerife',
    description: 'Ciclos formativos oficiales. Semipresencial, practicas en empresa, financiacion disponible.',
    url: 'https://cepformacion.akademate.com',
    siteName: 'CEP Formacion',
    images: [
      {
        url: 'https://cepformacion.akademate.com/og-image.png',
        width: 1000,
        height: 1000,
        alt: 'CEP Formacion',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CEP Formacion — Formacion Profesional en Tenerife',
    description: 'Ciclos formativos oficiales. Semipresencial, practicas en empresa.',
    images: ['https://cepformacion.akademate.com/og-image.png'],
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
