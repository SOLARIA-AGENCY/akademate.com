import {
  planMultiEntityBackfill,
  type EntityScopedLegacyRecord,
  type EntityScopedRecordType,
  type MultiEntityBackfillPlan,
} from './multi-entity-backfill'
import {
  planExplicitEntityResolutions,
  type ExplicitEntityResolutionPlan,
  type ExplicitEntityResolutionRequest,
  type ExplicitEntityResolutionSource,
} from './multi-entity-explicit-resolution'
import {
  projectPayloadOperationalSnapshot,
  type PayloadOperationalProjection,
  type PayloadOperationalSnapshot,
} from './multi-entity-payload-projection'
import {
  validateMultiEntityTopology,
  type MultiEntityTopology,
  type MultiEntityTopologyIssue,
} from './multi-entity-topology'

export interface UnifiedMultiEntityShadowInput extends PayloadOperationalSnapshot {
  readonly topology: MultiEntityTopology
  readonly explicitResolutions: readonly ExplicitEntityResolutionRequest[]
}

export type UnifiedMultiEntityProposalSource = 'campus_binding' | ExplicitEntityResolutionSource

export interface UnifiedMultiEntityRollback {
  readonly operation: 'restore_null_if_unchanged'
  readonly expectedLegalEntityId: string
  readonly restoreLegalEntityId: null
}

export interface UnifiedMultiEntityProposal {
  readonly operation: 'set_if_null'
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly tenantId: string
  readonly beforeLegalEntityId: null
  readonly proposedLegalEntityId: string
  readonly source: UnifiedMultiEntityProposalSource
  readonly campusId?: string
  readonly reviewReference?: string
  readonly rollback: UnifiedMultiEntityRollback
}

export type UnifiedMultiEntityShadowIssueCode =
  | 'proposal_overlap'
  | 'proposal_entity_conflict'
  | 'coverage_gap'

export interface UnifiedMultiEntityShadowIssue {
  readonly code: UnifiedMultiEntityShadowIssueCode
  readonly recordType: EntityScopedRecordType
  readonly recordId: string
  readonly relatedId?: string
}

export interface UnifiedMultiEntityShadowSummary {
  readonly sourceRecords: number
  readonly projectedRecords: number
  readonly targetRecords: number
  readonly alreadyAssigned: number
  readonly campusBindingProposals: number
  readonly explicitReviewProposals: number
  readonly inheritedCampaignProposals: number
  readonly coveredRecords: number
  readonly unresolvedRecords: number
  readonly blockedIssues: number
}

export interface UnifiedMultiEntityShadowPlan {
  readonly mode: 'unified_shadow_dry_run'
  readonly canWrite: false
  readonly canApply: false
  readonly ready: boolean
  readonly topologyIssues: readonly MultiEntityTopologyIssue[]
  readonly projection: PayloadOperationalProjection
  readonly campusBackfill: MultiEntityBackfillPlan
  readonly explicitResolution: ExplicitEntityResolutionPlan
  readonly proposals: readonly UnifiedMultiEntityProposal[]
  readonly issues: readonly UnifiedMultiEntityShadowIssue[]
  readonly summary: UnifiedMultiEntityShadowSummary
}

/**
 * Builds one read-only coverage plan across campus-derived and explicitly
 * reviewed entity assignments. It does not fetch, persist or authorize data.
 */
