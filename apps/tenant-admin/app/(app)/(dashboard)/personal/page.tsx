import { redirect } from 'next/navigation'

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  redirect(params?.tab === 'administrativos' ? '/dashboard/administrativo' : '/dashboard/profesores')
}
