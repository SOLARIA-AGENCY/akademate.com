import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
  FINANCE_ISOLATION_AUDIT_FLAG,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  createAccountingImportStagingEvidenceArtifact,
  createFinanceAdvertisingSourceStagingEvidenceManifest,
  createFinanceAccountingConnectionStagingEvidenceManifest,
  createFinanceAccountingProviderContractStagingEvidenceManifest,
  createFinanceAccountingSecretReferenceStagingEvidenceManifest,
  createFinanceEntityIsolationNegativeStagingEvidenceManifest,
  createFinanceIsolationScopeDigest,
  createFinanceIsolationStagingEvidenceManifest,
  createFinancePaymentSourceStagingEvidenceManifest,
  createFinanceReconciliationStagingEvidenceManifest,
  inspectFinancePaymentSourceContract,
  inspectFinanceAdvertisingSourceContract,
  type FinanceEntityIsolationNegativeAuditObservation,
  type FinanceIsolationAuditObservation,
  type FinanceIsolationEvidenceCaseRole,
  type FinanceReconciliationStagingEvidenceSample,
} from '../../../../../packages/finance/src'
import { createMultiEntityAccessBaseline } from '../../../../../packages/tenant/src/multi-entity-access-baseline'
import {
  createMultiEntityAccessSurfaceBaseline,
  type AccessSurfaceReference,
} from '../../../../../packages/tenant/src/multi-entity-access-surface-baseline'
import {
  createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact,
  createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact,
} from '../../../../../packages/tenant/src/multi-entity-access-surface-baseline-evidence'
import type {
  CourseRunEnrollmentClosureCourseRun,
  CourseRunEnrollmentClosureInput,
  CourseRunEnrollmentClosureScope,
  CourseRunEnrollmentClosureSession,
} from '../../../../../packages/tenant/src/course-run-enrollment-closure'
import {
  createCourseRunEnrollmentClosureEvidenceArtifact,
  type CourseRunEnrollmentClosureEvidenceRole,
} from '../../../../../packages/tenant/src/course-run-enrollment-closure-evidence'
import { createCampusMappingEvidenceArtifact } from '../../../../../packages/tenant/src/multi-entity-campus-mapping-evidence'
import { createMultiEntityLegalProfileReviewEvidenceArtifact } from '../../../../../packages/tenant/src/multi-entity-legal-profile-evidence'
import { createMultiEntitySchemaAuthorityReviewEvidenceArtifact } from '../../../../../packages/tenant/src/multi-entity-schema-authority-evidence'
import {
  digestMultiEntitySchemaExpansionPlan,
  planMultiEntitySchemaExpansion,
} from '../../../../../packages/tenant/src/multi-entity-schema-expansion-plan'
import {
  createSharedCourseCatalogEvidenceArtifact,
  type SharedCourseCatalogEvidenceRole,
  type SharedCourseCatalogReviewGraph,
} from '../../../../../packages/tenant/src/multi-entity-course-catalog-evidence'
import {
  createMultiEntityAccessBaselineCaptureEvidenceArtifact,
  createMultiEntityAccessUnchangedEvidenceArtifact,
} from '../../../../../packages/tenant/src/multi-entity-access-baseline-evidence'
import {
  createNominalPermissionPhaseLockEvidenceArtifact,
  type NominalPermissionPhaseLockEvidenceSample,
} from '../../../../../packages/tenant/src/multi-entity-nominal-permission-phase-lock-evidence'
import {
  createNominalPermissionPhaseLock,
  type NominalPermissionLockedPhase,
  type NominalPermissionRequestedAction,
} from '../../../../../packages/tenant/src/multi-entity-nominal-permission-phase-lock'
import {
  MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES,
  createMultiEntityRbacPolicyArtifact,
} from '../../../../../packages/tenant/src/multi-entity-rbac-policy-artifact'
import {
  createMultiEntityAuthorizationShadowEvidenceArtifact,
  createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact,
  type MultiEntityAuthorizationShadowEvidenceSample,
} from '../../../../../packages/tenant/src/multi-entity-safety-mode-evidence'
import { evaluateMultiEntityAuthorizationShadow } from '../../../../../packages/tenant/src/multi-entity-shadow'
import type { EntityScopedRecordType } from '../../../../../packages/tenant/src/multi-entity-backfill'
import {
  createMultiEntityRollbackRehearsalEvidenceArtifact,
  type MultiEntityRollbackRehearsalEvidenceSample,
  type MultiEntityRollbackRehearsalRole,
} from '../../../../../packages/tenant/src/multi-entity-rollback-rehearsal-evidence'
import { createMultiEntityRestoredBackupEvidenceArtifact } from '../../../../../packages/tenant/src/multi-entity-restored-backup-evidence'
import {
  createMultiEntityBackfillDryRunEvidenceArtifact,
  createMultiEntityExpandOnlyMigrationReviewEvidenceArtifact,
  createMultiEntityMigrationDryRunEvidenceArtifact,
  createMultiEntityNode22RuntimeEvidenceArtifact,
} from '../../../../../packages/tenant/src/multi-entity-runtime-migration-evidence'
import type {
  PayloadTeacherScheduleCourseRunRecord,
  PayloadTeacherScheduleSnapshot,
} from '../../../../../packages/tenant/src/multi-entity-teacher-schedule-projection'
import { createUnifiedPublicWebEvidenceArtifact } from '../../../../../packages/tenant/src/multi-entity-unified-public-web-evidence'
import {
  compareMultiEntityPublicProjection,
  type CurrentPublicProjectionBaseline,
} from '../../../../../packages/tenant/src/multi-entity-public-projection-runner'
import {
  planMultiEntityPublicProjection,
  type MultiEntityPublicProjectionInput,
} from '../../../../../packages/tenant/src/multi-entity-public-projection'
import {
  createSharedTeacherRegistryEvidenceArtifact,
  type SharedTeacherRegistryEvidenceRole,
} from '../../../../../packages/tenant/src/multi-entity-teacher-registry-evidence'
import {
  createTeacherScheduleShadowEvidenceArtifact,
  type TeacherScheduleShadowEvidenceRole,
} from '../../../../../packages/tenant/src/multi-entity-teacher-schedule-evidence'
import type { MultiEntityTopology } from '../../../../../packages/tenant/src/multi-entity-topology'
import {
  createMultiEntityContentAddressedEvidenceReference,
  getMultiEntitySpecificEvidenceArtifactKind,
  type MultiEntityStagingEvidenceBinding,
  type MultiEntityStagingEvidenceBundleInput,
} from '../../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
  type MultiEntityStagingReadinessInput,
} from '../../../../../packages/tenant/src/multi-entity-staging-readiness'
import {
  ACCESS_BASELINE_CAPTURED_READINESS_GATE,
  ACCESS_UNCHANGED_VERIFIED_READINESS_GATE,
  createAccessBaselineEvidenceBindingProposal,
} from '../access-baseline-evidence-binding'
import {
  SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE,
  createSharedCourseCatalogEvidenceBindingProposal,
} from '../course-catalog-evidence-binding'
import {
  ENTITY_ROLLBACK_REVIEWED_READINESS_GATE,
  createEntityRollbackBindingProposal,
} from '../entity-rollback-evidence-binding'
import { createEntityRollbackStagingEvidenceManifest } from '../entity-rollback-staging-evidence'
import {
  ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE,
  createEnrollmentCampaignScopeBindingProposal,
} from '../enrollment-campaign-scope-evidence-binding'
import { createEnrollmentCampaignScopeStagingEvidenceManifest } from '../enrollment-campaign-scope-staging-evidence'
import {
  ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE,
  EnrollmentClosureEvidenceBindingError,
  createEnrollmentClosureEvidenceBindingProposal,
} from '../enrollment-closure-evidence-binding'
import {
  ACCOUNTING_IMPORT_STAGING_READINESS_GATE,
  createAccountingImportEvidenceBindingProposal,
} from '../finance-accounting-import-evidence-binding'
import {
  FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE,
  createFinanceAdvertisingSourceBindingProposal,
} from '../finance-advertising-source-evidence-binding'
import {
  FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE,
  createFinanceAccountingConnectionBindingProposal,
} from '../finance-accounting-connection-evidence-binding'
import {
  FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE,
  createFinanceAccountingProviderContractBindingProposal,
} from '../finance-accounting-provider-contract-evidence-binding'
import {
  FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE,
  createFinanceAccountingSecretReferenceBindingProposal,
} from '../finance-accounting-secret-reference-evidence-binding'
import {
  FINANCE_RECONCILIATION_ENTITY_READINESS_GATE,
  createFinanceReconciliationEvidenceBindingProposal,
} from '../finance-reconciliation-evidence-binding'
import {
  FINANCE_ISOLATION_STAGING_READINESS_GATE,
  createFinanceIsolationEvidenceBindingProposal,
} from '../finance-isolation-evidence-binding'
import {
  FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE,
  createFinanceEntityIsolationNegativeBindingProposal,
} from '../finance-entity-isolation-negative-evidence-binding'
import {
  FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE,
  createFinancePaymentSourceBindingProposal,
} from '../finance-payment-source-evidence-binding'
import {
  FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE,
  createFinancePayloadRelationshipScopeBindingProposal,
} from '../finance-payload-relationship-scope-evidence-binding'
import { createFinancePayloadRelationshipScopeStagingEvidenceManifest } from '../finance-payload-relationship-scope-staging-evidence'
import {
  NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE,
  createNominalPermissionPhaseLockBindingProposal,
} from '../nominal-permission-phase-lock-evidence-binding'
import {
  OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE,
  ObservabilityRedactionBindingError,
  createObservabilityRedactionBindingProposal,
} from '../observability-redaction-evidence-binding'
import {
  assertObservabilityRedactionStagingEvidenceArtifact,
  createObservabilityRedactionStagingEvidenceArtifact,
  type ObservabilityRedactionSurfaceInput,
} from '../observability-redaction-staging-evidence'
import {
  AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE,
  FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE,
  createSafetyModeEvidenceBindingProposal,
} from '../safety-mode-evidence-binding'
import {
  ROLLBACK_REHEARSED_READINESS_GATE,
  createRollbackRehearsalEvidenceBindingProposal,
} from '../rollback-rehearsal-evidence-binding'
import {
  StrictStagingEvidenceBundleError,
  createStrictStagingEvidenceBundle,
  type StrictStagingEvidenceBundleInput,
  type StrictStagingSpecificArtifacts,
} from '../strict-staging-evidence-bundle'
import {
  SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE,
  createSharedTeacherRegistryEvidenceBindingProposal,
} from '../teacher-registry-evidence-binding'
import {
  UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE,
  createUnifiedPublicWebEvidenceBindingProposal,
} from '../unified-public-web-evidence-binding'
import {
  TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE,
  TeacherScheduleEvidenceBindingError,
  createTeacherScheduleEvidenceBindingProposal,
} from '../teacher-schedule-evidence-binding'

const campaignReviewReference = 'review://campaign/cep-multi-entity/staging-v1'
const readinessReviewReference = 'review://staging/readiness/v1'
const sourceDigest = `sha256:${'a'.repeat(64)}`
const targetTenantDigest = `sha256:${'b'.repeat(64)}`
const sourceSha = '89de407a610834b0c52af1976138e69723ba0239'
const labels = ['norte', 'santa-cruz', 'sur'] as const

function nominalSample(
  phase: NominalPermissionLockedPhase,
  requestedAction: NominalPermissionRequestedAction
): NominalPermissionPhaseLockEvidenceSample {
  const reviewReference = `review://permissions/${phase}/${requestedAction}/v1`
  return {
    phase,
    requestedAction,
    reviewReference,
    observation: createNominalPermissionPhaseLock({
      phase,
      requestedAction,
      authorizationMode: 'disabled',
      accessBaselineVerdict: 'unchanged',
      stagingBundleVerdict: 'ready_for_manual_staging_review',
      requestReviewReference: reviewReference,
    }),
  }
}

function financeSample(label: (typeof labels)[number]): FinanceReconciliationStagingEvidenceSample {
  const pilot = label === 'sur'
  return {
    tenantId: 'tenant-private',
    legalEntityId: `entity-${label}-private`,
    accountingConnectionId: `connection-${label}-private`,
    role: pilot ? 'cep_sur_pilot' : 'existing_entity',
    entityReviewReference: `review://finance/${label}/entity/v1`,
    runReviewReference: `review://finance/${label}/run/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/sur/pilot/v1' } : {}),
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
  }
}

const isolationRoles = [
  'three_entity_isolated',
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const

function isolationObservation(
  role: FinanceIsolationEvidenceCaseRole
): FinanceIsolationAuditObservation {
  const isolated = role === 'three_entity_isolated'
  const negativeIndex = isolationRoles.indexOf(role)
  return {
    schemaVersion: 1,
    mode: 'three_entity_finance_isolation_audit',
    verdict: isolated ? 'isolated' : 'breach_detected',
    canWrite: false,
    canApply: false,
    metrics: {
      expectedEntities: 3,
      evaluatedEntities: isolated ? 3 : negativeIndex,
      evaluatedSurfaces: isolated ? 15 : negativeIndex * 5,
      isolationBreaches: isolated ? 0 : 1,
    },
  }
}

const entityNegativeRoles = isolationRoles.filter(
  (role): role is Exclude<FinanceIsolationEvidenceCaseRole, 'three_entity_isolated'> =>
    role !== 'three_entity_isolated'
)

function entityIsolationNegativeObservation(
  label: (typeof labels)[number]
): FinanceEntityIsolationNegativeAuditObservation {
  return {
    schemaVersion: 1,
    mode: 'three_case_entity_finance_isolation_negative_audit',
    scopeDigest: createFinanceIsolationScopeDigest({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      connectionId: `connection-${label}-private`,
    }),
    verdict: 'all_breaches_rejected',
    canWrite: false,
    canApply: false,
    metrics: {
      expectedCases: 3,
      evaluatedCases: 3,
      rejectedCases: 3,
      gapCases: 0,
      isolationBreaches: 3,
    },
    cases: [...entityNegativeRoles]
      .sort()
      .map((role) => ({ role, verdict: 'breach_detected' as const, isolationBreaches: 1 })),
  }
}

function accountingConnectionManifest(norteConnectionId = 'connection-norte-private') {
  return createFinanceAccountingConnectionStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: label === 'norte' ? norteConnectionId : `connection-${label}-private`,
      provider: 'accounting-provider',
      externalCompanyId: `company-${label}-private`,
      integrationMode: 'read_only',
      connectionStatus: 'active',
      reviewedState: 'configured_not_resolved',
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      connectionReviewReference: `review://finance/${label}/connection/v1`,
      ...(label === 'sur'
        ? { pilotReviewReference: 'review://finance/sur/connection-pilot/v1' }
        : {}),
    })),
  })
}

