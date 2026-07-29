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
    default: 'Akademate — The AI-assisted operating system for academies',
    template: '%s | Akademate',
  },
  description: 'Run students, courses, schedules, teams, communications and insight from one connected academy operating system.',
  keywords: ['academy management', 'education operations', 'student management', 'LMS', 'AI for academies'],
  authors: [{ name: 'SOLARIA Agency' }],
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  openGraph: {
    title: 'Akademate — The AI-assisted operating system for academies',
    description: 'One connected operating system for in-person, online and hybrid academies.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'Akademate',
    images: [{ url: '/images/marketing/akademate-hero-operations.jpg', width: 1716, height: 917, alt: 'Modern academy operations with Akademate' }],
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased min-h-screen`}
        style={Object.keys(themeVars).length ? themeVars : undefined}
      >
        {children}
      </body>
    </html>
  )
}
