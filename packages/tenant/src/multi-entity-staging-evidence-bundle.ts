import { createHash } from 'node:crypto'

import {
  compareMultiEntityAccessBaselines,
  type MultiEntityAccessBaselineManifest,
} from './multi-entity-access-baseline'
import {
  MULTI_ENTITY_RBAC_INVENTORY_VERSION,
  MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES,
  type MultiEntityRbacPolicyArtifact,
} from './multi-entity-rbac-policy-artifact'
import {
  planMultiEntityStagingReadiness,
  type MultiEntityEntityStagingGate,
  type MultiEntityGlobalStagingGate,
  type MultiEntityStagingReadinessInput,
  type MultiEntityStagingReadinessVerdict,
} from './multi-entity-staging-readiness'

export interface MultiEntityStagingEvidenceBinding {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly reviewReference: string
  readonly evidenceReference: string
  readonly campaignReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly artifactKind: string
  readonly artifactDigest: string
}

export interface MultiEntitySpecificEvidenceArtifactPolicy {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly artifactKind: string
}

export const MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES = Object.freeze([
  Object.freeze({
    scope: 'global' as const,
    gate: 'schema_authority_decided' as const,
    artifactKind: 'cep_multi_entity_schema_authority_review_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'node22_runtime_verified' as const,
    artifactKind: 'cep_multi_entity_node22_runtime_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'access_baseline_captured' as const,
    artifactKind: 'cep_access_baseline_capture_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'access_unchanged_verified' as const,
    artifactKind: 'cep_access_baseline_unchanged_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'all_feature_flags_default_off' as const,
    artifactKind: 'cep_multi_entity_feature_flags_default_off_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'restored_backup_verified' as const,
    artifactKind: 'cep_multi_entity_restored_backup_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'expand_only_migration_reviewed' as const,
    artifactKind: 'cep_multi_entity_expand_only_migration_review_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'migration_dry_run_verified' as const,
    artifactKind: 'cep_multi_entity_migration_dry_run_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'backfill_dry_run_verified' as const,
    artifactKind: 'cep_multi_entity_backfill_dry_run_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'authorization_shadow_verified' as const,
    artifactKind: 'cep_multi_entity_authorization_shadow_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'rollback_rehearsed' as const,
    artifactKind: 'cep_multi_entity_rollback_rehearsal_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'nominal_permission_phase_lock_verified' as const,
    artifactKind: 'cep_nominal_permission_phase_lock_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'accounting_import_staging_verified' as const,
    artifactKind: 'cep_accounting_import_staging_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'enrollment_closure_shadow_verified' as const,
    artifactKind: 'cep_course_run_enrollment_closure_shadow_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'unified_public_web_reviewed' as const,
    artifactKind: 'cep_unified_public_web_review_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'shared_course_catalog_reviewed' as const,
    artifactKind: 'cep_multi_entity_shared_course_catalog_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'shared_teacher_registry_reviewed' as const,
    artifactKind: 'cep_multi_entity_shared_teacher_registry_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'teacher_schedule_shadow_verified' as const,
    artifactKind: 'cep_multi_entity_teacher_schedule_shadow_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'observability_redaction_verified' as const,
    artifactKind: 'cep_multi_entity_observability_redaction_evidence',
  }),
  Object.freeze({
    scope: 'global' as const,
    gate: 'financial_isolation_harness_verified' as const,
    artifactKind: 'cep_finance_isolation_staging_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'legal_profile_reviewed' as const,
    artifactKind: 'cep_multi_entity_legal_profile_entity_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'campus_mapping_reviewed' as const,
    artifactKind: 'cep_multi_entity_campus_mapping_entity_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'accounting_connection_reviewed' as const,
    artifactKind: 'cep_finance_accounting_connection_review_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'accounting_provider_contract_verified' as const,
    artifactKind: 'cep_finance_accounting_provider_contract_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'secret_reference_configured' as const,
    artifactKind: 'cep_finance_secret_reference_configuration_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'payment_source_reviewed' as const,
    artifactKind: 'cep_finance_payment_source_review_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'advertising_source_reviewed' as const,
    artifactKind: 'cep_finance_advertising_source_review_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'payload_relationship_scope_reviewed' as const,
    artifactKind: 'cep_finance_payload_relationship_scope_review_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'enrollment_campaign_scope_reviewed' as const,
    artifactKind: 'cep_multi_entity_enrollment_campaign_scope_review_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'entity_rollback_reviewed' as const,
    artifactKind: 'cep_multi_entity_entity_rollback_review_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'isolation_negative_cases_verified' as const,
    artifactKind: 'cep_finance_entity_isolation_negative_evidence',
  }),
  Object.freeze({
    scope: 'entity' as const,
    gate: 'finance_shadow_observed' as const,
    artifactKind: 'cep_finance_reconciliation_entity_evidence',
  }),
] satisfies readonly MultiEntitySpecificEvidenceArtifactPolicy[])

