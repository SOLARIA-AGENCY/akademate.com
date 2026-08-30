import { createHash } from 'node:crypto'

import {
  assertAccountingImportStagingEvidenceArtifact,
  assertFinanceAdvertisingSourceStagingEvidenceManifest,
  assertFinanceAccountingConnectionStagingEvidenceManifest,
  assertFinanceAccountingSecretReferenceStagingEvidenceManifest,
  assertFinanceAccountingProviderContractStagingEvidenceManifest,
  assertFinanceEntityIsolationNegativeStagingEvidenceManifest,
  assertFinanceIsolationStagingEvidenceManifest,
  assertFinancePaymentSourceStagingEvidenceManifest,
  assertFinanceReconciliationStagingEvidenceManifest,
  type AccountingImportStagingEvidenceArtifact,
  type FinanceAdvertisingSourceStagingEvidenceManifest,
  type FinanceAccountingConnectionStagingEvidenceManifest,
  type FinanceAccountingSecretReferenceStagingEvidenceManifest,
  type FinanceAccountingProviderContractStagingEvidenceManifest,
  type FinanceEntityIsolationNegativeStagingEvidenceManifest,
  type FinanceIsolationStagingEvidenceManifest,
  type FinancePaymentSourceStagingEvidenceManifest,
  type FinanceReconciliationStagingEvidenceManifest,
} from '../../../../packages/finance/src'
import {
  assertUnifiedPublicWebEvidenceArtifact,
  type UnifiedPublicWebEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-unified-public-web-evidence'
import {
  assertSharedCourseCatalogEvidenceArtifact,
  type SharedCourseCatalogEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-course-catalog-evidence'
import {
  assertMultiEntityAccessBaselineCaptureEvidenceArtifact,
  assertMultiEntityAccessUnchangedEvidenceArtifact,
  type MultiEntityAccessBaselineCaptureEvidenceArtifact,
  type MultiEntityAccessUnchangedEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-access-baseline-evidence'
import {
  assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput,
  assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput,
  type MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
  type MultiEntityAccessSurfaceBaselineEvidenceBindingContext,
  type MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-access-surface-baseline-evidence'
import type { MultiEntityAccessSurfaceBaselineManifest } from '../../../../packages/tenant/src/multi-entity-access-surface-baseline'
import {
  assertCourseRunEnrollmentClosureEvidenceArtifact,
  type CourseRunEnrollmentClosureEvidenceArtifact,
} from '../../../../packages/tenant/src/course-run-enrollment-closure-evidence'
import {
  assertNominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-nominal-permission-phase-lock-evidence'
import {
  assertMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-rollback-rehearsal-evidence'
import {
  assertMultiEntityRestoredBackupEvidenceArtifact,
  type MultiEntityRestoredBackupEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-restored-backup-evidence'
import {
  assertMultiEntityBackfillDryRunEvidenceArtifact,
  assertMultiEntityExpandOnlyMigrationReviewEvidenceArtifact,
  assertMultiEntityMigrationDryRunEvidenceArtifact,
  assertMultiEntityNode22RuntimeEvidenceArtifact,
  type MultiEntityBackfillDryRunEvidenceArtifact,
  type MultiEntityExpandOnlyMigrationReviewEvidenceArtifact,
  type MultiEntityMigrationDryRunEvidenceArtifact,
  type MultiEntityNode22RuntimeEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-runtime-migration-evidence'
import {
  assertSharedTeacherRegistryEvidenceArtifact,
  type SharedTeacherRegistryEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-teacher-registry-evidence'
import {
  assertTeacherScheduleShadowEvidenceArtifact,
  type TeacherScheduleShadowEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-teacher-schedule-evidence'
import {
  assertMultiEntityLegalProfileReviewEvidenceArtifact,
  type MultiEntityLegalProfileReviewEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-legal-profile-evidence'
import {
  assertCampusMappingEvidenceArtifact,
  type CampusMappingEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-campus-mapping-evidence'
import {
  assertMultiEntitySchemaAuthorityReviewEvidenceArtifact,
  type MultiEntitySchemaAuthorityReviewEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-schema-authority-evidence'
import {
  assertMultiEntitySchemaExpansionPlan,
  digestMultiEntitySchemaExpansionPlan,
  type MultiEntitySchemaExpansionPlan,
} from '../../../../packages/tenant/src/multi-entity-schema-expansion-plan'
import {
  createMultiEntityStagingEvidenceBundle,
  type MultiEntityStagingEvidenceBinding,
  type MultiEntityStagingEvidenceBundleInput,
  type MultiEntityStagingEvidenceBundleVerdict,
} from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import { createMultiEntityStagingEvidenceContractCoverageManifest } from '../../../../packages/tenant/src/multi-entity-staging-evidence-contract-coverage'
import {
  assertMultiEntityAuthorizationShadowEvidenceArtifact,
  assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
  type MultiEntityAuthorizationShadowEvidenceArtifact,
  type MultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
} from '../../../../packages/tenant/src/multi-entity-safety-mode-evidence'
import {
  ACCESS_BASELINE_CAPTURED_READINESS_GATE,
  ACCESS_UNCHANGED_VERIFIED_READINESS_GATE,
  createAccessBaselineEvidenceBindingProposal,
} from './access-baseline-evidence-binding'
import {
  createUnifiedPublicWebEvidenceBindingProposal,
  UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE,
} from './unified-public-web-evidence-binding'
import {
  createSharedCourseCatalogEvidenceBindingProposal,
  SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE,
} from './course-catalog-evidence-binding'
import {
  createEntityRollbackBindingProposal,
  ENTITY_ROLLBACK_REVIEWED_READINESS_GATE,
} from './entity-rollback-evidence-binding'
import {
  assertEntityRollbackStagingEvidenceManifest,
  type EntityRollbackStagingEvidenceManifest,
} from './entity-rollback-staging-evidence'
import {
  createEnrollmentCampaignScopeBindingProposal,
  ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE,
} from './enrollment-campaign-scope-evidence-binding'
import {
  assertEnrollmentCampaignScopeStagingEvidenceManifest,
  type EnrollmentCampaignScopeStagingEvidenceManifest,
} from './enrollment-campaign-scope-staging-evidence'
import {
  createEnrollmentClosureEvidenceBindingProposal,
  ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE,
} from './enrollment-closure-evidence-binding'
import {
  ACCOUNTING_IMPORT_STAGING_READINESS_GATE,
  createAccountingImportEvidenceBindingProposal,
} from './finance-accounting-import-evidence-binding'
import {
  createFinanceAdvertisingSourceBindingProposal,
  FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE,
} from './finance-advertising-source-evidence-binding'
import {
  createFinanceAccountingConnectionBindingProposal,
  FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE,
} from './finance-accounting-connection-evidence-binding'
import {
  createFinanceAccountingSecretReferenceBindingProposal,
  FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE,
} from './finance-accounting-secret-reference-evidence-binding'
import {
  createFinanceAccountingProviderContractBindingProposal,
  FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE,
} from './finance-accounting-provider-contract-evidence-binding'
import {
  createFinanceReconciliationEvidenceBindingProposal,
  FINANCE_RECONCILIATION_ENTITY_READINESS_GATE,
} from './finance-reconciliation-evidence-binding'
import {
  createFinanceIsolationEvidenceBindingProposal,
  FINANCE_ISOLATION_STAGING_READINESS_GATE,
} from './finance-isolation-evidence-binding'
import {
  createFinanceEntityIsolationNegativeBindingProposal,
  FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE,
} from './finance-entity-isolation-negative-evidence-binding'
import {
  createFinancePaymentSourceBindingProposal,
  FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE,
} from './finance-payment-source-evidence-binding'
import {
  createFinancePayloadRelationshipScopeBindingProposal,
  FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE,
} from './finance-payload-relationship-scope-evidence-binding'
import {
  assertFinancePayloadRelationshipScopeStagingEvidenceManifest,
  type FinancePayloadRelationshipScopeStagingEvidenceManifest,
} from './finance-payload-relationship-scope-staging-evidence'
import {
  ROLLBACK_REHEARSED_READINESS_GATE,
  createRollbackRehearsalEvidenceBindingProposal,
} from './rollback-rehearsal-evidence-binding'
import {
  AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE,
  FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE,
  createSafetyModeEvidenceBindingProposal,
} from './safety-mode-evidence-binding'
import {
  createNominalPermissionPhaseLockBindingProposal,
  NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE,
} from './nominal-permission-phase-lock-evidence-binding'
import {
  createObservabilityRedactionBindingProposal,
  OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE,
} from './observability-redaction-evidence-binding'
import {
  assertObservabilityRedactionStagingEvidenceArtifact,
  type ObservabilityRedactionStagingEvidenceArtifact,
} from './observability-redaction-staging-evidence'
import {
  createSharedTeacherRegistryEvidenceBindingProposal,
  SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE,
} from './teacher-registry-evidence-binding'
import {
  createTeacherScheduleEvidenceBindingProposal,
  TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE,
} from './teacher-schedule-evidence-binding'

export interface StrictStagingSpecificArtifacts {
  readonly schemaAuthority: MultiEntitySchemaAuthorityReviewEvidenceArtifact
  readonly schemaExpansionPlan: MultiEntitySchemaExpansionPlan
  readonly node22Runtime: MultiEntityNode22RuntimeEvidenceArtifact
  readonly accessBaselineCapture: MultiEntityAccessBaselineCaptureEvidenceArtifact
  readonly accessUnchanged: MultiEntityAccessUnchangedEvidenceArtifact
  readonly featureFlagsDefaultOff: MultiEntityFeatureFlagsDefaultOffEvidenceArtifact
  readonly restoredBackup: MultiEntityRestoredBackupEvidenceArtifact
  readonly expandOnlyMigrationReview: MultiEntityExpandOnlyMigrationReviewEvidenceArtifact
  readonly migrationDryRun: MultiEntityMigrationDryRunEvidenceArtifact
  readonly backfillDryRun: MultiEntityBackfillDryRunEvidenceArtifact
  readonly authorizationShadow: MultiEntityAuthorizationShadowEvidenceArtifact
  readonly rollbackRehearsal: MultiEntityRollbackRehearsalEvidenceArtifact
  readonly enrollmentClosureShadow: CourseRunEnrollmentClosureEvidenceArtifact
  readonly unifiedPublicWeb: UnifiedPublicWebEvidenceArtifact
  readonly sharedCourseCatalog: SharedCourseCatalogEvidenceArtifact
  readonly sharedTeacherRegistry: SharedTeacherRegistryEvidenceArtifact
  readonly teacherScheduleShadow: TeacherScheduleShadowEvidenceArtifact
  readonly legalProfile: MultiEntityLegalProfileReviewEvidenceArtifact
  readonly campusMapping: CampusMappingEvidenceArtifact
  readonly nominalPermissionLock: NominalPermissionPhaseLockEvidenceArtifact
  readonly accountingImport: AccountingImportStagingEvidenceArtifact
  readonly accountingConnection: FinanceAccountingConnectionStagingEvidenceManifest
  readonly accountingSecretReference: FinanceAccountingSecretReferenceStagingEvidenceManifest
  readonly accountingProviderContract: FinanceAccountingProviderContractStagingEvidenceManifest
  readonly paymentSource: FinancePaymentSourceStagingEvidenceManifest
  readonly advertisingSource: FinanceAdvertisingSourceStagingEvidenceManifest
  readonly payloadRelationshipScope: FinancePayloadRelationshipScopeStagingEvidenceManifest
  readonly enrollmentCampaignScope: EnrollmentCampaignScopeStagingEvidenceManifest
  readonly entityRollback: EntityRollbackStagingEvidenceManifest
  readonly financialIsolation: FinanceIsolationStagingEvidenceManifest
  readonly entityIsolationNegative: FinanceEntityIsolationNegativeStagingEvidenceManifest
  readonly financeReconciliation: FinanceReconciliationStagingEvidenceManifest
  readonly observabilityRedaction: ObservabilityRedactionStagingEvidenceArtifact
}

export interface StrictStagingEvidenceBundleInput {
  readonly bundleInput: MultiEntityStagingEvidenceBundleInput
  readonly specificArtifacts: StrictStagingSpecificArtifacts
  /** Supplementary v2 access-surface proof; deliberately outside the 56 gates. */
  readonly accessSurfaceBaseline: StrictStagingAccessSurfaceBaseline
}

export interface StrictStagingAccessSurfaceBaseline {
  readonly context: MultiEntityAccessSurfaceBaselineEvidenceBindingContext
  readonly capturedAccess: MultiEntityAccessSurfaceBaselineManifest
  readonly currentAccess: MultiEntityAccessSurfaceBaselineManifest
  readonly captureArtifact: MultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact
  readonly unchangedArtifact: MultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact
}

export interface StrictStagingEvidenceBundle {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_strict_staging_evidence_bundle'
  readonly mode: 'direct_specific_artifact_verification_review_only'
  readonly verdict: 'blocked_no_staging_execution_evidence'
  readonly canDeclareStagingReady: false
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly sourceDigest: string
  readonly targetTenantDigest: string
  readonly bundleDigest: string
  readonly verificationDigest: string
  readonly verificationReference: `evidence://sha256/${string}`
  readonly metrics: {
    readonly bundleVerdict: MultiEntityStagingEvidenceBundleVerdict
    readonly requiredBindings: 56
    readonly directlyVerifiedArtifactKinds: 32
    readonly directlyVerifiedBindings: 56
    readonly genericOnlyBindings: 0
    readonly sourceRegisteredStagingExecutionBindings: 0
  }
}

export type StrictStagingEvidenceBundleErrorCode =
  | 'STRICT_STAGING_EVIDENCE_INPUT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_SCHEMA_AUTHORITY_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_SCHEMA_EXPANSION_PLAN_INVALID'
  | 'STRICT_STAGING_EVIDENCE_NODE22_RUNTIME_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCESS_CAPTURE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCESS_UNCHANGED_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCESS_SURFACE_BASELINE_INVALID'
  | 'STRICT_STAGING_EVIDENCE_FEATURE_FLAGS_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_RESTORED_BACKUP_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_EXPAND_ONLY_MIGRATION_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_MIGRATION_DRY_RUN_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_BACKFILL_DRY_RUN_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_AUTHORIZATION_SHADOW_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ROLLBACK_REHEARSAL_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ENROLLMENT_CLOSURE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_UNIFIED_PUBLIC_WEB_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_SHARED_COURSE_CATALOG_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_SHARED_TEACHER_REGISTRY_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_TEACHER_SCHEDULE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_LEGAL_PROFILE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_CAMPUS_MAPPING_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_NOMINAL_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCOUNTING_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCOUNTING_CONNECTION_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCOUNTING_SECRET_REFERENCE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ACCOUNTING_PROVIDER_CONTRACT_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_PAYMENT_SOURCE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ADVERTISING_SOURCE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_PAYLOAD_RELATIONSHIP_SCOPE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ENROLLMENT_CAMPAIGN_SCOPE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ENTITY_ROLLBACK_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_FINANCE_ISOLATION_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_ENTITY_ISOLATION_NEGATIVE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_FINANCE_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_OBSERVABILITY_REDACTION_ARTIFACT_INVALID'
  | 'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
  | 'STRICT_STAGING_EVIDENCE_BINDING_MISMATCH'
  | 'STRICT_STAGING_EVIDENCE_BUNDLE_INVALID'
  | 'STRICT_STAGING_EVIDENCE_COVERAGE_POLICY_INVALID'

export class StrictStagingEvidenceBundleError extends Error {
  constructor(readonly code: StrictStagingEvidenceBundleErrorCode) {
    super('Strict multi-entity staging evidence bundle is invalid.')
    this.name = 'StrictStagingEvidenceBundleError'
  }
}

const INPUT_KEYS = new Set(['bundleInput', 'specificArtifacts', 'accessSurfaceBaseline'])
const ACCESS_SURFACE_BASELINE_KEYS = new Set([
  'context',
  'capturedAccess',
  'currentAccess',
  'captureArtifact',
  'unchangedArtifact',
])
const ARTIFACT_KEYS = new Set([
  'schemaAuthority',
  'schemaExpansionPlan',
  'node22Runtime',
  'accessBaselineCapture',
  'accessUnchanged',
  'featureFlagsDefaultOff',
  'restoredBackup',
  'expandOnlyMigrationReview',
  'migrationDryRun',
  'backfillDryRun',
  'authorizationShadow',
  'rollbackRehearsal',
  'enrollmentClosureShadow',
  'unifiedPublicWeb',
  'sharedCourseCatalog',
  'sharedTeacherRegistry',
  'teacherScheduleShadow',
  'legalProfile',
  'campusMapping',
  'nominalPermissionLock',
  'accountingImport',
  'accountingConnection',
  'accountingSecretReference',
  'accountingProviderContract',
  'paymentSource',
  'advertisingSource',
  'payloadRelationshipScope',
  'enrollmentCampaignScope',
  'entityRollback',
  'financialIsolation',
  'entityIsolationNegative',
  'financeReconciliation',
  'observabilityRedaction',
])

/**
 * Executes the thirty-two available specific artifact verifiers and reconstructs
 * all fifty-six expected bindings before evaluating the generic bundle. The
 * result remains blocked because no staging execution evidence is registered.
 * Its digest is content addressing, not a signature, environment attestation
 * or authorization to activate anything.
 */
export function createStrictStagingEvidenceBundle(
  input: StrictStagingEvidenceBundleInput
): StrictStagingEvidenceBundle {
  validateEnvelope(input)
  const { bundleInput, specificArtifacts } = input

  assertAccessSurfaceBaseline(input.accessSurfaceBaseline)
  assertSpecificArtifacts(specificArtifacts)
  let bundle: ReturnType<typeof createMultiEntityStagingEvidenceBundle>
  try {
    bundle = createMultiEntityStagingEvidenceBundle(bundleInput)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_BUNDLE_INVALID')
  }
  validateSharedContext(bundleInput, specificArtifacts, input.accessSurfaceBaseline)

  const schemaAuthorityBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    'schema_authority_decided'
  )
  const node22RuntimeBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    'node22_runtime_verified'
  )
  const accessCaptureBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    ACCESS_BASELINE_CAPTURED_READINESS_GATE
  )
  const accessUnchangedBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    ACCESS_UNCHANGED_VERIFIED_READINESS_GATE
  )
  const featureFlagsBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE
  )
  const restoredBackupBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    'restored_backup_verified'
  )
  const expandOnlyMigrationReviewBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    'expand_only_migration_reviewed'
  )
  const migrationDryRunBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    'migration_dry_run_verified'
  )
  const backfillDryRunBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    'backfill_dry_run_verified'
  )
  const authorizationShadowBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE
  )
  const rollbackBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    ROLLBACK_REHEARSED_READINESS_GATE
  )
  const enrollmentClosureBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE
  )
  const unifiedPublicWebBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE
  )
  const sharedCourseCatalogBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE
  )
  const sharedTeacherRegistryBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE
  )
  const teacherScheduleBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE
  )
  const observabilityRedactionBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE
  )
  const legalProfileBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    'legal_profile_reviewed',
    3
  )
  const campusMappingBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    'campus_mapping_reviewed',
    3
  )

  const nominalBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE
  )
  const accountingBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    ACCOUNTING_IMPORT_STAGING_READINESS_GATE
  )
  const financialIsolationBinding = findSingleBinding(
    bundleInput.evidenceBindings,
    'global',
    FINANCE_ISOLATION_STAGING_READINESS_GATE
  )
  const financeBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_RECONCILIATION_ENTITY_READINESS_GATE,
    3
  )
  const accountingConnectionBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE,
    3
  )
  const accountingSecretReferenceBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE,
    3
  )
  const accountingProviderContractBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE,
    3
  )
  const paymentSourceBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE,
    3
  )
  const advertisingSourceBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE,
    3
  )
  const payloadRelationshipScopeBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE,
    3
  )
  const enrollmentCampaignScopeBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE,
    3
  )
  const entityRollbackBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    ENTITY_ROLLBACK_REVIEWED_READINESS_GATE,
    3
  )
  const entityIsolationNegativeBindings = findBindings(
    bundleInput.evidenceBindings,
    'entity',
    FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE,
    3
  )

  let expectedNominal: MultiEntityStagingEvidenceBinding
  let expectedAccounting: MultiEntityStagingEvidenceBinding
  let expectedAccountingConnection: readonly MultiEntityStagingEvidenceBinding[]
  let expectedAccountingSecretReference: readonly MultiEntityStagingEvidenceBinding[]
  let expectedAccountingProviderContract: readonly MultiEntityStagingEvidenceBinding[]
  let expectedPaymentSource: readonly MultiEntityStagingEvidenceBinding[]
  let expectedAdvertisingSource: readonly MultiEntityStagingEvidenceBinding[]
  let expectedPayloadRelationshipScope: readonly MultiEntityStagingEvidenceBinding[]
  let expectedEnrollmentCampaignScope: readonly MultiEntityStagingEvidenceBinding[]
  let expectedEntityRollback: readonly MultiEntityStagingEvidenceBinding[]
  let expectedFinancialIsolation: MultiEntityStagingEvidenceBinding
  let expectedEntityIsolationNegative: readonly MultiEntityStagingEvidenceBinding[]
  let expectedFinance: readonly MultiEntityStagingEvidenceBinding[]
  let expectedAccess: readonly MultiEntityStagingEvidenceBinding[]
  let expectedSafety: readonly MultiEntityStagingEvidenceBinding[]
  let expectedRestoredBackup: MultiEntityStagingEvidenceBinding
  let expectedRollback: MultiEntityStagingEvidenceBinding
  let expectedEnrollmentClosure: MultiEntityStagingEvidenceBinding
  let expectedUnifiedPublicWeb: MultiEntityStagingEvidenceBinding
  let expectedSharedCourseCatalog: MultiEntityStagingEvidenceBinding
  let expectedSharedTeacherRegistry: MultiEntityStagingEvidenceBinding
  let expectedTeacherSchedule: MultiEntityStagingEvidenceBinding
  let expectedObservabilityRedaction: MultiEntityStagingEvidenceBinding
  let expectedSchemaAuthority: MultiEntityStagingEvidenceBinding
  let expectedNode22Runtime: MultiEntityStagingEvidenceBinding
  let expectedExpandOnlyMigrationReview: MultiEntityStagingEvidenceBinding
  let expectedMigrationDryRun: MultiEntityStagingEvidenceBinding
  let expectedBackfillDryRun: MultiEntityStagingEvidenceBinding
  try {
    expectedSchemaAuthority = artifactBinding(
      specificArtifacts.schemaAuthority,
      'global',
      'schema_authority_decided',
      bundleInput.readiness.readinessReviewReference,
      bundleInput
    )
    expectedNode22Runtime = artifactBinding(
      specificArtifacts.node22Runtime,
      'global',
      'node22_runtime_verified',
      bundleInput.readiness.readinessReviewReference,
      bundleInput
    )
    expectedAccess = createAccessBaselineEvidenceBindingProposal({
      captureArtifact: specificArtifacts.accessBaselineCapture,
      unchangedArtifact: specificArtifacts.accessUnchanged,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).bindings
    expectedRestoredBackup = artifactBinding(
      specificArtifacts.restoredBackup,
      'global',
      'restored_backup_verified',
      bundleInput.readiness.readinessReviewReference,
      bundleInput
    )
    expectedExpandOnlyMigrationReview = artifactBinding(
      specificArtifacts.expandOnlyMigrationReview,
      'global',
      'expand_only_migration_reviewed',
      bundleInput.readiness.readinessReviewReference,
      bundleInput
    )
    expectedMigrationDryRun = artifactBinding(
      specificArtifacts.migrationDryRun,
      'global',
      'migration_dry_run_verified',
      bundleInput.readiness.readinessReviewReference,
      bundleInput
    )
    expectedBackfillDryRun = artifactBinding(
      specificArtifacts.backfillDryRun,
      'global',
      'backfill_dry_run_verified',
      bundleInput.readiness.readinessReviewReference,
      bundleInput
    )
    expectedRollback = createRollbackRehearsalEvidenceBindingProposal({
      artifact: specificArtifacts.rollbackRehearsal,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedEnrollmentClosure = createEnrollmentClosureEvidenceBindingProposal({
      artifact: specificArtifacts.enrollmentClosureShadow,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedUnifiedPublicWeb = createUnifiedPublicWebEvidenceBindingProposal({
      artifact: specificArtifacts.unifiedPublicWeb,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedSharedCourseCatalog = createSharedCourseCatalogEvidenceBindingProposal({
      artifact: specificArtifacts.sharedCourseCatalog,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedSharedTeacherRegistry = createSharedTeacherRegistryEvidenceBindingProposal({
      artifact: specificArtifacts.sharedTeacherRegistry,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedTeacherSchedule = createTeacherScheduleEvidenceBindingProposal({
      artifact: specificArtifacts.teacherScheduleShadow,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedObservabilityRedaction = createObservabilityRedactionBindingProposal({
      artifact: specificArtifacts.observabilityRedaction,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedSafety = createSafetyModeEvidenceBindingProposal({
      featureFlagsArtifact: specificArtifacts.featureFlagsDefaultOff,
      authorizationShadowArtifact: specificArtifacts.authorizationShadow,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).bindings
    expectedNominal = createNominalPermissionPhaseLockBindingProposal({
      artifact: specificArtifacts.nominalPermissionLock,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedAccounting = createAccountingImportEvidenceBindingProposal({
      artifact: specificArtifacts.accountingImport,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedAccountingConnection = createFinanceAccountingConnectionBindingProposal({
      manifest: specificArtifacts.accountingConnection,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: accountingConnectionBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedAccountingSecretReference = createFinanceAccountingSecretReferenceBindingProposal({
      manifest: specificArtifacts.accountingSecretReference,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: accountingSecretReferenceBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedAccountingProviderContract = createFinanceAccountingProviderContractBindingProposal({
      manifest: specificArtifacts.accountingProviderContract,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: accountingProviderContractBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedPaymentSource = createFinancePaymentSourceBindingProposal({
      manifest: specificArtifacts.paymentSource,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: paymentSourceBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedAdvertisingSource = createFinanceAdvertisingSourceBindingProposal({
      manifest: specificArtifacts.advertisingSource,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: advertisingSourceBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedPayloadRelationshipScope = createFinancePayloadRelationshipScopeBindingProposal({
      manifest: specificArtifacts.payloadRelationshipScope,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: payloadRelationshipScopeBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedEnrollmentCampaignScope = createEnrollmentCampaignScopeBindingProposal({
      manifest: specificArtifacts.enrollmentCampaignScope,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: enrollmentCampaignScopeBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedEntityRollback = createEntityRollbackBindingProposal({
      manifest: specificArtifacts.entityRollback,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: entityRollbackBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedFinancialIsolation = createFinanceIsolationEvidenceBindingProposal({
      manifest: specificArtifacts.financialIsolation,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
    }).binding
    expectedEntityIsolationNegative = createFinanceEntityIsolationNegativeBindingProposal({
      manifest: specificArtifacts.entityIsolationNegative,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: entityIsolationNegativeBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
    expectedFinance = createFinanceReconciliationEvidenceBindingProposal({
      manifest: specificArtifacts.financeReconciliation,
      campaignReviewReference: bundleInput.campaignReviewReference,
      readinessReviewReference: bundleInput.readiness.readinessReviewReference,
      entities: financeBindings.map((binding) => ({
        artifactDigest: binding.artifactDigest,
        entityReviewReference: binding.reviewReference,
      })),
    }).bindings
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_BINDING_MISMATCH')
  }

  if (
    !sameBinding(schemaAuthorityBinding, expectedSchemaAuthority) ||
    !sameBinding(node22RuntimeBinding, expectedNode22Runtime) ||
    !sameBindingSet([accessCaptureBinding, accessUnchangedBinding], expectedAccess) ||
    !sameBindingSet([featureFlagsBinding, authorizationShadowBinding], expectedSafety) ||
    !sameBinding(restoredBackupBinding, expectedRestoredBackup) ||
    !sameBinding(expandOnlyMigrationReviewBinding, expectedExpandOnlyMigrationReview) ||
    !sameBinding(migrationDryRunBinding, expectedMigrationDryRun) ||
    !sameBinding(backfillDryRunBinding, expectedBackfillDryRun) ||
    !sameBinding(rollbackBinding, expectedRollback) ||
    !sameBinding(enrollmentClosureBinding, expectedEnrollmentClosure) ||
    !sameBinding(unifiedPublicWebBinding, expectedUnifiedPublicWeb) ||
    !sameBinding(sharedCourseCatalogBinding, expectedSharedCourseCatalog) ||
    !sameBinding(sharedTeacherRegistryBinding, expectedSharedTeacherRegistry) ||
    !sameBinding(teacherScheduleBinding, expectedTeacherSchedule) ||
    !sameBinding(observabilityRedactionBinding, expectedObservabilityRedaction) ||
    !matchesEntityArtifactBindings(
      legalProfileBindings,
      'legal_profile_reviewed',
      specificArtifacts.legalProfile.entities
    ) ||
    !matchesEntityArtifactBindings(
      campusMappingBindings,
      'campus_mapping_reviewed',
      specificArtifacts.campusMapping.entities
    ) ||
    !sameBinding(nominalBinding, expectedNominal) ||
    !sameBinding(accountingBinding, expectedAccounting) ||
    !sameBindingSet(accountingConnectionBindings, expectedAccountingConnection) ||
    !sameBindingSet(accountingSecretReferenceBindings, expectedAccountingSecretReference) ||
    !sameBindingSet(accountingProviderContractBindings, expectedAccountingProviderContract) ||
    !sameBindingSet(paymentSourceBindings, expectedPaymentSource) ||
    !sameBindingSet(advertisingSourceBindings, expectedAdvertisingSource) ||
    !sameBindingSet(payloadRelationshipScopeBindings, expectedPayloadRelationshipScope) ||
    !sameBindingSet(enrollmentCampaignScopeBindings, expectedEnrollmentCampaignScope) ||
    !sameBindingSet(entityRollbackBindings, expectedEntityRollback) ||
    !sameBinding(financialIsolationBinding, expectedFinancialIsolation) ||
    !sameBindingSet(entityIsolationNegativeBindings, expectedEntityIsolationNegative) ||
    !sameBindingSet(financeBindings, expectedFinance)
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_BINDING_MISMATCH')
  }

  let coverage: ReturnType<typeof createMultiEntityStagingEvidenceContractCoverageManifest>
  try {
    coverage = createMultiEntityStagingEvidenceContractCoverageManifest()
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_COVERAGE_POLICY_INVALID')
  }
  if (
    coverage.metrics.requiredBindings !== 56 ||
    coverage.metrics.specificArtifactGateTypes !== 32 ||
    coverage.metrics.specificallyConstrainedBindings !== 56 ||
    coverage.metrics.genericOnlyBindings !== 0 ||
    coverage.metrics.sourceRegisteredStagingExecutionBindings !== 0 ||
    coverage.verdict !== 'specific_contract_coverage_complete_no_staging_execution'
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_COVERAGE_POLICY_INVALID')
  }

  const verifiedBindings = [
    schemaAuthorityBinding,
    node22RuntimeBinding,
    accessCaptureBinding,
    accessUnchangedBinding,
    featureFlagsBinding,
    restoredBackupBinding,
    expandOnlyMigrationReviewBinding,
    migrationDryRunBinding,
    backfillDryRunBinding,
    authorizationShadowBinding,
    rollbackBinding,
    enrollmentClosureBinding,
    unifiedPublicWebBinding,
    sharedCourseCatalogBinding,
    sharedTeacherRegistryBinding,
    teacherScheduleBinding,
    nominalBinding,
    accountingBinding,
    ...accountingConnectionBindings,
    ...accountingSecretReferenceBindings,
    ...accountingProviderContractBindings,
    ...paymentSourceBindings,
    ...advertisingSourceBindings,
    ...payloadRelationshipScopeBindings,
    ...enrollmentCampaignScopeBindings,
    ...entityRollbackBindings,
    financialIsolationBinding,
    ...entityIsolationNegativeBindings,
    ...financeBindings,
    ...legalProfileBindings,
    ...campusMappingBindings,
  ]
    .map(canonicalBinding)
    .sort(compareCanonical)
  if (
    !sameRedactionSurfaceSet(specificArtifacts.observabilityRedaction.surfaces, verifiedBindings)
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
  }
  const allVerifiedBindings = [
    ...verifiedBindings,
    ...legalProfileBindings.map(canonicalBinding),
    ...campusMappingBindings.map(canonicalBinding),
    canonicalBinding(observabilityRedactionBinding),
  ].sort(compareCanonical)
  const verificationDigest = digest(
    JSON.stringify({
      schemaVersion: 1,
      bundleDigest: bundle.bundleDigest,
      artifactDigests: [
        specificArtifacts.schemaAuthority.artifactDigest,
        specificArtifacts.schemaAuthority.schemaExpansionPlanDigest,
        specificArtifacts.node22Runtime.artifactDigest,
        specificArtifacts.accessBaselineCapture.artifactDigest,
        specificArtifacts.accessUnchanged.artifactDigest,
        input.accessSurfaceBaseline.captureArtifact.artifactDigest,
        input.accessSurfaceBaseline.unchangedArtifact.artifactDigest,
        input.accessSurfaceBaseline.capturedAccess.digest,
        input.accessSurfaceBaseline.currentAccess.digest,
        specificArtifacts.featureFlagsDefaultOff.artifactDigest,
        specificArtifacts.restoredBackup.artifactDigest,
        specificArtifacts.expandOnlyMigrationReview.artifactDigest,
        specificArtifacts.migrationDryRun.artifactDigest,
        specificArtifacts.backfillDryRun.artifactDigest,
        specificArtifacts.authorizationShadow.artifactDigest,
        specificArtifacts.rollbackRehearsal.artifactDigest,
        specificArtifacts.enrollmentClosureShadow.artifactDigest,
        specificArtifacts.unifiedPublicWeb.artifactDigest,
        specificArtifacts.sharedCourseCatalog.artifactDigest,
        specificArtifacts.sharedTeacherRegistry.artifactDigest,
        specificArtifacts.teacherScheduleShadow.artifactDigest,
        specificArtifacts.legalProfile.artifactDigest,
        specificArtifacts.campusMapping.artifactDigest,
        specificArtifacts.nominalPermissionLock.artifactDigest,
        specificArtifacts.accountingImport.artifactDigest,
        specificArtifacts.accountingConnection.artifactDigest,
        ...specificArtifacts.accountingConnection.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.accountingSecretReference.artifactDigest,
        ...specificArtifacts.accountingSecretReference.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.accountingProviderContract.artifactDigest,
        ...specificArtifacts.accountingProviderContract.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.paymentSource.artifactDigest,
        ...specificArtifacts.paymentSource.entities.map(({ artifactDigest }) => artifactDigest),
        specificArtifacts.advertisingSource.artifactDigest,
        ...specificArtifacts.advertisingSource.entities.map(({ artifactDigest }) => artifactDigest),
        specificArtifacts.payloadRelationshipScope.artifactDigest,
        ...specificArtifacts.payloadRelationshipScope.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.enrollmentCampaignScope.artifactDigest,
        ...specificArtifacts.enrollmentCampaignScope.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.entityRollback.artifactDigest,
        ...specificArtifacts.entityRollback.entities.map(({ artifactDigest }) => artifactDigest),
        specificArtifacts.financialIsolation.artifactDigest,
        ...specificArtifacts.financialIsolation.cases.map(({ artifactDigest }) => artifactDigest),
        specificArtifacts.entityIsolationNegative.artifactDigest,
        ...specificArtifacts.entityIsolationNegative.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.financeReconciliation.artifactDigest,
        ...specificArtifacts.financeReconciliation.entities.map(
          ({ artifactDigest }) => artifactDigest
        ),
        specificArtifacts.observabilityRedaction.artifactDigest,
      ].sort(),
      verifiedBindings: allVerifiedBindings,
    })
  )

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_strict_staging_evidence_bundle',
    mode: 'direct_specific_artifact_verification_review_only',
    verdict: 'blocked_no_staging_execution_evidence',
    canDeclareStagingReady: false,
    canDeploy: false,
    canMigrate: false,
    canActivate: false,
    canChangePermissions: false,
    sourceDigest: bundle.sourceDigest,
    targetTenantDigest: bundle.targetTenantDigest,
    bundleDigest: bundle.bundleDigest,
    verificationDigest,
    verificationReference: `evidence://sha256/${verificationDigest.slice('sha256:'.length)}`,
    metrics: Object.freeze({
      bundleVerdict: bundle.verdict,
      requiredBindings: 56,
      directlyVerifiedArtifactKinds: 32,
      directlyVerifiedBindings: 56,
      genericOnlyBindings: 0,
      sourceRegisteredStagingExecutionBindings: 0,
    }),
  })
}

function validateEnvelope(input: StrictStagingEvidenceBundleInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !input.bundleInput ||
    typeof input.bundleInput !== 'object' ||
    !input.specificArtifacts ||
    typeof input.specificArtifacts !== 'object' ||
    !exactKeys(input.specificArtifacts, ARTIFACT_KEYS)
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_INPUT_INVALID')
  }
}

function assertAccessSurfaceBaseline(
  value: unknown
): asserts value is StrictStagingAccessSurfaceBaseline {
  if (!value || typeof value !== 'object' || !exactKeys(value, ACCESS_SURFACE_BASELINE_KEYS)) {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCESS_SURFACE_BASELINE_INVALID')
  }
  const baseline = value as StrictStagingAccessSurfaceBaseline
  try {
    const captureInput = {
      campaignReviewReference: baseline.context.campaignReviewReference,
      readinessReviewReference: baseline.context.readinessReviewReference,
      sourceDigest: baseline.context.sourceDigest,
      targetTenantDigest: baseline.context.targetTenantDigest,
      capturedAccess: baseline.capturedAccess,
    }
    assertMultiEntityAccessSurfaceBaselineCaptureEvidenceBoundToInput(
      baseline.captureArtifact,
      captureInput,
      baseline.context
    )
    assertMultiEntityAccessSurfaceBaselineUnchangedEvidenceBoundToInput(
      baseline.unchangedArtifact,
      {
        ...captureInput,
        captureArtifact: baseline.captureArtifact,
        currentAccess: baseline.currentAccess,
      },
      baseline.context
    )
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCESS_SURFACE_BASELINE_INVALID')
  }
}

function assertSpecificArtifacts(artifacts: StrictStagingSpecificArtifacts): void {
  try {
    assertMultiEntitySchemaAuthorityReviewEvidenceArtifact(artifacts.schemaAuthority)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_SCHEMA_AUTHORITY_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntitySchemaExpansionPlan(artifacts.schemaExpansionPlan)
    if (
      artifacts.schemaExpansionPlan.items.length !== 0 ||
      Object.values(artifacts.schemaExpansionPlan.summary).some((count) => count !== 0) ||
      artifacts.schemaExpansionPlan.operationalAuthority !== 'payload' ||
      artifacts.schemaExpansionPlan.canReadData !== false ||
      artifacts.schemaExpansionPlan.canWrite !== false ||
      artifacts.schemaExpansionPlan.canApplyMigration !== false ||
      artifacts.schemaExpansionPlan.canChangePermissions !== false
    ) {
      throw new Error('record-bearing or executable plan')
    }
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_SCHEMA_EXPANSION_PLAN_INVALID')
  }
  try {
    assertMultiEntityNode22RuntimeEvidenceArtifact(artifacts.node22Runtime)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_NODE22_RUNTIME_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityAccessBaselineCaptureEvidenceArtifact(artifacts.accessBaselineCapture)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCESS_CAPTURE_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityAccessUnchangedEvidenceArtifact(artifacts.accessUnchanged)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCESS_UNCHANGED_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityFeatureFlagsDefaultOffEvidenceArtifact(artifacts.featureFlagsDefaultOff)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_FEATURE_FLAGS_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityRestoredBackupEvidenceArtifact(artifacts.restoredBackup)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_RESTORED_BACKUP_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityExpandOnlyMigrationReviewEvidenceArtifact(artifacts.expandOnlyMigrationReview)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_EXPAND_ONLY_MIGRATION_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityMigrationDryRunEvidenceArtifact(artifacts.migrationDryRun)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_MIGRATION_DRY_RUN_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityBackfillDryRunEvidenceArtifact(artifacts.backfillDryRun)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_BACKFILL_DRY_RUN_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityAuthorizationShadowEvidenceArtifact(artifacts.authorizationShadow)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_AUTHORIZATION_SHADOW_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityRollbackRehearsalEvidenceArtifact(artifacts.rollbackRehearsal)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ROLLBACK_REHEARSAL_ARTIFACT_INVALID')
  }
  try {
    assertCourseRunEnrollmentClosureEvidenceArtifact(artifacts.enrollmentClosureShadow)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ENROLLMENT_CLOSURE_ARTIFACT_INVALID')
  }
  try {
    assertUnifiedPublicWebEvidenceArtifact(artifacts.unifiedPublicWeb)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_UNIFIED_PUBLIC_WEB_ARTIFACT_INVALID')
  }
  try {
    assertSharedCourseCatalogEvidenceArtifact(artifacts.sharedCourseCatalog)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_SHARED_COURSE_CATALOG_ARTIFACT_INVALID')
  }
  try {
    assertSharedTeacherRegistryEvidenceArtifact(artifacts.sharedTeacherRegistry)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_SHARED_TEACHER_REGISTRY_ARTIFACT_INVALID')
  }
  try {
    assertTeacherScheduleShadowEvidenceArtifact(artifacts.teacherScheduleShadow)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_TEACHER_SCHEDULE_ARTIFACT_INVALID')
  }
  try {
    assertMultiEntityLegalProfileReviewEvidenceArtifact(artifacts.legalProfile)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_LEGAL_PROFILE_ARTIFACT_INVALID')
  }
  try {
    assertCampusMappingEvidenceArtifact(artifacts.campusMapping)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_CAMPUS_MAPPING_ARTIFACT_INVALID')
  }
  try {
    assertNominalPermissionPhaseLockEvidenceArtifact(artifacts.nominalPermissionLock)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_NOMINAL_ARTIFACT_INVALID')
  }
  try {
    assertAccountingImportStagingEvidenceArtifact(artifacts.accountingImport)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCOUNTING_ARTIFACT_INVALID')
  }
  try {
    assertFinanceAccountingConnectionStagingEvidenceManifest(artifacts.accountingConnection)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCOUNTING_CONNECTION_ARTIFACT_INVALID')
  }
  try {
    assertFinanceAccountingSecretReferenceStagingEvidenceManifest(
      artifacts.accountingSecretReference
    )
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCOUNTING_SECRET_REFERENCE_ARTIFACT_INVALID')
  }
  try {
    assertFinanceAccountingProviderContractStagingEvidenceManifest(
      artifacts.accountingProviderContract
    )
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ACCOUNTING_PROVIDER_CONTRACT_ARTIFACT_INVALID')
  }
  try {
    assertFinancePaymentSourceStagingEvidenceManifest(artifacts.paymentSource)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_PAYMENT_SOURCE_ARTIFACT_INVALID')
  }
  try {
    assertFinanceAdvertisingSourceStagingEvidenceManifest(artifacts.advertisingSource)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ADVERTISING_SOURCE_ARTIFACT_INVALID')
  }
  try {
    assertFinancePayloadRelationshipScopeStagingEvidenceManifest(artifacts.payloadRelationshipScope)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_PAYLOAD_RELATIONSHIP_SCOPE_ARTIFACT_INVALID')
  }
  try {
    assertEnrollmentCampaignScopeStagingEvidenceManifest(artifacts.enrollmentCampaignScope)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ENROLLMENT_CAMPAIGN_SCOPE_ARTIFACT_INVALID')
  }
  try {
    assertEntityRollbackStagingEvidenceManifest(artifacts.entityRollback)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ENTITY_ROLLBACK_ARTIFACT_INVALID')
  }
  try {
    assertFinanceIsolationStagingEvidenceManifest(artifacts.financialIsolation)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_FINANCE_ISOLATION_ARTIFACT_INVALID')
  }
  try {
    assertFinanceEntityIsolationNegativeStagingEvidenceManifest(artifacts.entityIsolationNegative)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_ENTITY_ISOLATION_NEGATIVE_ARTIFACT_INVALID')
  }
  try {
    assertFinanceReconciliationStagingEvidenceManifest(artifacts.financeReconciliation)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_FINANCE_ARTIFACT_INVALID')
  }
  try {
    assertObservabilityRedactionStagingEvidenceArtifact(artifacts.observabilityRedaction)
  } catch {
    throw strictError('STRICT_STAGING_EVIDENCE_OBSERVABILITY_REDACTION_ARTIFACT_INVALID')
  }
  if (
    artifacts.financeReconciliation.verdict !== 'eligible_for_manual_staging_binding' ||
    artifacts.financeReconciliation.entities.some(
      ({ verdict }) => verdict !== 'eligible_for_manual_binding'
    )
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_FINANCE_ARTIFACT_INVALID')
  }
}

function validateSharedContext(
  bundleInput: MultiEntityStagingEvidenceBundleInput,
  artifacts: StrictStagingSpecificArtifacts,
  accessSurfaceBaseline: StrictStagingAccessSurfaceBaseline
): void {
  if (
    artifacts.schemaAuthority.authority !== artifacts.schemaExpansionPlan.operationalAuthority ||
    artifacts.schemaAuthority.schemaExpansionPlanDigest !==
      digestMultiEntitySchemaExpansionPlan(artifacts.schemaExpansionPlan) ||
    new Set([
      artifacts.node22Runtime.sourceSha,
      artifacts.expandOnlyMigrationReview.sourceSha,
      artifacts.migrationDryRun.sourceSha,
      artifacts.backfillDryRun.sourceSha,
    ]).size !== 1 ||
    artifacts.expandOnlyMigrationReview.migrationPlanDigest !==
      artifacts.migrationDryRun.migrationPlanDigest ||
    artifacts.expandOnlyMigrationReview.schemaBeforeDigest !==
      artifacts.migrationDryRun.schemaBeforeDigest ||
    artifacts.expandOnlyMigrationReview.schemaAfterDigest !==
      artifacts.migrationDryRun.schemaAfterDigest ||
    artifacts.migrationDryRun.backupManifestDigest !==
      artifacts.restoredBackup.backupManifestDigest ||
    artifacts.backfillDryRun.backupManifestDigest !== artifacts.restoredBackup.backupManifestDigest
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
  }
  const context = [
    artifacts.schemaAuthority,
    artifacts.node22Runtime,
    artifacts.accessBaselineCapture,
    artifacts.accessUnchanged,
    artifacts.featureFlagsDefaultOff,
    artifacts.restoredBackup,
    artifacts.expandOnlyMigrationReview,
    artifacts.migrationDryRun,
    artifacts.backfillDryRun,
    artifacts.authorizationShadow,
    artifacts.rollbackRehearsal,
    artifacts.enrollmentClosureShadow,
    artifacts.unifiedPublicWeb,
    artifacts.sharedCourseCatalog,
    artifacts.sharedTeacherRegistry,
    artifacts.teacherScheduleShadow,
    artifacts.legalProfile,
    artifacts.campusMapping,
    artifacts.nominalPermissionLock,
    artifacts.accountingImport,
    artifacts.accountingConnection,
    artifacts.accountingSecretReference,
    artifacts.accountingProviderContract,
    artifacts.paymentSource,
    artifacts.advertisingSource,
    artifacts.payloadRelationshipScope,
    artifacts.enrollmentCampaignScope,
    artifacts.entityRollback,
    artifacts.financialIsolation,
    artifacts.entityIsolationNegative,
    artifacts.financeReconciliation,
    artifacts.observabilityRedaction,
  ]
  const campaignDigest = digest(bundleInput.campaignReviewReference)
  const readinessDigest = digest(bundleInput.readiness.readinessReviewReference)
  if (
    context.some(
      (artifact) =>
        artifact.sourceDigest !== bundleInput.sourceDigest ||
        artifact.targetTenantDigest !== bundleInput.targetTenantDigest ||
        artifact.campaignReviewReferenceDigest !== campaignDigest ||
        artifact.readinessReviewReferenceDigest !== readinessDigest
    )
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
  }
  const accountingScopeByReview = new Map(
    artifacts.accountingConnection.entities.map((entity) => [
      entity.entityReviewReferenceDigest,
      entity.scopeDigest,
    ])
  )
  for (const entity of [
    ...artifacts.accountingSecretReference.entities,
    ...artifacts.accountingProviderContract.entities,
    ...artifacts.entityIsolationNegative.entities,
    ...artifacts.financeReconciliation.entities,
  ]) {
    if (accountingScopeByReview.get(entity.entityReviewReferenceDigest) !== entity.scopeDigest) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  const externalCompanyByReview = new Map(
    artifacts.accountingConnection.entities.map((entity) => [
      entity.entityReviewReferenceDigest,
      entity.externalCompanyBindingDigest,
    ])
  )
  for (const entity of artifacts.accountingProviderContract.entities) {
    if (
      externalCompanyByReview.get(entity.entityReviewReferenceDigest) !==
      entity.providerCompanyBindingDigest
    ) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  for (const entity of artifacts.paymentSource.entities) {
    if (
      accountingScopeByReview.get(entity.entityReviewReferenceDigest) !==
      entity.accountingScopeDigest
    ) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  for (const entity of artifacts.advertisingSource.entities) {
    if (
      accountingScopeByReview.get(entity.entityReviewReferenceDigest) !==
      entity.accountingScopeDigest
    ) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  const paymentSourceByReview = new Map(
    artifacts.paymentSource.entities.map((entity) => [entity.entityReviewReferenceDigest, entity])
  )
  const advertisingSourceByReview = new Map(
    artifacts.advertisingSource.entities.map((entity) => [
      entity.entityReviewReferenceDigest,
      entity,
    ])
  )
  for (const entity of artifacts.payloadRelationshipScope.entities) {
    const payment = paymentSourceByReview.get(entity.entityReviewReferenceDigest)
    const advertising = advertisingSourceByReview.get(entity.entityReviewReferenceDigest)
    if (
      accountingScopeByReview.get(entity.entityReviewReferenceDigest) !==
        entity.accountingScopeDigest ||
      payment?.paymentSourceScopeDigest !== entity.paymentSourceScopeDigest ||
      payment.relationshipMappingDigest !== entity.paymentRelationshipMappingDigest ||
      advertising?.advertisingSourceScopeDigest !== entity.advertisingSourceScopeDigest ||
      advertising.relationshipMappingDigest !== entity.advertisingRelationshipMappingDigest
    ) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  if (
    artifacts.enrollmentCampaignScope.payloadRelationshipScopeArtifactDigest !==
    artifacts.payloadRelationshipScope.artifactDigest
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
  }
  const payloadRelationshipByReview = new Map(
    artifacts.payloadRelationshipScope.entities.map((entity) => [
      entity.entityReviewReferenceDigest,
      entity,
    ])
  )
  for (const entity of artifacts.enrollmentCampaignScope.entities) {
    const payloadRelationship = payloadRelationshipByReview.get(entity.entityReviewReferenceDigest)
    if (
      !payloadRelationship ||
      entity.payloadRelationshipArtifactDigest !== payloadRelationship.artifactDigest ||
      entity.accountingScopeDigest !== payloadRelationship.accountingScopeDigest ||
      entity.payloadScopeDigest !== payloadRelationship.payloadScopeDigest ||
      entity.payloadPlanDigest !== payloadRelationship.payloadPlanDigest ||
      entity.enrollmentCoverageDigest !== payloadRelationship.enrollmentCoverageDigest ||
      entity.campaignCoverageDigest !== payloadRelationship.campaignCoverageDigest ||
      entity.paymentRelationshipMappingDigest !==
        payloadRelationship.paymentRelationshipMappingDigest ||
      entity.advertisingRelationshipMappingDigest !==
        payloadRelationship.advertisingRelationshipMappingDigest
    ) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  for (const entity of artifacts.entityRollback.entities) {
    if (
      accountingScopeByReview.get(entity.entityReviewReferenceDigest) !==
        entity.accountingScopeDigest ||
      entity.globalRollbackArtifactDigest !== artifacts.rollbackRehearsal.artifactDigest ||
      entity.accessBaselineDigest !== artifacts.rollbackRehearsal.accessBaselineDigest
    ) {
      throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
    }
  }
  if (
    artifacts.accessBaselineCapture.baselineDigest !== bundleInput.capturedAccess.digest ||
    artifacts.accessBaselineCapture.policyDigest !== bundleInput.rbacPolicy.policyDigest ||
    artifacts.accessUnchanged.captureArtifactDigest !==
      artifacts.accessBaselineCapture.artifactDigest ||
    artifacts.accessUnchanged.capturedBaselineDigest !== bundleInput.capturedAccess.digest ||
    artifacts.accessUnchanged.currentBaselineDigest !== bundleInput.currentAccess.digest ||
    artifacts.accessUnchanged.policyDigest !== bundleInput.rbacPolicy.policyDigest ||
    artifacts.rollbackRehearsal.accessBaselineDigest !== bundleInput.capturedAccess.digest
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
  }
  if (
    accessSurfaceBaseline.context.campaignReviewReference !== bundleInput.campaignReviewReference ||
    accessSurfaceBaseline.context.readinessReviewReference !==
      bundleInput.readiness.readinessReviewReference ||
    accessSurfaceBaseline.context.sourceDigest !== bundleInput.sourceDigest ||
    accessSurfaceBaseline.context.targetTenantDigest !== bundleInput.targetTenantDigest
  ) {
    throw strictError('STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH')
  }
}

function findSingleBinding(
  bindings: readonly MultiEntityStagingEvidenceBinding[],
  scope: 'global' | 'entity',
  gate: MultiEntityStagingEvidenceBinding['gate']
): MultiEntityStagingEvidenceBinding {
  return findBindings(bindings, scope, gate, 1)[0]!
}

function artifactBinding(
  artifact: {
    readonly kind: string
    readonly artifactDigest: string
    readonly evidenceReference: string
  },
  scope: 'global' | 'entity',
  gate: MultiEntityStagingEvidenceBinding['gate'],
  reviewReference: string,
  bundleInput: MultiEntityStagingEvidenceBundleInput
): MultiEntityStagingEvidenceBinding {
  return {
    scope,
    gate,
    reviewReference,
    evidenceReference: artifact.evidenceReference,
    campaignReviewReference: bundleInput.campaignReviewReference,
    sourceDigest: bundleInput.sourceDigest,
    targetTenantDigest: bundleInput.targetTenantDigest,
    artifactKind: artifact.kind,
    artifactDigest: artifact.artifactDigest,
  }
}

function matchesEntityArtifactBindings(
  bindings: readonly MultiEntityStagingEvidenceBinding[],
  gate: 'legal_profile_reviewed' | 'campus_mapping_reviewed',
  artifacts: readonly {
    readonly kind: string
    readonly artifactDigest: string
    readonly evidenceReference: string
    readonly reviewReferenceDigest?: string
    readonly entityReviewReferenceDigest?: string
  }[]
): boolean {
  if (bindings.length !== artifacts.length || bindings.length !== 3) return false
  const expectedByReview = new Map(
    artifacts.map((artifact) => [
      artifact.reviewReferenceDigest ?? artifact.entityReviewReferenceDigest,
      artifact,
    ])
  )
  return bindings.every((binding) => {
    const artifact = expectedByReview.get(digest(binding.reviewReference))
    return (
      artifact !== undefined &&
      binding.scope === 'entity' &&
      binding.gate === gate &&
      binding.artifactKind === artifact.kind &&
      binding.artifactDigest === artifact.artifactDigest &&
      binding.evidenceReference === artifact.evidenceReference
    )
  })
}

function findBindings(
  bindings: readonly MultiEntityStagingEvidenceBinding[],
  scope: 'global' | 'entity',
  gate: MultiEntityStagingEvidenceBinding['gate'],
  expected: number
): readonly MultiEntityStagingEvidenceBinding[] {
  const matches = bindings.filter((binding) => binding?.scope === scope && binding.gate === gate)
  if (matches.length !== expected) {
    throw strictError('STRICT_STAGING_EVIDENCE_BINDING_MISMATCH')
  }
  return matches
}

function sameBinding(
  left: MultiEntityStagingEvidenceBinding,
  right: MultiEntityStagingEvidenceBinding
): boolean {
  return JSON.stringify(canonicalBinding(left)) === JSON.stringify(canonicalBinding(right))
}

function sameBindingSet(
  left: readonly MultiEntityStagingEvidenceBinding[],
  right: readonly MultiEntityStagingEvidenceBinding[]
): boolean {
  return (
    JSON.stringify(left.map(canonicalBinding).sort(compareCanonical)) ===
    JSON.stringify(right.map(canonicalBinding).sort(compareCanonical))
  )
}

function sameRedactionSurfaceSet(
  surfaces: ObservabilityRedactionStagingEvidenceArtifact['surfaces'],
  bindings: readonly ReturnType<typeof canonicalBinding>[]
): boolean {
  const surfaceKeys = surfaces
    .map(({ scope, gate, artifactKind, artifactDigest }) =>
      JSON.stringify({ scope, gate, artifactKind, artifactDigest })
    )
    .sort()
  const bindingKeys = bindings
    .map(({ scope, gate, artifactKind, artifactDigest }) =>
      JSON.stringify({ scope, gate, artifactKind, artifactDigest })
    )
    .sort()
  return JSON.stringify(surfaceKeys) === JSON.stringify(bindingKeys)
}

function canonicalBinding(binding: MultiEntityStagingEvidenceBinding) {
  return {
    scope: binding.scope,
    gate: binding.gate,
    reviewReference: binding.reviewReference,
    evidenceReference: binding.evidenceReference,
    campaignReviewReference: binding.campaignReviewReference,
    sourceDigest: binding.sourceDigest,
    targetTenantDigest: binding.targetTenantDigest,
    artifactKind: binding.artifactKind,
    artifactDigest: binding.artifactDigest,
  }
}

function compareCanonical(left: object, right: object): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right))
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function strictError(code: StrictStagingEvidenceBundleErrorCode) {
  return new StrictStagingEvidenceBundleError(code)
}
