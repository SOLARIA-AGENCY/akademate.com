import { getDb } from '@/lib/db'

export interface OpsTenantRecord {
  id: string
  name: string
  slug: string
  domain: string | null
  active: boolean
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  limits: {
    maxUsers: number | null
    maxCourses: number | null
    maxLeadsPerMonth: number | null
    storageQuotaMB: number | null
  }
  createdAt: string
  updatedAt: string
}

interface TenantRow {
  id: string
  name: string
  slug: string
  domain: string | null
  active: boolean
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  limits_max_users: number | null
  limits_max_courses: number | null
  limits_max_leads_per_month: number | null
  limits_storage_quota_m_b: number | null
  created_at: string
  updated_at: string
}

export interface TenantListResult {
  docs: OpsTenantRecord[]
  totalDocs: number
  page: number
  limit: number
  totalPages: number
}

function mapTenantRow(row: TenantRow): OpsTenantRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain,
    active: row.active,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    notes: row.notes,
    limits: {
      maxUsers: row.limits_max_users,
      maxCourses: row.limits_max_courses,
      maxLeadsPerMonth: row.limits_max_leads_per_month,
      storageQuotaMB: row.limits_storage_quota_m_b,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listTenants(params: {
  limit: number
  page: number
  search?: string
}): Promise<TenantListResult> {
  const db = getDb()
  const search = params.search?.trim()
  const offset = (params.page - 1) * params.limit

  const filters: string[] = []
  const values: Array<string | number> = []

  if (search) {
    values.push(`%${search}%`)
    const position = values.length
    filters.push(`(name ILIKE $${position} OR slug ILIKE $${position} OR COALESCE(domain, '') ILIKE $${position})`)
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''

  const countResult = await db.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM tenants ${whereClause}`,
    values
  )

  values.push(params.limit, offset)
  const limitPosition = values.length - 1
  const offsetPosition = values.length

  const rowsResult = await db.query<TenantRow>(
    `SELECT
       id,
       name,
       slug,
       domain,
       active,
       contact_email,
       contact_phone,
       notes,
       limits_max_users,
       limits_max_courses,
       limits_max_leads_per_month,
       limits_storage_quota_m_b,
       created_at,
       updated_at
     FROM tenants
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
    values
  )

  const totalDocs = parseInt(countResult.rows[0]?.total ?? '0', 10)

  return {
    docs: rowsResult.rows.map(mapTenantRow),
    totalDocs,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(totalDocs / params.limit)),
  }
}

export async function getTenantById(id: string): Promise<OpsTenantRecord | null> {
  const db = getDb()
  const result = await db.query<TenantRow>(
    `SELECT
       id,
       name,
       slug,
       domain,
       active,
       contact_email,
       contact_phone,
       notes,
       limits_max_users,
       limits_max_courses,
       limits_max_leads_per_month,
       limits_storage_quota_m_b,
       created_at,
       updated_at
     FROM tenants
     WHERE id = $1
     LIMIT 1`,
    [id]
  )

  const row = result.rows[0]
  return row ? mapTenantRow(row) : null
}

export async function createTenant(input: {
  name: string
  slug: string
  domain?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  notes?: string | null
  limitsMaxUsers: number
  limitsMaxCourses: number
  limitsMaxLeadsPerMonth: number
  limitsStorageQuotaMB: number
}): Promise<OpsTenantRecord> {
  const db = getDb()
  const result = await db.query<TenantRow>(
    `INSERT INTO tenants (
       name,
       slug,
       domain,
       contact_email,
       contact_phone,
       notes,
       limits_max_users,
       limits_max_courses,
       limits_max_leads_per_month,
       limits_storage_quota_m_b,
       active,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
     RETURNING
       id,
       name,
       slug,
       domain,
       active,
       contact_email,
       contact_phone,
       notes,
       limits_max_users,
       limits_max_courses,
       limits_max_leads_per_month,
       limits_storage_quota_m_b,
       created_at,
       updated_at`,
    [
      input.name,
      input.slug,
      input.domain ?? null,
      input.contactEmail ?? null,
      input.contactPhone ?? null,
      input.notes ?? null,
      input.limitsMaxUsers,
      input.limitsMaxCourses,
      input.limitsMaxLeadsPerMonth,
      input.limitsStorageQuotaMB,
    ]
  )

  return mapTenantRow(result.rows[0]!)
}

export async function updateTenant(
  id: string,
  input: {
    name: string
    slug: string
    domain?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    notes?: string | null
    active: boolean
    limitsMaxUsers: number
    limitsMaxCourses: number
    limitsMaxLeadsPerMonth: number
    limitsStorageQuotaMB: number
  }
): Promise<OpsTenantRecord | null> {
  const db = getDb()
  const result = await db.query<TenantRow>(
    `UPDATE tenants
     SET
       name = $2,
       slug = $3,
       domain = $4,
       contact_email = $5,
       contact_phone = $6,
       notes = $7,
       active = $8,
       limits_max_users = $9,
       limits_max_courses = $10,
       limits_max_leads_per_month = $11,
       limits_storage_quota_m_b = $12,
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       name,
       slug,
       domain,
       active,
       contact_email,
       contact_phone,
       notes,
       limits_max_users,
       limits_max_courses,
       limits_max_leads_per_month,
       limits_storage_quota_m_b,
       created_at,
       updated_at`,
    [
      id,
      input.name,
      input.slug,
      input.domain ?? null,
      input.contactEmail ?? null,
      input.contactPhone ?? null,
      input.notes ?? null,
      input.active,
      input.limitsMaxUsers,
      input.limitsMaxCourses,
      input.limitsMaxLeadsPerMonth,
      input.limitsStorageQuotaMB,
    ]
  )

  const row = result.rows[0]
  return row ? mapTenantRow(row) : null
}
