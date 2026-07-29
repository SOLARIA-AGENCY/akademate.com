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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'),
  title: {
    default: 'Akademate | Operación para centros de formación',
    template: '%s | Akademate',
  },
  description:
    'Akademate es un SaaS en desarrollo para la operación académica y administrativa de centros de formación.',
  keywords: ['software para academias', 'gestión académica', 'centros de formación'],
  authors: [{ name: 'SOLARIA AGENCY OÜ' }],
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'Akademate | Operación para centros de formación',
    description:
      'Software en desarrollo con capacidades y límites comunicados de forma verificable.',
    url: 'https://akademate.com',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Akademate',
  },
  alternates: {
    canonical: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Akademate',
    description: 'Operación académica y administrativa para centros de formación.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
