import type { FinanceRuntime } from './finance-runtime.ts'

export const FINANCE_PROVIDER_KEYS = ['holded', 'xero', 'quickbooks'] as const
export type FinanceProviderKey = (typeof FINANCE_PROVIDER_KEYS)[number]

export type FinanceProviderAvailability = 'coming_soon' | 'available' | 'custom_request'
export type FinanceConnectionMode = 'scaffold' | 'read_only' | 'read_write'
export type FinanceConnectionStatus = 'pending' | 'connected' | 'degraded' | 'revoked' | 'disconnected'

export type FinanceCapability =
  | 'organizations.read'
  | 'accounts.read'
  | 'taxes.read'
  | 'contacts.read'
  | 'invoices.read'
  | 'purchases.read'
  | 'payments.read'
  | 'invoices.write'

export type FinanceProviderCatalogEntry = {
  key: FinanceProviderKey
  label: string
  availability: FinanceProviderAvailability
  supportedModes: readonly FinanceConnectionMode[]
  capabilities: readonly FinanceCapability[]
  evidenceUrl?: string
}

export type FinanceProviderRequest = {
  tenantId: string
  connectionId: string
  organizationId?: string
  resource: string
  cursor?: string
  pageSize?: number
}

export type FinanceProviderPage<T = Record<string, unknown>> = {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

export type FinanceProviderTransport = (
  request: FinanceProviderRequest,
) => Promise<FinanceProviderPage>

export class FinanceProviderError extends Error {
  constructor(
    public readonly code: string,
    message = code,
  ) {
    super(message)
    this.name = 'FinanceProviderError'
  }
}

export interface FinanceProviderAdapter {
  readonly key: FinanceProviderKey
  readonly runtime: FinanceRuntime
  validateCredential(input: { tenantId: string; credential: string }): Promise<{ valid: boolean }>
  discoverOrganizations(input: { tenantId: string; connectionId: string }): Promise<FinanceProviderPage>
  discoverCapabilities(): readonly FinanceCapability[]
  healthCheck(input: { tenantId: string; connectionId: string }): Promise<{ ok: boolean }>
  readPage(input: FinanceProviderRequest): Promise<FinanceProviderPage>
}

const defaultCapabilities: readonly FinanceCapability[] = [
  'organizations.read',
  'accounts.read',
  'taxes.read',
  'contacts.read',
  'invoices.read',
  'purchases.read',
  'payments.read',
]

export const financeProviderCatalog: readonly FinanceProviderCatalogEntry[] = [
  {
    key: 'holded',
    label: 'Holded',
    availability: 'coming_soon',
    supportedModes: ['scaffold', 'read_only'],
    capabilities: defaultCapabilities,
    evidenceUrl: 'https://www.holded.com/es/desarrolladores/primeros-pasos',
  },
  {
    key: 'xero',
    label: 'Xero',
    availability: 'coming_soon',
    supportedModes: ['scaffold', 'read_only'],
    capabilities: defaultCapabilities,
    evidenceUrl: 'https://developer.xero.com/documentation/guides/oauth2/overview',
  },
  {
    key: 'quickbooks',
    label: 'QuickBooks Online',
    availability: 'coming_soon',
    supportedModes: ['scaffold', 'read_only'],
    capabilities: defaultCapabilities,
    evidenceUrl: 'https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0',
  },
]

export function getFinanceProviderCatalogEntry(key: FinanceProviderKey): FinanceProviderCatalogEntry {
  const entry = financeProviderCatalog.find((candidate) => candidate.key === key)
  if (!entry) throw new FinanceProviderError('finance_provider_unknown')
  return entry
}

export function createDisabledFinanceProviderAdapter(
  key: FinanceProviderKey,
  runtime: FinanceRuntime = { mode: 'disabled', externalIo: false, realData: false, webhooks: false, writeback: false },
): FinanceProviderAdapter {
  const disabled = (): never => {
    throw new FinanceProviderError('finance_provider_disabled')
  }

  return {
    key,
    runtime,
    validateCredential: async () => disabled(),
    discoverOrganizations: async () => disabled(),
    discoverCapabilities: () => getFinanceProviderCatalogEntry(key).capabilities,
    healthCheck: async () => disabled(),
    readPage: async () => disabled(),
  }
}

export function createFinanceProviderAdapter(
  key: FinanceProviderKey,
  runtime: FinanceRuntime,
  _transport?: FinanceProviderTransport,
): FinanceProviderAdapter {
  if (runtime.mode !== 'connected' || !runtime.externalIo || !runtime.realData) {
    return createDisabledFinanceProviderAdapter(key, runtime)
  }

  throw new FinanceProviderError('finance_provider_not_implemented')
}
