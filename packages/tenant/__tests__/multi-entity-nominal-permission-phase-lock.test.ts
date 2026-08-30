import { describe, expect, it } from 'vitest'

import {
  createNominalPermissionPhaseLock,
  serializeNominalPermissionPhaseLock,
  type NominalPermissionPhaseLockInput,
} from '../src/multi-entity-nominal-permission-phase-lock'

function input(
  change: Partial<NominalPermissionPhaseLockInput> = {}
): NominalPermissionPhaseLockInput {
  return {
    phase: 'implementation',
    requestedAction: 'generate_nominal_matrix',
    authorizationMode: 'disabled',
    accessBaselineVerdict: 'unchanged',
    stagingBundleVerdict: 'ready_for_manual_staging_review',
    requestReviewReference: 'review://permissions/phase-lock/request-001',
    ...change,
  }
}

describe('nominal permission phase lock', () => {
  it('remains locked even when access is unchanged and the staging bundle is ready for review', () => {
    const lock = createNominalPermissionPhaseLock(input())

    expect(lock).toEqual({
      schemaVersion: 1,
      kind: 'cep_nominal_permission_phase_lock',
      mode: 'deny_only_during_implementation',
      verdict: 'locked',
      canGenerateNominalMatrix: false,
      canApplyPermissionChange: false,
      canBulkChangePermissions: false,
      canUsePlatformSuperadmin: false,
      requiresManualPerUserRollback: true,
      reasons: [
        'final_solution_validation_not_proven',
        'explicit_manual_authorization_missing',
        'manual_per_user_rollback_not_approved',
        'platform_superadmin_not_business_authority',
        'matrix_generation_forbidden_during_implementation',
      ],
      metrics: {
        blockingReasons: 5,
        accessBaselineUnchanged: true,
        stagingBundleReadyForReview: true,
        authorizationDisabled: true,
      },
    })
    expect(Object.isFrozen(lock)).toBe(true)
    expect(Object.isFrozen(lock.reasons)).toBe(true)
    expect(Object.isFrozen(lock.metrics)).toBe(true)
  })

  it('adds access, authorization and bundle blockers without weakening the invariant', () => {
    const lock = createNominalPermissionPhaseLock(
      input({
        phase: 'staging_validation',
        requestedAction: 'apply_permission_change',
        authorizationMode: 'shadow',
        accessBaselineVerdict: 'changed',
        stagingBundleVerdict: 'blocked',
      })
    )

    expect(lock.reasons).toEqual([
      'access_baseline_changed',
      'authorization_mode_not_disabled',
      'staging_bundle_not_ready',
      'final_solution_validation_not_proven',
      'explicit_manual_authorization_missing',
      'manual_per_user_rollback_not_approved',
      'platform_superadmin_not_business_authority',
      'permission_application_forbidden_during_implementation',
    ])
    expect(lock.metrics).toEqual({
      blockingReasons: 8,
      accessBaselineUnchanged: false,
      stagingBundleReadyForReview: false,
      authorizationDisabled: false,
    })
    expect(lock.canApplyPermissionChange).toBe(false)
    expect(lock.canBulkChangePermissions).toBe(false)
  })

  it.each([
    ['implementation', 'generate_nominal_matrix'],
    ['implementation', 'apply_permission_change'],
    ['staging_validation', 'generate_nominal_matrix'],
    ['staging_validation', 'apply_permission_change'],
  ] as const)('has no unlock branch in %s for %s', (phase, requestedAction) => {
    const lock = createNominalPermissionPhaseLock(input({ phase, requestedAction }))

    expect(lock.verdict).toBe('locked')
    expect(lock.canGenerateNominalMatrix).toBe(false)
    expect(lock.canApplyPermissionChange).toBe(false)
    expect(lock.canUsePlatformSuperadmin).toBe(false)
  })

  it('serializes deterministically without nominal or review data', () => {
    const first = serializeNominalPermissionPhaseLock(input())
    const second = serializeNominalPermissionPhaseLock(input())

    expect(first).toBe(second)
    expect(first).not.toContain('review://permissions/phase-lock/request-001')
    expect(first).not.toContain('userId')
    expect(first).not.toContain('email')
    expect(first).not.toContain('membership')
  })

  it.each([
    ['final phase invented', { phase: 'production_ready' }],
    ['active authorization', { authorizationMode: 'active' }],
    ['unknown action', { requestedAction: 'bulk_apply' }],
    ['unknown bundle verdict', { stagingBundleVerdict: 'approved' }],
    ['invalid review', { requestReviewReference: 'ticket-1' }],
  ])('rejects %s', (_label, change) => {
    expect(() => createNominalPermissionPhaseLock(input(change as never))).toThrow(
      'MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_INPUT_INVALID'
    )
  })

  it('rejects user, role or approval fields instead of accepting premature nominal data', () => {
    for (const change of [
      { users: [{ id: '1' }] },
      { role: 'superadmin' },
      { approvedBy: 'director' },
      { bulk: true },
    ]) {
      expect(() => createNominalPermissionPhaseLock({ ...input(), ...change } as never)).toThrow(
        'MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_INPUT_INVALID'
      )
    }
  })

  it('exports no generation, apply or unlock operation', async () => {
    const module = await import('../src/multi-entity-nominal-permission-phase-lock')
    expect(Object.keys(module).filter((key) => /generate|apply|unlock|bulk/i.test(key))).toEqual([])
  })
})
