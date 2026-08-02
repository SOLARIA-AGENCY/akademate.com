import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import { LocaleProvider } from '@/components/i18n/locale-provider'
import { localizedAlternates } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import './globals.css'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://akademate.com'),
  title: {
    default: 'Akademate | Grow your academy and delight every learner',
    template: '%s | Akademate',
  },
  description:
    'Bring enrolment, operations, learning and revenue together in one academy operating system.',
  keywords: [
    'academy management',
    'education operations',
    'booking software',
    'sports academy software',
    'learning management',
    'academy payments',
  ],
  authors: [{ name: 'SOLARIA Agency' }],
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'Akademate | Grow your academy and delight every learner',
    description: 'One connected experience for enrolment, operations, learning and revenue.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Akademate',
    images: [
      {
        url: '/images/marketing/akademate-hero-operations.jpg',
        width: 1716,
        height: 917,
        alt: 'Modern learning business operations with Akademate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: localizedAlternates('/'),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = await getRequestLocale()
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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontSans.variable} font-sans antialiased min-h-screen`}
        style={Object.keys(themeVars).length ? themeVars : undefined}
      >
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  )
}
