import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { LocaleProvider } from '@/components/i18n/locale-provider'
import { JsonLd } from '@/components/seo/JsonLd'
import { AnalyticsClickCapture } from '@/components/tracking/AnalyticsClickCapture'
import { ConsentAwareAnalytics } from '@/components/tracking/ConsentAwareAnalytics'
import { CookieConsentBanner } from '@/components/tracking/CookieConsentBanner'
import { publicRootMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale, getRequestPathname } from '@/lib/i18n/server'
import { stripLocalePrefix } from '@/lib/i18n/routing'
import './globals.css'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return publicRootMetadata(await getRequestLocale())
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  const pathname = stripLocalePrefix(await getRequestPathname()).pathname

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased min-h-screen`}>
        <LocaleProvider locale={locale}>
          <JsonLd locale={locale} pathname={pathname} />
          <AnalyticsClickCapture />
          <ConsentAwareAnalytics />
          {children}
          <CookieConsentBanner />
        </LocaleProvider>
      </body>
    </html>
  )
}