function accountingSecretReferenceManifest(norteConnectionId = 'connection-norte-private') {
  return createFinanceAccountingSecretReferenceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: label === 'norte' ? norteConnectionId : `connection-${label}-private`,
      secretReference: `op://cep/accounting/${label}`,
      configuredState: 'reference_configured_not_resolved',
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      secretReviewReference: `review://finance/${label}/secret-reference/v1`,
      ...(label === 'sur' ? { pilotReviewReference: 'review://finance/sur/secret-pilot/v1' } : {}),
    })),
  })
}

function accountingProviderContractManifest(
  norteConnectionId = 'connection-norte-private',
  norteExternalCompanyId = 'company-norte-private'
) {
  return createFinanceAccountingProviderContractStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const accountingConnectionId =
        label === 'norte' ? norteConnectionId : `connection-${label}-private`
      const externalCompanyId =
        label === 'norte' ? norteExternalCompanyId : `company-${label}-private`
      return {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        accountingConnectionId,
        provider: 'accounting-provider',
        externalCompanyId,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        contractReviewReference: `review://finance/${label}/provider-contract/v1`,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/provider-pilot/v1' }
          : {}),
        observation: {
          schemaVersion: 1 as const,
          mode: 'read_only_accounting_provider_contract_inspection' as const,
          verdict: 'contract_satisfied' as const,
          scopeDigest: createFinanceIsolationScopeDigest({
            tenantId: 'tenant-private',
            legalEntityId: `entity-${label}-private`,
            connectionId: accountingConnectionId,
          }),
          providerCompanyBindingDigest: sha256(
            JSON.stringify(['accounting-provider', externalCompanyId])
          ),
          contractVersion: 1 as const,
          operations: ['list_transactions'] as const,
          pagination: {
            mode: 'cursor' as const,
            minimumPageSize: 1 as const,
            maximumPageSize: 500 as const,
            maximumPages: 1000 as const,
            cycleDetectionRequired: true as const,
          },
          canReadTransactions: true as const,
          canInvokeProvider: false as const,
          canWriteProvider: false as const,
          canExposeCredential: false as const,
          canPersistRawPayload: false as const,
        },
      }
    }),
  })
}

function paymentSourceManifest(
  norteAccountingConnectionId = 'connection-norte-private',
  nortePaymentSourceConnectionId = 'payments-norte-private'
) {
  return createFinancePaymentSourceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const accountingConnectionId =
        label === 'norte' ? norteAccountingConnectionId : `connection-${label}-private`
      const paymentSourceConnectionId =
        label === 'norte' ? nortePaymentSourceConnectionId : `payments-${label}-private`
      const source = {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        accountingConnectionId,
        sourceConnectionId: paymentSourceConnectionId,
        provider: 'payments-provider',
        externalAccountId: `payments-account-${label}-private`,
        integrationMode: 'read_only' as const,
        connectionStatus: 'active' as const,
        reviewReference: `review://finance/${label}/payment-source/v1`,
        client: {
          provider: 'payments-provider',
          listPaymentEvents: async () => ({
            items: [],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          }),
        },
        enrollmentMappings: [
          { externalId: `external-enrollment-${label}-private`, localId: 101 + index },
        ],
      }
      return {
        tenantId: source.tenantId,
        legalEntityId: source.legalEntityId,
        accountingConnectionId: source.accountingConnectionId,
        paymentSourceConnectionId: source.sourceConnectionId,
        provider: source.provider,
        externalAccountId: source.externalAccountId,
        integrationMode: source.integrationMode,
        connectionStatus: source.connectionStatus,
        enrollmentMappings: source.enrollmentMappings,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        sourceReviewReference: source.reviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/payment-source-pilot/v1' }
          : {}),
        observation: inspectFinancePaymentSourceContract(source),
      }
    }),
  })
}

function advertisingSourceManifest(
  norteAccountingConnectionId = 'connection-norte-private',
  norteAdvertisingSourceConnectionId = 'ads-norte-private'
) {
  return createFinanceAdvertisingSourceStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const accountingConnectionId =
        label === 'norte' ? norteAccountingConnectionId : `connection-${label}-private`
      const advertisingSourceConnectionId =
        label === 'norte' ? norteAdvertisingSourceConnectionId : `ads-${label}-private`
      const source = {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        accountingConnectionId,
        sourceConnectionId: advertisingSourceConnectionId,
        provider: 'meta-ads',
        externalAccountId: `ad-account-${label}-private`,
        integrationMode: 'read_only' as const,
        connectionStatus: 'active' as const,
        reviewReference: `review://finance/${label}/advertising-source/v1`,
        client: {
          provider: 'meta-ads',
          listDailyAdvertisingSpend: async () => ({
            items: [],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          }),
        },
        campaignMappings: [
          { externalId: `external-campaign-${label}-private`, localId: 301 + index },
        ],
      }
      return {
        tenantId: source.tenantId,
        legalEntityId: source.legalEntityId,
        accountingConnectionId: source.accountingConnectionId,
        advertisingSourceConnectionId: source.sourceConnectionId,
        provider: source.provider,
        externalAccountId: source.externalAccountId,
        integrationMode: source.integrationMode,
        connectionStatus: source.connectionStatus,
        campaignMappings: source.campaignMappings,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        sourceReviewReference: source.reviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/advertising-source-pilot/v1' }
          : {}),
        observation: inspectFinanceAdvertisingSourceContract(source),
      }
    }),
  })
}

function payloadRelationshipScopeManifest(
  paymentManifest = paymentSourceManifest(),
  advertisingManifest = advertisingSourceManifest(),
  norteAccountingConnectionId = 'connection-norte-private'
) {
  const paymentByReview = new Map(
    paymentManifest.entities.map((artifact) => [artifact.entityReviewReferenceDigest, artifact])
  )
  const advertisingByReview = new Map(
    advertisingManifest.entities.map((artifact) => [artifact.entityReviewReferenceDigest, artifact])
  )
  return createFinancePayloadRelationshipScopeStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label, index) => {
      const entityReviewReference = `review://finance/${label}/entity/v1`
      const accountingConnectionId =
        label === 'norte' ? norteAccountingConnectionId : `connection-${label}-private`
      const paymentSource = {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        accountingConnectionId,
        sourceConnectionId: `payments-${label}-private`,
        provider: 'payments-provider',
        externalAccountId: `payments-account-${label}-private`,
        integrationMode: 'read_only' as const,
        connectionStatus: 'active' as const,
        reviewReference: `review://finance/${label}/payment-source/v1`,
        client: {
          provider: 'payments-provider',
          listPaymentEvents: async () => ({
            items: [],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          }),
        },
        enrollmentMappings: [
          { externalId: `external-enrollment-${label}-private`, localId: 101 + index },
        ],
      }
      const advertisingSource = {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        accountingConnectionId,
        sourceConnectionId: `ads-${label}-private`,
        provider: 'meta-ads',
        externalAccountId: `ad-account-${label}-private`,
        integrationMode: 'read_only' as const,
        connectionStatus: 'active' as const,
        reviewReference: `review://finance/${label}/advertising-source/v1`,
        client: {
          provider: 'meta-ads',
          listDailyAdvertisingSpend: async () => ({
            items: [],
            nextCursor: null,
            snapshotVersion: 'snapshot-v1',
          }),
        },
        campaignMappings: [
          { externalId: `external-campaign-${label}-private`, localId: 301 + index },
        ],
      }
      const reviewDigest = sha256(entityReviewReference)
      return {
        accountingConnectionId,
        payloadPlan: {
          tenantId: 'tenant-private',
          legalEntityId: `entity-${label}-private`,
          payloadTenantId: '7',
          reviewReference: `review://finance/${label}/payload-plan/v1`,
          enrollmentIds: [101 + index],
          courseRunIds: [201 + index],
          campaignIds: [301 + index],
        },
        paymentSource,
        paymentSourceArtifact: paymentByReview.get(reviewDigest)!,
        advertisingSource,
        advertisingSourceArtifact: advertisingByReview.get(reviewDigest)!,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://finance/sur/payload-scope-pilot/v1' }
          : {}),
      }
    }),
  })
}

function enrollmentCampaignScopeManifest(
  payloadRelationshipScope = payloadRelationshipScopeManifest()
) {
  return createEnrollmentCampaignScopeStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    payloadRelationshipScope,
    samples: labels.map((label, index) => ({
      payloadPlan: {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        payloadTenantId: '7',
        reviewReference: `review://finance/${label}/payload-plan/v1`,
        enrollmentIds: [101 + index],
        courseRunIds: [201 + index],
        campaignIds: [301 + index],
      },
      enrollmentRelationships: [{ enrollmentId: 101 + index, courseRunId: 201 + index }],
      campaignRelationships: [{ campaignId: 301 + index, courseRunId: 201 + index }],
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      relationshipReviewReference: `review://finance/${label}/enrollment-campaign-scope/v1`,
      ...(label === 'sur'
        ? { pilotReviewReference: 'review://finance/sur/enrollment-campaign-pilot/v1' }
        : {}),
    })),
  })
}

function authorizationSample(
  legacyAllowed: boolean,
  proposedAllowed: boolean
): MultiEntityAuthorizationShadowEvidenceSample {
  return {
    reviewReference: `review://authorization/${legacyAllowed}/${proposedAllowed}/v1`,
    legacyAllowed,
    proposedAllowed,
    observation: evaluateMultiEntityAuthorizationShadow({
      configuredMode: 'shadow',
      legacyAllowed,
      request: {
        scope: 'group',
        userId: 'private-user',
        groupId: 'private-group',
        capability: 'catalog.read',
      },
      snapshot: proposedAllowed
        ? {
            groupMemberships: [
              {
                userId: 'private-user',
                groupId: 'private-group',
                status: 'active',
                capabilities: ['catalog.read'],
              },
            ],
            legalEntityMemberships: [],
          }
        : { groupMemberships: [], legalEntityMemberships: [] },
    }),
  }
}

const rollbackRecordTypes: readonly EntityScopedRecordType[] = [
  'classroom',
  'course_run',
  'enrollment',
  'lead',
  'campaign',
  'advertising_spend',
]

function rollbackFlags(active: boolean) {
  return {
    AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: active,
    AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: active,
    AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: active,
    AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: active,
    AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: active,
    AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: active ? ('shadow' as const) : ('disabled' as const),
  }
}

function rollbackSample(
  role: MultiEntityRollbackRehearsalRole,
  baselineDigest: string
): MultiEntityRollbackRehearsalEvidenceSample {
  const reviewReference = `review://rollback/${role}/v1`
  const shared = {
    targetTenantId: 'tenant-private',
    reviewReference,
    accessBaseline: { capturedDigest: baselineDigest, currentDigest: baselineDigest },
    flagState: rollbackFlags(false),
  }
  if (role === 'full_reversible') {
    return {
      role,
      reviewReference,
      drillInput: {
        ...shared,
        flagState: rollbackFlags(true),
        records: rollbackRecordTypes.map((recordType) => ({
          operation: 'restore_null_if_unchanged' as const,
          recordType,
          recordId: `private-${recordType}`,
          tenantId: 'tenant-private',
          expectedLegalEntityId: 'entity-private',
          currentLegalEntityId: 'entity-private',
          restoreLegalEntityId: null,
        })),
      },
    }
  }
  if (role === 'access_drift_blocked') {
    return {
      role,
      reviewReference,
      drillInput: {
        ...shared,
        accessBaseline: {
          capturedDigest: baselineDigest,
          currentDigest: `sha256:${'d'.repeat(64)}`,
        },
        records: [],
      },
    }
  }
  const recordType = role === 'cross_tenant_blocked' ? 'course_run' : 'campaign'
  return {
    role,
    reviewReference,
    drillInput: {
      ...shared,
      records: [
        {
          operation: 'restore_null_if_unchanged',
          recordType,
          recordId: `private-${recordType}`,
          tenantId: role === 'cross_tenant_blocked' ? 'other-private' : 'tenant-private',
          expectedLegalEntityId: 'entity-private',
          currentLegalEntityId:
            role === 'changed_record_blocked' ? 'changed-private' : 'entity-private',
          restoreLegalEntityId: null,
        },
      ],
    },
  }
}

