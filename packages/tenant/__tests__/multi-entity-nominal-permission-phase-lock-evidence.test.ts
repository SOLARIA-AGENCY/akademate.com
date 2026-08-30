import { describe, expect, it } from 'vitest'

import {
  assertNominalPermissionPhaseLockEvidenceArtifact,
  createNominalPermissionPhaseLockEvidenceArtifact,
  serializeNominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceInput,
  type NominalPermissionPhaseLockEvidenceSample,
} from '../src/multi-entity-nominal-permission-phase-lock-evidence'
import {
  createNominalPermissionPhaseLock,
  type NominalPermissionLockedPhase,
  type NominalPermissionRequestedAction,
} from '../src/multi-entity-nominal-permission-phase-lock'

const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'

function sample(
  phase: NominalPermissionLockedPhase,
  requestedAction: NominalPermissionRequestedAction,
  change: Partial<NominalPermissionPhaseLockEvidenceSample> = {}
): NominalPermissionPhaseLockEvidenceSample {
  return {
    phase,
    requestedAction,
    reviewReference: `review://permissions/phase-lock/${phase}/${requestedAction}/v1`,
    observation: createNominalPermissionPhaseLock({
      phase,
      requestedAction,
      authorizationMode: 'disabled',
      accessBaselineVerdict: 'unchanged',
      stagingBundleVerdict: 'ready_for_manual_staging_review',
      requestReviewReference: `review://permissions/phase-lock/${phase}/${requestedAction}/v1`,
    }),
    ...change,
  }
}

function samples(): NominalPermissionPhaseLockEvidenceSample[] {
  return [
    sample('implementation', 'generate_nominal_matrix'),
    sample('implementation', 'apply_permission_change'),
    sample('staging_validation', 'generate_nominal_matrix'),
    sample('staging_validation', 'apply_permission_change'),
  ]
}

function input(
  change: Partial<NominalPermissionPhaseLockEvidenceInput> = {}
): NominalPermissionPhaseLockEvidenceInput {
  return {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: samples(),
    ...change,
  }
}

