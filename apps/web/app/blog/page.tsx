import type { Metadata } from 'next'
import { EditorialIndex } from '@/components/editorial/EditorialIndex'
import { insightPosts } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'Academy management insights and guides',
  description:
    'Practical guides on academy operations, enrolment, hybrid learning and responsible automation.',
  keywords: ['academy management', 'academy operations', 'course enrolment', 'virtual campus'],
  alternates: { canonical: '/blog' },
}

export default function BlogPage() {
  return <EditorialIndex kind="insight" posts={insightPosts} />
}
