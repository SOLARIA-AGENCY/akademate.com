import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityStagingShadowExecutionEvidenceArtifact,
  registerMultiEntityStagingShadowExecutionEvidence,
  type MultiEntityStagingShadowExecutionEvidenceInput,
} from '../src/multi-entity-staging-execution-binding'
import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
} from '../src/multi-entity-staging-readiness'
import { getMultiEntitySpecificEvidenceArtifactKind } from '../src/multi-entity-staging-evidence-bundle'

const readinessReviewReference = 'review://readiness/cep/v1'
const campaignReviewReference = 'review://campaign/cep/v1'
const executionReviewReference = 'review://execution/cep/v1'
const entityReviewReferences = [
  'review://entity/cep-norte/v1',
  'review://entity/cep-centro/v1',
  'review://entity/cep-sur/v1',
]

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function evidenceReference(artifactDigest: string): `evidence://sha256/${string}` {
  return `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`
}

function input(
  overrides: Partial<MultiEntityStagingShadowExecutionEvidenceInput> = {}
): MultiEntityStagingShadowExecutionEvidenceInput {
  const bindings = [
    ...MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) =>
      binding('global', gate, readinessReviewReference)
    ),
    ...MULTI_ENTITY_ENTITY_STAGING_GATES.flatMap((gate) =>
      entityReviewReferences.map((reviewReference) => binding('entity', gate, reviewReference))
    ),
  ]
  return {
    environment: 'staging',
    sourceSha: 'a'.repeat(40),
    sourceDigest: sha256('source'),
    targetTenantDigest: sha256('tenant'),
    campaignReviewReference,
    readinessReviewReference,
    executionReviewReference,
    executionReportDigest: sha256('execution-report'),
    inputSnapshotDigest: sha256('input-snapshot'),
    observedAtUtc: '2026-07-26T12:00:00.000Z',
    bindings,
    metrics: {
      requiredBindings: 56,
      observedBindings: 56,
      payloadReads: 56,
      providerReads: 3,
      writes: 0,
      permissionChanges: 0,
    },
    ...overrides,
  }
}

function binding(
  scope: 'global' | 'entity',
  gate:
    | (typeof MULTI_ENTITY_GLOBAL_STAGING_GATES)[number]
    | (typeof MULTI_ENTITY_ENTITY_STAGING_GATES)[number],
  reviewReference: string
) {
  const artifactKind = getMultiEntitySpecificEvidenceArtifactKind(scope, gate)
  if (!artifactKind) throw new Error(`missing artifact kind for ${scope}/${gate}`)
  const artifactDigest = sha256(`${scope}/${gate}/${reviewReference}`)
  return {
    scope,
    gate,
    reviewReference,
    evidenceReference: evidenceReference(artifactDigest),
    artifactKind,
    artifactDigest,
  }
}

describe('multi-entity staging shadow execution evidence', () => {
  it('registers and re-validates exactly 56 typed read-only bindings', () => {
    const artifact = registerMultiEntityStagingShadowExecutionEvidence({
      ...input(),
      bindings: [...input().bindings].reverse(),
    })

    expect(artifact.environment).toBe('staging')
    expect(artifact.metrics).toMatchObject({
      requiredBindings: 56,
      observedBindings: 56,
      writes: 0,
      permissionChanges: 0,
    })
    expect(artifact.bindings).toHaveLength(56)
    expect(artifact.artifactDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    assertMultiEntityStagingShadowExecutionEvidenceArtifact(artifact)
  })

  it('is deterministic when bindings arrive in a different order', () => {
    const first = registerMultiEntityStagingShadowExecutionEvidence(input())
    const second = registerMultiEntityStagingShadowExecutionEvidence({
      ...input(),
      bindings: [...input().bindings].reverse(),
    })

    expect(second).toEqual(first)
  })

  it.each([
    ['production environment', { environment: 'production' }],
    ['write count', { metrics: { ...input().metrics, writes: 1 } }],
    ['missing binding', { bindings: input().bindings.slice(0, 55) }],
  ])('rejects %s', (_label, override) => {
    expect(() =>
      registerMultiEntityStagingShadowExecutionEvidence(
        input(override as Partial<MultiEntityStagingShadowExecutionEvidenceInput>)
      )
    ).toThrow('MULTI_ENTITY_STAGING_SHADOW_EXECUTION_EVIDENCE_INVALID')
  })

  it('rejects a forged artifact kind or digest during assertion', () => {
    const artifact = registerMultiEntityStagingShadowExecutionEvidence(input())
    const forged = {
      ...artifact,
      bindings: artifact.bindings.map((binding, index) =>
        index === 0 ? { ...binding, artifactKind: 'generic_unreviewed_kind' } : binding
      ),
    }

    expect(() => assertMultiEntityStagingShadowExecutionEvidenceArtifact(forged)).toThrow(
      'MULTI_ENTITY_STAGING_SHADOW_EXECUTION_EVIDENCE_INVALID'
    )
  })

  it('rejects entity gates that do not cover the same three review subjects', () => {
    const source = input()
    const replacedReviewReference = 'review://entity/unexpected/v1'
    const forgedBindings = source.bindings.map((binding, index) =>
      index === MULTI_ENTITY_GLOBAL_STAGING_GATES.length
        ? bindingFromExisting(binding, replacedReviewReference)
        : binding
    )

    expect(() =>
      registerMultiEntityStagingShadowExecutionEvidence({
        ...source,
        bindings: forgedBindings,
      })
    ).toThrow('MULTI_ENTITY_STAGING_SHADOW_EXECUTION_EVIDENCE_INVALID')
  })
})

function bindingFromExisting(binding: ReturnType<typeof binding>, reviewReference: string) {
  const artifactDigest = sha256(`${binding.scope}/${binding.gate}/${reviewReference}`)
  return {
    ...binding,
    reviewReference,
    artifactDigest,
    evidenceReference: evidenceReference(artifactDigest),
  }
}
