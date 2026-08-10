import { z } from 'zod'

export const financeIntegrationStatuses = ['submitted', 'under_review', 'api_validation', 'proposal_pending', 'accepted', 'in_development', 'sandbox_validation', 'available', 'declined', 'cancelled'] as const
export type FinanceIntegrationRequestStatus = (typeof financeIntegrationStatuses)[number]
export type FinanceIntegrationClassification = 'public_api_oauth' | 'public_api_token' | 'api_discovery_required' | 'file_exchange' | 'custom_middleware' | 'not_feasible'

const capabilities = ['accounts', 'taxes', 'contacts', 'invoices', 'expenses', 'payments', 'banking', 'payroll', 'reports'] as const
const privateHostname = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|::1|fc[0-9a-f]{2}:|fe80:)/i

function publicHttpsUrl(value: string, optional: boolean): string | null {
  const trimmed = value.trim()
  if (!trimmed && optional) return null
  let parsed: URL
  try { parsed = new URL(trimmed) } catch { throw new Error('invalid_url') }
  if (parsed.protocol !== 'https:' || privateHostname.test(parsed.hostname) || parsed.hostname.endsWith('.localhost')) throw new Error('invalid_url')
  return parsed.toString()
}

export const financeIntegrationRequestSchema = z.object({
  providerName: z.string().trim().min(2).max(160),
  providerWebsite: z.string().trim().min(1).max(1000),
  apiDocumentationUrl: z.string().trim().max(1000).nullable().optional(),
  countryCode: z.string().trim().length(2),
  currency: z.string().trim().length(3),
  legalEntityCount: z.coerce.number().int().positive().max(10000),
  campusCount: z.coerce.number().int().positive().max(100000),
  monthlyTransactionBand: z.enum(['under_100', '100_999', '1000_9999', '10000_plus']),
  capabilities: z.array(z.enum(capabilities)).min(1).max(capabilities.length),
  writebackRequested: z.boolean().default(false),
  sandboxKnown: z.enum(['yes', 'no', 'unknown']),
  urgency: z.enum(['exploring', 'quarter', 'sixty_days', 'thirty_days']),
  context: z.string().trim().min(20).max(4000),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.capabilities).size !== value.capabilities.length) ctx.addIssue({ code: 'custom', path: ['capabilities'], message: 'capabilities must be unique' })
  if (value.writebackRequested && value.capabilities.length === 0) ctx.addIssue({ code: 'custom', path: ['capabilities'], message: 'writeback needs a capability' })
  try { publicHttpsUrl(value.providerWebsite, false) } catch { ctx.addIssue({ code: 'custom', path: ['providerWebsite'], message: 'provider website must be a public HTTPS URL' }) }
  if (value.apiDocumentationUrl) {
    try { publicHttpsUrl(value.apiDocumentationUrl, true) } catch { ctx.addIssue({ code: 'custom', path: ['apiDocumentationUrl'], message: 'API documentation must be a public HTTPS URL' }) }
  }
})

export type FinanceIntegrationRequestInput = z.input<typeof financeIntegrationRequestSchema>
export type NormalizedFinanceIntegrationRequest = z.output<typeof financeIntegrationRequestSchema> & { countryCode: string; currency: string; capabilities: string[]; providerWebsite: string; apiDocumentationUrl: string | null }

export function parseFinanceIntegrationRequest(input: unknown): NormalizedFinanceIntegrationRequest {
  const parsed = financeIntegrationRequestSchema.safeParse(input)
  if (!parsed.success) throw new Error('finance_integration_request_invalid')
  return {
    ...parsed.data,
    countryCode: parsed.data.countryCode.toUpperCase(),
    currency: parsed.data.currency.toUpperCase(),
    capabilities: [...new Set(parsed.data.capabilities)].sort(),
    providerWebsite: publicHttpsUrl(parsed.data.providerWebsite, false)!,
    apiDocumentationUrl: publicHttpsUrl(parsed.data.apiDocumentationUrl ?? '', true),
  }
}

export function canCancelFinanceIntegrationRequest(status: FinanceIntegrationRequestStatus): boolean {
  return ['submitted', 'under_review', 'proposal_pending'].includes(status)
}

export function canTransitionFinanceIntegrationRequest(from: FinanceIntegrationRequestStatus, to: FinanceIntegrationRequestStatus): boolean {
  if (from === to) return false
  if (to === 'cancelled') return canCancelFinanceIntegrationRequest(from)
  const transitions: Record<FinanceIntegrationRequestStatus, FinanceIntegrationRequestStatus[]> = {
    submitted: ['under_review', 'declined'],
    under_review: ['api_validation', 'proposal_pending', 'declined'],
    api_validation: ['proposal_pending', 'accepted', 'declined'],
    proposal_pending: ['accepted', 'declined'],
    accepted: ['in_development'],
    in_development: ['sandbox_validation', 'declined'],
    sandbox_validation: ['available', 'in_development', 'declined'],
    available: [],
    declined: [],
    cancelled: [],
  }
  return transitions[from].includes(to)
}
