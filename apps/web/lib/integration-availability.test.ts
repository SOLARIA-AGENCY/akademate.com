// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { assertFinanceConnectorRegistry, financeConnectors } from '@/lib/integration-availability'

describe('public finance connector registry', () => {
  it('keeps initial provider statuses claim-safe', () => {
    expect(financeConnectors.map((connector) => connector.id)).toEqual(['holded', 'xero', 'quickbooks', 'custom'])
    expect(financeConnectors.slice(0, 3).every((connector) => connector.status === 'coming-soon')).toBe(true)
    expect(financeConnectors.at(-1)?.status).toBe('custom-request')
    expect(() => assertFinanceConnectorRegistry()).not.toThrow()
  })

  it('fails closed when available lacks deployment evidence', () => {
    expect(() => assertFinanceConnectorRegistry([{ ...financeConnectors[0]!, status: 'available' }])).toThrow('proof_required')
  })

  it('rejects proof metadata on a planned connector', () => {
    expect(() => assertFinanceConnectorRegistry([{ ...financeConnectors[0]!, proofSha: 'a'.repeat(40) }])).toThrow('unverified_metadata')
  })
})
