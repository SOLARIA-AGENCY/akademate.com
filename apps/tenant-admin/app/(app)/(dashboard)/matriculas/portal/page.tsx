import { redirect } from 'next/navigation'

export default async function MatriculasPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>
}) {
  const params = await searchParams
  const leadId = params.leadId?.trim()
  redirect(leadId ? `/matriculas/nueva?leadId=${encodeURIComponent(leadId)}` : '/matriculas/nueva')
}
