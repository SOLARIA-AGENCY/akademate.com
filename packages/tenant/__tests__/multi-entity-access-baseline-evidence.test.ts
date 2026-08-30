import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityAccessBaselineCaptureEvidenceArtifact,
  assertMultiEntityAccessUnchangedEvidenceArtifact,
  createMultiEntityAccessBaselineCaptureEvidenceArtifact,
  createMultiEntityAccessUnchangedEvidenceArtifact,
} from '../src/multi-entity-access-baseline-evidence'
import {
  createMultiEntityAccessBaseline,
  type LegacyAccessUserSnapshot,
} from '../src/multi-entity-access-baseline'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const policyDigest = `sha256:${'c'.repeat(64)}`

function users(): LegacyAccessUserSnapshot[] {
  return [
    { id: 'private-admin', role: 'admin', tenantId: 'tenant-private', isActive: true },
    {
      id: 'private-marketing',
      role: 'marketing',
      tenantId: 'tenant-private',
      isActive: true,
    },
    { id: 'platform-private', role: 'superadmin', tenantId: null, isActive: true },
  ]
}

function baseline(source = users(), policy = policyDigest) {
  return createMultiEntityAccessBaseline({
    targetTenantId: 'tenant-private',
    policyDigest: policy,
    users: source,
  })
}

function capture() {
  return createMultiEntityAccessBaselineCaptureEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    capturedAccess: baseline(),
  })
}

function unchanged() {
  const capturedAccess = baseline()
  const captureArtifact = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    capturedAccess,
  })
  return createMultiEntityAccessUnchangedEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    captureArtifact,
    capturedAccess,
    currentAccess: baseline([...users()].reverse()),
  })
}

describe('multi-entity access baseline evidence', () => {
  it('seals an anonymized capture without granting authorization capabilities', () => {
    const artifact = capture()
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_access_baseline_capture_evidence',
      mode: 'content_addressed_capture_review',
      verdict: 'eligible_for_manual_staging_binding',
      canBindAutomatically: false,
      canMarkVerified: false,
      canActivateAuthorization: false,
      canChangePermissions: false,
      sourceDigest,
      targetTenantDigest,
      policyDigest,
      metrics: { users: 3, tenantUsers: 2, platformSuperadmins: 1 },
    })
    expect(artifact.artifactDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.evidenceReference).toBe(
      `evidence://sha256/${artifact.artifactDigest.slice('sha256:'.length)}`
    )
    expect(() => assertMultiEntityAccessBaselineCaptureEvidenceArtifact(artifact)).not.toThrow()
    expect(Object.isFrozen(artifact)).toBe(true)
    expect(Object.isFrozen(artifact.metrics.roles)).toBe(true)
  })

  it('seals only an exact unchanged comparison linked to the capture artifact', () => {
    const artifact = unchanged()
    expect(artifact).toMatchObject({
      kind: 'cep_access_baseline_unchanged_evidence',
      mode: 'content_addressed_exact_access_comparison',
      verdict: 'eligible_for_manual_staging_binding',
      canActivateAuthorization: false,
      canChangePermissions: false,
      policyDigest,
      metrics: {
        capturedUsers: 3,
        currentUsers: 3,
        userCountDelta: 0,
        policyUnchanged: true,
      },
    })
    expect(artifact.capturedBaselineDigest).toBe(artifact.currentBaselineDigest)
    expect(artifact.captureArtifactDigest).toBe(capture().artifactDigest)
    expect(() => assertMultiEntityAccessUnchangedEvidenceArtifact(artifact)).not.toThrow()
  })

  it('is deterministic under user reordering', () => {
    const first = unchanged()
    const capturedAccess = baseline([...users()].reverse())
    const captureArtifact = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      capturedAccess,
    })
    const second = createMultiEntityAccessUnchangedEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      captureArtifact,
      capturedAccess,
      currentAccess: baseline(),
    })
    expect(second).toEqual(first)
  })

  it.each([
    [
      'role',
      users().map((user) => (user.role === 'marketing' ? { ...user, role: 'gestor' } : user)),
    ],
    [
      'active state',
      users().map((user) => (user.role === 'marketing' ? { ...user, isActive: false } : user)),
    ],
    ['removed user', users().slice(0, 2)],
  ])('rejects current access drift in %s', (_label, currentUsers) => {
    const capturedAccess = baseline()
    const captureArtifact = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      capturedAccess,
    })
    expect(() =>
      createMultiEntityAccessUnchangedEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        captureArtifact,
        capturedAccess,
        currentAccess: baseline(currentUsers as LegacyAccessUserSnapshot[]),
      })
    ).toThrow('MULTI_ENTITY_ACCESS_BASELINE_EVIDENCE_INVALID')
  })

  it('rejects policy drift even if all user assignments remain equal', () => {
    const capturedAccess = baseline()
    const captureArtifact = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      capturedAccess,
    })
    expect(() =>
      createMultiEntityAccessUnchangedEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        captureArtifact,
        capturedAccess,
        currentAccess: baseline(users(), `sha256:${'d'.repeat(64)}`),
      })
    ).toThrow('MULTI_ENTITY_ACCESS_BASELINE_EVIDENCE_INVALID')
  })

  it.each([
    ['capture digest', () => ({ ...capture(), artifactDigest: `sha256:${'e'.repeat(64)}` })],
    ['capture permission', () => ({ ...capture(), canChangePermissions: true })],
    [
      'comparison digest',
      () => ({ ...unchanged(), currentBaselineDigest: `sha256:${'f'.repeat(64)}` }),
    ],
    ['comparison permission', () => ({ ...unchanged(), canActivateAuthorization: true })],
  ])('rejects a forged %s artifact', (_label, build) => {
    const artifact = build()
    const assertion = artifact.kind.includes('unchanged')
      ? assertMultiEntityAccessUnchangedEvidenceArtifact
      : assertMultiEntityAccessBaselineCaptureEvidenceArtifact
    expect(() => assertion(artifact)).toThrow('MULTI_ENTITY_ACCESS_BASELINE_EVIDENCE_INVALID')
  })

  it('rejects capture reuse across another campaign or target context', () => {
    const capturedAccess = baseline()
    const captureArtifact = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      capturedAccess,
    })
    for (const change of [
      { campaignReviewReference: 'review://campaign/other/v1' },
      { sourceDigest: `sha256:${'d'.repeat(64)}` },
      { targetTenantDigest: `sha256:${'e'.repeat(64)}` },
    ]) {
      expect(() =>
        createMultiEntityAccessUnchangedEvidenceArtifact({
          campaignReviewReference,
          readinessReviewReference,
          sourceDigest,
          targetTenantDigest,
          captureArtifact,
          capturedAccess,
          currentAccess: baseline(),
          ...change,
        })
      ).toThrow('MULTI_ENTITY_ACCESS_BASELINE_EVIDENCE_INVALID')
    }
  })

  it('serializes no user, tenant or review identifiers and exports no mutation', async () => {
    const serialized = JSON.stringify({ capture: capture(), unchanged: unchanged() })
    for (const secret of [
      'private-admin',
      'private-marketing',
      'tenant-private',
      campaignReviewReference,
      readinessReviewReference,
    ]) {
      expect(serialized).not.toContain(secret)
    }
    const module = await import('../src/multi-entity-access-baseline-evidence')
    expect(Object.keys(module)).not.toEqual(
      expect.arrayContaining(['apply', 'activate', 'changePermissions', 'write'])
    )
  })
})
