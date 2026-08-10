import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import { parseFinanceIntegrationRequest, type FinanceIntegrationRequestStatus } from './finance-integration-request.ts'
import type { FinanceRuntime } from './finance-runtime.ts'

const readRoles = new Set(['superadmin', 'admin', 'gestor'])

export type FinanceIntegrationRequestRecord = {
  id: string
  providerName: string
  providerWebsite: string
  apiDocumentationUrl: string | null
  countryCode: string
  currency: string
  legalEntityCount: number
  campusCount: number
  monthlyTransactionBand: string
  capabilities: string[]
  writebackRequested: boolean
  sandboxKnown: string
  urgency: string
  context: string
  status: FinanceIntegrationRequestStatus
  classification: string | null
  createdAt: string
  updatedAt: string
  events?: Array<{ fromStatus: string | null; toStatus: string; reasonCode: string | null; createdAt: string }>
}

export class FinanceIntegrationRequestError extends Error {
  readonly code: string
  constructor(code: string) { super(code); this.name = 'FinanceIntegrationRequestError'; this.code = code }
}

function fail(code: string): never { throw new FinanceIntegrationRequestError(code) }
function assertRuntime(runtime: FinanceRuntime): void { if (runtime.mode === 'disabled') fail('finance_runtime_disabled') }
function assertRead(principal: NextLearningPrincipal): void { if (!readRoles.has(principal.platformRole)) fail('finance_forbidden') }

function dateValue(value: unknown): string { return new Date(String(value)).toISOString() }

function mapRequest(row: Record<string, unknown>, events?: FinanceIntegrationRequestRecord['events']): FinanceIntegrationRequestRecord {
  return {
    id: String(row.id), providerName: String(row.provider_name), providerWebsite: String(row.provider_website), apiDocumentationUrl: row.api_documentation_url ? String(row.api_documentation_url) : null,
    countryCode: String(row.country_code), currency: String(row.currency), legalEntityCount: Number(row.legal_entity_count), campusCount: Number(row.campus_count), monthlyTransactionBand: String(row.monthly_transaction_band),
    capabilities: Array.isArray(row.capabilities) ? row.capabilities.map(String) : [], writebackRequested: row.writeback_requested === true, sandboxKnown: String(row.sandbox_known), urgency: String(row.urgency), context: String(row.context),
    status: String(row.status) as FinanceIntegrationRequestStatus, classification: row.classification ? String(row.classification) : null, createdAt: dateValue(row.created_at), updatedAt: dateValue(row.updated_at), events,
  }
}

export async function listFinanceIntegrationRequests(input: { tx: LearningSqlClient; principal: NextLearningPrincipal; runtime: FinanceRuntime }): Promise<{ items: FinanceIntegrationRequestRecord[] }> {
  assertRuntime(input.runtime); assertRead(input.principal)
  const rows = await input.tx.unsafe<Record<string, unknown>>(`SELECT id, provider_name, provider_website, api_documentation_url, country_code, currency, legal_entity_count, campus_count, monthly_transaction_band, capabilities, writeback_requested, sandbox_known, urgency, context, status, classification, created_at, updated_at FROM finance_integration_requests WHERE tenant_id = $1 ORDER BY created_at DESC, id DESC`, [input.principal.tenantId])
  return { items: rows.map((row) => mapRequest(row)) }
}

