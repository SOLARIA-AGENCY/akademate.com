import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface LegacyStaffPageProps {
  params: Promise<{ id: string }>
}

interface StaffDocument {
  staff_type?: 'profesor' | 'administrativo' | null
}

export default async function LegacyStaffPage({ params }: LegacyStaffPageProps) {
  const { id } = await params
  const numericId = Number.parseInt(id, 10)

  if (!Number.isFinite(numericId)) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })

  let staff: StaffDocument | null = null

  try {
    staff = (await payload.findByID({
      collection: 'staff',
      id: numericId,
      depth: 0,
      overrideAccess: true,
    })) as StaffDocument
  } catch {
    notFound()
  }

  if (!staff) {
    notFound()
  }

  redirect(
    staff.staff_type === 'administrativo'
      ? `/dashboard/administrativo/${numericId}`
      : `/dashboard/profesores/${numericId}`,
  )
}
