import { z } from 'zod'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'
import type { FinanceRuntime } from './finance-runtime.ts'
import { getFinanceProviderCatalogEntry, type FinanceConnectionMode, type FinanceProviderKey } from './finance-provider.ts'

const financeRoles = new Set(['superadmin', 'admin', 'gestor'])
const financeWriteRoles = new Set(['superadmin', 'admin'])

export const createFinanceConnectionSchema = z.object({
  financeEntityId: z.uuid(),
  provider: z.enum(['holded', 'xero', 'quickbooks']),
  mode: z.enum(['scaffold', 'read_only', 'read_write']).default('scaffold'),
}).strict()

export const updateFinanceConnectionSchema = z.object({
  mode: z.enum(['scaffold', 'read_only', 'read_write']).optional(),
  status: z.enum(['disconnected', 'revoked']).optional(),
}).strict().refine((value) => value.mode !== undefined || value.status !== undefined, {
  message: 'at least one connection change is required',
})

export type FinanceConnectionRecord = {
  id: string
  financeEntityId: string
  provider: FinanceProviderKey
  mode: FinanceConnectionMode
  status: 'pending' | 'connected' | 'degraded' | 'revoked' | 'disconnected'
  externalOrganizationId: string | null
  externalOrganizationName: string | null
  hasCredential: boolean
  lastHealthCheckAt: string | null
  lastErrorCode: string | null
}

export class FinanceConnectionError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'FinanceConnectionError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new FinanceConnectionError(code)
}

function assertRuntime(runtime: FinanceRuntime): void {
  if (runtime.mode === 'disabled') fail('finance_runtime_disabled')
}

function assertCanRead(principal: NextLearningPrincipal): void {
  if (!financeRoles.has(principal.platformRole)) fail('finance_forbidden')
}

function assertCanWrite(principal: NextLearningPrincipal): void {
  if (!financeWriteRoles.has(principal.platformRole)) fail('finance_forbidden')
}

function mapConnection(row: Record<string, unknown>): FinanceConnectionRecord {
  return {
    id: String(row.id),
    financeEntityId: String(row.finance_entity_id),
    provider: String(row.provider) as FinanceProviderKey,
    mode: String(row.mode) as FinanceConnectionMode,
    status: String(row.status) as FinanceConnectionRecord['status'],
    externalOrganizationId: row.external_organization_id ? String(row.external_organization_id) : null,
    externalOrganizationName: row.external_organization_name ? String(row.external_organization_name) : null,
    hasCredential: row.has_credential === true,
    lastHealthCheckAt: row.last_health_check_at ? new Date(String(row.last_health_check_at)).toISOString() : null,
    lastErrorCode: row.last_error_code ? String(row.last_error_code) : null,
  }
}

export async function listNextFinanceConnections(input: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  runtime: FinanceRuntime
}): Promise<{ items: FinanceConnectionRecord[] }> {
  assertRuntime(input.runtime)
  assertCanRead(input.principal)
  const rows = await input.tx.unsafe<Record<string, unknown>>(`
    SELECT
      fc.id,
      fc.finance_entity_id,
      fc.provider,
      fc.mode,
      fc.status,
      fc.external_organization_id,
      fc.external_organization_name,
      EXISTS (
        SELECT 1 FROM finance_connection_credentials credentials
        WHERE credentials.tenant_id = fc.tenant_id AND credentials.connection_id = fc.id
      ) AS has_credential,
      fc.last_health_check_at,
      fc.last_error_code
    FROM finance_connections fc
    WHERE fc.tenant_id = $1
    ORDER BY fc.created_at DESC, fc.id DESC
  `, [input.principal.tenantId])
  return { items: rows.map(mapConnection) }
}