function entityRollbackManifest(
  globalRollback: ReturnType<typeof createMultiEntityRollbackRehearsalEvidenceArtifact>,
  norteConnectionId = 'connection-norte-private'
) {
  return createEntityRollbackStagingEvidenceManifest({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    globalRollbackArtifact: globalRollback,
    samples: labels.map((label) => {
      const legalEntityId = `entity-${label}-private`
      const rollbackReviewReference = `review://rollback/entity/${label}/v1`
      return {
        tenantId: 'tenant-private',
        legalEntityId,
        accountingConnectionId:
          label === 'norte' ? norteConnectionId : `connection-${label}-private`,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        rollbackReviewReference,
        ...(label === 'sur'
          ? { pilotReviewReference: 'review://rollback/entity/sur/pilot/v1' }
          : {}),
        drillInput: {
          targetTenantId: 'tenant-private',
          reviewReference: rollbackReviewReference,
          accessBaseline: {
            capturedDigest: globalRollback.accessBaselineDigest,
            currentDigest: globalRollback.accessBaselineDigest,
          },
          flagState: rollbackFlags(false),
          records: rollbackRecordTypes.map((recordType) => ({
            operation: 'restore_null_if_unchanged' as const,
            recordType,
            recordId: `${label}-${recordType}-private`,
            tenantId: 'tenant-private',
            expectedLegalEntityId: legalEntityId,
            currentLegalEntityId: legalEntityId,
            restoreLegalEntityId: null,
          })),
        },
      }
    }),
  })
}

function enrollmentClosureShadowArtifact() {
  const closureScope: CourseRunEnrollmentClosureScope = {
    tenantId: 'tenant-private',
    legalEntityId: 'entity-sur-private',
    courseRunId: 'run-private',
  }
  const run = (
    change: Partial<CourseRunEnrollmentClosureCourseRun> = {}
  ): CourseRunEnrollmentClosureCourseRun => ({
    ...closureScope,
    trainingType: 'private',
    operationalStatus: 'enrollment_open',
    enrollmentStatus: 'open',
    startDate: '2026-07-18T09:00:00+02:00',
    maxStudents: 20,
    currentEnrollments: 10,
    ...change,
  })
  const closureSessions = (): CourseRunEnrollmentClosureSession[] =>
    Array.from({ length: 7 }, (_, index) => ({
      ...closureScope,
      id: `session-private-${index + 1}`,
      startsAt: `2026-07-${String(18 + index).padStart(2, '0')}T09:00:00+02:00`,
      status: 'scheduled' as const,
    }))
  const campaign = (status: 'active' | 'paused' = 'active') => ({
    ...closureScope,
    id: 'campaign-private',
    status,
  })
  const base = (
    change: Partial<CourseRunEnrollmentClosureInput> = {}
  ): CourseRunEnrollmentClosureInput => ({
    scope: closureScope,
    now: '2026-07-17T12:00:00+02:00',
    courseRun: run(),
    sessions: [],
    campaigns: [campaign()],
    ...change,
  })
  const roles: readonly CourseRunEnrollmentClosureEvidenceRole[] = [
    'before_start_open',
    'capacity_full_closes',
    'sixth_session_open',
    'seventh_session_closes',
    'cycle_before_deadline_open',
    'cycle_after_deadline_closes',
    'cycle_missing_deadline_blocked',
    'cross_scope_blocked',
    'paused_campaign_not_reactivated',
  ]
  const caseInput = (role: CourseRunEnrollmentClosureEvidenceRole) => {
    if (role === 'capacity_full_closes') {
      return base({ courseRun: run({ currentEnrollments: 20 }) })
    }
    if (role === 'sixth_session_open') {
      return base({ now: '2026-07-23T10:00:00+02:00', sessions: closureSessions() })
    }
    if (role === 'seventh_session_closes') {
      return base({ now: '2026-07-24T10:00:00+02:00', sessions: closureSessions() })
    }
    if (role === 'cycle_before_deadline_open' || role === 'cycle_after_deadline_closes') {
      return base({
        now:
          role === 'cycle_before_deadline_open'
            ? '2026-09-15T12:00:00+02:00'
            : '2026-10-01T12:00:00+02:00',
        courseRun: run({
          trainingType: 'cycle',
          startDate: '2026-09-01T09:00:00+02:00',
          officialEnrollmentDeadline: '2026-09-30',
        }),
      })
    }
    if (role === 'cycle_missing_deadline_blocked') {
      return base({
        now: '2026-09-15T12:00:00+02:00',
        courseRun: run({
          trainingType: 'cycle',
          startDate: '2026-09-01T09:00:00+02:00',
        }),
      })
    }
    if (role === 'cross_scope_blocked') {
      const crossSessions = closureSessions()
      crossSessions[6] = { ...crossSessions[6]!, legalEntityId: 'entity-norte-private' }
      return base({
        now: '2026-07-24T10:00:00+02:00',
        sessions: crossSessions,
        campaigns: [{ ...campaign(), tenantId: 'other-tenant-private' }],
      })
    }
    if (role === 'paused_campaign_not_reactivated') {
      return base({
        now: '2026-07-24T10:00:00+02:00',
        courseRun: run({ enrollmentStatus: 'closed' }),
        sessions: closureSessions(),
        campaigns: [campaign('paused')],
      })
    }
    return base()
  }
  return createCourseRunEnrollmentClosureEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      reviewReference: `review://enrollment-closure/${role}/v1`,
      input: caseInput(role),
    })),
  })
}

function teacherScheduleShadowArtifact() {
  const topology: MultiEntityTopology = {
    legalEntities: [
      { id: 'entity-norte-private', tenantId: 'tenant-private', status: 'validated' },
      { id: 'entity-sur-private', tenantId: 'tenant-private', status: 'proposed' },
    ],
    campuses: [
      { id: 'campus-norte-private', tenantId: 'tenant-private' },
      { id: 'campus-sur-private', tenantId: 'tenant-private' },
    ],
    campusBindings: [
      {
        id: 'binding-norte-private',
        tenantId: 'tenant-private',
        legalEntityId: 'entity-norte-private',
        campusId: 'campus-norte-private',
        status: 'validated',
      },
      {
        id: 'binding-sur-private',
        tenantId: 'tenant-private',
        legalEntityId: 'entity-sur-private',
        campusId: 'campus-sur-private',
        status: 'proposed',
      },
    ],
    staffAssignments: [
      {
        id: 'assignment-norte-shared-private',
        tenantId: 'tenant-private',
        legalEntityId: 'entity-norte-private',
        staffId: 'teacher-shared-private',
        campusIds: ['campus-norte-private'],
        status: 'validated',
      },
      {
        id: 'assignment-sur-shared-private',
        tenantId: 'tenant-private',
        legalEntityId: 'entity-sur-private',
        staffId: 'teacher-shared-private',
        campusIds: ['campus-sur-private'],
        status: 'proposed',
      },
      {
        id: 'assignment-sur-other-private',
        tenantId: 'tenant-private',
        legalEntityId: 'entity-sur-private',
        staffId: 'teacher-other-private',
        campusIds: ['campus-sur-private'],
        status: 'validated',
      },
      ...['1', '2'].map((suffix) => ({
        id: `assignment-sur-ambiguous-${suffix}-private`,
        tenantId: 'tenant-private',
        legalEntityId: 'entity-sur-private',
        staffId: 'teacher-ambiguous-private',
        campusIds: ['campus-sur-private'],
        status: 'suspended' as const,
      })),
    ],
    accountingConnections: [],
  }
  const norteRun: PayloadTeacherScheduleCourseRunRecord = {
    id: 'run-norte-private',
    tenant: 'tenant-private',
    legalEntity: 'entity-norte-private',
    campus: 'campus-norte-private',
    instructor: 'teacher-shared-private',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    schedule_days: ['monday'],
    schedule_time_start: '09:00:00',
    schedule_time_end: '11:00:00',
    planning_status: 'published',
  }
  const surRun = (
    change: Partial<PayloadTeacherScheduleCourseRunRecord> = {}
  ): PayloadTeacherScheduleCourseRunRecord => ({
    ...norteRun,
    id: 'run-sur-private',
    legalEntity: 'entity-sur-private',
    campus: 'campus-sur-private',
    ...change,
  })
  const snapshot = (
    courseRuns: readonly PayloadTeacherScheduleCourseRunRecord[]
  ): PayloadTeacherScheduleSnapshot => ({ targetTenantId: 'tenant-private', topology, courseRuns })
  const roles: readonly TeacherScheduleShadowEvidenceRole[] = [
    'shared_non_overlapping_ready',
    'shared_overlapping_blocked',
    'adjacent_slots_ready',
    'different_teacher_overlap_ready',
    'missing_assignment_blocked',
    'ambiguous_assignment_blocked',
    'cross_tenant_blocked',
    'cancelled_overlap_ignored',
  ]
  const caseSnapshot = (role: TeacherScheduleShadowEvidenceRole) => {
    if (role === 'shared_non_overlapping_ready') {
      return snapshot([norteRun, surRun({ schedule_days: ['tuesday'] })])
    }
    if (role === 'shared_overlapping_blocked') {
      return snapshot([
        norteRun,
        surRun({ schedule_time_start: '10:00:00', schedule_time_end: '12:00:00' }),
      ])
    }
    if (role === 'adjacent_slots_ready') {
      return snapshot([
        norteRun,
        surRun({ schedule_time_start: '11:00:00', schedule_time_end: '13:00:00' }),
      ])
    }
    if (role === 'different_teacher_overlap_ready') {
      return snapshot([
        norteRun,
        surRun({
          instructor: 'teacher-other-private',
          schedule_time_start: '10:00:00',
          schedule_time_end: '12:00:00',
        }),
      ])
    }
    if (role === 'missing_assignment_blocked') {
      return snapshot([surRun({ instructor: 'teacher-missing-private' })])
    }
    if (role === 'ambiguous_assignment_blocked') {
      return snapshot([surRun({ instructor: 'teacher-ambiguous-private' })])
    }
    if (role === 'cross_tenant_blocked') {
      return snapshot([{ ...norteRun, tenant: 'other-tenant-private' }])
    }
    return snapshot([
      norteRun,
      surRun({
        planning_status: 'cancelled',
        schedule_time_start: '10:00:00',
        schedule_time_end: '12:00:00',
      }),
    ])
  }
  return createTeacherScheduleShadowEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      reviewReference: `review://teacher-schedule/${role}/v1`,
      snapshot: caseSnapshot(role),
    })),
  })
}

function unifiedPublicWebArtifact() {
  const baseline: CurrentPublicProjectionBaseline = {
    courseSlugs: ['curso-publico'],
    cycleSlugs: [],
    campusSlugs: ['sede-norte', 'sede-santa-cruz', 'sede-sur'],
    runSlugs: ['NOR-2026-001', 'SC-2026-001', 'SUR-2026-001'],
  }
  const source = (): MultiEntityPublicProjectionInput => ({
    targetTenantId: 'tenant-private',
    legalEntities: [1, 2, 3].map((index) => ({
      id: `entity-${index}-private`,
      tenantId: 'tenant-private',
      status: 'validated' as const,
    })),
    campusBindings: [1, 2, 3].map((index) => ({
      id: `binding-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      campusId: `campus-${index}-private`,
      status: 'validated' as const,
    })),
    courses: [
      {
        id: 'course-shared-private',
        tenantId: 'tenant-private',
        slug: 'curso-publico',
        title: 'Curso público',
        active: true,
      },
    ],
    cycles: [],
    campuses: [
      {
        id: 'campus-1-private',
        tenantId: 'tenant-private',
        slug: 'sede-norte',
        name: 'Norte',
        city: null,
        active: true,
      },
      {
        id: 'campus-2-private',
        tenantId: 'tenant-private',
        slug: 'sede-santa-cruz',
        name: 'Santa Cruz',
        city: null,
        active: true,
      },
      {
        id: 'campus-3-private',
        tenantId: 'tenant-private',
        slug: 'sede-sur',
        name: 'Sur',
        city: null,
        active: true,
      },
    ],
    courseRuns: [1, 2, 3].map((index) => ({
      id: `run-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      courseId: 'course-shared-private',
      cycleId: null,
      campusId: `campus-${index}-private`,
      publicSlug: ['NOR-2026-001', 'SC-2026-001', 'SUR-2026-001'][index - 1]!,
      status: 'enrollment_open' as const,
      startDate: '2026-09-01',
      modality: 'presential' as const,
    })),
  })
  const sourceWithCancelledRuns = (count: number): MultiEntityPublicProjectionInput => {
    const value = source()
    return {
      ...value,
      courseRuns: [
        ...value.courseRuns,
        ...Array.from({ length: count }, (_, offset) => ({
          ...value.courseRuns[0]!,
          id: `run-cancelled-${offset + 1}-private`,
          publicSlug: `ONLINE-2026-00${offset + 1}`,
          campusId: null,
          status: 'cancelled' as const,
        })),
      ],
    }
  }
  return createUnifiedPublicWebEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [1, 2, 3].map((index) => ({
      evidenceReference: `evidence://public-web/sample-${index}`,
      observation: compareMultiEntityPublicProjection(
        planMultiEntityPublicProjection(
          index === 1 ? source() : sourceWithCancelledRuns(index - 1)
        ),
        baseline
      ),
    })),
  })
}

