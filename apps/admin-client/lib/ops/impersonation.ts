import { getDb } from '@/lib/db'
import { getTenantById } from '@/lib/ops/tenants'

export type ImpersonationAccessType = 'dashboard' | 'payload'

interface VerifyResult {
  reachable: boolean
  status: number | null
}

interface BuildUrlsResult {
  dashboardUrl: string
  payloadUrl: string
  environment: 'production' | 'staging' | 'development'
}

export interface ImpersonationAuditInput {
  tenantId: string
  accessType: ImpersonationAccessType
  actorUserId: string
  actorEmail: string
  actorName?: string | null
  reason?: string | null
}

export interface ImpersonationAuditResult {
  auditId: number
  targetUrl: string
  accessType: ImpersonationAccessType
  tenant: {
    id: string
    name: string
    slug: string
    domain: string | null
    active: boolean
  }
  environment: 'production' | 'staging' | 'development'
  destination: {
    reachable: boolean
    status: number | null
    checkedAt: string
  }
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/$/, '')
  }
  return `https://${trimmed}`.replace(/\/$/, '')
}

function inferEnvironment(url: string): 'production' | 'staging' | 'development' {
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('http://')) {
    return 'development'
  }
  if (url.includes('staging') || url.includes('preview') || url.includes('dev.')) {
    return 'staging'
  }
  return 'production'
}

function buildTenantUrls(tenant: { slug: string; domain: string | null }): BuildUrlsResult {
  const fallbackTenantBase = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_TENANT_ADMIN_URL?.trim() || 'http://akademate-tenant:3009'
  )
  const derivedDomain = tenant.domain?.trim()
  const tenantBase = derivedDomain
    ? normalizeBaseUrl(derivedDomain)
    : fallbackTenantBase

  return {
    dashboardUrl: tenantBase,
    payloadUrl: `${tenantBase}/admin`,
    environment: inferEnvironment(tenantBase),
  }
}

async function verifyDestination(url: string): Promise<VerifyResult> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    return {
      reachable: response.status < 500,
      status: response.status,
    }
  } catch {
    return {
      reachable: false,
      status: null,
    }
  }
}

let tableReady = false

async function ensureAuditTable(): Promise<void> {
  if (tableReady) return
  const db = getDb()
  await db.query(`
    CREATE TABLE IF NOT EXISTS ops_impersonation_audit (
      id BIGSERIAL PRIMARY KEY,
      tenant_id VARCHAR(64) NOT NULL,
      tenant_slug VARCHAR(128) NOT NULL,
      tenant_domain VARCHAR(255),
      tenant_name VARCHAR(255) NOT NULL,
      access_type VARCHAR(32) NOT NULL,
      target_url TEXT NOT NULL,
      destination_reachable BOOLEAN NOT NULL,
      destination_status INTEGER,
      actor_user_id VARCHAR(128) NOT NULL,
      actor_email VARCHAR(255) NOT NULL,
      actor_name VARCHAR(255),
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ops_impersonation_tenant_id ON ops_impersonation_audit(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_ops_impersonation_created_at ON ops_impersonation_audit(created_at);
  `)
  tableReady = true
}

export async function createImpersonationAudit(
  input: ImpersonationAuditInput
): Promise<ImpersonationAuditResult | null> {
  const tenant = await getTenantById(input.tenantId)
  if (!tenant) return null

  const urls = buildTenantUrls({ slug: tenant.slug, domain: tenant.domain })
  const targetUrl = input.accessType === 'payload' ? urls.payloadUrl : urls.dashboardUrl
  const destination = await verifyDestination(targetUrl)
  const checkedAt = new Date().toISOString()

  await ensureAuditTable()
  const db = getDb()
  const insert = await db.query<{ id: number }>(
    `INSERT INTO ops_impersonation_audit (
       tenant_id,
       tenant_slug,
       tenant_domain,
       tenant_name,
       access_type,
       target_url,
       destination_reachable,
       destination_status,
       actor_user_id,
       actor_email,
       actor_name,
       reason
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      tenant.id,
      tenant.slug,
      tenant.domain,
      tenant.name,
      input.accessType,
      targetUrl,
      destination.reachable,
      destination.status,
      input.actorUserId,
      input.actorEmail,
      input.actorName ?? null,
      input.reason ?? null,
    ]
  )

  return {
    auditId: insert.rows[0]!.id,
    targetUrl,
    accessType: input.accessType,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      active: tenant.active,
    },
    environment: urls.environment,
    destination: {
      reachable: destination.reachable,
      status: destination.status,
      checkedAt,
    },
  }
}
