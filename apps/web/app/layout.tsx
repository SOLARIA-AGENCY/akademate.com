import type { Metadata } from 'next'
import { cookies } from 'next/headers'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('akademate_theme')?.value
  const themeVars: Record<string, string> = {}

  if (themeCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(themeCookie)) as Record<string, string>
      const mapping: Record<string, string> = {
        primary: '--primary',
        secondary: '--secondary',
        accent: '--accent',
        background: '--background',
        foreground: '--foreground',
      }
      for (const [key, cssVar] of Object.entries(mapping)) {
        const value = parsed[key]
        if (typeof value === 'string' && value.trim().length > 0) {
          themeVars[cssVar] = value.trim()
        }
      }
    } catch {
      // Ignore malformed theme cookie
    }
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased min-h-screen`}
        style={Object.keys(themeVars).length ? themeVars : undefined}
      >
        {children}
      </body>
    </html>
  )
}