function sharedCourseCatalogArtifact() {
  const topology: MultiEntityTopology = {
    legalEntities: [1, 2, 3].map((index) => ({
      id: `entity-${index}-private`,
      tenantId: 'tenant-private',
      status: 'validated' as const,
    })),
    campuses: [1, 2, 3].map((index) => ({
      id: `campus-${index}-private`,
      tenantId: 'tenant-private',
    })),
    campusBindings: [1, 2, 3].map((index) => ({
      id: `binding-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      campusId: `campus-${index}-private`,
      status: 'validated' as const,
    })),
    staffAssignments: [1, 2, 3].map((index) => ({
      id: `assignment-${index}-private`,
      tenantId: 'tenant-private',
      legalEntityId: `entity-${index}-private`,
      staffId: 'teacher-shared-private',
      campusIds: [`campus-${index}-private`],
      status: 'validated' as const,
    })),
    accountingConnections: [],
  }
  const classroom = (index: number) => ({
    id: `classroom-${index}-private`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    campusId: `campus-${index}-private`,
  })
  const run = (index: number, courseId = 'course-shared-private') => ({
    id: `run-${index}-private`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    courseId,
    campusId: `campus-${index}-private`,
    classroomId: `classroom-${index}-private` as string | null,
    staffAssignmentIds: [`assignment-${index}-private`],
  })
  const shared: SharedCourseCatalogReviewGraph = {
    topology,
    courses: [{ id: 'course-shared-private', tenantId: 'tenant-private' }],
    teachers: [{ id: 'teacher-shared-private', tenantId: 'tenant-private' }],
    classrooms: [classroom(1), classroom(2), classroom(3)],
    courseRuns: [run(1), run(2), run(3)],
  }
  const roles: readonly SharedCourseCatalogEvidenceRole[] = [
    'three_entity_shared_master_ready',
    'independent_master_courses_ready',
    'duplicate_master_course_blocked',
    'missing_master_course_blocked',
    'cross_tenant_master_course_blocked',
    'cross_entity_campus_blocked',
    'cross_entity_classroom_blocked',
    'cross_entity_teacher_assignment_blocked',
  ]
  const caseGraph = (role: SharedCourseCatalogEvidenceRole): SharedCourseCatalogReviewGraph => {
    if (role === 'three_entity_shared_master_ready') return shared
    if (role === 'independent_master_courses_ready') {
      return {
        ...shared,
        courses: [1, 2, 3].map((index) => ({
          id: `course-${index}-private`,
          tenantId: 'tenant-private',
        })),
        courseRuns: [1, 2, 3].map((index) => run(index, `course-${index}-private`)),
      }
    }
    const one = { ...shared, classrooms: [classroom(1)], courseRuns: [run(1)] }
    if (role === 'duplicate_master_course_blocked') {
      return { ...one, courses: [shared.courses[0]!, shared.courses[0]!] }
    }
    if (role === 'missing_master_course_blocked') return { ...one, courses: [] }
    if (role === 'cross_tenant_master_course_blocked') {
      return { ...one, courses: [{ ...shared.courses[0]!, tenantId: 'other-tenant-private' }] }
    }
    if (role === 'cross_entity_campus_blocked') {
      return {
        topology,
        courses: shared.courses,
        teachers: [],
        classrooms: [],
        courseRuns: [
          { ...run(1), campusId: 'campus-2-private', classroomId: null, staffAssignmentIds: [] },
        ],
      }
    }
    if (role === 'cross_entity_classroom_blocked') {
      return {
        topology,
        courses: shared.courses,
        teachers: [],
        classrooms: [classroom(2)],
        courseRuns: [{ ...run(1), classroomId: 'classroom-2-private', staffAssignmentIds: [] }],
      }
    }
    return {
      topology,
      courses: shared.courses,
      teachers: shared.teachers,
      classrooms: [],
      courseRuns: [{ ...run(1), classroomId: null, staffAssignmentIds: ['assignment-2-private'] }],
    }
  }
  return createSharedCourseCatalogEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      reviewReference: `review://course-catalog/${role}/v1`,
      graph: caseGraph(role),
    })),
  })
}

function sharedTeacherRegistryArtifact() {
  const entity = (index: number) => ({
    id: `entity-${index}-private`,
    tenantId: 'tenant-private',
    status: 'validated' as const,
  })
  const campus = (index: number) => ({
    id: `campus-${index}-private`,
    tenantId: 'tenant-private',
  })
  const binding = (index: number) => ({
    id: `binding-${index}-private`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    campusId: `campus-${index}-private`,
    status: 'validated' as const,
  })
  const assignment = (
    index: number,
    staffId = 'teacher-shared-private',
    change: Partial<MultiEntityTopology['staffAssignments'][number]> = {}
  ) => ({
    id: `assignment-${index}-${staffId}`,
    tenantId: 'tenant-private',
    legalEntityId: `entity-${index}-private`,
    staffId,
    campusIds: [`campus-${index}-private`],
    status: 'validated' as const,
    ...change,
  })
  const topology = (
    legalEntities: MultiEntityTopology['legalEntities'],
    campuses: MultiEntityTopology['campuses'],
    campusBindings: MultiEntityTopology['campusBindings'],
    staffAssignments: MultiEntityTopology['staffAssignments']
  ): MultiEntityTopology => ({
    legalEntities,
    campuses,
    campusBindings,
    staffAssignments,
    accountingConnections: [],
  })
  const roles: readonly SharedTeacherRegistryEvidenceRole[] = [
    'three_entity_shared_master_ready',
    'same_entity_duplicate_active_blocked',
    'suspended_history_ready',
    'cross_entity_campus_blocked',
    'cross_tenant_assignment_blocked',
    'missing_entity_blocked',
    'independent_master_teachers_ready',
  ]
  const caseTopology = (role: SharedTeacherRegistryEvidenceRole): MultiEntityTopology => {
    if (role === 'three_entity_shared_master_ready') {
      return topology(
        [entity(1), entity(2), entity(3)],
        [campus(1), campus(2), campus(3)],
        [binding(1), binding(2), binding(3)],
        [assignment(1), assignment(2), assignment(3)]
      )
    }
    if (role === 'same_entity_duplicate_active_blocked') {
      return topology(
        [entity(1)],
        [campus(1)],
        [binding(1)],
        [assignment(1), assignment(1, undefined, { id: 'assignment-duplicate-private' })]
      )
    }
    if (role === 'suspended_history_ready') {
      return topology(
        [entity(1)],
        [campus(1)],
        [binding(1)],
        [
          assignment(1),
          assignment(1, undefined, { id: 'assignment-old-private', status: 'suspended' }),
        ]
      )
    }
    if (role === 'cross_entity_campus_blocked') {
      return topology(
        [entity(1), entity(2)],
        [campus(1), campus(2)],
        [binding(1), binding(2)],
        [assignment(1, undefined, { campusIds: ['campus-2-private'] })]
      )
    }
    if (role === 'cross_tenant_assignment_blocked') {
      return topology(
        [entity(1)],
        [],
        [],
        [assignment(1, undefined, { tenantId: 'other-tenant-private', campusIds: [] })]
      )
    }
    if (role === 'missing_entity_blocked') {
      return topology([], [], [], [assignment(1, undefined, { campusIds: [] })])
    }
    return topology(
      [entity(1), entity(2), entity(3)],
      [campus(1), campus(2), campus(3)],
      [binding(1), binding(2), binding(3)],
      [
        assignment(1, 'teacher-one-private'),
        assignment(2, 'teacher-two-private'),
        assignment(3, 'teacher-three-private'),
      ]
    )
  }
  return createSharedTeacherRegistryEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: roles.map((role) => ({
      role,
      reviewReference: `review://teacher-registry/${role}/v1`,
      topology: caseTopology(role),
    })),
  })
}

function redactionSurface(
  scope: 'global' | 'entity',
  gate: ObservabilityRedactionSurfaceInput['gate'],
  artifact: { readonly kind: string; readonly artifactDigest: string }
): ObservabilityRedactionSurfaceInput {
  return {
    scope,
    gate,
    artifactKind: artifact.kind,
    artifactDigest: artifact.artifactDigest,
    serializedArtifact: JSON.stringify(artifact),
  }
}

function observabilitySurfaces(
  artifacts: Omit<StrictStagingSpecificArtifacts, 'observabilityRedaction'>
): ObservabilityRedactionSurfaceInput[] {
  const global: ObservabilityRedactionSurfaceInput[] = [
    redactionSurface('global', 'schema_authority_decided', artifacts.schemaAuthority),
    redactionSurface('global', 'node22_runtime_verified', artifacts.node22Runtime),
    redactionSurface(
      'global',
      ACCESS_BASELINE_CAPTURED_READINESS_GATE,
      artifacts.accessBaselineCapture
    ),
    redactionSurface('global', ACCESS_UNCHANGED_VERIFIED_READINESS_GATE, artifacts.accessUnchanged),
    redactionSurface(
      'global',
      FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE,
      artifacts.featureFlagsDefaultOff
    ),
    redactionSurface('global', 'restored_backup_verified', artifacts.restoredBackup),
    redactionSurface(
      'global',
      'expand_only_migration_reviewed',
      artifacts.expandOnlyMigrationReview
    ),
    redactionSurface('global', 'migration_dry_run_verified', artifacts.migrationDryRun),
    redactionSurface('global', 'backfill_dry_run_verified', artifacts.backfillDryRun),
    redactionSurface(
      'global',
      AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE,
      artifacts.authorizationShadow
    ),
    redactionSurface('global', ROLLBACK_REHEARSED_READINESS_GATE, artifacts.rollbackRehearsal),
    redactionSurface(
      'global',
      ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE,
      artifacts.enrollmentClosureShadow
    ),
    redactionSurface(
      'global',
      UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE,
      artifacts.unifiedPublicWeb
    ),
    redactionSurface(
      'global',
      SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE,
      artifacts.sharedCourseCatalog
    ),
    redactionSurface(
      'global',
      SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE,
      artifacts.sharedTeacherRegistry
    ),
    redactionSurface(
      'global',
      TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE,
      artifacts.teacherScheduleShadow
    ),
    redactionSurface(
      'global',
      NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE,
      artifacts.nominalPermissionLock
    ),
    redactionSurface(
      'global',
      ACCOUNTING_IMPORT_STAGING_READINESS_GATE,
      artifacts.accountingImport
    ),
    redactionSurface(
      'global',
      FINANCE_ISOLATION_STAGING_READINESS_GATE,
      artifacts.financialIsolation
    ),
  ]
  const entityGroups = [
    [
      FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE,
      artifacts.accountingConnection.entities,
    ],
    [
      FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE,
      artifacts.accountingSecretReference.entities,
    ],
    [
      FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE,
      artifacts.accountingProviderContract.entities,
    ],
    [FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE, artifacts.paymentSource.entities],
    [FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE, artifacts.advertisingSource.entities],
    [
      FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE,
      artifacts.payloadRelationshipScope.entities,
    ],
    [ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE, artifacts.enrollmentCampaignScope.entities],
    [ENTITY_ROLLBACK_REVIEWED_READINESS_GATE, artifacts.entityRollback.entities],
    [FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE, artifacts.entityIsolationNegative.entities],
    [FINANCE_RECONCILIATION_ENTITY_READINESS_GATE, artifacts.financeReconciliation.entities],
    ['legal_profile_reviewed' as const, artifacts.legalProfile.entities],
    ['campus_mapping_reviewed' as const, artifacts.campusMapping.entities],
  ] as const
  return [
    ...global,
    ...entityGroups.flatMap(([gate, entities]) =>
      entities.map((artifact) => redactionSurface('entity', gate, artifact))
    ),
  ]
}

