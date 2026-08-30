import { describe, expect, it } from 'vitest'

import {
  MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES,
  getMultiEntitySpecificEvidenceArtifactKind,
} from '../src/multi-entity-staging-evidence-bundle'
import {
  createMultiEntityStagingEvidenceContractCoverageManifest,
  serializeMultiEntityStagingEvidenceContractCoverageManifest,
} from '../src/multi-entity-staging-evidence-contract-coverage'
import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
} from '../src/multi-entity-staging-readiness'

describe('multi-entity staging evidence contract coverage', () => {
  it('constrains all 56 bindings while recording zero staging executions', () => {
    const manifest = createMultiEntityStagingEvidenceContractCoverageManifest()

    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_multi_entity_staging_evidence_contract_coverage',
      mode: 'source_contract_coverage_only',
      verdict: 'specific_contract_coverage_complete_no_staging_execution',
      canDeclareStagingReady: false,
      canDeploy: false,
      canMigrate: false,
      canActivate: false,
      canChangePermissions: false,
      metrics: {
        globalGateTypes: 20,
        entityGateTypes: 12,
        gateTypes: 32,
        requiredBindings: 56,
        specificArtifactGateTypes: 32,
        genericOnlyGateTypes: 0,
        specificallyConstrainedBindings: 56,
        genericOnlyBindings: 0,
        sourceRegisteredStagingExecutionBindings: 0,
      },
    })
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.metrics)).toBe(true)
    expect(Object.isFrozen(manifest.gates)).toBe(true)
    expect(manifest.gates.every(Object.isFrozen)).toBe(true)
  })

  it('accounts for every gate type exactly once and every entity gate three times', () => {
    const manifest = createMultiEntityStagingEvidenceContractCoverageManifest()
    const keys = manifest.gates.map(({ scope, gate }) => `${scope}:${gate}`)

    expect(manifest.gates).toHaveLength(32)
    expect(new Set(keys).size).toBe(32)
    expect(manifest.gates.filter(({ scope }) => scope === 'global')).toHaveLength(
      MULTI_ENTITY_GLOBAL_STAGING_GATES.length
    )
    expect(manifest.gates.filter(({ scope }) => scope === 'entity')).toHaveLength(
      MULTI_ENTITY_ENTITY_STAGING_GATES.length
    )
    expect(manifest.gates.reduce((total, gate) => total + gate.requiredBindings, 0)).toBe(56)
  })

  it('registers all thirty-two reviewed specific contracts', () => {
    const manifest = createMultiEntityStagingEvidenceContractCoverageManifest()
    const specific = manifest.gates.filter(
      ({ validation }) => validation === 'specific_artifact_kind_enforced'
    )

    expect(specific).toEqual([
      {
        scope: 'global',
        gate: 'schema_authority_decided',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_schema_authority_review_evidence',
      },
      {
        scope: 'global',
        gate: 'node22_runtime_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_node22_runtime_evidence',
      },
      {
        scope: 'global',
        gate: 'access_baseline_captured',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_access_baseline_capture_evidence',
      },
      {
        scope: 'global',
        gate: 'access_unchanged_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_access_baseline_unchanged_evidence',
      },
      {
        scope: 'global',
        gate: 'all_feature_flags_default_off',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_feature_flags_default_off_evidence',
      },
      {
        scope: 'global',
        gate: 'restored_backup_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_restored_backup_evidence',
      },
      {
        scope: 'global',
        gate: 'expand_only_migration_reviewed',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_expand_only_migration_review_evidence',
      },
      {
        scope: 'global',
        gate: 'migration_dry_run_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_migration_dry_run_evidence',
      },
      {
        scope: 'global',
        gate: 'backfill_dry_run_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_backfill_dry_run_evidence',
      },
      {
        scope: 'global',
        gate: 'rollback_rehearsed',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_rollback_rehearsal_evidence',
      },
      {
        scope: 'global',
        gate: 'unified_public_web_reviewed',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_unified_public_web_review_evidence',
      },
      {
        scope: 'global',
        gate: 'shared_course_catalog_reviewed',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_shared_course_catalog_evidence',
      },
      {
        scope: 'global',
        gate: 'shared_teacher_registry_reviewed',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_shared_teacher_registry_evidence',
      },
      {
        scope: 'global',
        gate: 'teacher_schedule_shadow_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_teacher_schedule_shadow_evidence',
      },
      {
        scope: 'global',
        gate: 'enrollment_closure_shadow_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_course_run_enrollment_closure_shadow_evidence',
      },
      {
        scope: 'global',
        gate: 'authorization_shadow_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_authorization_shadow_evidence',
      },
      {
        scope: 'global',
        gate: 'nominal_permission_phase_lock_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_nominal_permission_phase_lock_evidence',
      },
      {
        scope: 'global',
        gate: 'financial_isolation_harness_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_isolation_staging_evidence',
      },
      {
        scope: 'global',
        gate: 'accounting_import_staging_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_accounting_import_staging_evidence',
      },
      {
        scope: 'global',
        gate: 'observability_redaction_verified',
        requiredBindings: 1,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_observability_redaction_evidence',
      },
      {
        scope: 'entity',
        gate: 'legal_profile_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_legal_profile_entity_evidence',
      },
      {
        scope: 'entity',
        gate: 'campus_mapping_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_campus_mapping_entity_evidence',
      },
      {
        scope: 'entity',
        gate: 'accounting_connection_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_accounting_connection_review_evidence',
      },
      {
        scope: 'entity',
        gate: 'secret_reference_configured',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_secret_reference_configuration_evidence',
      },
      {
        scope: 'entity',
        gate: 'accounting_provider_contract_verified',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_accounting_provider_contract_evidence',
      },
      {
        scope: 'entity',
        gate: 'payload_relationship_scope_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_payload_relationship_scope_review_evidence',
      },
      {
        scope: 'entity',
        gate: 'payment_source_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_payment_source_review_evidence',
      },
      {
        scope: 'entity',
        gate: 'advertising_source_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_advertising_source_review_evidence',
      },
      {
        scope: 'entity',
        gate: 'entity_rollback_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_entity_rollback_review_evidence',
      },
      {
        scope: 'entity',
        gate: 'isolation_negative_cases_verified',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_entity_isolation_negative_evidence',
      },
      {
        scope: 'entity',
        gate: 'finance_shadow_observed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_finance_reconciliation_entity_evidence',
      },
      {
        scope: 'entity',
        gate: 'enrollment_campaign_scope_reviewed',
        requiredBindings: 3,
        validation: 'specific_artifact_kind_enforced',
        artifactKind: 'cep_multi_entity_enrollment_campaign_scope_review_evidence',
      },
    ])
    expect(MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES).toHaveLength(32)
    expect(Object.isFrozen(MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES)).toBe(true)
    expect(MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES.every(Object.isFrozen)).toBe(true)
  })

  it.each([
    ['global', 'node22_runtime_verified'],
    ['global', 'expand_only_migration_reviewed'],
    ['global', 'migration_dry_run_verified'],
    ['global', 'backfill_dry_run_verified'],
  ] as const)('requires %s:%s to bind a dedicated artifact kind', (scope, gate) => {
    const entry = createMultiEntityStagingEvidenceContractCoverageManifest().gates.find(
      (candidate) => candidate.scope === scope && candidate.gate === gate
    )

    expect(entry).toMatchObject({
      validation: 'specific_artifact_kind_enforced',
    })
    expect(getMultiEntitySpecificEvidenceArtifactKind(scope, gate)).toMatch(/^cep_.+_evidence$/)
  })

  it('requires the restored backup gate to bind the dedicated artifact kind', () => {
    expect(getMultiEntitySpecificEvidenceArtifactKind('global', 'restored_backup_verified')).toBe(
      'cep_multi_entity_restored_backup_evidence'
    )
  })

  it('serializes deterministically without tenant, entity, user or runtime claims', () => {
    const first = serializeMultiEntityStagingEvidenceContractCoverageManifest()
    const second = serializeMultiEntityStagingEvidenceContractCoverageManifest()

    expect(second).toBe(first)
    for (const value of ['tenantId', 'legalEntityId', 'userId', 'review://', 'evidence://']) {
      expect(first).not.toContain(value)
    }
    expect(first).not.toContain('ready_for_manual_staging_review')
    expect(first).not.toContain('generatedAt')
  })

  it('exports no operation that can mark ready, bind, deploy, activate or change permissions', async () => {
    const module = await import('../src/multi-entity-staging-evidence-contract-coverage')
    expect(
      Object.keys(module).filter((key) =>
        /markReady|bind|deploy|activate|changePermission/i.test(key)
      )
    ).toEqual([])
  })
})
