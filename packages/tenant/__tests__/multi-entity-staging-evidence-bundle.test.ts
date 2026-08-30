import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  createMultiEntityAccessBaseline,
  type MultiEntityAccessBaselineManifest,
} from '../src/multi-entity-access-baseline'
import {
  MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES,
  createMultiEntityRbacPolicyArtifact,
  type MultiEntityRbacPolicyArtifact,
} from '../src/multi-entity-rbac-policy-artifact'
import {
  createMultiEntityContentAddressedEvidenceReference,
  createMultiEntityStagingEvidenceBundle,
  getMultiEntitySpecificEvidenceArtifactKind,
  serializeMultiEntityStagingEvidenceBundle,
  type MultiEntityStagingEvidenceBinding,
  type MultiEntityStagingEvidenceBundleInput,
} from '../src/multi-entity-staging-evidence-bundle'
import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
  type MultiEntityStagingReadinessInput,
} from '../src/multi-entity-staging-readiness'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const sourceDigest = sha256('source-revision')
const targetTenantDigest = sha256('tenant-cep')

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function policy(): MultiEntityRbacPolicyArtifact {
  return createMultiEntityRbacPolicyArtifact(
    MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.map((path) => ({
      path,
      content: `export const access = ${JSON.stringify(path)}`,
    }))
  )
}

function access(
  rbacPolicy: MultiEntityRbacPolicyArtifact,
  suffix = ''
): MultiEntityAccessBaselineManifest {
  return createMultiEntityAccessBaseline({
    targetTenantId: 'tenant-cep',
    policyDigest: rbacPolicy.policyDigest,
    users: [
      { id: `admin${suffix}`, role: 'admin', tenantId: 'tenant-cep', isActive: true },
      { id: 'platform', role: 'superadmin', tenantId: null, isActive: true },
    ],
  })
}

function readiness(): MultiEntityStagingReadinessInput {
  const globalChecks = Object.fromEntries(
    MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) => {
      const artifactDigest = sha256(`global:${gate}`)
      return [
        gate,
        {
          status: 'verified',
          evidenceReference: createMultiEntityContentAddressedEvidenceReference(artifactDigest),
        },
      ]
    })
  ) as MultiEntityStagingReadinessInput['globalChecks']
  const entities = (['norte', 'santa-cruz', 'sur'] as const).map((label) => ({
    tenantId: 'tenant-cep',
    legalEntityId: `entity-${label}`,
    accountingConnectionId: `accounting-${label}`,
    role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
    reviewReference: `review://entity/${label}/v1`,
    ...(label === 'sur' ? { pilotReviewReference: 'review://entity/sur/pilot/v1' } : {}),
    checks: Object.fromEntries(
      MULTI_ENTITY_ENTITY_STAGING_GATES.map((gate) => {
        const artifactDigest = sha256(`review://entity/${label}/v1:${gate}`)
        return [
          gate,
          {
            status: 'verified',
            evidenceReference: createMultiEntityContentAddressedEvidenceReference(artifactDigest),
          },
        ]
      })
    ),
  }))
  return {
    readinessReviewReference: 'review://readiness/cep/staging-v1',
    globalChecks,
    entities,
  }
}

function bindings(
  readinessInput: MultiEntityStagingReadinessInput
): MultiEntityStagingEvidenceBinding[] {
  const result: MultiEntityStagingEvidenceBinding[] = []
  for (const [gate, evidence] of Object.entries(readinessInput.globalChecks)) {
    if (!evidence?.evidenceReference) continue
    result.push({
      scope: 'global',
      gate: gate as (typeof MULTI_ENTITY_GLOBAL_STAGING_GATES)[number],
      reviewReference: readinessInput.readinessReviewReference,
      evidenceReference: evidence.evidenceReference,
      campaignReviewReference,
      sourceDigest,
      targetTenantDigest,
      artifactKind: getMultiEntitySpecificEvidenceArtifactKind('global', gate) ?? `cep_${gate}`,
      artifactDigest: sha256(`global:${gate}`),
    })
  }
  for (const entity of readinessInput.entities) {
    for (const [gate, evidence] of Object.entries(entity.checks)) {
      if (!evidence?.evidenceReference) continue
      result.push({
        scope: 'entity',
        gate: gate as (typeof MULTI_ENTITY_ENTITY_STAGING_GATES)[number],
        reviewReference: entity.reviewReference,
        evidenceReference: evidence.evidenceReference,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: getMultiEntitySpecificEvidenceArtifactKind('entity', gate) ?? `cep_${gate}`,
        artifactDigest: sha256(`${entity.reviewReference}:${gate}`),
      })
    }
  }
  return result
}

