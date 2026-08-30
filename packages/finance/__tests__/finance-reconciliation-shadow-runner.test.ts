import { describe, expect, it, vi } from 'vitest'
import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  resolveFinanceReconciliationShadowRunnerGate,
  runFinanceReconciliationShadowEvidence,
  type FinanceReconciliationPipelineInput,
} from '../src'

const enabledEnvironment = {
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

const input: FinanceReconciliationPipelineInput = {
  tenantId: 'tenant-secret-id',
  legalEntityId: 'entity-secret-id',
  connectionId: 'connection-secret-id',
  accountingTransactions: [
    {
      externalId: 'accounting-secret-id',
      tenantId: 'tenant-secret-id',
      legalEntityId: 'entity-secret-id',
      connectionId: 'connection-secret-id',
      kind: 'income',
      status: 'posted',
      bookedOn: '2026-07-21',
      amount: '98765.43',
      currency: 'EUR',
      reference: 'private-payment-reference',
    },
  ],
  operational: {
    targetTenantId: 'tenant-secret-id',
    targetLegalEntityId: 'entity-secret-id',
    enrollments: [
      {
        id: 'enrollment-secret-id',
        tenantId: 'tenant-secret-id',
        legalEntityId: 'entity-secret-id',
        amountPaid: '98765.43',
      },
    ],
    paymentEvents: [
      {
        id: 'payment-secret-id',
        tenantId: 'tenant-secret-id',
        legalEntityId: 'entity-secret-id',
        enrollment: 'enrollment-secret-id',
        status: 'paid',
        amount: '98765.43',
        currency: 'EUR',
        paidAt: '2026-07-21',
        transactionReference: 'private-payment-reference',
      },
    ],
    campaigns: [],
    advertisingSpend: [],
  },
}

describe('finance reconciliation staging shadow runner', () => {
  it('does not call the loader when the flag is disabled', async () => {
    const loadSnapshot = vi.fn(async () => input)

    await expect(
      runFinanceReconciliationShadowEvidence({ environment: {}, loadSnapshot })
    ).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
    })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it.each([
    [{ [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true' }, 'environment_missing_or_invalid'],
    [
      {
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('fails closed outside explicit staging: %o', async (environment, reason) => {
    const loadSnapshot = vi.fn(async () => input)

    expect(resolveFinanceReconciliationShadowRunnerGate(environment)).toEqual({
      enabled: false,
      reason,
    })
    await expect(
      runFinanceReconciliationShadowEvidence({ environment, loadSnapshot })
    ).resolves.toMatchObject({ status: 'skipped', reason })
    expect(loadSnapshot).not.toHaveBeenCalled()
  })

  it('loads once in staging and returns only aggregate redacted evidence', async () => {
    const loadSnapshot = vi.fn(async () => input)
    const result = await runFinanceReconciliationShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot,
    })

    expect(loadSnapshot).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      observation: {
        schemaVersion: 1,
        mode: 'read_only_finance_reconciliation_shadow',
        verdict: 'planned',
        canWrite: false,
        canApply: false,
        metrics: {
          accountingTransactions: 1,
          sourceRecords: 1,
          projectedRecords: 1,
          ignoredRecords: 0,
          blockedRecords: 0,
          projectionIssues: 0,
          reconciliationTransactions: 1,
          proposed: 1,
          unmatched: 0,
          ambiguous: 0,
          conflicted: 0,
        },
      },
      serializedObservation:
        '{"schemaVersion":1,"mode":"read_only_finance_reconciliation_shadow","verdict":"planned","canWrite":false,"canApply":false,"metrics":{"accountingTransactions":1,"sourceRecords":1,"projectedRecords":1,"ignoredRecords":0,"blockedRecords":0,"projectionIssues":0,"reconciliationTransactions":1,"proposed":1,"unmatched":0,"ambiguous":0,"conflicted":0}}',
    })

    const serialized = JSON.stringify(result)
    for (const secret of [
      'tenant-secret-id',
      'entity-secret-id',
      'connection-secret-id',
      'accounting-secret-id',
      'enrollment-secret-id',
      'payment-secret-id',
      '98765.43',
      'EUR',
      'private-payment-reference',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('records a blocked projection without emitting partial reconciliation', async () => {
    const result = await runFinanceReconciliationShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => ({
        ...input,
        operational: {
          ...input.operational,
          enrollments: [{ ...input.operational.enrollments[0]!, amountPaid: '1.00' }],
        },
      }),
    })

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'blocked',
        metrics: {
          projectedRecords: 0,
          blockedRecords: 1,
          projectionIssues: 1,
          reconciliationTransactions: 0,
          proposed: 0,
        },
      },
    })
  })

  it('redacts loader failures instead of returning provider or credential details', async () => {
    const result = await runFinanceReconciliationShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => {
        throw new Error('Bearer provider-secret-value')
      },
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain('provider-secret-value')
  })

  it('redacts planning failures instead of returning malformed snapshot data', async () => {
    const result = await runFinanceReconciliationShadowEvidence({
      environment: enabledEnvironment,
      loadSnapshot: async () => ({ ...input, tenantId: ' other-tenant ' }),
    })

    expect(result).toEqual({
      status: 'failed',
      reason: 'reconciliation_planning_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain('other-tenant')
  })
})
