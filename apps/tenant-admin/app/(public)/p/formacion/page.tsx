import { notFound } from 'next/navigation'
import { WebsiteRenderer } from '../../_components/WebsiteRenderer'
import { getPublicPage, getTenantWebsite } from '@/app/lib/website/server'

export const dynamic = 'force-dynamic'

export default async function FormacionLandingPage() {
  const website = await getTenantWebsite()
  const page = await getPublicPage('/')

  if (!page) notFound()

  return <WebsiteRenderer page={page} brandColor={website.visualIdentity.colorPrimary} />
}