describe('nominal permission phase lock evidence', () => {
  it('seals the four maximally permissive locked cases without an unlock capability', () => {
    const artifact = createNominalPermissionPhaseLockEvidenceArtifact(input())

    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_nominal_permission_phase_lock_evidence',
      mode: 'max_permissive_deny_matrix',
      verdict: 'eligible_for_manual_staging_binding',
      canGenerateNominalMatrix: false,
      canApplyPermissionChange: false,
      canBulkChangePermissions: false,
      canUsePlatformSuperadmin: false,
      canBindAutomatically: false,
      canMarkVerified: false,
      canActivate: false,
      canChangePermissions: false,
      sourceDigest,
      targetTenantDigest,
      metrics: { requiredCases: 4, lockedCases: 4, phases: 2, requestedActions: 2 },
    })
    expect(artifact.cases).toHaveLength(4)
    expect(
      new Set(artifact.cases.map(({ reviewReferenceDigest }) => reviewReferenceDigest)).size
    ).toBe(4)
    expect(artifact.evidenceReference).toBe(
      `evidence://sha256/${artifact.artifactDigest.slice('sha256:'.length)}`
    )
    expect(Object.isFrozen(artifact)).toBe(true)
    expect(Object.isFrozen(artifact.cases)).toBe(true)
    expect(artifact.cases.every(Object.isFrozen)).toBe(true)
    expect(() => assertNominalPermissionPhaseLockEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic across sample order and does not mutate observations', () => {
    const source = input()
    const before = JSON.stringify(source)
    const first = serializeNominalPermissionPhaseLockEvidenceArtifact(source)
    const second = serializeNominalPermissionPhaseLockEvidenceArtifact({
      ...source,
      samples: [...source.samples].reverse(),
    })

    expect(second).toBe(first)
    expect(JSON.stringify(source)).toBe(before)
  })

  it.each([
    ['missing case', () => samples().slice(0, 3)],
    [
      'duplicate case',
      () => [
        sample('implementation', 'generate_nominal_matrix'),
        sample('implementation', 'generate_nominal_matrix', {
          reviewReference: 'review://permissions/phase-lock/duplicate/v1',
        }),
        sample('staging_validation', 'generate_nominal_matrix'),
        sample('staging_validation', 'apply_permission_change'),
      ],
    ],
    [
      'duplicate review',
      () => {
        const result = samples()
        result[3] = { ...result[3]!, reviewReference: result[0]!.reviewReference }
        return result
      },
    ],
  ])('rejects an incomplete evidence matrix: %s', (_label, build) => {
    expect(() =>
      createNominalPermissionPhaseLockEvidenceArtifact(input({ samples: build() }))
    ).toThrow('MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_EVIDENCE_INVALID')
  })

  it.each([
    ['matrix generation enabled', { canGenerateNominalMatrix: true }],
    ['permission application enabled', { canApplyPermissionChange: true }],
    ['bulk change enabled', { canBulkChangePermissions: true }],
    ['superadmin enabled', { canUsePlatformSuperadmin: true }],
    ['rollback removed', { requiresManualPerUserRollback: false }],
    ['verdict changed', { verdict: 'unlocked' }],
    [
      'authorization not disabled',
      {
        metrics: {
          ...sample('implementation', 'generate_nominal_matrix').observation.metrics,
          authorizationDisabled: false,
        },
      },
    ],
    [
      'manual authorization blocker removed',
      {
        reasons: sample('implementation', 'generate_nominal_matrix').observation.reasons.filter(
          (reason) => reason !== 'explicit_manual_authorization_missing'
        ),
      },
    ],
  ])('rejects a weakened observation: %s', (_label, change) => {
    const source = samples()
    source[0] = {
      ...source[0]!,
      observation: { ...source[0]!.observation, ...change } as never,
    }
    expect(() =>
      createNominalPermissionPhaseLockEvidenceArtifact(input({ samples: source }))
    ).toThrow('MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_EVIDENCE_INVALID')
  })

  it.each([
    ['source digest', { sourceDigest: `sha256:${'c'.repeat(64)}` }],
    ['artifact digest', { artifactDigest: `sha256:${'d'.repeat(64)}` }],
    ['evidence reference', { evidenceReference: `evidence://sha256/${'e'.repeat(64)}` }],
    ['matrix capability', { canGenerateNominalMatrix: true }],
    ['verified capability', { canMarkVerified: true }],
    ['case digest', { cases: undefined }],
  ])('rejects forged sealed evidence: %s', (_label, change) => {
    const artifact = createNominalPermissionPhaseLockEvidenceArtifact(input())
    const forged =
      change.cases === undefined && Object.prototype.hasOwnProperty.call(change, 'cases')
        ? {
            ...artifact,
            cases: [
              { ...artifact.cases[0]!, observationDigest: `sha256:${'f'.repeat(64)}` },
              ...artifact.cases.slice(1),
            ],
          }
        : { ...artifact, ...change }
    expect(() => assertNominalPermissionPhaseLockEvidenceArtifact(forged)).toThrow(
      'MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_EVIDENCE_INVALID'
    )
  })

  it('rejects extra nominal fields and omits raw reviews or user data from serialization', () => {
    expect(() =>
      createNominalPermissionPhaseLockEvidenceArtifact({
        ...input(),
        users: [{ id: 'private-user' }],
      } as never)
    ).toThrow('MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_EVIDENCE_INVALID')

    const serialized = serializeNominalPermissionPhaseLockEvidenceArtifact(input())
    for (const privateValue of ['review://', 'private-user', 'email', 'membership', 'approvedBy']) {
      expect(serialized).not.toContain(privateValue)
    }
  })

  it('exports no generation, apply, unlock or permission mutation operation', async () => {
    const module = await import('../src/multi-entity-nominal-permission-phase-lock-evidence')
    expect(
      Object.keys(module).filter((key) =>
        /generate|apply|unlock|bulkChange|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