const SPECIFIC_ARTIFACT_KIND_BY_GATE = new Map(
  MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES.map((policy) => [
    `${policy.scope}\u0000${policy.gate}`,
    policy.artifactKind,
  ])
)

export function getMultiEntitySpecificEvidenceArtifactKind(
  scope: 'global' | 'entity',
  gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
): string | null {
  return SPECIFIC_ARTIFACT_KIND_BY_GATE.get(`${scope}\u0000${gate}`) ?? null
}

export interface MultiEntityStagingEvidenceBundleInput {
  readonly campaignReviewReference: string
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly rbacPolicy: MultiEntityRbacPolicyArtifact
  readonly capturedAccess: MultiEntityAccessBaselineManifest
  readonly currentAccess: MultiEntityAccessBaselineManifest
  readonly readiness: MultiEntityStagingReadinessInput
  readonly evidenceBindings: readonly MultiEntityStagingEvidenceBinding[]
}

export type MultiEntityStagingEvidenceBundleVerdict =
  | 'insufficient_evidence'
  | 'blocked'
  | 'ready_for_manual_staging_review'

export interface MultiEntityStagingEvidenceBundle {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_staging_evidence_bundle'
  readonly mode: 'review_bundle_only'
  readonly verdict: MultiEntityStagingEvidenceBundleVerdict
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly policyDigest: string
  readonly accessBaselineDigest: string
  readonly bundleDigest: string
  readonly metrics: {
    readonly readinessVerdict: MultiEntityStagingReadinessVerdict
    readonly requiredChecks: number
    readonly verifiedChecks: number
    readonly blockingChecks: number
    readonly evidenceBindings: number
    readonly accessBaselineUnchanged: boolean
  }
}

export type MultiEntityContentAddressedEvidenceReference = `evidence://sha256/${string}`

