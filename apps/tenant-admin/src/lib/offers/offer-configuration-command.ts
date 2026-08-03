import {
  OfferPublicationSchema,
  type OfferPublication,
} from '@akademate/operations/offer-publication'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'

type OfferRow = {
  id: number
  tenant_id: number
  course_id: number
  course_name: string
  codigo: string
  start_date: string | Date
  end_date: string | Date
  publication_access: unknown
  conversion_mode: unknown
  share_slug: string | null
  form_template_key: string | null
  external_action_url: string | null
  payment_plan: string | null
  offer_price_amount: number | string | null
  deposit_amount: number | string | null
  cta_label: string | null
  capacity_policy: unknown
}

export type OfferConfigurationRecord = OfferPublication & {
  courseRunId: number
  courseId: number
  courseName: string
  code: string
  startsAt: string
  endsAt: string
  shareSlug: string | null
  formTemplateKey: string | null
  externalActionUrl: string | null
  paymentPlan: 'full_amount' | 'deposit' | null
  priceAmount: number | null
  depositAmount: number | null
  ctaLabel: string | null
}

const OFFER_MANAGER_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])

export class NextOfferConfigurationError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextOfferConfigurationError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextOfferConfigurationError(code)
}

function positiveInteger(value: string | number): number {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) fail('course_run_id_invalid')
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) fail('course_run_id_invalid')
  return parsed
}

function numberOrNull(value: number | string | null): number | null {
  if (value === null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) fail('offer_persistence_invalid')
  return parsed
}

function iso(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) fail('offer_persistence_invalid')
  return date.toISOString()
}

function requireManager(principal: NextLearningPrincipal) {
  if (!OFFER_MANAGER_ROLES.has(principal.platformRole)) {
    fail('offer_configuration_forbidden')
  }
}

function mapOffer(row: OfferRow | undefined): OfferConfigurationRecord {
  if (!row) fail('offer_not_found')
  const parsed = OfferPublicationSchema.parse({
    publicationAccess: row.publication_access,
    conversionMode: row.conversion_mode,
    shareSlug: row.share_slug ?? undefined,
    formTemplateKey: row.form_template_key ?? undefined,
    externalActionUrl: row.external_action_url ?? undefined,
    paymentPlan: row.payment_plan ?? undefined,
    priceAmount: numberOrNull(row.offer_price_amount) ?? undefined,
    depositAmount: numberOrNull(row.deposit_amount) ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    capacityPolicy: row.capacity_policy,
  })

  return {
    ...parsed,
    courseRunId: row.id,
    courseId: row.course_id,
    courseName: row.course_name,
    code: row.codigo,
    startsAt: iso(row.start_date),
    endsAt: iso(row.end_date),
    shareSlug: parsed.shareSlug ?? null,
    formTemplateKey: parsed.formTemplateKey ?? null,
    externalActionUrl: parsed.externalActionUrl ?? null,
    paymentPlan: parsed.paymentPlan ?? null,
    priceAmount: parsed.priceAmount ?? null,
    depositAmount: parsed.depositAmount ?? null,
    ctaLabel: parsed.ctaLabel ?? null,
  }
}

const OFFER_COLUMNS = `
  cr.id,
  cr.tenant_id,
  cr.course_id,
  c.name AS course_name,
  cr.codigo,
  cr.start_date,
  cr.end_date,
  cr.publication_access,
  cr.conversion_mode,
  cr.share_slug,
  cr.form_template_key,
  cr.external_action_url,
  cr.payment_plan,
  cr.offer_price_amount,
  cr.deposit_amount,
  cr.cta_label,
  cr.capacity_policy
`

export async function getNextOfferConfiguration({
  tx,
  principal,
  courseRunId: rawCourseRunId,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  courseRunId: string | number
}): Promise<OfferConfigurationRecord> {
  requireManager(principal)
  const courseRunId = positiveInteger(rawCourseRunId)
  const rows = await tx.unsafe<OfferRow>(`
    SELECT ${OFFER_COLUMNS}
    FROM course_runs cr
    INNER JOIN courses c
      ON c.id = cr.course_id
      AND c.tenant_id = cr.tenant_id
    WHERE cr.tenant_id = $1 AND cr.id = $2
    LIMIT 1
  `, [principal.tenantId, courseRunId])
  return mapOffer(rows[0])
}

export async function updateNextOfferConfiguration({
  tx,
  principal,
  courseRunId: rawCourseRunId,
  input,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  courseRunId: string | number
  input: unknown
}): Promise<OfferConfigurationRecord> {
  requireManager(principal)
  const courseRunId = positiveInteger(rawCourseRunId)
  const offer = OfferPublicationSchema.parse(input)
  const rows = await tx.unsafe<OfferRow>(`
    UPDATE course_runs AS cr
    SET
      publication_access = $3,
      conversion_mode = $4,
      share_slug = $5,
      form_template_key = $6,
      external_action_url = $7,
      payment_plan = $8,
      offer_price_amount = $9,
      deposit_amount = $10,
      cta_label = $11,
      capacity_policy = $12,
      updated_at = NOW()
    FROM courses AS c
    WHERE cr.tenant_id = $1 AND cr.id = $2
      AND c.id = cr.course_id
      AND c.tenant_id = cr.tenant_id
    RETURNING ${OFFER_COLUMNS}
  `, [
    principal.tenantId,
    courseRunId,
    offer.publicationAccess,
    offer.conversionMode,
    offer.shareSlug ?? null,
    offer.formTemplateKey ?? null,
    offer.externalActionUrl ?? null,
    offer.paymentPlan ?? null,
    offer.priceAmount ?? null,
    offer.depositAmount ?? null,
    offer.ctaLabel ?? null,
    offer.capacityPolicy,
  ])
  return mapOffer(rows[0])
}
