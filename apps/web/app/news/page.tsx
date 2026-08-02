import type { Metadata } from 'next'
import { EditorialIndex } from '@/components/editorial/EditorialIndex'
import { getNewsPosts } from '@/lib/blog-posts'
import { getEditorialMetadataAlternates, getEditorialUi } from '@/lib/editorial-i18n'
import { getRequestLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const content = getEditorialUi(locale).index.news
  return {
    title: content.title,
    description: content.description,
    keywords:
      locale === 'es'
        ? [
            'novedades de Akademate',
            'actualizaciones de software para academias',
            'producto SaaS educativo',
          ]
        : ['Akademate news', 'academy software updates', 'education SaaS product news'],
    alternates: getEditorialMetadataAlternates('/news', locale),
  }
}

export default async function NewsPage() {
  const locale = await getRequestLocale()
  return <EditorialIndex kind="news" posts={getNewsPosts(locale)} locale={locale} />
}