export async function createFinanceIntegrationRequest(input: { tx: LearningSqlClient; principal: NextLearningPrincipal; runtime: FinanceRuntime; payload: unknown }): Promise<FinanceIntegrationRequestRecord> {
  assertRuntime(input.runtime); assertRead(input.principal)
  const parsed = (() => { try { return parseFinanceIntegrationRequest(input.payload) } catch { fail('finance_invalid_request') } })()
  const rows = await input.tx.unsafe<Record<string, unknown>>(`
    INSERT INTO finance_integration_requests (tenant_id, requester_user_id, provider_name, provider_website, api_documentation_url, country_code, currency, legal_entity_count, campus_count, monthly_transaction_band, capabilities, writeback_requested, sandbox_known, urgency, context)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15)
    RETURNING id, provider_name, provider_website, api_documentation_url, country_code, currency, legal_entity_count, campus_count, monthly_transaction_band, capabilities, writeback_requested, sandbox_known, urgency, context, status, classification, created_at, updated_at
  `, [input.principal.tenantId, input.principal.userId, parsed.providerName, parsed.providerWebsite, parsed.apiDocumentationUrl, parsed.countryCode, parsed.currency, parsed.legalEntityCount, parsed.campusCount, parsed.monthlyTransactionBand, JSON.stringify(parsed.capabilities), parsed.writebackRequested, parsed.sandboxKnown, parsed.urgency, parsed.context])
  const row = rows[0]; if (!row) fail('finance_request_create_failed')
  await input.tx.unsafe(`INSERT INTO finance_integration_request_events (tenant_id, request_id, actor_user_id, from_status, to_status, reason_code) VALUES ($1, $2::uuid, $3, NULL, 'submitted', 'request_submitted')`, [input.principal.tenantId, row.id, input.principal.userId])
  return mapRequest(row)
}

export async function getFinanceIntegrationRequest(input: { tx: LearningSqlClient; principal: NextLearningPrincipal; runtime: FinanceRuntime; requestId: string }): Promise<FinanceIntegrationRequestRecord> {
  assertRuntime(input.runtime); assertRead(input.principal)
  const rows = await input.tx.unsafe<Record<string, unknown>>(`SELECT id, provider_name, provider_website, api_documentation_url, country_code, currency, legal_entity_count, campus_count, monthly_transaction_band, capabilities, writeback_requested, sandbox_known, urgency, context, status, classification, created_at, updated_at FROM finance_integration_requests WHERE tenant_id = $1 AND id = $2::uuid`, [input.principal.tenantId, input.requestId])
  const row = rows[0]; if (!row) fail('finance_request_not_found')
  const eventRows = await input.tx.unsafe<Record<string, unknown>>(`SELECT from_status, to_status, reason_code, created_at FROM finance_integration_request_events WHERE tenant_id = $1 AND request_id = $2::uuid ORDER BY created_at ASC, id ASC`, [input.principal.tenantId, input.requestId])
  return mapRequest(row, eventRows.map((event) => ({ fromStatus: event.from_status ? String(event.from_status) : null, toStatus: String(event.to_status), reasonCode: event.reason_code ? String(event.reason_code) : null, createdAt: dateValue(event.created_at) })))
}

export async function cancelFinanceIntegrationRequest(input: { tx: LearningSqlClient; principal: NextLearningPrincipal; runtime: FinanceRuntime; requestId: string }): Promise<FinanceIntegrationRequestRecord> {
  assertRuntime(input.runtime); assertRead(input.principal)
  try {
    await input.tx.unsafe(`SELECT akademate_next_cancel_finance_integration_request($1::uuid)`, [input.requestId])
  } catch (error) {
    if (error instanceof Error && (error.message.includes('finance_request_not_found') || error.message.includes('finance_request_cannot_cancel'))) fail(error.message.includes('not_found') ? 'finance_request_not_found' : 'finance_request_cannot_cancel')
    throw error
  }
  const updated = await input.tx.unsafe<Record<string, unknown>>(`SELECT id, provider_name, provider_website, api_documentation_url, country_code, currency, legal_entity_count, campus_count, monthly_transaction_band, capabilities, writeback_requested, sandbox_known, urgency, context, status, classification, created_at, updated_at FROM finance_integration_requests WHERE tenant_id = $1 AND id = $2::uuid`, [input.principal.tenantId, input.requestId])
  const row = updated[0]; if (!row) fail('finance_request_update_failed')
  return mapRequest(row)
}
