import { OfferPublicationSchema } from '@akademate/operations/offer-publication'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'

const HOST_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SYSTEM_HOSTS = new Set([
  'akademate.com',
  'akademate.io',
  'www.akademate.com',
  'www.akademate.io',
  'api.akademate.com',
  'api.akademate.io',
  'admin.akademate.com',
  'admin.akademate.io',
  'app.akademate.com',
  'app.akademate.io',
  'dashboard.akademate.com',
  'dashboard.akademate.io',
])

type PublicOfferRow = {
  tenant_slug: string
  tenant_name: string
  tenant_domain: string | null
  tenant_logo_url: string | null
  tenant_primary_color: string | null
  tenant_contact_email: string | null
  course_run_id: number
  course_id: number
  course_name: string
  short_description: string | null
  modality: string
  duration_hours: number | string | null
  course_image_url: string | null
  code: string
  starts_at: string | Date
  ends_at: string | Date
  enrollment_deadline: string | Date | null
  schedule_time_start: string | null
  schedule_time_end: string | null
  max_students: number | string
  current_enrollments: number | string
  campus_name: string | null
  campus_city: string | null
  campus_address: string | null
  publication_access: unknown
  conversion_mode: unknown
  share_slug: string
  form_template_key: string | null
  external_action_url: string | null
  payment_plan: string | null
  offer_price_amount: number | string | null
  deposit_amount: number | string | null
  cta_label: string | null
  capacity_policy: unknown
}
export type NextPublicOffer = {
  tenantSlug: string
  tenantName: string
  tenantDomain: string | null
  tenantLogoUrl: string | null
  tenantPrimaryColor: string
  tenantContactEmail: string | null
  courseRunId: number
  courseId: number
  courseName: string
  shortDescription: string | null
  modality: string
  durationHours: number | null
  courseImageUrl: string | null
  code: string
  startsAt: string
  endsAt: string
  enrollmentDeadline: string | null
  scheduleTimeStart: string | null
  scheduleTimeEnd: string | null
  maxStudents: number
  currentEnrollments: number
  availablePlaces: number | null
  campusName: string | null
  campusCity: string | null
  campusAddress: string | null
  publicationAccess: 'public' | 'unlisted'
  conversionMode: 'information_only' | 'interest_form' | 'free_registration' | 'approval_required' | 'paid_registration' | 'external_link'
  shareSlug: string
  externalActionUrl: string | null
  paymentPlan: 'full_amount' | 'deposit' | null
  priceAmount: number | null
  depositAmount: number | null
  ctaLabel: string | null
  capacityPolicy: 'limited' | 'waitlist' | 'unlimited'
}

export class NextPublicOfferError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextPublicOfferError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextPublicOfferError(code)
}

export function normalizePublicOfferHost(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/:\d{1,5}$/, '')
  if (!HOST_PATTERN.test(normalized) || SYSTEM_HOSTS.has(normalized)) {
    fail('public_offer_host_invalid')
  }
  return normalized
}

export function normalizeShareSlug(value: string): string {
  if (value.length < 3 || value.length > 160 || !SLUG_PATTERN.test(value)) {
    fail('public_offer_slug_invalid')
  }
  return value
}

function numeric(value: number | string | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function iso(value: string | Date | null): string | null {
  if (value === null) return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) fail('public_offer_projection_invalid')
  return parsed.toISOString()
}

function mapRow(row: PublicOfferRow): NextPublicOffer {
  const parsed = OfferPublicationSchema.safeParse({
    publicationAccess: row.publication_access,
    conversionMode: row.conversion_mode,
    shareSlug: row.share_slug,
    formTemplateKey: row.form_template_key ?? undefined,
    externalActionUrl: row.external_action_url ?? undefined,
    paymentPlan: row.payment_plan ?? undefined,
    priceAmount: numeric(row.offer_price_amount) ?? undefined,
    depositAmount: numeric(row.deposit_amount) ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    capacityPolicy: row.capacity_policy,
  })
  if (!parsed.success || parsed.data.publicationAccess === 'private') {
    fail('public_offer_projection_invalid')
  }
  const maxStudents = numeric(row.max_students)
  const currentEnrollments = numeric(row.current_enrollments)
  if (maxStudents === null || currentEnrollments === null) fail('public_offer_projection_invalid')
  const primaryColor = row.tenant_primary_color && /^#[0-9a-f]{6}$/i.test(row.tenant_primary_color)
    ? row.tenant_primary_color
    : '#2457F5'

  return {
    tenantSlug: row.tenant_slug,
    tenantName: row.tenant_name,
    tenantDomain: row.tenant_domain,
    tenantLogoUrl: row.tenant_logo_url,
    tenantPrimaryColor: primaryColor,
    tenantContactEmail: row.tenant_contact_email,
    courseRunId: row.course_run_id,
    courseId: row.course_id,
    courseName: row.course_name,
    shortDescription: row.short_description,
    modality: row.modality,
    durationHours: numeric(row.duration_hours),
    courseImageUrl: row.course_image_url,
    code: row.code,
    startsAt: iso(row.starts_at)!,
    endsAt: iso(row.ends_at)!,
    enrollmentDeadline: iso(row.enrollment_deadline),
    scheduleTimeStart: row.schedule_time_start,
    scheduleTimeEnd: row.schedule_time_end,
    maxStudents,
    currentEnrollments,
    availablePlaces: parsed.data.capacityPolicy === 'unlimited'
      ? null
      : Math.max(0, maxStudents - currentEnrollments),
    campusName: row.campus_name,
    campusCity: row.campus_city,
    campusAddress: row.campus_address,
    publicationAccess: parsed.data.publicationAccess,
    conversionMode: parsed.data.conversionMode,
    shareSlug: parsed.data.shareSlug!,
    externalActionUrl: parsed.data.externalActionUrl ?? null,
    paymentPlan: parsed.data.paymentPlan ?? null,
    priceAmount: parsed.data.priceAmount ?? null,
    depositAmount: parsed.data.depositAmount ?? null,
    ctaLabel: parsed.data.ctaLabel ?? null,
    capacityPolicy: parsed.data.capacityPolicy,
  }
}

export async function getNextPublicOffer({
  tx,
  host,
  shareSlug,
}: {
  tx: LearningSqlClient
  host: string
  shareSlug: string
}): Promise<NextPublicOffer> {
  const normalizedHost = normalizePublicOfferHost(host)
  const normalizedSlug = normalizeShareSlug(shareSlug)
  const rows = await tx.unsafe<PublicOfferRow>(`
    SELECT *
    FROM akademate_next_get_public_offer($1, $2)
  `, [normalizedHost, normalizedSlug])
  if (!rows[0]) fail('public_offer_not_found')
  return mapRow(rows[0])
}
