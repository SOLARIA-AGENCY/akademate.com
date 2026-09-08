import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/routing'

export function getNavigationLabel(href: string, dictionary: ReturnType<typeof getDictionary>) {
  const labels: Record<string, string> = {
    '/features': dictionary.navigation.features,
    '/solutions': dictionary.navigation.solutions,
    '/pricing': dictionary.navigation.pricing,
    '/blog': dictionary.navigation.blog,
    '/news': dictionary.navigation.news,
    '/download': dictionary.navigation.download,
    '/sobre-nosotros': dictionary.navigation.company,
  }
  return labels[href] ?? href
}

export function LanguageSelector({
  locale,
  hrefForLocale,
  dictionary,
  onNavigate,
  mobile = false,
}: {
  locale: Locale
  hrefForLocale: (locale: Locale) => string
  dictionary: ReturnType<typeof getDictionary>
  onNavigate?: () => void
  mobile?: boolean
}) {
  const commonClassName = mobile
    ? 'inline-flex min-h-11 items-center rounded-full border border-slate-200 p-1 text-sm font-semibold text-slate-600'
    : 'inline-flex min-h-11 items-center rounded-full border border-slate-200 p-1 text-xs font-semibold text-slate-600'

  return (
    <div className={commonClassName} role="group" aria-label={dictionary.header.chooseLanguage}>
      <a
        href={hrefForLocale('en')}
        lang="en"
        aria-current={locale === 'en' ? 'page' : undefined}
        className={`rounded-full px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${locale === 'en' ? 'bg-[#071633] text-white' : 'hover:bg-slate-100'}`}
        onClick={onNavigate}
      >
        EN<span className="sr-only"> — {dictionary.language.english}</span>
      </a>
      <a
        href={hrefForLocale('es')}
        lang="es"
        aria-current={locale === 'es' ? 'page' : undefined}
        className={`rounded-full px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${locale === 'es' ? 'bg-[#071633] text-white' : 'hover:bg-slate-100'}`}
        onClick={onNavigate}
      >
        ES<span className="sr-only"> — {dictionary.language.spanish}</span>
      </a>
    </div>
  )
}
