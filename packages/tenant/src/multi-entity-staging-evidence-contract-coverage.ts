import {
  MULTI_ENTITY_ENTITY_STAGING_GATES,
  MULTI_ENTITY_GLOBAL_STAGING_GATES,
  type MultiEntityEntityStagingGate,
  type MultiEntityGlobalStagingGate,
} from './multi-entity-staging-readiness'
import {
  MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES,
  getMultiEntitySpecificEvidenceArtifactKind,
} from './multi-entity-staging-evidence-bundle'

export interface MultiEntityStagingEvidenceContractCoverageEntry {
  readonly scope: 'global' | 'entity'
  readonly gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
  readonly requiredBindings: 1 | 3
  readonly validation: 'specific_artifact_kind_enforced' | 'generic_content_addressed_only'
  readonly artifactKind: string | null
}

export interface MultiEntityStagingEvidenceContractCoverageManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_staging_evidence_contract_coverage'
  readonly mode: 'source_contract_coverage_only'
  readonly verdict: 'specific_contract_coverage_complete_no_staging_execution'
  readonly canDeclareStagingReady: false
  readonly canDeploy: false
  readonly canMigrate: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly metrics: {
    readonly globalGateTypes: 20
    readonly entityGateTypes: 12
    readonly gateTypes: 32
    readonly requiredBindings: 56
    readonly specificArtifactGateTypes: number
    readonly genericOnlyGateTypes: number
    readonly specificallyConstrainedBindings: number
    readonly genericOnlyBindings: number
    readonly sourceRegisteredStagingExecutionBindings: 0
  }
  readonly gates: readonly MultiEntityStagingEvidenceContractCoverageEntry[]
}

/**
 * Reports source-level artifact-kind enforcement, not staging execution. The
 * Every binding has a reviewed specific contract, but this source audit still
 * records zero staging executions and grants no operational authority.
 */
export function createMultiEntityStagingEvidenceContractCoverageManifest(): MultiEntityStagingEvidenceContractCoverageManifest {
  const gates = Object.freeze([
    ...MULTI_ENTITY_GLOBAL_STAGING_GATES.map((gate) => coverageEntry('global', gate)),
    ...MULTI_ENTITY_ENTITY_STAGING_GATES.map((gate) => coverageEntry('entity', gate)),
  ])
  const specificArtifactGateTypes = gates.filter(
    ({ validation }) => validation === 'specific_artifact_kind_enforced'
  ).length
  const specificallyConstrainedBindings = gates.reduce(
    (total, gate) =>
      total + (gate.validation === 'specific_artifact_kind_enforced' ? gate.requiredBindings : 0),
    0
  )
  const requiredBindings = gates.reduce((total, gate) => total + gate.requiredBindings, 0)
  if (
    MULTI_ENTITY_GLOBAL_STAGING_GATES.length !== 20 ||
    MULTI_ENTITY_ENTITY_STAGING_GATES.length !== 12 ||
    gates.length !== 32 ||
    requiredBindings !== 56 ||
    specificArtifactGateTypes !== MULTI_ENTITY_SPECIFIC_EVIDENCE_ARTIFACT_POLICIES.length
  ) {
    throw new Error('MULTI_ENTITY_STAGING_EVIDENCE_CONTRACT_POLICY_INVALID')
  }

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_staging_evidence_contract_coverage',
    mode: 'source_contract_coverage_only',
    verdict: 'specific_contract_coverage_complete_no_staging_execution',
    canDeclareStagingReady: false,
    canDeploy: false,
    canMigrate: false,
    canActivate: false,
    canChangePermissions: false,
    metrics: Object.freeze({
      globalGateTypes: 20,
      entityGateTypes: 12,
      gateTypes: 32,
      requiredBindings: 56,
      specificArtifactGateTypes,
      genericOnlyGateTypes: gates.length - specificArtifactGateTypes,
      specificallyConstrainedBindings,
      genericOnlyBindings: 56 - specificallyConstrainedBindings,
      sourceRegisteredStagingExecutionBindings: 0,
    }),
    gates,
  })
}

export function serializeMultiEntityStagingEvidenceContractCoverageManifest(): string {
  return JSON.stringify(createMultiEntityStagingEvidenceContractCoverageManifest())
}

function coverageEntry(
  scope: 'global' | 'entity',
  gate: MultiEntityGlobalStagingGate | MultiEntityEntityStagingGate
): MultiEntityStagingEvidenceContractCoverageEntry {
  const artifactKind = getMultiEntitySpecificEvidenceArtifactKind(scope, gate)
  return Object.freeze({
    scope,
    gate,
    requiredBindings: scope === 'global' ? 1 : 3,
    validation:
      artifactKind === null
        ? ('generic_content_addressed_only' as const)
        : ('specific_artifact_kind_enforced' as const),
    artifactKind,
  })
}
