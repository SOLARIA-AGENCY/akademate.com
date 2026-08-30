import { withTenantScope } from '@/app/lib/server/tenant-scope'
import {
  ES_CANARIAS_SCE_PACK,
  EMPTY_REGION_PACK,
  findRegionPack,
  resolvePolicy,
  type AttendanceEvent,
  type AttendanceMark,
  type PolicyOverride,
  type RegionPackPayload,
} from '@/src/domain/compliance-ops'

type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: Array<Record<string, unknown>> }>
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) return relationId((value as { id: unknown }).id)
  return null
}

export async function loadResolvedPolicy(
  payload: PayloadLike,
  tenantId: number,
  scope?: { campusId?: string | number; courseRunId?: string | number },
): Promise<{ packId: string; policy: RegionPackPayload }> {
  const bindings = await payload.find({
    collection: 'region-pack-bindings',
    where: withTenantScope({ active: { equals: true } }, tenantId),
    limit: 50,
    overrideAccess: true,
  })

  const preferred =
    bindings.docs.find((doc) => doc.scope === 'course_run' && String(doc.scope_id) === String(scope?.courseRunId ?? '')) ??
    bindings.docs.find((doc) => doc.scope === 'campus' && String(doc.scope_id) === String(scope?.campusId ?? '')) ??
    bindings.docs.find((doc) => doc.scope === 'tenant')

  const pack = findRegionPack(String(preferred?.pack_id ?? '')) ?? EMPTY_REGION_PACK
  const override = (preferred?.override_json as PolicyOverride | undefined) ?? null
  return { packId: pack.id, policy: resolvePolicy({ pack, override }) }
}

export function mapRosterDoc(doc: Record<string, unknown>): AttendanceMark & { id: number } {
  return {
    id: Number(doc.id),
    enrollmentId: String(relationId(doc.enrollment) ?? ''),
    date: String(doc.session_date ?? '').slice(0, 10),
    code: String(doc.code ?? ''),
    scheduledHours: Number(doc.scheduled_hours ?? 0),
  }
}

export async function listRoster(
  payload: PayloadLike,
  tenantId: number,
  courseRunId: string | number,
): Promise<AttendanceMark[]> {
  const result = await payload.find({
    collection: 'attendance-roster-entries',
    where: withTenantScope({ course_run: { equals: courseRunId } }, tenantId),
    limit: 500,
    sort: 'session_date',
    overrideAccess: true,
  })
  return result.docs.map(mapRosterDoc)
}

export async function upsertRosterEntry(
  payload: PayloadLike,
  tenantId: number,
  input: AttendanceMark & { courseRunId: string | number; recordedBy?: string | number },
): Promise<AttendanceMark> {
  const existing = await payload.find({
    collection: 'attendance-roster-entries',
    where: withTenantScope(
      {
        and: [
          { enrollment: { equals: input.enrollmentId } },
          { session_date: { equals: input.date } },
        ],
      },
      tenantId,
    ),
    limit: 1,
    overrideAccess: true,
  })

  const data = {
    tenant: tenantId,
    course_run: input.courseRunId,
    enrollment: input.enrollmentId,
    session_date: input.date,
    code: input.code,
    scheduled_hours: input.scheduledHours,
    recorded_by: input.recordedBy,
  }

  const doc = existing.docs[0]
    ? await payload.update({
        collection: 'attendance-roster-entries',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'attendance-roster-entries',
        data,
        overrideAccess: true,
      })

  return mapRosterDoc(doc)
}

export async function persistEvents(
  payload: PayloadLike,
  tenantId: number,
  events: AttendanceEvent[],
): Promise<AttendanceEvent[]> {
  const created: AttendanceEvent[] = []
  for (const event of events) {
    const dedupeKey = `${tenantId}:${event.type}:${event.enrollmentId}:${event.value}`
    const existing = await payload.find({
      collection: 'attendance-events',
      where: { dedupe_key: { equals: dedupeKey } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) continue
    await payload.create({
      collection: 'attendance-events',
      data: {
        tenant: tenantId,
        enrollment: event.enrollmentId,
        event_type: event.type,
        value: event.value,
        at_date: event.atDate,
        acknowledged: false,
        dedupe_key: dedupeKey,
      },
      overrideAccess: true,
    })
    created.push(event)
  }
  return created
}

export async function listEvents(payload: PayloadLike, tenantId: number) {
  const result = await payload.find({
    collection: 'attendance-events',
    where: withTenantScope({}, tenantId),
    limit: 100,
    sort: '-createdAt',
    overrideAccess: true,
  })
  return result.docs.map((doc) => ({
    id: doc.id,
    type: doc.event_type,
    enrollmentId: relationId(doc.enrollment),
    value: Number(doc.value),
    atDate: String(doc.at_date ?? '').slice(0, 10),
    acknowledged: Boolean(doc.acknowledged),
  }))
}

export function defaultVerifyPackId(): string {
  return ES_CANARIAS_SCE_PACK.id
}
