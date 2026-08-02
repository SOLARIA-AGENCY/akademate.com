import type { Metadata } from 'next'
import { EditorialIndex } from '@/components/editorial/EditorialIndex'
import { getInsightPosts } from '@/lib/blog-posts'
import { getEditorialUi } from '@/lib/editorial-i18n'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const metadata = publicPageMetadata({
    locale,
    pathname: '/blog',
    copy: {
      en: getEditorialUi('en').index.insight,
      es: getEditorialUi('es').index.insight,
    },
  })
  return {
    ...metadata,
    keywords:
      locale === 'es'
        ? [
            'gestión de academias',
            'operaciones académicas',
            'matrícula de cursos',
            'campus virtual',
          ]
        : ['academy management', 'academy operations', 'course enrolment', 'virtual campus'],
  }
}

export default async function BlogPage() {
  const locale = await getRequestLocale()
  return <EditorialIndex kind="insight" posts={getInsightPosts(locale)} locale={locale} />
}
