import type { CollectionAfterChangeHook } from 'payload'

type CampusRecord = {
  id: number | string
  name?: string | null
  tenant?: number | string | null
}

function relationNumber(value: number | string | null | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return undefined
}

export const ensureDefaultClassroom: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !doc?.id) return doc

  const campus = doc as CampusRecord
  const campusId = relationNumber(campus.id)
  if (!campusId) return doc
  const existing = await req.payload.find({
    collection: 'classrooms',
    where: {
      campus: { equals: campusId },
    },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) return doc

  const campusCode =
    typeof campus.name === 'string'
      ? campus.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .toUpperCase()
          .slice(0, 12)
      : 'SEDE'

  await req.payload.create({
    collection: 'classrooms',
    overrideAccess: true,
    data: {
      code: `${campusCode}-${campusId}-A1`,
      name: 'Aula 1',
      capacity: 30,
      campus: campusId,
      usage_policy: 'mixed',
      enabled_shifts: ['morning', 'afternoon'],
      data_quality_status: 'complete',
      is_active: true,
      tenant: relationNumber(campus.tenant),
    },
  })

  return doc
}