interface ExpectedBinding {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly reviewReference: string
  readonly evidenceReference: string
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const EVIDENCE_REFERENCE_PATTERN = /^evidence:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const ARTIFACT_KIND_PATTERN = /^[a-z][a-z0-9_]{2,99}$/
const INPUT_KEYS = new Set([
  'campaignReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'rbacPolicy',
  'capturedAccess',
  'currentAccess',
  'readiness',
  'evidenceBindings',
])
const BINDING_KEYS = new Set([
  'scope',
  'gate',
  'reviewReference',
  'evidenceReference',
  'campaignReviewReference',
  'sourceDigest',
  'targetTenantDigest',
  'artifactKind',
  'artifactDigest',
])
const POLICY_KEYS = new Set([
  'schemaVersion',
  'kind',
  'mode',
  'inventoryVersion',
  'canChangePermissions',
  'policyDigest',
  'metrics',
  'sources',
])
const POLICY_METRICS_KEYS = new Set(['files', 'totalBytes', 'requiredAuthorities'])
const POLICY_SOURCE_KEYS = new Set(['path', 'digest', 'bytes'])

/** Builds the only evidence reference form accepted by the staging bundle. */
export function createMultiEntityContentAddressedEvidenceReference(
  artifactDigest: string
): MultiEntityContentAddressedEvidenceReference {
  if (!DIGEST_PATTERN.test(artifactDigest)) {
    bundleError('MULTI_ENTITY_STAGING_BUNDLE_ARTIFACT_DIGEST_INVALID')
  }
  return `evidence://sha256/${artifactDigest.slice('sha256:'.length)}`
}

/**
 * Seals the independently produced staging artifacts into one deterministic,
 * identifier-free review bundle. It performs no I/O and grants no operational
 * authority. Evidence from another campaign, source or tenant fails closed.
 */
export function createMultiEntityStagingEvidenceBundle(
  input: MultiEntityStagingEvidenceBundleInput
): MultiEntityStagingEvidenceBundle {
  validateInputShape(input)
  validateRbacPolicy(input.rbacPolicy)

  const accessComparison = compareMultiEntityAccessBaselines(
    input.capturedAccess,
    input.currentAccess
  )
  if (
    input.rbacPolicy.policyDigest !== input.capturedAccess.policyDigest ||
    input.rbacPolicy.policyDigest !== input.currentAccess.policyDigest
  ) {
    bundleError('MULTI_ENTITY_STAGING_BUNDLE_POLICY_MISMATCH')
  }

  const readiness = planMultiEntityStagingReadiness(input.readiness)
  const expectedBindings = collectExpectedBindings(input.readiness)
  validateBindings(input, expectedBindings)

  const accessBaselineUnchanged = accessComparison.verdict === 'unchanged'
  const verdict: MultiEntityStagingEvidenceBundleVerdict = !accessBaselineUnchanged
    ? 'blocked'
    : readiness.verdict === 'blocked'
      ? 'blocked'
      : readiness.verdict === 'insufficient_evidence'
        ? 'insufficient_evidence'
        : 'ready_for_manual_staging_review'

  const canonicalBindings = [...input.evidenceBindings]
    .map((binding) => ({
      scope: binding.scope,
      gate: binding.gate,
      reviewReferenceDigest: digest(binding.reviewReference),
      evidenceReferenceDigest: digest(binding.evidenceReference),
      artifactKind: binding.artifactKind,
      artifactDigest: binding.artifactDigest,
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
  const bundleDigest = digest(
    JSON.stringify({
      schemaVersion: 1,
      sourceDigest: input.sourceDigest,
      targetTenantDigest: input.targetTenantDigest,
      policyDigest: input.rbacPolicy.policyDigest,
      accessBaselineDigest: input.capturedAccess.digest,
      readinessVerdict: readiness.verdict,
      accessBaselineUnchanged,
      bindings: canonicalBindings,
    })
  )

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_staging_evidence_bundle',
    mode: 'review_bundle_only',
    verdict,
    canDeploy: false,
    canMigrate: false,
    canActivate: false,
    canChangePermissions: false,
    sourceDigest: input.sourceDigest,
    targetTenantDigest: input.targetTenantDigest,
    policyDigest: input.rbacPolicy.policyDigest,
    accessBaselineDigest: input.capturedAccess.digest,
    bundleDigest,
    metrics: Object.freeze({
      readinessVerdict: readiness.verdict,
      requiredChecks: readiness.metrics.totalChecks,
      verifiedChecks: readiness.metrics.verified,
      blockingChecks: readiness.metrics.blockingChecks,
      evidenceBindings: input.evidenceBindings.length,
      accessBaselineUnchanged,
    }),
  })
}

export function serializeMultiEntityStagingEvidenceBundle(
  input: MultiEntityStagingEvidenceBundleInput
): string {
  return JSON.stringify(createMultiEntityStagingEvidenceBundle(input))
}

function validateInputShape(input: MultiEntityStagingEvidenceBundleInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !DIGEST_PATTERN.test(input.sourceDigest) ||
    !DIGEST_PATTERN.test(input.targetTenantDigest) ||
    !Array.isArray(input.evidenceBindings) ||
    input.evidenceBindings.length > 100
  ) {
    bundleError('MULTI_ENTITY_STAGING_BUNDLE_INPUT_INVALID')
  }
}

function validateRbacPolicy(policy: MultiEntityRbacPolicyArtifact): void {
  if (
    !policy ||
    !exactKeys(policy, POLICY_KEYS) ||
    policy.schemaVersion !== 1 ||
    policy.kind !== 'cep_current_rbac_policy_artifact' ||
    policy.mode !== 'source_inventory_hash_only' ||
    policy.inventoryVersion !== MULTI_ENTITY_RBAC_INVENTORY_VERSION ||
    policy.canChangePermissions !== false ||
    !DIGEST_PATTERN.test(policy.policyDigest) ||
    !policy.metrics ||
    !exactKeys(policy.metrics, POLICY_METRICS_KEYS) ||
    !Array.isArray(policy.sources) ||
    policy.metrics.files !== policy.sources.length ||
    policy.metrics.requiredAuthorities !== MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.length ||
    policy.sources.some(
      (source) =>
        !source ||
        !exactKeys(source, POLICY_SOURCE_KEYS) ||
        typeof source.path !== 'string' ||
        !DIGEST_PATTERN.test(source.digest) ||
        !Number.isSafeInteger(source.bytes) ||
        source.bytes <= 0
    ) ||
    policy.metrics.totalBytes !==
      policy.sources.reduce((total, source) => total + source.bytes, 0) ||
    policy.sources.some(
      (source, index) =>
        index > 0 && policy.sources[index - 1]!.path.localeCompare(source.path) >= 0
    ) ||
    policy.policyDigest !==
      digest(
        JSON.stringify({
          inventoryVersion: policy.inventoryVersion,
          sources: policy.sources,
        })
      )
  ) {
    bundleError('MULTI_ENTITY_STAGING_BUNDLE_POLICY_INVALID')
  }
}

function collectExpectedBindings(
  readiness: MultiEntityStagingReadinessInput
): readonly ExpectedBinding[] {
  const expected: ExpectedBinding[] = []
  for (const [gate, evidence] of Object.entries(readiness.globalChecks)) {
    if (evidence?.evidenceReference) {
      expected.push({
        scope: 'global',
        gate: gate as MultiEntityGlobalStagingGate,
        reviewReference: readiness.readinessReviewReference,
        evidenceReference: evidence.evidenceReference,
      })
    }
  }
  for (const entity of readiness.entities) {
    for (const [gate, evidence] of Object.entries(entity.checks)) {
      if (evidence?.evidenceReference) {
        expected.push({
          scope: 'entity',
          gate: gate as MultiEntityEntityStagingGate,
          reviewReference: entity.reviewReference,
          evidenceReference: evidence.evidenceReference,
        })
      }
    }
  }
  return expected
}

function validateBindings(
  input: MultiEntityStagingEvidenceBundleInput,
  expectedBindings: readonly ExpectedBinding[]
): void {
  if (input.evidenceBindings.length !== expectedBindings.length) {
    bundleError('MULTI_ENTITY_STAGING_BUNDLE_BINDINGS_INCOMPLETE')
  }
  const expected = new Map(expectedBindings.map((binding) => [bindingKey(binding), binding]))
  const seen = new Set<string>()
  for (const binding of input.evidenceBindings) {
    if (
      !binding ||
      typeof binding !== 'object' ||
      !exactKeys(binding, BINDING_KEYS) ||
      !['global', 'entity'].includes(binding.scope) ||
      !REVIEW_REFERENCE_PATTERN.test(binding.reviewReference) ||
      !EVIDENCE_REFERENCE_PATTERN.test(binding.evidenceReference) ||
      binding.campaignReviewReference !== input.campaignReviewReference ||
      binding.sourceDigest !== input.sourceDigest ||
      binding.targetTenantDigest !== input.targetTenantDigest ||
      !ARTIFACT_KIND_PATTERN.test(binding.artifactKind) ||
      !DIGEST_PATTERN.test(binding.artifactDigest) ||
      binding.evidenceReference !==
        createMultiEntityContentAddressedEvidenceReference(binding.artifactDigest) ||
      (getMultiEntitySpecificEvidenceArtifactKind(binding.scope, binding.gate) !== null &&
        binding.artifactKind !==
          getMultiEntitySpecificEvidenceArtifactKind(binding.scope, binding.gate))
    ) {
      bundleError('MULTI_ENTITY_STAGING_BUNDLE_BINDING_INVALID')
    }
    const key = bindingKey(binding)
    const match = expected.get(key)
    if (!match || match.evidenceReference !== binding.evidenceReference || seen.has(key)) {
      bundleError('MULTI_ENTITY_STAGING_BUNDLE_BINDING_MISMATCH')
    }
    seen.add(key)
  }
}

function bindingKey(binding: Pick<ExpectedBinding, 'scope' | 'gate' | 'reviewReference'>): string {
  return `${binding.scope}\u0000${binding.gate}\u0000${binding.reviewReference}`
}

function exactKeys(value: object, allowed: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === allowed.size && keys.every((key) => allowed.has(key))
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function bundleError(code: string): never {
  throw Object.assign(new Error('Multi-entity staging evidence bundle is invalid.'), { code })
}