function artifacts() {
  const { capturedAccess } = accessContext()
  const schemaExpansionPlan = planMultiEntitySchemaExpansion([])
  const schemaAuthority = createMultiEntitySchemaAuthorityReviewEvidenceArtifact({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    decisionReference: 'review://authority/payload-cep/v1',
    authority: 'payload',
    schemaFingerprintDigest: sha256('cep-payload-schema-fingerprint-v1'),
    schemaExpansionPlanDigest: digestMultiEntitySchemaExpansionPlan(schemaExpansionPlan),
  })
  const runtimeMigrationCommon = {
    environment: 'staging' as const,
    sourceSha,
    sourceDigest,
    targetTenantDigest,
    campaignReviewReference,
    readinessReviewReference,
    commandDigest: sha256('reviewed-command'),
    tool: 'akademate-reviewer',
    toolVersion: '1.2.3',
    exitStatus: 0 as const,
    startedAtUtc: '2026-07-26T08:00:00.000Z',
    finishedAtUtc: '2026-07-26T08:01:00.000Z',
    executionReportDigest: sha256('external-execution-report'),
    verificationReportDigest: sha256('external-verification-report'),
  }
  const node22Runtime = createMultiEntityNode22RuntimeEvidenceArtifact({
    ...runtimeMigrationCommon,
    gateReviewReference: 'review://runtime/node22/staging-v1',
    tool: 'node',
    toolVersion: 'v22.17.0',
  })
  const accessBaselineCapture = createMultiEntityAccessBaselineCaptureEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    capturedAccess,
  })
  const accessUnchanged = createMultiEntityAccessUnchangedEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    captureArtifact: accessBaselineCapture,
    capturedAccess,
    currentAccess: capturedAccess,
  })
  const featureFlagsDefaultOff = createMultiEntityFeatureFlagsDefaultOffEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    flagState: {
      AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: false,
      AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: false,
      AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: false,
      AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: false,
      AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: false,
      AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: false,
      AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: false,
      AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: false,
      AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'disabled',
    },
  })
  const authorizationShadow = createMultiEntityAuthorizationShadowEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      authorizationSample(false, false),
      authorizationSample(false, true),
      authorizationSample(true, false),
      authorizationSample(true, true),
    ],
  })
  const rollbackRehearsal = createMultiEntityRollbackRehearsalEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      rollbackSample('full_reversible', capturedAccess.digest),
      rollbackSample('access_drift_blocked', capturedAccess.digest),
      rollbackSample('cross_tenant_blocked', capturedAccess.digest),
      rollbackSample('changed_record_blocked', capturedAccess.digest),
    ],
  })
  const enrollmentClosureShadow = enrollmentClosureShadowArtifact()
  const unifiedPublicWeb = unifiedPublicWebArtifact()
  const sharedCourseCatalog = sharedCourseCatalogArtifact()
  const sharedTeacherRegistry = sharedTeacherRegistryArtifact()
  const teacherScheduleShadow = teacherScheduleShadowArtifact()
  const legalProfile = createMultiEntityLegalProfileReviewEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    entities: labels.map((label) => ({
      id: `entity-${label}-private`,
      tenantId: 'tenant-private',
      role: label === 'santa-cruz' ? ('santa_cruz' as const) : label,
      pilot: label === 'sur',
      reviewReference: `review://finance/${label}/entity/v1`,
      legalName: `CEP Formación ${label}`,
      nif: label === 'norte' ? '12345678Z' : label === 'santa-cruz' ? '87654321X' : 'X1234567L',
      registeredAddress: {
        line1: `Calle ${label}, 1`,
        postalCode: '28001',
        locality: 'Madrid',
        region: 'Madrid',
        countryCode: 'ES',
      },
      legalContact: {
        fullName: 'María Legal',
        email: `legal+${label}@cep.example`,
        phone: '+34600123456',
      },
    })),
  })
  const campusMapping = createCampusMappingEvidenceArtifact({
    reviewEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => {
      const campusId = `campus-${label}`
      return {
        tenantId: 'tenant-private',
        legalEntityId: `entity-${label}-private`,
        role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
        entityReviewReference: `review://finance/${label}/entity/v1`,
        ...(label === 'sur' ? { pilotReviewReference: 'review://finance/sur/pilot/v1' } : {}),
        campuses: [{ id: campusId, tenantId: 'tenant-private', status: 'validated' as const }],
        classrooms: [
          {
            id: `classroom-${label}`,
            tenantId: 'tenant-private',
            campusId,
            status: 'validated' as const,
          },
        ],
        bindings: [
          {
            id: `binding-${label}`,
            tenantId: 'tenant-private',
            legalEntityId: `entity-${label}-private`,
            campusId,
            status: 'validated' as const,
          },
        ],
      }
    }),
  })
  const entityRollback = entityRollbackManifest(rollbackRehearsal)
  const nominalPermissionLock = createNominalPermissionPhaseLockEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: [
      nominalSample('implementation', 'generate_nominal_matrix'),
      nominalSample('implementation', 'apply_permission_change'),
      nominalSample('staging_validation', 'generate_nominal_matrix'),
      nominalSample('staging_validation', 'apply_permission_change'),
    ],
  })
  const accountingImport = createAccountingImportStagingEvidenceArtifact({
    executionEnvironment: 'staging',
    runnerFlag: ACCOUNTING_IMPORT_STAGING_RUNNER_FLAG,
    runnerFlagValue: true,
    runReviewReference: 'review://finance/accounting-import/run/v1',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    observation: {
      schemaVersion: 1,
      mode: 'three_entity_accounting_import_staging',
      verdict: 'completed',
      canReadProvider: true,
      canWriteProvider: false,
      canWriteLocal: true,
      canApply: false,
      metrics: {
        expectedEntities: 3,
        attemptedEntities: 3,
        completedEntities: 3,
        failedEntities: 0,
        pilotCandidates: 1,
      },
    },
  })
  const accountingConnection = accountingConnectionManifest()
  const accountingSecretReference = accountingSecretReferenceManifest()
  const accountingProviderContract = accountingProviderContractManifest()
  const paymentSource = paymentSourceManifest()
  const advertisingSource = advertisingSourceManifest()
  const payloadRelationshipScope = payloadRelationshipScopeManifest(
    paymentSource,
    advertisingSource
  )
  const enrollmentCampaignScope = enrollmentCampaignScopeManifest(payloadRelationshipScope)
  const financialIsolation = createFinanceIsolationStagingEvidenceManifest({
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_ISOLATION_AUDIT_FLAG,
    runnerFlagValue: true,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: isolationRoles.map((role) => ({
      role,
      runReviewReference: `review://finance/isolation/${role}/v1`,
      observation: isolationObservation(role),
    })),
  })
  const entityIsolationNegative = createFinanceEntityIsolationNegativeStagingEvidenceManifest({
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_ISOLATION_AUDIT_FLAG,
    runnerFlagValue: true,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map((label) => ({
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      entityReviewReference: `review://finance/${label}/entity/v1`,
      ...(label === 'sur'
        ? { pilotReviewReference: 'review://finance/isolation/sur/pilot/v1' }
        : {}),
      caseReviews: entityNegativeRoles.map((role) => ({
        role,
        runReviewReference: `review://finance/isolation/${label}/${role}/v1`,
      })),
      observation: entityIsolationNegativeObservation(label),
    })),
  })
  const financeReconciliation = createFinanceReconciliationStagingEvidenceManifest({
    executionEnvironment: 'staging',
    runnerFlag: FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
    runnerFlagValue: true,
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    samples: labels.map(financeSample),
  })
  const restoredPayloadDigest = sha256('restored-backup-payload')
  const restoredBackup = createMultiEntityRestoredBackupEvidenceArtifact({
    restoreEnvironment: 'staging',
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    backupManifestDigest: sha256('restored-backup-manifest'),
    restoreExecutionReportDigest: sha256('restored-backup-execution-report'),
    verificationReportDigest: sha256('restored-backup-verification-report'),
    backupPayloadDigest: restoredPayloadDigest,
    restoredPayloadDigest,
  })
  const expandOnlyMigrationReview = createMultiEntityExpandOnlyMigrationReviewEvidenceArtifact({
    ...runtimeMigrationCommon,
    gateReviewReference: 'review://migration/expand-only/staging-v1',
    migrationPlanDigest: sha256('expand-only-migration-plan'),
    schemaBeforeDigest: sha256('schema-before'),
    schemaAfterDigest: sha256('schema-after'),
    expandOperationsReviewed: 7,
    destructiveOperationsDetected: 0,
  })
  const migrationDryRun = createMultiEntityMigrationDryRunEvidenceArtifact({
    ...runtimeMigrationCommon,
    gateReviewReference: 'review://migration/dry-run/staging-v1',
    backupManifestDigest: restoredBackup.backupManifestDigest,
    migrationPlanDigest: expandOnlyMigrationReview.migrationPlanDigest,
    schemaBeforeDigest: expandOnlyMigrationReview.schemaBeforeDigest,
    schemaAfterDigest: expandOnlyMigrationReview.schemaAfterDigest,
  })
  const dryRunSnapshotDigest = sha256('backfill-dry-run-snapshot')
  const backfillDryRun = createMultiEntityBackfillDryRunEvidenceArtifact({
    ...runtimeMigrationCommon,
    gateReviewReference: 'review://backfill/dry-run/staging-v1',
    backupManifestDigest: restoredBackup.backupManifestDigest,
    inputSnapshotDigest: dryRunSnapshotDigest,
    backfillPlanDigest: sha256('backfill-dry-run-plan'),
    postRunSnapshotDigest: dryRunSnapshotDigest,
  })
  const preObservability = {
    schemaAuthority,
    node22Runtime,
    accessBaselineCapture,
    accessUnchanged,
    featureFlagsDefaultOff,
    restoredBackup,
    expandOnlyMigrationReview,
    migrationDryRun,
    backfillDryRun,
    authorizationShadow,
    rollbackRehearsal,
    enrollmentClosureShadow,
    unifiedPublicWeb,
    sharedCourseCatalog,
    sharedTeacherRegistry,
    teacherScheduleShadow,
    legalProfile,
    campusMapping,
    entityRollback,
    nominalPermissionLock,
    accountingImport,
    accountingConnection,
    accountingSecretReference,
    accountingProviderContract,
    paymentSource,
    advertisingSource,
    payloadRelationshipScope,
    enrollmentCampaignScope,
    financialIsolation,
    entityIsolationNegative,
    financeReconciliation,
  }
  const observabilityRedaction = createObservabilityRedactionStagingEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    surfaces: observabilitySurfaces(preObservability),
  })
  return { schemaExpansionPlan, ...preObservability, observabilityRedaction }
}

function entityArtifactBindings(
  gate: 'legal_profile_reviewed' | 'campus_mapping_reviewed',
  artifacts: readonly {
    readonly kind: string
    readonly artifactDigest: string
    readonly evidenceReference: string
    readonly reviewReferenceDigest?: string
    readonly entityReviewReferenceDigest?: string
  }[]
): readonly MultiEntityStagingEvidenceBinding[] {
  return artifacts.map((artifact) => {
    const reviewReferenceDigest =
      artifact.reviewReferenceDigest ?? artifact.entityReviewReferenceDigest!
    const label = labels.find(
      (candidate) => reviewReferenceDigest === sha256(`review://finance/${candidate}/entity/v1`)
    )
    if (!label) throw new Error(`unknown entity review for ${gate}`)
    return {
      scope: 'entity' as const,
      gate,
      reviewReference: `review://finance/${label}/entity/v1`,
      evidenceReference: artifact.evidenceReference,
      campaignReviewReference,
      sourceDigest,
      targetTenantDigest,
      artifactKind: artifact.kind,
      artifactDigest: artifact.artifactDigest,
    }
  })
}

function globalArtifactBinding(
  gate:
    | 'schema_authority_decided'
    | 'node22_runtime_verified'
    | 'restored_backup_verified'
    | 'expand_only_migration_reviewed'
    | 'migration_dry_run_verified'
    | 'backfill_dry_run_verified',
  artifact: {
    readonly kind: string
    readonly artifactDigest: string
    readonly evidenceReference: string
  }
): MultiEntityStagingEvidenceBinding {
  return {
    scope: 'global',
    gate,
    reviewReference: readinessReviewReference,
    evidenceReference: artifact.evidenceReference,
    campaignReviewReference,
    sourceDigest,
    targetTenantDigest,
    artifactKind: artifact.kind,
    artifactDigest: artifact.artifactDigest,
  }
}

