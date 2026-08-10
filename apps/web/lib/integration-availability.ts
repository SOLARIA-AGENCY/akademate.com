export type PublicConnectorStatus = 'coming-soon' | 'available' | 'custom-request'

export type PublicFinanceConnector = {
  id: 'holded' | 'xero' | 'quickbooks' | 'custom'
  name: string
  status: PublicConnectorStatus
  logoId: 'xero' | 'quickbooks' | null
  proofSha: string | null
  availableSince: string | null
  ctaPath: string
}

export const financeConnectors: readonly PublicFinanceConnector[] = [
  { id: 'holded', name: 'Holded', status: 'coming-soon', logoId: null, proofSha: null, availableSince: null, ctaPath: '/contacto?asunto=integracion-contable' },
  { id: 'xero', name: 'Xero', status: 'coming-soon', logoId: 'xero', proofSha: null, availableSince: null, ctaPath: '/contacto?asunto=integracion-contable' },
  { id: 'quickbooks', name: 'QuickBooks Online', status: 'coming-soon', logoId: 'quickbooks', proofSha: null, availableSince: null, ctaPath: '/contacto?asunto=integracion-contable' },
  { id: 'custom', name: 'Your finance provider', status: 'custom-request', logoId: null, proofSha: null, availableSince: null, ctaPath: '/contacto?asunto=integracion-contable' },
]

export function assertFinanceConnectorRegistry(connectors: readonly PublicFinanceConnector[] = financeConnectors): void {
  for (const connector of connectors) {
    if (connector.status === 'available') {
      if (!/^[0-9a-f]{40}$/.test(connector.proofSha ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(connector.availableSince ?? '')) throw new Error(`public_finance_connector_proof_required:${connector.id}`)
    } else if (connector.proofSha !== null || connector.availableSince !== null) {
      throw new Error(`public_finance_connector_unverified_metadata:${connector.id}`)
    }
  }
}

assertFinanceConnectorRegistry()
