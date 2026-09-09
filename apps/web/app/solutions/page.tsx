import type { Metadata } from 'next'
import { OptimizedImage } from '@/components/media/OptimizedImage'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { marketingText } from '@/lib/i18n/marketing-copy'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { verticals } from '@/lib/marketing-content'
import { getLocalizedSolutionDetail, getLocalizedVertical } from '@/lib/vertical-i18n'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/solutions',
    image: '/images/marketing/akademate-multisite-network.jpg',
    copy: {
      en: {
        title: 'Academy management software for every learning model',
        description:
          'Academy management software for professional training, languages, wellness, sport, driving schools, camps, coding academies, performing arts, online education and multi-site groups.',
      },
      es: {
        title: 'Software de gestión de academias para cada modelo',
        description:
          'Software de gestión de academias para formación profesional, idiomas, bienestar, deporte, autoescuelas, campamentos, programación, artes, educación online y redes multisedes.',
      },
    },
  })
}

export default async function SolutionsPage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const href = (path: string) => localizedHref(path, locale)
  const openLabel = marketingText(locale, 'Know more')

  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture overflow-hidden bg-[#06142f] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-blue-200">{dictionary.solutions.eyebrow}</p>
              <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
                {dictionary.solutions.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100/75">
                {dictionary.solutions.description}
              </p>
            </div>
            <div className="scroll-depth relative aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_34px_100px_rgba(2,12,34,.46)]">
              <OptimizedImage
                src="/images/marketing/akademate-multisite-network.jpg"
                alt="Academy teams coordinating courses across in-person, online and multi-site learning models"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
        <section className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
            {verticals.map((item, index) => {
              const vertical = getLocalizedVertical(item.slug, locale)
              const detail = getLocalizedSolutionDetail(item.slug, locale)
              if (!vertical || !detail) return null
              return (
                <Link
                  key={vertical.slug}
                  href={href(`/solutions/${vertical.slug}`)}
                  className={`group overflow-hidden rounded-2xl bg-white shadow-sm ${index % 3 === 0 ? 'md:col-span-2 md:grid md:grid-cols-2' : ''}`}
                >
                  <div className="relative min-h-[300px] overflow-hidden">
                    <OptimizedImage
                      src={vertical.image}
                      alt={vertical.imageAlt}
                      fill
                      sizes={
                        index % 3 === 0
                          ? '(max-width: 768px) 100vw, 50vw'
                          : '(max-width: 768px) 100vw, 50vw'
                      }
                      className="object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <div className="p-7 sm:p-9">
                    <h2 className="text-3xl font-semibold tracking-tight">{vertical.title}</h2>
                    <p className="mt-4 text-lg leading-7 text-slate-600">{detail.headline}</p>
                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                      {detail.outcomes.slice(0, 4).map((outcome) => (
                        <li key={outcome} className="flex gap-2 text-sm text-slate-600">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
                            aria-hidden="true"
                          />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-8 inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#071633] px-5 text-sm font-semibold text-white">
                      {openLabel}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
