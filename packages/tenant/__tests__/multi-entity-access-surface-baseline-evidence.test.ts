import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
  assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput,
  assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
  assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput,
  createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
  createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
  type MultiEntityAccessSurfaceBaselineCaptureEvidenceInput,
  type MultiEntityAccessSurfaceBaselineEvidenceBindingContext,
  type MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput,
} from '../src/multi-entity-access-surface-baseline-evidence'
import {
  createMultiEntityAccessSurfaceBaseline,
  type AccessSurfaceReference,
  type MultiEntityAccessSurfaceBaselineInput,
} from '../src/multi-entity-access-surface-baseline'

const ref = (value: number): AccessSurfaceReference =>
  `ref:sha256:${value.toString(16).padStart(64, '0')}`
const digest = (value: string) => `sha256:${value.repeat(64)}` as const

function baselineInput(
  overrides: Partial<MultiEntityAccessSurfaceBaselineInput> = {}
): MultiEntityAccessSurfaceBaselineInput {
  return {
    targetTenantRef: ref(1),
    sourceDigests: {
      authorizationPolicy: digest('a'),
      payloadUsersSchema: digest('b'),
      platformMembershipsSchema: digest('c'),
      payloadApiKeysSchema: digest('d'),
      platformApiKeysSchema: digest('e'),
    },
    users: [
      {
        ref: ref(10),
        source: 'payload_tenant_admin',
        tenantRef: ref(1),
        roles: ['admin'],
        status: 'active',
      },
      {
        ref: ref(11),
        source: 'platform',
        tenantRef: null,
        roles: [],
        status: 'active',
      },
    ],
    memberships: [
      {
        ref: ref(20),
        userRef: ref(11),
        tenantRef: ref(1),
        roles: ['finance_read'],
        status: 'active',
      },
    ],
    apiKeys: [
      {
        ref: ref(30),
        source: 'payload_tenant_admin',
        tenantRef: ref(1),
        scopes: ['enrollments:read'],
        status: 'active',
      },
    ],
    ...overrides,
  }
}

function evidenceInput(
  overrides: Partial<MultiEntityAccessSurfaceBaselineCaptureEvidenceInput> = {}
): MultiEntityAccessSurfaceBaselineCaptureEvidenceInput {
  return {
    campaignReviewReference: 'review://campaign/cep/staging-v2',
    readinessReviewReference: 'review://readiness/cep/staging-v2',
    sourceDigest: digest('f'),
    targetTenantDigest: digest('e'),
    capturedAccess: createMultiEntityAccessSurfaceBaseline(baselineInput()),
    ...overrides,
  }
}

function unchangedInput(
  overrides: Partial<MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput> = {}
): MultiEntityAccessSurfaceBaselineUnchangedEvidenceInput {
  const captureInput = evidenceInput()
  const captureArtifact =
    createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(captureInput)
  return {
    campaignReviewReference: captureInput.campaignReviewReference,
    readinessReviewReference: captureInput.readinessReviewReference,
    sourceDigest: captureInput.sourceDigest,
    targetTenantDigest: captureInput.targetTenantDigest,
    captureArtifact,
    capturedAccess: captureInput.capturedAccess,
    currentAccess: createMultiEntityAccessSurfaceBaseline(baselineInput()),
    ...overrides,
  }
}

function bindingContext(
  input: MultiEntityAccessSurfaceBaselineCaptureEvidenceInput = evidenceInput()
): MultiEntityAccessSurfaceBaselineEvidenceBindingContext {
  return {
    campaignReviewReference: input.campaignReviewReference,
    readinessReviewReference: input.readinessReviewReference,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    targetTenantRef: input.capturedAccess.targetTenantRef,
  }
}

function resealUnchangedArtifact(
  artifact: ReturnType<typeof createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact>,
  metrics: typeof artifact.metrics
) {
  const {
    artifactDigest: _artifactDigest,
    evidenceReference: _evidenceReference,
    ...payload
  } = {
    ...artifact,
    metrics,
  }
  const nextDigest = `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`
  return {
    ...payload,
    artifactDigest: nextDigest,
    evidenceReference: `evidence://sha256/${nextDigest.slice('sha256:'.length)}`,
  }
}

