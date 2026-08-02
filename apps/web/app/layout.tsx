import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import { LocaleProvider } from '@/components/i18n/locale-provider'
import { publicRootMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'
import './globals.css'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  return publicRootMetadata(await getRequestLocale())
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
