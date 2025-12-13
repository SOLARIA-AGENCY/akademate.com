import type { Metadata } from 'next'
import { Manrope, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fontSans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'Akademate - Plataforma de Formación',
    template: '%s | Akademate',
  },
  description: 'Plataforma SaaS multi-tenant para academias y centros de formación',
  keywords: ['formación', 'cursos', 'academia', 'educación', 'lms'],
  authors: [{ name: 'SOLARIA Agency' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Akademate',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  )
}
