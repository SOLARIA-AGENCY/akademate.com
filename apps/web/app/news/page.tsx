import type { Metadata } from 'next'
import { EditorialIndex } from '@/components/editorial/EditorialIndex'
import { getNewsPosts } from '@/lib/blog-posts'
import { getEditorialUi } from '@/lib/editorial-i18n'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const metadata = publicPageMetadata({
    locale,
    pathname: '/news',
    copy: {
      en: getEditorialUi('en').index.news,
      es: getEditorialUi('es').index.news,
    },
  })
  return {
    ...metadata,
    keywords:
      locale === 'es'
        ? [
            'novedades de Akademate',
            'actualizaciones de software para academias',
            'producto SaaS educativo',
          ]
        : ['Akademate news', 'academy software updates', 'education SaaS product news'],
  }
}

export default async function NewsPage() {
  const locale = await getRequestLocale()
  return <EditorialIndex kind="news" posts={getNewsPosts(locale)} locale={locale} />
}
