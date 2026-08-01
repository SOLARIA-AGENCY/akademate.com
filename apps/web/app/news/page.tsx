import type { Metadata } from 'next'
import { EditorialIndex } from '@/components/editorial/EditorialIndex'
import { newsPosts } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'Akademate product news and updates',
  description:
    'Read Akademate product news covering academy onboarding, new operating profiles and platform direction.',
  keywords: ['Akademate news', 'academy software updates', 'education SaaS product news'],
  alternates: { canonical: '/news' },
}

export default function NewsPage() {
  return <EditorialIndex kind="news" posts={newsPosts} />
}
