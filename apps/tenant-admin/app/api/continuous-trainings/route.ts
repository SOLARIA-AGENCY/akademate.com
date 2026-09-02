import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'
import { CONTINUOUS_TRAINING_COLLECTION } from '@/src/domain/continuous-training'
import type { ContinuousTrainingListingRow } from '@/src/domain/continuous-training'
import { durationLabel, isContinuousFundingType } from '@/src/domain/continuous-training'

export const dynamic = 'force-dynamic'

function relationLabel(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    const row = value as { name?: string; nombre?: string }
    return String(row.name ?? row.nombre ?? '').trim()
  }
  return ''
}

function mapDoc(doc: Record<string, unknown>): ContinuousTrainingListingRow {
  const funding = isContinuousFundingType(String(doc.funding_type ?? ''))
    ? (doc.funding_type as ContinuousTrainingListingRow['fundingType'])
    : 'unspecified'
  const campuses = Array.isArray(doc.campuses) ? doc.campuses : []
  const instructors = Array.isArray(doc.instructors) ? doc.instructors : []
  const thumb = doc.thumbnail
  const thumbnailUrl =
    thumb && typeof thumb === 'object' && thumb !== null && 'url' in thumb
      ? String((thumb as { url?: string }).url ?? '')
      : null
  const status = ['draft', 'active', 'inactive'].includes(String(doc.status))
    ? (doc.status as ContinuousTrainingListingRow['status'])
    : 'draft'
  const delivery = ['in_person', 'live_online', 'on_demand', 'hybrid'].includes(String(doc.delivery_mode))
    ? (doc.delivery_mode as ContinuousTrainingListingRow['deliveryMode'])
    : 'on_demand'

  return {
    id: String(doc.id),
    name: String(doc.name ?? 'Sin nombre'),
    description: String(doc.description ?? ''),
    areaLabel: relationLabel(doc.area),
    fundingType: funding,
    deliveryMode: delivery,
    durationLabel: durationLabel(
      typeof doc.duration_hours === 'number' ? doc.duration_hours : null,
      doc.unlimited_access === true,
    ),
    price: typeof doc.price === 'number' ? doc.price : null,
    status,
    campusLabel: campuses.map(relationLabel).filter(Boolean).join(', '),
    instructorLabel: instructors.map(relationLabel).filter(Boolean).join(', '),
    thumbnailUrl,
    capacity: typeof doc.capacity === 'number' ? doc.capacity : 0,
    activeEnrollmentCount: 0,
    virtualCampusUrl: typeof doc.virtual_campus_url === 'string' ? doc.virtual_campus_url : null,
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : null,
  }
}

export async function GET() {
  const user = await getAuthenticatedUserContext()
  if (!user) {
    return NextResponse.json({ docs: [], total: 0 }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: CONTINUOUS_TRAINING_COLLECTION,
      depth: 1,
      limit: 200,
      sort: '-updatedAt',
    })
    const docs = (result.docs as Array<Record<string, unknown>>).map(mapDoc)
    return NextResponse.json({ docs, total: result.totalDocs, schemaReady: true })
  } catch {
    return NextResponse.json({ docs: [], total: 0, schemaReady: false })
  }
}
