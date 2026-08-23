import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { getAppLoginUrl, probeAppLoginHealth } from '@/lib/app-login-health'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/login',
    copy: {
      en: {
        title: getDictionary('en').login.title,
        description: getDictionary('en').login.description,
      },
      es: {
        title: getDictionary('es').login.title,
        description: getDictionary('es').login.description,
      },
    },
  })
}

export default async function LoginPage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const loginUrl = getAppLoginUrl()
  const health = await probeAppLoginHealth(loginUrl)

  if (health.available) redirect(loginUrl)

  const href = (path: string) => localizedHref(path, locale)

  return (
    <div className="marketing-page min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture bg-[#06142f] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-blue-200">{dictionary.login.title}</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {dictionary.login.unavailableTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100/75">
              {dictionary.login.unavailableDescription}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href={href('/contacto?asunto=demo')} className="button-primary-light">
                {dictionary.login.demoCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={href('/contacto')} className="button-ghost-light">
                {dictionary.login.contactCta}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