function input(): MultiEntityStagingEvidenceBundleInput {
  const rbacPolicy = policy()
  const capturedAccess = access(rbacPolicy)
  const readinessInput = readiness()
  return {
    campaignReviewReference,
    sourceDigest,
    targetTenantDigest,
    rbacPolicy,
    capturedAccess,
    currentAccess: capturedAccess,
    readiness: readinessInput,
    evidenceBindings: bindings(readinessInput),
  }
}

function expectCode(action: () => unknown, code: string): void {
  expect(action).toThrowError(expect.objectContaining({ code }))
}

describe('multi-entity staging evidence bundle', () => {
  it('seals all 56 checks without granting deploy, migration, activation or permission authority', () => {
    const bundle = createMultiEntityStagingEvidenceBundle(input())

    expect(bundle).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_staging_evidence_bundle',
      mode: 'review_bundle_only',
      verdict: 'ready_for_manual_staging_review',
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      sourceDigest,
      targetTenantDigest,
      metrics: {
        readinessVerdict: 'ready_for_staging_review',
        requiredChecks: 56,
        verifiedChecks: 56,
        blockingChecks: 0,
        evidenceBindings: 56,
        accessBaselineUnchanged: true,
      },
    })
    expect(bundle.bundleDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(JSON.stringify(bundle)).not.toContain('tenant-cep')
    expect(JSON.stringify(bundle)).not.toContain('entity-norte')
    expect(JSON.stringify(bundle)).not.toContain('evidence://')
    expect(JSON.stringify(bundle)).not.toContain('review://')
  })

  it('is deterministic when bindings arrive in another order', () => {
    const source = input()
    const reordered = { ...source, evidenceBindings: [...source.evidenceBindings].reverse() }

    expect(serializeMultiEntityStagingEvidenceBundle(reordered)).toBe(
      serializeMultiEntityStagingEvidenceBundle(source)
    )
  })

  it('fails closed when a binding belongs to another campaign, source or tenant', () => {
    for (const change of [
      { campaignReviewReference: 'review://campaign/other/v1' },
      { sourceDigest: sha256('other-source') },
      { targetTenantDigest: sha256('other-tenant') },
    ]) {
      const source = input()
      const evidenceBindings = [...source.evidenceBindings]
      evidenceBindings[0] = { ...evidenceBindings[0]!, ...change }
      expectCode(
        () => createMultiEntityStagingEvidenceBundle({ ...source, evidenceBindings }),
        'MULTI_ENTITY_STAGING_BUNDLE_BINDING_INVALID'
      )
    }
  })

  it('rejects substitution when the evidence reference does not address its artifact digest', () => {
    const source = input()
    const evidenceBindings = [...source.evidenceBindings]
    evidenceBindings[0] = {
      ...evidenceBindings[0]!,
      artifactDigest: sha256('substituted-artifact'),
    }

    expectCode(
      () => createMultiEntityStagingEvidenceBundle({ ...source, evidenceBindings }),
      'MULTI_ENTITY_STAGING_BUNDLE_BINDING_INVALID'
    )
  })

  it.each([
    ['global', 'access_baseline_captured'],
    ['global', 'access_unchanged_verified'],
    ['global', 'all_feature_flags_default_off'],
    ['global', 'rollback_rehearsed'],
    ['global', 'teacher_schedule_shadow_verified'],
    ['global', 'enrollment_closure_shadow_verified'],
    ['global', 'authorization_shadow_verified'],
    ['global', 'nominal_permission_phase_lock_verified'],
    ['global', 'accounting_import_staging_verified'],
    ['global', 'observability_redaction_verified'],
    ['global', 'financial_isolation_harness_verified'],
    ['entity', 'accounting_connection_reviewed'],
    ['entity', 'accounting_provider_contract_verified'],
    ['entity', 'secret_reference_configured'],
    ['entity', 'payload_relationship_scope_reviewed'],
    ['entity', 'enrollment_campaign_scope_reviewed'],
    ['entity', 'payment_source_reviewed'],
    ['entity', 'advertising_source_reviewed'],
    ['entity', 'entity_rollback_reviewed'],
    ['entity', 'isolation_negative_cases_verified'],
    ['entity', 'finance_shadow_observed'],
  ] as const)('rejects a generic artifact kind for %s:%s', (scope, gate) => {
    const source = input()
    let changed = false
    const evidenceBindings = source.evidenceBindings.map((binding) => {
      if (!changed && binding.scope === scope && binding.gate === gate) {
        changed = true
        return { ...binding, artifactKind: 'cep_generic_shadow_evidence' }
      }
      return binding
    })

    expectCode(
      () => createMultiEntityStagingEvidenceBundle({ ...source, evidenceBindings }),
      'MULTI_ENTITY_STAGING_BUNDLE_BINDING_INVALID'
    )
  })

  it('rejects missing, duplicate, reassigned and extra evidence bindings', () => {
    const source = input()
    const first = source.evidenceBindings[0]!
    const second = source.evidenceBindings[1]!
    const cases: readonly MultiEntityStagingEvidenceBinding[][] = [
      source.evidenceBindings.slice(1),
      [first, first, ...source.evidenceBindings.slice(2)],
      [
        { ...first, evidenceReference: second.evidenceReference },
        ...source.evidenceBindings.slice(1),
      ],
      [...source.evidenceBindings, { ...first, gate: 'node22_runtime_verified' }],
    ]
    const codes = [
      'MULTI_ENTITY_STAGING_BUNDLE_BINDINGS_INCOMPLETE',
      'MULTI_ENTITY_STAGING_BUNDLE_BINDING_MISMATCH',
      'MULTI_ENTITY_STAGING_BUNDLE_BINDING_INVALID',
      'MULTI_ENTITY_STAGING_BUNDLE_BINDINGS_INCOMPLETE',
    ]
    cases.forEach((evidenceBindings, index) =>
      expectCode(
        () => createMultiEntityStagingEvidenceBundle({ ...source, evidenceBindings }),
        codes[index]!
      )
    )
  })

  it('blocks access drift even if every readiness check is marked verified', () => {
    const source = input()
    const bundle = createMultiEntityStagingEvidenceBundle({
      ...source,
      currentAccess: access(source.rbacPolicy, '-changed'),
    })

    expect(bundle).toMatchObject({
      verdict: 'blocked',
      canChangePermissions: false,
      metrics: { accessBaselineUnchanged: false },
    })
  })

  it('rejects RBAC policy drift against either access baseline', () => {
    const source = input()
    const differentPolicy = createMultiEntityRbacPolicyArtifact(
      MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.map((path) => ({
        path,
        content: `export const changedAccess = ${JSON.stringify(path)}`,
      }))
    )
    expectCode(
      () => createMultiEntityStagingEvidenceBundle({ ...source, rbacPolicy: differentPolicy }),
      'MULTI_ENTITY_STAGING_BUNDLE_POLICY_MISMATCH'
    )
  })

  it('remains insufficient when a readiness gate is pending and binds only referenced evidence', () => {
    const source = input()
    const readinessInput = readiness()
    readinessInput.globalChecks.node22_runtime_verified = { status: 'pending' }
    const bundle = createMultiEntityStagingEvidenceBundle({
      ...source,
      readiness: readinessInput,
      evidenceBindings: bindings(readinessInput),
    })

    expect(bundle).toMatchObject({
      verdict: 'insufficient_evidence',
      metrics: { verifiedChecks: 55, blockingChecks: 1, evidenceBindings: 55 },
    })
  })

  it('rejects forged flags, unknown input fields and malformed artifact metadata', () => {
    const source = input()
    expectCode(
      () =>
        createMultiEntityStagingEvidenceBundle({
          ...source,
          operatorEmail: 'private@cep.test',
        } as never),
      'MULTI_ENTITY_STAGING_BUNDLE_INPUT_INVALID'
    )
    expectCode(
      () =>
        createMultiEntityStagingEvidenceBundle({
          ...source,
          rbacPolicy: { ...source.rbacPolicy, canChangePermissions: true } as never,
        }),
      'MULTI_ENTITY_STAGING_BUNDLE_POLICY_INVALID'
    )
    expectCode(
      () =>
        createMultiEntityStagingEvidenceBundle({
          ...source,
          rbacPolicy: {
            ...source.rbacPolicy,
            policyDigest: sha256('forged-policy-with-valid-shape'),
          },
        }),
      'MULTI_ENTITY_STAGING_BUNDLE_POLICY_INVALID'
    )
    const evidenceBindings = [...source.evidenceBindings]
    evidenceBindings[0] = { ...evidenceBindings[0]!, canApply: true } as never
    expectCode(
      () => createMultiEntityStagingEvidenceBundle({ ...source, evidenceBindings }),
      'MULTI_ENTITY_STAGING_BUNDLE_BINDING_INVALID'
    )
  })

  it('rejects malformed digests before creating a content-addressed reference', () => {
    expectCode(
      () => createMultiEntityContentAddressedEvidenceReference('sha256:not-a-digest'),
      'MULTI_ENTITY_STAGING_BUNDLE_ARTIFACT_DIGEST_INVALID'
    )
  })
})
