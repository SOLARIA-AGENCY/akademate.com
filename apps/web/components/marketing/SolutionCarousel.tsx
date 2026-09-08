import { OptimizedImage } from '@/components/media/OptimizedImage'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { marketingText } from '@/lib/i18n/marketing-copy'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { verticals } from '@/lib/marketing-content'
import { getLocalizedVertical } from '@/lib/vertical-i18n'

export async function SolutionCarousel() {
  const locale = await getRequestLocale()
  const href = (path: string) => localizedHref(path, locale)
  const openLabel = marketingText(locale, 'See this academy model')

  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {verticals.map((item) => {
        const vertical = getLocalizedVertical(item.slug, locale)
        if (!vertical) return null
        return (
          <Link
            key={vertical.slug}
            href={href(`/solutions/${vertical.slug}`)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(7,22,51,.06)] transition hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
              <OptimizedImage
                src={vertical.image}
                alt={vertical.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col px-4 py-5">
              <h3 className="text-lg font-semibold tracking-tight text-[#071633]">
                {vertical.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{vertical.description}</p>
              <span className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#071633] px-4 text-sm font-semibold text-white transition group-hover:bg-blue-700">
                {openLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
