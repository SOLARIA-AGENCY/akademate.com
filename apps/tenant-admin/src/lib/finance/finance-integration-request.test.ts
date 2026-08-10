import { describe, expect, it } from 'vitest'

import { canCancelFinanceIntegrationRequest, canTransitionFinanceIntegrationRequest, parseFinanceIntegrationRequest } from './finance-integration-request.ts'

const valid = {
  providerName: 'Example Books', providerWebsite: 'https://example.com', apiDocumentationUrl: 'https://docs.example.com/api', countryCode: 'es', currency: 'eur', legalEntityCount: 1, campusCount: 2,
  monthlyTransactionBand: '100_999' as const, capabilities: ['accounts', 'invoices'] as const, writebackRequested: false, sandboxKnown: 'unknown' as const, urgency: 'exploring' as const, context: 'We need an accounting connection for two campuses and invoice exports.',
}

describe('finance integration request contract', () => {
  it('normalizes country, currency, urls and capabilities', () => {
    const parsed = parseFinanceIntegrationRequest(valid)
    expect(parsed.countryCode).toBe('ES')
    expect(parsed.currency).toBe('EUR')
    expect(parsed.capabilities).toEqual(['accounts', 'invoices'])
    expect(parsed.providerWebsite).toBe('https://example.com/')
  })

  it('rejects private/non-HTTPS URLs and malformed context', () => {
    expect(() => parseFinanceIntegrationRequest({ ...valid, providerWebsite: 'http://localhost:3000' })).toThrow('finance_integration_request_invalid')
    expect(() => parseFinanceIntegrationRequest({ ...valid, apiDocumentationUrl: 'https://127.0.0.1/docs' })).toThrow('finance_integration_request_invalid')
    expect(() => parseFinanceIntegrationRequest({ ...valid, context: 'too short' })).toThrow('finance_integration_request_invalid')
    expect(() => parseFinanceIntegrationRequest({ ...valid, capabilities: ['accounts', 'accounts'] })).toThrow('finance_integration_request_invalid')
  })

  it('enforces an explicit state machine and cancellation boundary', () => {
    expect(canTransitionFinanceIntegrationRequest('submitted', 'under_review')).toBe(true)
    expect(canTransitionFinanceIntegrationRequest('available', 'in_development')).toBe(false)
    expect(canCancelFinanceIntegrationRequest('proposal_pending')).toBe(true)
    expect(canCancelFinanceIntegrationRequest('accepted')).toBe(false)
  })
})