function input(): StrictStagingEvidenceBundleInput {
  const specificArtifacts = artifacts()
  const schemaAuthority = globalArtifactBinding(
    'schema_authority_decided',
    specificArtifacts.schemaAuthority
  )
  const node22Runtime = globalArtifactBinding(
    'node22_runtime_verified',
    specificArtifacts.node22Runtime
  )
  const access = createAccessBaselineEvidenceBindingProposal({
    captureArtifact: specificArtifacts.accessBaselineCapture,
    unchangedArtifact: specificArtifacts.accessUnchanged,
    campaignReviewReference,
    readinessReviewReference,
  }).bindings
  const safety = createSafetyModeEvidenceBindingProposal({
    featureFlagsArtifact: specificArtifacts.featureFlagsDefaultOff,
    authorizationShadowArtifact: specificArtifacts.authorizationShadow,
    campaignReviewReference,
    readinessReviewReference,
  }).bindings
  const restoredBackup = globalArtifactBinding(
    'restored_backup_verified',
    specificArtifacts.restoredBackup
  )
  const expandOnlyMigrationReview = globalArtifactBinding(
    'expand_only_migration_reviewed',
    specificArtifacts.expandOnlyMigrationReview
  )
  const migrationDryRun = globalArtifactBinding(
    'migration_dry_run_verified',
    specificArtifacts.migrationDryRun
  )
  const backfillDryRun = globalArtifactBinding(
    'backfill_dry_run_verified',
    specificArtifacts.backfillDryRun
  )
  const rollback = createRollbackRehearsalEvidenceBindingProposal({
    artifact: specificArtifacts.rollbackRehearsal,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const enrollmentClosure = createEnrollmentClosureEvidenceBindingProposal({
    artifact: specificArtifacts.enrollmentClosureShadow,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const unifiedPublicWeb = createUnifiedPublicWebEvidenceBindingProposal({
    artifact: specificArtifacts.unifiedPublicWeb,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const teacherSchedule = createTeacherScheduleEvidenceBindingProposal({
    artifact: specificArtifacts.teacherScheduleShadow,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const sharedTeacherRegistry = createSharedTeacherRegistryEvidenceBindingProposal({
    artifact: specificArtifacts.sharedTeacherRegistry,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const sharedCourseCatalog = createSharedCourseCatalogEvidenceBindingProposal({
    artifact: specificArtifacts.sharedCourseCatalog,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const observabilityRedaction = createObservabilityRedactionBindingProposal({
    artifact: specificArtifacts.observabilityRedaction,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const financeReviewByDigest = new Map(
    labels.map((label) => [
      sha256(`review://finance/${label}/entity/v1`),
      `review://finance/${label}/entity/v1`,
    ])
  )
  const legalProfile = entityArtifactBindings(
    'legal_profile_reviewed',
    specificArtifacts.legalProfile.entities
  )
  const campusMapping = entityArtifactBindings(
    'campus_mapping_reviewed',
    specificArtifacts.campusMapping.entities
  )
  const entityRollback = createEntityRollbackBindingProposal({
    manifest: specificArtifacts.entityRollback,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.entityRollback.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const nominal = createNominalPermissionPhaseLockBindingProposal({
    artifact: specificArtifacts.nominalPermissionLock,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const accounting = createAccountingImportEvidenceBindingProposal({
    artifact: specificArtifacts.accountingImport,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const financialIsolation = createFinanceIsolationEvidenceBindingProposal({
    manifest: specificArtifacts.financialIsolation,
    campaignReviewReference,
    readinessReviewReference,
  }).binding
  const accountingConnection = createFinanceAccountingConnectionBindingProposal({
    manifest: specificArtifacts.accountingConnection,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.accountingConnection.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const accountingSecretReference = createFinanceAccountingSecretReferenceBindingProposal({
    manifest: specificArtifacts.accountingSecretReference,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.accountingSecretReference.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const accountingProviderContract = createFinanceAccountingProviderContractBindingProposal({
    manifest: specificArtifacts.accountingProviderContract,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.accountingProviderContract.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const paymentSource = createFinancePaymentSourceBindingProposal({
    manifest: specificArtifacts.paymentSource,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.paymentSource.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const advertisingSource = createFinanceAdvertisingSourceBindingProposal({
    manifest: specificArtifacts.advertisingSource,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.advertisingSource.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const payloadRelationshipScope = createFinancePayloadRelationshipScopeBindingProposal({
    manifest: specificArtifacts.payloadRelationshipScope,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.payloadRelationshipScope.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const enrollmentCampaignScope = createEnrollmentCampaignScopeBindingProposal({
    manifest: specificArtifacts.enrollmentCampaignScope,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.enrollmentCampaignScope.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const finance = createFinanceReconciliationEvidenceBindingProposal({
    manifest: specificArtifacts.financeReconciliation,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.financeReconciliation.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  const entityIsolationNegative = createFinanceEntityIsolationNegativeBindingProposal({
    manifest: specificArtifacts.entityIsolationNegative,
    campaignReviewReference,
    readinessReviewReference,
    entities: specificArtifacts.entityIsolationNegative.entities.map((entity) => ({
      artifactDigest: entity.artifactDigest,
      entityReviewReference: financeReviewByDigest.get(entity.entityReviewReferenceDigest)!,
    })),
  }).bindings
  return {
    bundleInput: completeBundleInput(
      schemaAuthority,
      node22Runtime,
      access,
      safety,
      restoredBackup,
      expandOnlyMigrationReview,
      migrationDryRun,
      backfillDryRun,
      rollback,
      enrollmentClosure,
      unifiedPublicWeb,
      sharedCourseCatalog,
      sharedTeacherRegistry,
      teacherSchedule,
      observabilityRedaction,
      legalProfile,
      campusMapping,
      nominal,
      accounting,
      accountingConnection,
      accountingSecretReference,
      accountingProviderContract,
      paymentSource,
      advertisingSource,
      payloadRelationshipScope,
      enrollmentCampaignScope,
      entityRollback,
      financialIsolation,
      entityIsolationNegative,
      finance
    ),
    specificArtifacts,
    accessSurfaceBaseline: accessSurfaceBaseline(),
  }
}

function accessSurfaceBaseline() {
  const ref = (value: string) =>
    `ref:sha256:${sha256(value).slice('sha256:'.length)}` as AccessSurfaceReference
  const targetTenantRef = ref('target-tenant')
  const sourceDigests = {
    authorizationPolicy: sha256('authorization-policy'),
    payloadUsersSchema: sha256('payload-users-schema'),
    platformMembershipsSchema: sha256('platform-memberships-schema'),
    payloadApiKeysSchema: sha256('payload-api-keys-schema'),
    platformApiKeysSchema: sha256('platform-api-keys-schema'),
  }
  const payloadUserRef = ref('payload-admin')
  const platformUserRef = ref('platform-admin')
  const capturedAccess = createMultiEntityAccessSurfaceBaseline({
    targetTenantRef,
    sourceDigests,
    users: [
      {
        ref: payloadUserRef,
        source: 'payload_tenant_admin',
        tenantRef: targetTenantRef,
        roles: ['admin'],
        status: 'active',
      },
      {
        ref: platformUserRef,
        source: 'platform',
        tenantRef: null,
        roles: [],
        status: 'active',
      },
    ],
    memberships: [
      {
        ref: ref('platform-membership'),
        userRef: platformUserRef,
        tenantRef: targetTenantRef,
        roles: ['admin'],
        status: 'active',
      },
    ],
    apiKeys: [
      {
        ref: ref('platform-api-key'),
        source: 'platform',
        tenantRef: targetTenantRef,
        scopes: ['enrollments:read'],
        status: 'active',
      },
    ],
  })
  const currentAccess = capturedAccess
  const context = {
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    targetTenantRef,
  }
  const captureArtifact = createMultiEntityAccessSurfaceBaselineCaptureEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    capturedAccess,
  })
  const unchangedArtifact = createMultiEntityAccessSurfaceBaselineUnchangedEvidenceArtifact({
    campaignReviewReference,
    readinessReviewReference,
    sourceDigest,
    targetTenantDigest,
    captureArtifact,
    capturedAccess,
    currentAccess,
  })
  return { context, capturedAccess, currentAccess, captureArtifact, unchangedArtifact }
}

function completeBundleInput(
  schemaAuthority: MultiEntityStagingEvidenceBinding,
  node22Runtime: MultiEntityStagingEvidenceBinding,
  access: readonly MultiEntityStagingEvidenceBinding[],
  safety: readonly MultiEntityStagingEvidenceBinding[],
  restoredBackup: MultiEntityStagingEvidenceBinding,
  expandOnlyMigrationReview: MultiEntityStagingEvidenceBinding,
  migrationDryRun: MultiEntityStagingEvidenceBinding,
  backfillDryRun: MultiEntityStagingEvidenceBinding,
  rollback: MultiEntityStagingEvidenceBinding,
  enrollmentClosure: MultiEntityStagingEvidenceBinding,
  unifiedPublicWeb: MultiEntityStagingEvidenceBinding,
  sharedCourseCatalog: MultiEntityStagingEvidenceBinding,
  sharedTeacherRegistry: MultiEntityStagingEvidenceBinding,
  teacherSchedule: MultiEntityStagingEvidenceBinding,
  observabilityRedaction: MultiEntityStagingEvidenceBinding,
  legalProfile: readonly MultiEntityStagingEvidenceBinding[],
  campusMapping: readonly MultiEntityStagingEvidenceBinding[],
  nominal: MultiEntityStagingEvidenceBinding,
  accounting: MultiEntityStagingEvidenceBinding,
  accountingConnection: readonly MultiEntityStagingEvidenceBinding[],
  accountingSecretReference: readonly MultiEntityStagingEvidenceBinding[],
  accountingProviderContract: readonly MultiEntityStagingEvidenceBinding[],
  paymentSource: readonly MultiEntityStagingEvidenceBinding[],
  advertisingSource: readonly MultiEntityStagingEvidenceBinding[],
  payloadRelationshipScope: readonly MultiEntityStagingEvidenceBinding[],
  enrollmentCampaignScope: readonly MultiEntityStagingEvidenceBinding[],
  entityRollback: readonly MultiEntityStagingEvidenceBinding[],
  financialIsolation: MultiEntityStagingEvidenceBinding,
  entityIsolationNegative: readonly MultiEntityStagingEvidenceBinding[],
  finance: readonly MultiEntityStagingEvidenceBinding[]
): MultiEntityStagingEvidenceBundleInput {
  const globalSpecific = new Map([
    ['schema_authority_decided' as const, schemaAuthority],
    ['node22_runtime_verified' as const, node22Runtime],
    [ACCESS_BASELINE_CAPTURED_READINESS_GATE, access[0]!],
    [ACCESS_UNCHANGED_VERIFIED_READINESS_GATE, access[1]!],
    [FEATURE_FLAGS_DEFAULT_OFF_READINESS_GATE, safety[0]!],
    ['restored_backup_verified' as const, restoredBackup],
    ['expand_only_migration_reviewed' as const, expandOnlyMigrationReview],
    ['migration_dry_run_verified' as const, migrationDryRun],
    ['backfill_dry_run_verified' as const, backfillDryRun],
    [AUTHORIZATION_SHADOW_VERIFIED_READINESS_GATE, safety[1]!],
    [ROLLBACK_REHEARSED_READINESS_GATE, rollback],
    [ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE, enrollmentClosure],
    [UNIFIED_PUBLIC_WEB_REVIEWED_READINESS_GATE, unifiedPublicWeb],
    [SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE, sharedCourseCatalog],
    [SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE, sharedTeacherRegistry],
    [TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE, teacherSchedule],
    [OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE, observabilityRedaction],
    [NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE, nominal],
    [ACCOUNTING_IMPORT_STAGING_READINESS_GATE, accounting],
    [FINANCE_ISOLATION_STAGING_READINESS_GATE, financialIsolation],
  ])
  const financeByReview = new Map(finance.map((binding) => [binding.reviewReference, binding]))
  const entityIsolationByReview = new Map(
    entityIsolationNegative.map((binding) => [binding.reviewReference, binding])
  )
  const accountingConnectionByReview = new Map(
    accountingConnection.map((binding) => [binding.reviewReference, binding])
  )
  const accountingSecretByReview = new Map(
    accountingSecretReference.map((binding) => [binding.reviewReference, binding])
  )
  const accountingProviderByReview = new Map(
    accountingProviderContract.map((binding) => [binding.reviewReference, binding])
  )
  const paymentSourceByReview = new Map(
    paymentSource.map((binding) => [binding.reviewReference, binding])
  )
  const advertisingSourceByReview = new Map(
    advertisingSource.map((binding) => [binding.reviewReference, binding])
  )
  const payloadRelationshipScopeByReview = new Map(
    payloadRelationshipScope.map((binding) => [binding.reviewReference, binding])
  )
  const enrollmentCampaignScopeByReview = new Map(
    enrollmentCampaignScope.map((binding) => [binding.reviewReference, binding])
  )
  const entityRollbackByReview = new Map(
    entityRollback.map((binding) => [binding.reviewReference, binding])
  )
  const legalProfileByReview = new Map(
    legalProfile.map((binding) => [binding.reviewReference, binding])
  )
  const campusMappingByReview = new Map(
    campusMapping.map((binding) => [binding.reviewReference, binding])
  )
  const globalChecks = Object.fromEntries(
    MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) => {
      const specific = globalSpecific.get(gate)
      const genericDigest = sha256(`global:${gate}`)
      return [
        gate,
        {
          status: 'verified',
          evidenceReference:
            specific?.evidenceReference ??
            createMultiEntityContentAddressedEvidenceReference(genericDigest),
        },
      ]
    })
  ) as MultiEntityStagingReadinessInput['globalChecks']
  const entities = labels.map((label) => {
    const reviewReference = `review://finance/${label}/entity/v1`
    const financeBinding = financeByReview.get(reviewReference)!
    const entityIsolationBinding = entityIsolationByReview.get(reviewReference)!
    const accountingConnectionBinding = accountingConnectionByReview.get(reviewReference)!
    const accountingSecretBinding = accountingSecretByReview.get(reviewReference)!
    const accountingProviderBinding = accountingProviderByReview.get(reviewReference)!
    const paymentSourceBinding = paymentSourceByReview.get(reviewReference)!
    const advertisingSourceBinding = advertisingSourceByReview.get(reviewReference)!
    const payloadRelationshipScopeBinding = payloadRelationshipScopeByReview.get(reviewReference)!
    const enrollmentCampaignScopeBinding = enrollmentCampaignScopeByReview.get(reviewReference)!
    const entityRollbackBinding = entityRollbackByReview.get(reviewReference)!
    return {
      tenantId: 'tenant-private',
      legalEntityId: `entity-${label}-private`,
      accountingConnectionId: `connection-${label}-private`,
      role: label === 'sur' ? ('cep_sur_pilot' as const) : ('existing_entity' as const),
      reviewReference,
      ...(label === 'sur' ? { pilotReviewReference: 'review://finance/sur/pilot/v1' } : {}),
      checks: Object.fromEntries(
        MULTI_ENTITY_ENTITY_STAGING_GATES.map((gate) => {
          const genericDigest = sha256(`${reviewReference}:${gate}`)
          return [
            gate,
            {
              status: 'verified',
              evidenceReference:
                gate === FINANCE_RECONCILIATION_ENTITY_READINESS_GATE
                  ? financeBinding.evidenceReference
                  : gate === 'legal_profile_reviewed'
                    ? legalProfileByReview.get(reviewReference)!.evidenceReference
                    : gate === 'campus_mapping_reviewed'
                      ? campusMappingByReview.get(reviewReference)!.evidenceReference
                      : gate === FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE
                        ? accountingConnectionBinding.evidenceReference
                        : gate === FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE
                          ? accountingSecretBinding.evidenceReference
                          : gate === FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE
                            ? accountingProviderBinding.evidenceReference
                            : gate === FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE
                              ? paymentSourceBinding.evidenceReference
                              : gate === FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE
                                ? advertisingSourceBinding.evidenceReference
                                : gate ===
                                    FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE
                                  ? payloadRelationshipScopeBinding.evidenceReference
                                  : gate === ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE
                                    ? enrollmentCampaignScopeBinding.evidenceReference
                                    : gate === ENTITY_ROLLBACK_REVIEWED_READINESS_GATE
                                      ? entityRollbackBinding.evidenceReference
                                      : gate === FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE
                                        ? entityIsolationBinding.evidenceReference
                                        : createMultiEntityContentAddressedEvidenceReference(
                                            genericDigest
                                          ),
            },
          ]
        })
      ),
    }
  })
  const readiness: MultiEntityStagingReadinessInput = {
    readinessReviewReference,
    globalChecks,
    entities,
  }
  const evidenceBindings: MultiEntityStagingEvidenceBinding[] = []
  for (const [gate, evidence] of Object.entries(globalChecks)) {
    const specific = globalSpecific.get(gate as typeof NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE)
    if (specific) {
      evidenceBindings.push(specific)
      continue
    }
    const artifactDigest = sha256(`global:${gate}`)
    evidenceBindings.push({
      scope: 'global',
      gate: gate as (typeof MULTI_ENTITY_GLOBAL_STAGING_GATES)[number],
      reviewReference: readinessReviewReference,
      evidenceReference: evidence!.evidenceReference!,
      campaignReviewReference,
      sourceDigest,
      targetTenantDigest,
      artifactKind: getMultiEntitySpecificEvidenceArtifactKind('global', gate) ?? `cep_${gate}`,
      artifactDigest,
    })
  }
  for (const entity of entities) {
    for (const [gate, evidence] of Object.entries(entity.checks)) {
      if (gate === FINANCE_RECONCILIATION_ENTITY_READINESS_GATE) {
        evidenceBindings.push(financeByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === 'legal_profile_reviewed') {
        evidenceBindings.push(legalProfileByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === 'campus_mapping_reviewed') {
        evidenceBindings.push(campusMappingByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE) {
        evidenceBindings.push(accountingConnectionByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE) {
        evidenceBindings.push(accountingSecretByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_ACCOUNTING_PROVIDER_CONTRACT_READINESS_GATE) {
        evidenceBindings.push(accountingProviderByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE) {
        evidenceBindings.push(paymentSourceByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_ADVERTISING_SOURCE_REVIEWED_READINESS_GATE) {
        evidenceBindings.push(advertisingSourceByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE) {
        evidenceBindings.push(payloadRelationshipScopeByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE) {
        evidenceBindings.push(enrollmentCampaignScopeByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === ENTITY_ROLLBACK_REVIEWED_READINESS_GATE) {
        evidenceBindings.push(entityRollbackByReview.get(entity.reviewReference)!)
        continue
      }
      if (gate === FINANCE_ENTITY_ISOLATION_NEGATIVE_READINESS_GATE) {
        evidenceBindings.push(entityIsolationByReview.get(entity.reviewReference)!)
        continue
      }
      const artifactDigest = sha256(`${entity.reviewReference}:${gate}`)
      evidenceBindings.push({
        scope: 'entity',
        gate: gate as (typeof MULTI_ENTITY_ENTITY_STAGING_GATES)[number],
        reviewReference: entity.reviewReference,
        evidenceReference: evidence!.evidenceReference!,
        campaignReviewReference,
        sourceDigest,
        targetTenantDigest,
        artifactKind: getMultiEntitySpecificEvidenceArtifactKind('entity', gate) ?? `cep_${gate}`,
        artifactDigest,
      })
    }
  }
  const { rbacPolicy, capturedAccess } = accessContext()
  return {
    campaignReviewReference,
    sourceDigest,
    targetTenantDigest,
    rbacPolicy,
    capturedAccess,
    currentAccess: capturedAccess,
    readiness,
    evidenceBindings,
  }
}

function accessContext() {
  const rbacPolicy = createMultiEntityRbacPolicyArtifact(
    MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.map((path) => ({
      path,
      content: `export const access = ${JSON.stringify(path)}`,
    }))
  )
  const capturedAccess = createMultiEntityAccessBaseline({
    targetTenantId: 'tenant-private',
    policyDigest: rbacPolicy.policyDigest,
    users: [
      { id: 'current-admin', role: 'admin', tenantId: 'tenant-private', isActive: true },
      { id: 'platform', role: 'superadmin', tenantId: null, isActive: true },
    ],
  })
  return {
    rbacPolicy,
    capturedAccess,
  }
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function expectCode(run: () => unknown, code: StrictStagingEvidenceBundleError['code']) {
  expect(run).toThrowError(
    expect.objectContaining<Partial<StrictStagingEvidenceBundleError>>({ code })
  )
}

describe('strict staging evidence bundle', () => {
  it('proposes the course catalog gate without catalog, operational or financial authority', () => {
    const artifact = sharedCourseCatalogArtifact()
    const proposal = createSharedCourseCatalogEvidenceBindingProposal({
      artifact,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toMatchObject({
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canReadPayload: false,
      canWrite: false,
      canCreateCourse: false,
      canCreateCourseRun: false,
      canAssignCourseRun: false,
      canProcessEnrollments: false,
      canProcessCampaigns: false,
      canProcessFinance: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: SHARED_COURSE_CATALOG_REVIEWED_READINESS_GATE,
        artifactKind: 'cep_multi_entity_shared_course_catalog_evidence',
      },
    })
    expect(() =>
      createSharedCourseCatalogEvidenceBindingProposal({
        artifact,
        campaignReviewReference: 'review://campaign/other/v1',
        readinessReviewReference,
      })
    ).toThrow('SHARED_COURSE_CATALOG_EVIDENCE_CONTEXT_MISMATCH')
  })

  it('proposes the teacher registry gate without teacher, permission or economic authority', () => {
    const artifact = sharedTeacherRegistryArtifact()
    const proposal = createSharedTeacherRegistryEvidenceBindingProposal({
      artifact,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toMatchObject({
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canReadPayload: false,
      canWrite: false,
      canCreateTeacher: false,
      canAssignTeacher: false,
      canStoreEconomicTerms: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: SHARED_TEACHER_REGISTRY_REVIEWED_READINESS_GATE,
        artifactKind: 'cep_multi_entity_shared_teacher_registry_evidence',
      },
    })
    expect(() =>
      createSharedTeacherRegistryEvidenceBindingProposal({
        artifact,
        campaignReviewReference: 'review://campaign/other/v1',
        readinessReviewReference,
      })
    ).toThrow('SHARED_TEACHER_REGISTRY_EVIDENCE_CONTEXT_MISMATCH')
  })

  it('proposes the redaction gate without telemetry, persistence or log authority', () => {
    const artifact = artifacts().observabilityRedaction
    const proposal = createObservabilityRedactionBindingProposal({
      artifact,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toMatchObject({
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canEmitTelemetry: false,
      canPersistPayload: false,
      canReadRuntimeLogs: false,
      canDeploy: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE,
        artifactKind: 'cep_multi_entity_observability_redaction_evidence',
      },
    })
    expect(() =>
      createObservabilityRedactionBindingProposal({
        artifact,
        campaignReviewReference: 'review://campaign/other/v1',
        readinessReviewReference,
      })
    ).toThrowError(
      expect.objectContaining<Partial<ObservabilityRedactionBindingError>>({
        code: 'OBSERVABILITY_REDACTION_CONTEXT_MISMATCH',
      })
    )
  })

  it.each([
    ['tenant identifier', { tenantId: 'tenant-private' }],
    ['email value', { note: 'admin@cep.test' }],
    ['financial amount', { amount: 1200 }],
  ])('rejects a serialized artifact leaking %s', (_label, leak) => {
    const { observabilityRedaction: _ignored, ...preObservability } = artifacts()
    const surfaces = observabilitySurfaces(preObservability)
    const parsed = JSON.parse(surfaces[0]!.serializedArtifact) as Record<string, unknown>
    const leaked = { ...parsed, ...leak }
    surfaces[0] = { ...surfaces[0]!, serializedArtifact: JSON.stringify(leaked) }
    expect(() =>
      createObservabilityRedactionStagingEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        surfaces,
      })
    ).toThrow('OBSERVABILITY_REDACTION_STAGING_EVIDENCE_INVALID')
  })

  it('rejects incomplete coverage and non-canonical JSON', () => {
    const { observabilityRedaction: _ignored, ...preObservability } = artifacts()
    const surfaces = observabilitySurfaces(preObservability)
    expect(() =>
      createObservabilityRedactionStagingEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        surfaces: surfaces.slice(1),
      })
    ).toThrow('OBSERVABILITY_REDACTION_STAGING_EVIDENCE_INVALID')

    const nonCanonical = [...surfaces]
    nonCanonical[0] = {
      ...nonCanonical[0]!,
      serializedArtifact: JSON.stringify(JSON.parse(nonCanonical[0]!.serializedArtifact), null, 2),
    }
    expect(() =>
      createObservabilityRedactionStagingEvidenceArtifact({
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        surfaces: nonCanonical,
      })
    ).toThrow('OBSERVABILITY_REDACTION_STAGING_EVIDENCE_INVALID')
  })

  it('rejects forged redaction evidence and a valid audit of a substituted artifact', () => {
    const source = input()
    expect(() =>
      assertObservabilityRedactionStagingEvidenceArtifact({
        ...source.specificArtifacts.observabilityRedaction,
        canPersistPayload: true,
      })
    ).toThrow('OBSERVABILITY_REDACTION_STAGING_EVIDENCE_INVALID')

    const { observabilityRedaction: _ignored, ...preObservability } = source.specificArtifacts
    const surfaces = observabilitySurfaces(preObservability)
    const replacementDigest = `sha256:${'f'.repeat(64)}`
    const parsed = JSON.parse(surfaces[0]!.serializedArtifact) as Record<string, unknown>
    surfaces[0] = {
      ...surfaces[0]!,
      artifactDigest: replacementDigest,
      serializedArtifact: JSON.stringify({
        ...parsed,
        artifactDigest: replacementDigest,
        evidenceReference: `evidence://sha256/${'f'.repeat(64)}`,
      }),
    }
    const substitutedAudit = createObservabilityRedactionStagingEvidenceArtifact({
      campaignReviewReference,
      readinessReviewReference,
      sourceDigest,
      targetTenantDigest,
      surfaces,
    })
    const substitutedBinding = createObservabilityRedactionBindingProposal({
      artifact: substitutedAudit,
      campaignReviewReference,
      readinessReviewReference,
    }).binding
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: {
            ...source.bundleInput,
            readiness: {
              ...source.bundleInput.readiness,
              globalChecks: {
                ...source.bundleInput.readiness.globalChecks,
                [OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE]: {
                  status: 'verified',
                  evidenceReference: substitutedBinding.evidenceReference,
                },
              },
            },
            evidenceBindings: source.bundleInput.evidenceBindings.map((binding) =>
              binding.gate === OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE
                ? substitutedBinding
                : binding
            ),
          },
          specificArtifacts: {
            ...source.specificArtifacts,
            observabilityRedaction: substitutedAudit,
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('proposes the enrollment closure gate without loader, write or pause authority', () => {
    const artifact = enrollmentClosureShadowArtifact()
    const proposal = createEnrollmentClosureEvidenceBindingProposal({
      artifact,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toMatchObject({
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canLoadSnapshot: false,
      canWrite: false,
      canPauseAds: false,
      canExecutePause: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: ENROLLMENT_CLOSURE_SHADOW_VERIFIED_READINESS_GATE,
        artifactKind: 'cep_course_run_enrollment_closure_shadow_evidence',
      },
    })
    expect(() =>
      createEnrollmentClosureEvidenceBindingProposal({
        artifact,
        campaignReviewReference: 'review://campaign/other/v1',
        readinessReviewReference,
      })
    ).toThrowError(
      expect.objectContaining<Partial<EnrollmentClosureEvidenceBindingError>>({
        code: 'ENROLLMENT_CLOSURE_EVIDENCE_CONTEXT_MISMATCH',
      })
    )
  })

  it('proposes the teacher schedule gate without loader, write or assignment authority', () => {
    const artifact = teacherScheduleShadowArtifact()
    const proposal = createTeacherScheduleEvidenceBindingProposal({
      artifact,
      campaignReviewReference,
      readinessReviewReference,
    })
    expect(proposal).toMatchObject({
      status: 'proposed',
      canBindAutomatically: false,
      canMarkVerified: false,
      canLoadSnapshot: false,
      canWrite: false,
      canApply: false,
      canAssignTeacher: false,
      canActivate: false,
      canChangePermissions: false,
      binding: {
        scope: 'global',
        gate: TEACHER_SCHEDULE_SHADOW_VERIFIED_READINESS_GATE,
        artifactKind: 'cep_multi_entity_teacher_schedule_shadow_evidence',
      },
    })
    expect(() =>
      createTeacherScheduleEvidenceBindingProposal({
        artifact,
        campaignReviewReference: 'review://campaign/other/v1',
        readinessReviewReference,
      })
    ).toThrowError(
      expect.objectContaining<Partial<TeacherScheduleEvidenceBindingError>>({
        code: 'TEACHER_SCHEDULE_EVIDENCE_CONTEXT_MISMATCH',
      })
    )
  })

  it('directly verifies all 56 specific bindings but remains blocked on staging execution', () => {
    const result = createStrictStagingEvidenceBundle(input())

    expect(result).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_strict_staging_evidence_bundle',
      mode: 'direct_specific_artifact_verification_review_only',
      verdict: 'blocked_no_staging_execution_evidence',
      canDeclareStagingReady: false,
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      sourceDigest,
      targetTenantDigest,
      metrics: {
        bundleVerdict: 'ready_for_manual_staging_review',
        requiredBindings: 56,
        directlyVerifiedArtifactKinds: 32,
        directlyVerifiedBindings: 56,
        genericOnlyBindings: 0,
        sourceRegisteredStagingExecutionBindings: 0,
      },
    })
    expect(result.verificationDigest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(result.verificationReference).toBe(
      `evidence://sha256/${result.verificationDigest.slice('sha256:'.length)}`
    )
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.metrics)).toBe(true)
    expect(JSON.stringify(result)).not.toContain('tenant-private')
    expect(JSON.stringify(result)).not.toContain('accountingTransactions')
  })

  it.each([
    [
      'record-bearing plan',
      planMultiEntitySchemaExpansion([
        {
          collection: 'course-runs',
          recordId: 'run-private',
          tenantId: 'tenant-private',
          currentLegalEntityId: null,
          reviewedLegalEntityIds: ['entity-private'],
          dependencyLegalEntityIds: ['entity-private'],
        },
      ]),
    ],
    ['write-capable plan', { ...planMultiEntitySchemaExpansion([]), canWrite: true }],
  ])('rejects a %s from the source-only schema authority gate', (_label, schemaExpansionPlan) => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: { ...source.specificArtifacts, schemaExpansionPlan } as never,
        }),
      'STRICT_STAGING_EVIDENCE_SCHEMA_EXPANSION_PLAN_INVALID'
    )
  })

  it.each([
    ['substituted plan digest', 'payload', sha256('another-expand-only-plan')],
    [
      'authority drift',
      'drizzle_control_plane',
      digestMultiEntitySchemaExpansionPlan(planMultiEntitySchemaExpansion([])),
    ],
  ] as const)(
    'rejects %s even when the replacement authority artifact is internally valid',
    (_label, authority, schemaExpansionPlanDigest) => {
      const source = input()
      const schemaAuthority = createMultiEntitySchemaAuthorityReviewEvidenceArtifact({
        reviewEnvironment: 'staging',
        campaignReviewReference,
        readinessReviewReference,
        sourceDigest,
        targetTenantDigest,
        decisionReference: 'review://authority/payload-cep/replacement-v1',
        authority,
        schemaFingerprintDigest: sha256('cep-payload-schema-fingerprint-v1'),
        schemaExpansionPlanDigest,
      })
      const replacementBinding = globalArtifactBinding('schema_authority_decided', schemaAuthority)
      const evidenceBindings = source.bundleInput.evidenceBindings.map((binding) =>
        binding.gate === 'schema_authority_decided' ? replacementBinding : binding
      )

      expectCode(
        () =>
          createStrictStagingEvidenceBundle({
            ...source,
            bundleInput: {
              ...source.bundleInput,
              readiness: {
                ...source.bundleInput.readiness,
                globalChecks: {
                  ...source.bundleInput.readiness.globalChecks,
                  schema_authority_decided: {
                    status: 'verified',
                    evidenceReference: schemaAuthority.evidenceReference,
                  },
                },
              },
              evidenceBindings,
            },
            specificArtifacts: { ...source.specificArtifacts, schemaAuthority },
          }),
        'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
      )
    }
  )

  it('is deterministic when the 56 bindings arrive in another order', () => {
    const source = input()
    const reordered = {
      ...source,
      bundleInput: {
        ...source.bundleInput,
        evidenceBindings: [...source.bundleInput.evidenceBindings].reverse(),
      },
    }
    expect(createStrictStagingEvidenceBundle(reordered)).toEqual(
      createStrictStagingEvidenceBundle(source)
    )
  })

  it.each([
    ['accessBaselineCapture', 'STRICT_STAGING_EVIDENCE_ACCESS_CAPTURE_ARTIFACT_INVALID'],
    ['accessUnchanged', 'STRICT_STAGING_EVIDENCE_ACCESS_UNCHANGED_ARTIFACT_INVALID'],
    ['featureFlagsDefaultOff', 'STRICT_STAGING_EVIDENCE_FEATURE_FLAGS_ARTIFACT_INVALID'],
    ['restoredBackup', 'STRICT_STAGING_EVIDENCE_RESTORED_BACKUP_ARTIFACT_INVALID'],
    ['node22Runtime', 'STRICT_STAGING_EVIDENCE_NODE22_RUNTIME_ARTIFACT_INVALID'],
    ['expandOnlyMigrationReview', 'STRICT_STAGING_EVIDENCE_EXPAND_ONLY_MIGRATION_ARTIFACT_INVALID'],
    ['migrationDryRun', 'STRICT_STAGING_EVIDENCE_MIGRATION_DRY_RUN_ARTIFACT_INVALID'],
    ['backfillDryRun', 'STRICT_STAGING_EVIDENCE_BACKFILL_DRY_RUN_ARTIFACT_INVALID'],
    ['authorizationShadow', 'STRICT_STAGING_EVIDENCE_AUTHORIZATION_SHADOW_ARTIFACT_INVALID'],
    ['rollbackRehearsal', 'STRICT_STAGING_EVIDENCE_ROLLBACK_REHEARSAL_ARTIFACT_INVALID'],
    ['nominalPermissionLock', 'STRICT_STAGING_EVIDENCE_NOMINAL_ARTIFACT_INVALID'],
    ['sharedCourseCatalog', 'STRICT_STAGING_EVIDENCE_SHARED_COURSE_CATALOG_ARTIFACT_INVALID'],
    ['sharedTeacherRegistry', 'STRICT_STAGING_EVIDENCE_SHARED_TEACHER_REGISTRY_ARTIFACT_INVALID'],
    ['legalProfile', 'STRICT_STAGING_EVIDENCE_LEGAL_PROFILE_ARTIFACT_INVALID'],
    ['campusMapping', 'STRICT_STAGING_EVIDENCE_CAMPUS_MAPPING_ARTIFACT_INVALID'],
    ['accountingImport', 'STRICT_STAGING_EVIDENCE_ACCOUNTING_ARTIFACT_INVALID'],
    ['accountingConnection', 'STRICT_STAGING_EVIDENCE_ACCOUNTING_CONNECTION_ARTIFACT_INVALID'],
    [
      'accountingSecretReference',
      'STRICT_STAGING_EVIDENCE_ACCOUNTING_SECRET_REFERENCE_ARTIFACT_INVALID',
    ],
    [
      'accountingProviderContract',
      'STRICT_STAGING_EVIDENCE_ACCOUNTING_PROVIDER_CONTRACT_ARTIFACT_INVALID',
    ],
    ['paymentSource', 'STRICT_STAGING_EVIDENCE_PAYMENT_SOURCE_ARTIFACT_INVALID'],
    ['advertisingSource', 'STRICT_STAGING_EVIDENCE_ADVERTISING_SOURCE_ARTIFACT_INVALID'],
    [
      'payloadRelationshipScope',
      'STRICT_STAGING_EVIDENCE_PAYLOAD_RELATIONSHIP_SCOPE_ARTIFACT_INVALID',
    ],
    ['entityRollback', 'STRICT_STAGING_EVIDENCE_ENTITY_ROLLBACK_ARTIFACT_INVALID'],
    ['financialIsolation', 'STRICT_STAGING_EVIDENCE_FINANCE_ISOLATION_ARTIFACT_INVALID'],
    [
      'entityIsolationNegative',
      'STRICT_STAGING_EVIDENCE_ENTITY_ISOLATION_NEGATIVE_ARTIFACT_INVALID',
    ],
    ['financeReconciliation', 'STRICT_STAGING_EVIDENCE_FINANCE_ARTIFACT_INVALID'],
  ] as const)('rejects a forged %s artifact', (key, code) => {
    const source = input()
    const artifact = source.specificArtifacts[key]
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            [key]: { ...artifact, artifactDigest: `sha256:${'c'.repeat(64)}` },
          },
        } as never),
      code
    )
  })

  it('rejects substitution of a specialized binding even when the generic shape is valid', () => {
    const source = input()
    const replacementDigest = sha256('substituted-nominal-artifact')
    const evidenceBindings = source.bundleInput.evidenceBindings.map((binding) =>
      binding.gate === NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE
        ? {
            ...binding,
            artifactDigest: replacementDigest,
            evidenceReference:
              createMultiEntityContentAddressedEvidenceReference(replacementDigest),
          }
        : binding
    )
    const globalChecks = {
      ...source.bundleInput.readiness.globalChecks,
      [NOMINAL_PERMISSION_PHASE_LOCK_READINESS_GATE]: {
        status: 'verified' as const,
        evidenceReference: createMultiEntityContentAddressedEvidenceReference(replacementDigest),
      },
    }
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: {
            ...source.bundleInput,
            readiness: { ...source.bundleInput.readiness, globalChecks },
            evidenceBindings,
          },
        }),
      'STRICT_STAGING_EVIDENCE_BINDING_MISMATCH'
    )
  })

  it.each([
    ['legal_profile_reviewed', 'STRICT_STAGING_EVIDENCE_BINDING_MISMATCH'],
    ['campus_mapping_reviewed', 'STRICT_STAGING_EVIDENCE_BINDING_MISMATCH'],
  ] as const)('rejects a substituted %s aggregate artifact binding', (gate, code) => {
    const source = input()
    const replacementDigest = sha256(`substituted:${gate}`)
    const replacementEvidenceReference =
      createMultiEntityContentAddressedEvidenceReference(replacementDigest)
    const evidenceBindings = source.bundleInput.evidenceBindings.map((binding) =>
      binding.gate === gate
        ? {
            ...binding,
            artifactDigest: replacementDigest,
            evidenceReference: replacementEvidenceReference,
          }
        : binding
    )
    const entities = source.bundleInput.readiness.entities.map((entity) => ({
      ...entity,
      checks: {
        ...entity.checks,
        [gate]: {
          ...entity.checks[gate],
          status: 'verified' as const,
          evidenceReference: replacementEvidenceReference,
        },
      },
    }))
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: {
            ...source.bundleInput,
            readiness: { ...source.bundleInput.readiness, entities },
            evidenceBindings,
          },
        }),
      code
    )
  })

  it('rejects artifact reuse across another campaign, source or tenant context', () => {
    for (const change of [
      { campaignReviewReference: 'review://campaign/other/staging-v1' },
      { sourceDigest: `sha256:${'d'.repeat(64)}` },
      { targetTenantDigest: `sha256:${'e'.repeat(64)}` },
    ]) {
      const source = input()
      const evidenceBindings = source.bundleInput.evidenceBindings.map((binding) => ({
        ...binding,
        ...(change.campaignReviewReference
          ? { campaignReviewReference: change.campaignReviewReference }
          : {}),
        ...(change.sourceDigest ? { sourceDigest: change.sourceDigest } : {}),
        ...(change.targetTenantDigest ? { targetTenantDigest: change.targetTenantDigest } : {}),
      }))
      expectCode(
        () =>
          createStrictStagingEvidenceBundle({
            ...source,
            bundleInput: { ...source.bundleInput, ...change, evidenceBindings },
          }),
        'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
      )
    }
  })

  it('rejects current access drift against the sealed unchanged artifact', () => {
    const source = input()
    const currentAccess = createMultiEntityAccessBaseline({
      targetTenantId: 'tenant-private',
      policyDigest: source.bundleInput.rbacPolicy.policyDigest,
      users: [
        {
          id: 'current-admin',
          role: 'gestor',
          tenantId: 'tenant-private',
          isActive: true,
        },
        { id: 'platform', role: 'superadmin', tenantId: null, isActive: true },
      ],
    })
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: { ...source.bundleInput, currentAccess },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('requires the supplementary access-surface baseline', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          accessSurfaceBaseline: undefined,
        } as never),
      'STRICT_STAGING_EVIDENCE_ACCESS_SURFACE_BASELINE_INVALID'
    )
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          accessSurfaceBaseline: {},
        } as never),
      'STRICT_STAGING_EVIDENCE_ACCESS_SURFACE_BASELINE_INVALID'
    )
  })

  it('rejects API-key drift in the supplementary access-surface baseline', () => {
    const source = input()
    const baseline = source.accessSurfaceBaseline
    const currentAccess = createMultiEntityAccessSurfaceBaseline({
      targetTenantRef: baseline.capturedAccess.targetTenantRef,
      sourceDigests: baseline.capturedAccess.sourceDigests,
      users: baseline.capturedAccess.users,
      memberships: baseline.capturedAccess.memberships,
      apiKeys: baseline.capturedAccess.apiKeys.map((apiKey) => ({
        ...apiKey,
        status: 'revoked' as const,
      })),
    })
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          accessSurfaceBaseline: { ...baseline, currentAccess },
        }),
      'STRICT_STAGING_EVIDENCE_ACCESS_SURFACE_BASELINE_INVALID'
    )
  })

  it('rejects a valid connection artifact whose entity scope differs from finance evidence', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            accountingConnection: accountingConnectionManifest('connection-norte-substituted'),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid secret artifact whose scope differs from the reviewed connection', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            accountingSecretReference: accountingSecretReferenceManifest(
              'connection-norte-substituted'
            ),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid provider contract bound to another external company', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            accountingProviderContract: accountingProviderContractManifest(
              'connection-norte-private',
              'company-norte-substituted'
            ),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid payment source bound to another accounting scope', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            paymentSource: paymentSourceManifest('connection-norte-substituted'),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid advertising source bound to another accounting scope', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            advertisingSource: advertisingSourceManifest('connection-norte-substituted'),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid Payload scope artifact linked to substituted source mappings', () => {
    const source = input()
    const substitutedPayment = paymentSourceManifest('connection-norte-substituted')
    const substitutedAdvertising = advertisingSourceManifest('connection-norte-substituted')
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            payloadRelationshipScope: payloadRelationshipScopeManifest(
              substitutedPayment,
              substitutedAdvertising,
              'connection-norte-substituted'
            ),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a valid entity rollback bound to another accounting scope', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          specificArtifacts: {
            ...source.specificArtifacts,
            entityRollback: entityRollbackManifest(
              source.specificArtifacts.rollbackRehearsal,
              'connection-norte-substituted'
            ),
          },
        }),
      'STRICT_STAGING_EVIDENCE_CONTEXT_MISMATCH'
    )
  })

  it('rejects a partial finance mapping through the complete-bundle gate', () => {
    const source = input()
    let removedOneFinanceBinding = false
    const evidenceBindings = source.bundleInput.evidenceBindings.filter((binding) => {
      if (
        binding.gate === FINANCE_RECONCILIATION_ENTITY_READINESS_GATE &&
        !removedOneFinanceBinding
      ) {
        removedOneFinanceBinding = true
        return false
      }
      return true
    })
    expect(removedOneFinanceBinding).toBe(true)
    expect(evidenceBindings).toHaveLength(55)
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: { ...source.bundleInput, evidenceBindings },
        }),
      'STRICT_STAGING_EVIDENCE_BUNDLE_INVALID'
    )
  })

  it('wraps an invalid generic-only binding without overstating specific verification', () => {
    const source = input()
    const evidenceBindings = source.bundleInput.evidenceBindings.map((binding) =>
      binding.gate === 'teacher_schedule_shadow_verified'
        ? { ...binding, artifactDigest: `sha256:${'f'.repeat(64)}` }
        : binding
    )
    expect(evidenceBindings).not.toEqual(source.bundleInput.evidenceBindings)
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: { ...source.bundleInput, evidenceBindings },
        }),
      'STRICT_STAGING_EVIDENCE_BUNDLE_INVALID'
    )
  })

  it('rejects automation metadata and exports no activation capability', async () => {
    const source = input()
    expectCode(
      () => createStrictStagingEvidenceBundle({ ...source, activate: true } as never),
      'STRICT_STAGING_EVIDENCE_INPUT_INVALID'
    )
    const exported = await import('../strict-staging-evidence-bundle')
    expect(Object.keys(exported)).not.toEqual(
      expect.arrayContaining([
        'deploy',
        'migrate',
        'activate',
        'applyPermissions',
        'markStagingReady',
      ])
    )
  })

  it('fails closed with a safe code for a malformed nested bundle', () => {
    const source = input()
    expectCode(
      () =>
        createStrictStagingEvidenceBundle({
          ...source,
          bundleInput: { campaignReviewReference } as never,
        }),
      'STRICT_STAGING_EVIDENCE_BUNDLE_INVALID'
    )
  })
})
