import { notFound } from 'next/navigation'
import { WebsiteRenderer } from '../../_components/WebsiteRenderer'
import { getPublicPage, getTenantWebsite } from '@/app/lib/website/server'
import { applyCepHomeOverrides } from '@/app/lib/website/cep-home-overrides'

export const dynamic = 'force-dynamic'

export default async function FormacionLandingPage() {
  const website = await getTenantWebsite()
  const page = await getPublicPage('/')

  if (!page) notFound()

  const normalizedPage = applyCepHomeOverrides(page)
  return <WebsiteRenderer page={normalizedPage} brandColor={website.visualIdentity.colorPrimary} />
}