describe('expanded access surface baseline evidence', () => {
  it('seals a redacted capture without runtime or permission authority', () => {
    const artifact = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(evidenceInput())

    expect(artifact).toMatchObject({
      kind: 'cep_access_surface_baseline_capture_evidence',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canReadRuntime: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
      containsSecrets: false,
      identifiersPseudonymized: true,
      metrics: { users: 2, memberships: 1, apiKeys: 1 },
    })
    expect(JSON.stringify(artifact)).not.toContain('ref:sha256:')
    expect(artifact.artifactDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(artifact)
    ).not.toThrow()
  })

  it('is deterministic and binds the unchanged comparison to the capture', () => {
    const first = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(evidenceInput())
    const second = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(evidenceInput())
    expect(second).toEqual(first)

    const unchanged =
      createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(unchangedInput())
    expect(unchanged).toMatchObject({
      kind: 'cep_access_surface_baseline_unchanged_evidence',
      metrics: {
        userDelta: 0,
        membershipDelta: 0,
        apiKeyDelta: 0,
        sourceAuthoritiesUnchanged: true,
      },
      canChangePermissions: false,
    })
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(unchanged)
    ).not.toThrow()
  })

  it.each([
    ['capture source digest', { sourceDigest: 'not-a-digest' }],
    ['capture target tenant digest', { targetTenantDigest: 'not-a-digest' }],
    ['capture review reference', { campaignReviewReference: 'raw-id' }],
  ])('rejects a malformed capture envelope: %s', (_label, override) => {
    expect(() =>
      createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(
        evidenceInput(override as Partial<MultiEntityAccessSurfaceBaselineCaptureEvidenceInput>)
      )
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')
  })

  it('rejects changed memberships, API keys or source authorities', () => {
    const captured = createMultiEntityAccessSurfaceBaseline(baselineInput())
    const captureArtifact = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(
      evidenceInput({ capturedAccess: captured })
    )
    for (const currentAccess of [
      createMultiEntityAccessSurfaceBaseline(
        baselineInput({
          memberships: [{ ...baselineInput().memberships[0]!, status: 'suspended' }],
        })
      ),
      createMultiEntityAccessSurfaceBaseline(
        baselineInput({
          apiKeys: [{ ...baselineInput().apiKeys[0]!, status: 'revoked' }],
        })
      ),
      createMultiEntityAccessSurfaceBaseline(
        baselineInput({
          sourceDigests: { ...baselineInput().sourceDigests, authorizationPolicy: digest('f') },
        })
      ),
    ]) {
      expect(() =>
        createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact({
          ...unchangedInput(),
          captureArtifact,
          capturedAccess: captured,
          currentAccess,
        })
      ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')
    }
  })

  it('rejects a forged artifact and a capture from another baseline', () => {
    const artifact = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(evidenceInput())
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact({
        ...artifact,
        canChangePermissions: true,
      })
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')

    const otherBaseline = createMultiEntityAccessSurfaceBaseline(baselineInput({ apiKeys: [] }))
    expect(() =>
      createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(
        unchangedInput({ currentAccess: otherBaseline })
      )
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')
  })

  it('requires the capture artifact to match the reviewed tenant context', () => {
    const input = evidenceInput()
    const artifact = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(input)
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput(
        artifact,
        input,
        bindingContext(input)
      )
    ).not.toThrow()

    const relabeledInput = { ...input, targetTenantDigest: digest('a') }
    const relabeledArtifact =
      createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(relabeledInput)
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact(relabeledArtifact)
    ).not.toThrow()
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput(
        relabeledArtifact,
        input,
        bindingContext(input)
      )
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')
  })

  it('rejects unchanged evidence with forged counts even when its hash is resealed', () => {
    const artifact =
      createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(unchangedInput())
    const forged = resealUnchangedArtifact(artifact, {
      ...artifact.metrics,
      capturedUsers: artifact.metrics.currentUsers + 1,
    })
    expect(() => assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(forged)).toThrow(
      'MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID'
    )
  })

  it('binds unchanged evidence to both manifests and the tenant context', () => {
    const input = unchangedInput()
    const context = bindingContext(input)
    const artifact = createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact(input)
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput(artifact, input, context)
    ).not.toThrow()
    expect(() =>
      assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput(artifact, input, {
        ...context,
        targetTenantRef: ref(2),
      })
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_EVIDENCE_INVALID')
  })
})