export async function createNextFinanceConnection(input: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  runtime: FinanceRuntime
  payload: unknown
}): Promise<FinanceConnectionRecord> {
  assertRuntime(input.runtime)
  assertCanWrite(input.principal)
  const parsed = createFinanceConnectionSchema.safeParse(input.payload)
  if (!parsed.success) fail('finance_invalid_request')
  const providerEntry = getFinanceProviderCatalogEntry(parsed.data.provider)
  if (!providerEntry.supportedModes.includes(parsed.data.mode)) fail('finance_mode_not_supported')
  if (parsed.data.mode !== 'scaffold' && providerEntry.availability !== 'available') fail('finance_provider_not_available')
  if (parsed.data.mode === 'scaffold' && input.runtime.mode !== 'scaffold') fail('finance_scaffold_requires_scaffold_runtime')

  const rows = await input.tx.unsafe<Record<string, unknown>>(`
    INSERT INTO finance_connections (
      tenant_id, finance_entity_id, provider, mode, status, created_by, updated_at
    )
    VALUES ($1, $2::uuid, $3, $4, 'pending', $5, now())
    RETURNING id, finance_entity_id, provider, mode, status, external_organization_id,
      external_organization_name, false AS has_credential, last_health_check_at, last_error_code
  `, [input.principal.tenantId, parsed.data.financeEntityId, parsed.data.provider, parsed.data.mode, input.principal.userId])
  const row = rows[0]
  if (!row) fail('finance_connection_create_failed')
  return mapConnection(row)
}

export async function updateNextFinanceConnection(input: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  runtime: FinanceRuntime
  connectionId: string
  payload: unknown
}): Promise<FinanceConnectionRecord> {
  assertRuntime(input.runtime)
  assertCanWrite(input.principal)
  const parsed = updateFinanceConnectionSchema.safeParse(input.payload)
  if (!parsed.success) fail('finance_invalid_request')

  const rows = await input.tx.unsafe<Record<string, unknown>>(`
    UPDATE finance_connections
    SET mode = COALESCE($3, mode),
        status = COALESCE($4, status),
        updated_at = now()
    WHERE tenant_id = $1 AND id = $2::uuid
    RETURNING id, finance_entity_id, provider, mode, status, external_organization_id,
      external_organization_name,
      EXISTS (SELECT 1 FROM finance_connection_credentials credentials
        WHERE credentials.tenant_id = finance_connections.tenant_id
          AND credentials.connection_id = finance_connections.id) AS has_credential,
      last_health_check_at, last_error_code
  `, [input.principal.tenantId, input.connectionId, parsed.data.mode ?? null, parsed.data.status ?? null])
  const row = rows[0]
  if (!row) fail('finance_connection_not_found')
  return mapConnection(row)
}

export async function getNextFinanceSummary(input: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  runtime: FinanceRuntime
}): Promise<{
  generatedAt: string
  connections: { total: number; connected: number; needsAttention: number }
  paymentProjection: { total: number; lastProjectedAt: string | null }
}> {
  assertRuntime(input.runtime)
  assertCanRead(input.principal)
  const rows = await input.tx.unsafe<Record<string, unknown>>(`
    SELECT
      (SELECT count(*)::integer FROM finance_connections WHERE tenant_id = $1) AS total_connections,
      (SELECT count(*)::integer FROM finance_connections WHERE tenant_id = $1 AND status = 'connected') AS connected_connections,
      (SELECT count(*)::integer FROM finance_connections WHERE tenant_id = $1 AND status IN ('degraded', 'revoked')) AS attention_connections,
      (SELECT count(*)::integer FROM finance_payment_projections WHERE tenant_id = $1) AS projection_count,
      (SELECT max(projected_at) FROM finance_payment_projections WHERE tenant_id = $1) AS last_projected_at
  `, [input.principal.tenantId])
  const row = rows[0]
  return {
    generatedAt: new Date().toISOString(),
    connections: {
      total: Number(row?.total_connections ?? 0),
      connected: Number(row?.connected_connections ?? 0),
      needsAttention: Number(row?.attention_connections ?? 0),
    },
    paymentProjection: {
      total: Number(row?.projection_count ?? 0),
      lastProjectedAt: row?.last_projected_at ? new Date(String(row.last_projected_at)).toISOString() : null,
    },
  }
}