export function planUnifiedMultiEntityShadow(
  input: UnifiedMultiEntityShadowInput
): UnifiedMultiEntityShadowPlan {
  const topologyIssues = validateMultiEntityTopology(input.topology)
  const projection = projectPayloadOperationalSnapshot(input)
  const campusRecords = projection.records.filter(({ campusId }) => campusId !== null)
  const explicitRecords = projection.records.filter(({ campusId }) => campusId === null)

  const campusBackfill = planMultiEntityBackfill({
    targetTenantId: input.targetTenantId,
    legalEntities: input.topology.legalEntities,
    campusBindings: input.topology.campusBindings,
    records: campusRecords,
    maxRecords: input.maxRecords,
  })
  const explicitResolution = planExplicitEntityResolutions({
    targetTenantId: input.targetTenantId,
    legalEntities: input.topology.legalEntities,
    campusBindings: input.topology.campusBindings,
    records: explicitRecords,
    resolutions: input.explicitResolutions,
    dependencies: projection.dependencies,
    maxRecords: input.maxRecords,
  })

  const issues: UnifiedMultiEntityShadowIssue[] = []
  const proposalsByRecord = new Map<string, UnifiedMultiEntityProposal>()

  for (const proposal of campusBackfill.proposals) {
    addProposal(
      {
        operation: proposal.operation,
        recordType: proposal.recordType,
        recordId: proposal.recordId,
        tenantId: proposal.tenantId,
        beforeLegalEntityId: proposal.beforeLegalEntityId,
        proposedLegalEntityId: proposal.proposedLegalEntityId,
        source: 'campus_binding',
        campusId: proposal.campusId,
        rollback: rollbackFor(proposal.proposedLegalEntityId),
      },
      proposalsByRecord,
      issues
    )
  }

  for (const proposal of explicitResolution.proposals) {
    addProposal(
      {
        operation: proposal.operation,
        recordType: proposal.recordType,
        recordId: proposal.recordId,
        tenantId: proposal.tenantId,
        beforeLegalEntityId: proposal.beforeLegalEntityId,
        proposedLegalEntityId: proposal.proposedLegalEntityId,
        source: proposal.resolutionSource,
        reviewReference: proposal.reviewReference,
        rollback: proposal.rollback,
      },
      proposalsByRecord,
      issues
    )
  }

  const targetRecords = projection.records.filter(
    ({ tenantId }) => tenantId === input.targetTenantId
  )
  const blockedRecordKeys = new Set<string>()
  for (const issue of [
    ...projection.issues,
    ...campusBackfill.issues,
    ...explicitResolution.issues,
  ]) {
    if (issue.recordType && issue.recordId) {
      blockedRecordKeys.add(proposalKey(issue.recordType, issue.recordId))
    }
  }
  const coveredKeys = new Set<string>()
  let alreadyAssigned = 0

  for (const record of targetRecords) {
    const key = recordKey(record)
    if (blockedRecordKeys.has(key)) continue
    if (record.legalEntityId) {
      alreadyAssigned += 1
      coveredKeys.add(key)
    }
    if (proposalsByRecord.has(key)) coveredKeys.add(key)
  }

  for (const record of targetRecords) {
    if (!coveredKeys.has(recordKey(record))) {
      issues.push({ code: 'coverage_gap', recordType: record.recordType, recordId: record.id })
    }
  }

  const proposals = [...proposalsByRecord.values()].sort(compareProposals)
  const sortedIssues = issues.sort(compareIssues)
  const campusBindingProposals = proposals.filter(
    ({ source }) => source === 'campus_binding'
  ).length
  const explicitReviewProposals = proposals.filter(
    ({ source }) => source === 'explicit_review'
  ).length
  const inheritedCampaignProposals = proposals.filter(
    ({ source }) => source === 'parent_campaign'
  ).length
  const unresolvedRecords = targetRecords.length - coveredKeys.size
  const blockedIssues =
    topologyIssues.length +
    projection.issues.length +
    campusBackfill.issues.length +
    explicitResolution.issues.length +
    sortedIssues.length

  return {
    mode: 'unified_shadow_dry_run',
    canWrite: false,
    canApply: false,
    ready:
      projection.issues.length === 0 &&
      topologyIssues.length === 0 &&
      campusBackfill.fullyMappable &&
      explicitResolution.ready &&
      sortedIssues.length === 0 &&
      unresolvedRecords === 0,
    projection,
    topologyIssues,
    campusBackfill,
    explicitResolution,
    proposals,
    issues: sortedIssues,
    summary: {
      sourceRecords: projection.summary.sourceRecords,
      projectedRecords: projection.summary.projectedRecords,
      targetRecords: targetRecords.length,
      alreadyAssigned,
      campusBindingProposals,
      explicitReviewProposals,
      inheritedCampaignProposals,
      coveredRecords: coveredKeys.size,
      unresolvedRecords,
      blockedIssues,
    },
  }
}

function addProposal(
  proposal: UnifiedMultiEntityProposal,
  proposalsByRecord: Map<string, UnifiedMultiEntityProposal>,
  issues: UnifiedMultiEntityShadowIssue[]
): void {
  const key = proposalKey(proposal.recordType, proposal.recordId)
  const existing = proposalsByRecord.get(key)
  if (!existing) {
    proposalsByRecord.set(key, proposal)
    return
  }

  issues.push({
    code:
      existing.proposedLegalEntityId === proposal.proposedLegalEntityId
        ? 'proposal_overlap'
        : 'proposal_entity_conflict',
    recordType: proposal.recordType,
    recordId: proposal.recordId,
    relatedId: existing.proposedLegalEntityId,
  })
}

function rollbackFor(legalEntityId: string): UnifiedMultiEntityRollback {
  return {
    operation: 'restore_null_if_unchanged',
    expectedLegalEntityId: legalEntityId,
    restoreLegalEntityId: null,
  }
}

function recordKey(record: EntityScopedLegacyRecord): string {
  return proposalKey(record.recordType, record.id)
}

function proposalKey(recordType: EntityScopedRecordType, recordId: string): string {
  return `${recordType}\u0000${recordId}`
}

function compareProposals(
  left: UnifiedMultiEntityProposal,
  right: UnifiedMultiEntityProposal
): number {
  return (
    left.recordType.localeCompare(right.recordType) || left.recordId.localeCompare(right.recordId)
  )
}

function compareIssues(
  left: UnifiedMultiEntityShadowIssue,
  right: UnifiedMultiEntityShadowIssue
): number {
  return (
    left.recordType.localeCompare(right.recordType) ||
    left.recordId.localeCompare(right.recordId) ||
    left.code.localeCompare(right.code) ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}
