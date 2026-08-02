import type { Metadata } from 'next'
import { EditorialIndex } from '@/components/editorial/EditorialIndex'
import { getInsightPosts } from '@/lib/blog-posts'
import { getEditorialMetadataAlternates, getEditorialUi } from '@/lib/editorial-i18n'
import { getRequestLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const content = getEditorialUi(locale).index.insight
  return {
    title: content.title,
    description: content.description,
    keywords:
      locale === 'es'
        ? [
            'gestión de academias',
            'operaciones académicas',
            'matrícula de cursos',
            'campus virtual',
          ]
        : ['academy management', 'academy operations', 'course enrolment', 'virtual campus'],
    alternates: getEditorialMetadataAlternates('/blog', locale),
  }
}

export default async function BlogPage() {
  const locale = await getRequestLocale()
  return <EditorialIndex kind="insight" posts={getInsightPosts(locale)} locale={locale} />
}
