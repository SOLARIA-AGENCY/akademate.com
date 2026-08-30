import type {
  UnifiedMultiEntityProposalSource,
  UnifiedMultiEntityShadowPlan,
} from './multi-entity-unified-shadow-plan'

export interface LedgerProposalSourceMetrics {
  readonly campusBinding: number
  readonly explicitReview: number
  readonly parentCampaign: number
}

export interface LedgerIssueStageMetrics {
  readonly topology: number
  readonly projection: number
  readonly campusBackfill: number
  readonly explicitResolution: number
  readonly unifiedCoverage: number
}

export interface RedactedUnifiedLedgerObservation {
  readonly mode: 'unified_shadow'
  readonly readiness: 'ready' | 'blocked'
  readonly sourceRecords: number
  readonly projectedRecords: number
  readonly targetRecords: number
  readonly alreadyAssigned: number
  readonly coveredRecords: number
  readonly unresolvedRecords: number
  readonly coverageBasisPoints: number
  readonly blockedIssues: number
  readonly proposalSources: LedgerProposalSourceMetrics
  readonly issueStages: LedgerIssueStageMetrics
}

export interface UnifiedLedgerMetrics {
  readonly runs: number
  readonly readyRuns: number
  readonly blockedRuns: number
  readonly sourceRecords: number
  readonly projectedRecords: number
  readonly targetRecords: number
  readonly alreadyAssigned: number
  readonly coveredRecords: number
  readonly unresolvedRecords: number
  readonly coverageBasisPoints: number
  readonly blockedIssues: number
  readonly proposalSources: LedgerProposalSourceMetrics
  readonly issueStages: LedgerIssueStageMetrics
}

const MAX_OBSERVATIONS = 10_000
const PROPOSAL_SOURCES = new Set<UnifiedMultiEntityProposalSource>([
  'campus_binding',
  'explicit_review',
  'parent_campaign',
])

/**
 * Produces an allow-listed observation from a validated shadow plan. Record,
 * tenant, entity, campus and review identifiers are deliberately omitted.
 */
export function createRedactedUnifiedLedgerObservation(
  plan: UnifiedMultiEntityShadowPlan
): RedactedUnifiedLedgerObservation {
  assertPlanContract(plan)
  const proposalSources = proposalSourceMetrics(plan)
  const issueStages = issueStageMetrics(plan)

  return {
    mode: 'unified_shadow',
    readiness: plan.ready ? 'ready' : 'blocked',
    sourceRecords: plan.summary.sourceRecords,
    projectedRecords: plan.summary.projectedRecords,
    targetRecords: plan.summary.targetRecords,
    alreadyAssigned: plan.summary.alreadyAssigned,
    coveredRecords: plan.summary.coveredRecords,
    unresolvedRecords: plan.summary.unresolvedRecords,
    coverageBasisPoints: coverageBasisPoints(
      plan.summary.coveredRecords,
      plan.summary.targetRecords
    ),
    blockedIssues: plan.summary.blockedIssues,
    proposalSources,
    issueStages,
  }
}

export function summarizeUnifiedLedgerObservations(
  observations: readonly RedactedUnifiedLedgerObservation[]
): UnifiedLedgerMetrics {
  if (observations.length > MAX_OBSERVATIONS) {
    throw new Error('Unified ledger observation limit exceeded.')
  }

  let readyRuns = 0
  let blockedRuns = 0
  let sourceRecords = 0
  let projectedRecords = 0
  let targetRecords = 0
  let alreadyAssigned = 0
  let coveredRecords = 0
  let unresolvedRecords = 0
  let blockedIssues = 0
  const proposalSources = mutableProposalSourceMetrics()
  const issueStages = mutableIssueStageMetrics()

  for (const observation of observations) {
    assertObservationContract(observation)
    if (observation.readiness === 'ready') readyRuns += 1
    else blockedRuns += 1
    sourceRecords = safeAdd(sourceRecords, observation.sourceRecords)
    projectedRecords = safeAdd(projectedRecords, observation.projectedRecords)
    targetRecords = safeAdd(targetRecords, observation.targetRecords)
    alreadyAssigned = safeAdd(alreadyAssigned, observation.alreadyAssigned)
    coveredRecords = safeAdd(coveredRecords, observation.coveredRecords)
    unresolvedRecords = safeAdd(unresolvedRecords, observation.unresolvedRecords)
    blockedIssues = safeAdd(blockedIssues, observation.blockedIssues)
    proposalSources.campusBinding = safeAdd(
      proposalSources.campusBinding,
      observation.proposalSources.campusBinding
    )
    proposalSources.explicitReview = safeAdd(
      proposalSources.explicitReview,
      observation.proposalSources.explicitReview
    )
    proposalSources.parentCampaign = safeAdd(
      proposalSources.parentCampaign,
      observation.proposalSources.parentCampaign
    )
    issueStages.topology = safeAdd(issueStages.topology, observation.issueStages.topology)
    issueStages.projection = safeAdd(issueStages.projection, observation.issueStages.projection)
    issueStages.campusBackfill = safeAdd(
      issueStages.campusBackfill,
      observation.issueStages.campusBackfill
    )
    issueStages.explicitResolution = safeAdd(
      issueStages.explicitResolution,
      observation.issueStages.explicitResolution
    )
    issueStages.unifiedCoverage = safeAdd(
      issueStages.unifiedCoverage,
      observation.issueStages.unifiedCoverage
    )
  }

  return {
    runs: observations.length,
    readyRuns,
    blockedRuns,
    sourceRecords,
    projectedRecords,
    targetRecords,
    alreadyAssigned,
    coveredRecords,
    unresolvedRecords,
    coverageBasisPoints: coverageBasisPoints(coveredRecords, targetRecords),
    blockedIssues,
    proposalSources,
    issueStages,
  }
}

function assertPlanContract(plan: UnifiedMultiEntityShadowPlan): void {
  if (plan.mode !== 'unified_shadow_dry_run' || plan.canWrite || plan.canApply) {
    throw new Error('Invalid unified ledger shadow plan contract.')
  }

  for (const value of Object.values(plan.summary)) assertNonNegativeSafeInteger(value)
  if (
    plan.summary.projectedRecords > plan.summary.sourceRecords ||
    plan.summary.targetRecords > plan.summary.projectedRecords ||
    plan.summary.coveredRecords + plan.summary.unresolvedRecords !== plan.summary.targetRecords ||
    plan.summary.alreadyAssigned > plan.summary.coveredRecords
  ) {
    throw new Error('Invalid unified ledger shadow plan summary.')
  }

  const proposalSources = proposalSourceMetrics(plan)
  const issueStages = issueStageMetrics(plan)
  const proposalCount =
    proposalSources.campusBinding + proposalSources.explicitReview + proposalSources.parentCampaign
  const issueCount =
    issueStages.topology +
    issueStages.projection +
    issueStages.campusBackfill +
    issueStages.explicitResolution +
    issueStages.unifiedCoverage

  if (
    proposalCount !== plan.proposals.length ||
    proposalSources.campusBinding !== plan.summary.campusBindingProposals ||
    proposalSources.explicitReview !== plan.summary.explicitReviewProposals ||
    proposalSources.parentCampaign !== plan.summary.inheritedCampaignProposals ||
    issueCount !== plan.summary.blockedIssues
  ) {
    throw new Error('Invalid unified ledger shadow plan counters.')
  }

  const proposalKeys = new Set<string>()
  for (const proposal of plan.proposals) {
    if (
      proposal.operation !== 'set_if_null' ||
      !PROPOSAL_SOURCES.has(proposal.source) ||
      proposal.rollback.operation !== 'restore_null_if_unchanged' ||
      proposal.rollback.expectedLegalEntityId !== proposal.proposedLegalEntityId ||
      proposal.rollback.restoreLegalEntityId !== null
    ) {
      throw new Error('Invalid unified ledger proposal contract.')
    }
    const key = `${proposal.recordType}\u0000${proposal.recordId}`
    if (proposalKeys.has(key)) throw new Error('Duplicate unified ledger proposal.')
    proposalKeys.add(key)
  }

  const expectedReady =
    plan.topologyIssues.length === 0 &&
    plan.projection.issues.length === 0 &&
    plan.campusBackfill.fullyMappable &&
    plan.explicitResolution.ready &&
    plan.issues.length === 0 &&
    plan.summary.unresolvedRecords === 0
  if (plan.ready !== expectedReady) {
    throw new Error('Invalid unified ledger readiness contract.')
  }
}

function assertObservationContract(observation: RedactedUnifiedLedgerObservation): void {
  assertExactKeys(observation as unknown as Record<string, unknown>, [
    'mode',
    'readiness',
    'sourceRecords',
    'projectedRecords',
    'targetRecords',
    'alreadyAssigned',
    'coveredRecords',
    'unresolvedRecords',
    'coverageBasisPoints',
    'blockedIssues',
    'proposalSources',
    'issueStages',
  ])
  assertExactKeys(observation.proposalSources as unknown as Record<string, unknown>, [
    'campusBinding',
    'explicitReview',
    'parentCampaign',
  ])
  assertExactKeys(observation.issueStages as unknown as Record<string, unknown>, [
    'topology',
    'projection',
    'campusBackfill',
    'explicitResolution',
    'unifiedCoverage',
  ])

  if (observation.mode !== 'unified_shadow') {
    throw new Error('Invalid redacted unified ledger observation contract.')
  }
  for (const value of [
    observation.sourceRecords,
    observation.projectedRecords,
    observation.targetRecords,
    observation.alreadyAssigned,
    observation.coveredRecords,
    observation.unresolvedRecords,
    observation.coverageBasisPoints,
    observation.blockedIssues,
    ...Object.values(observation.proposalSources),
    ...Object.values(observation.issueStages),
  ]) {
    assertNonNegativeSafeInteger(value)
  }

  const issueCount = Object.values(observation.issueStages).reduce((total, value) => {
    return safeAdd(total, value)
  }, 0)
  const expectedCoverage = coverageBasisPoints(
    observation.coveredRecords,
    observation.targetRecords
  )
  const readyShape =
    observation.readiness === 'ready' &&
    observation.unresolvedRecords === 0 &&
    observation.blockedIssues === 0 &&
    observation.coverageBasisPoints === 10_000
  const blockedShape =
    observation.readiness === 'blocked' &&
    (observation.unresolvedRecords > 0 || observation.blockedIssues > 0)

  if (
    observation.projectedRecords > observation.sourceRecords ||
    observation.targetRecords > observation.projectedRecords ||
    observation.coveredRecords + observation.unresolvedRecords !== observation.targetRecords ||
    observation.alreadyAssigned > observation.coveredRecords ||
    observation.coverageBasisPoints !== expectedCoverage ||
    observation.blockedIssues !== issueCount ||
    (!readyShape && !blockedShape)
  ) {
    throw new Error('Invalid redacted unified ledger observation contract.')
  }
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(value).sort()
  const allowed = [...expected].sort()
  if (actual.length !== allowed.length || actual.some((key, index) => key !== allowed[index])) {
    throw new Error('Invalid redacted unified ledger observation fields.')
  }
}

function proposalSourceMetrics(plan: UnifiedMultiEntityShadowPlan): LedgerProposalSourceMetrics {
  return {
    campusBinding: plan.proposals.filter(({ source }) => source === 'campus_binding').length,
    explicitReview: plan.proposals.filter(({ source }) => source === 'explicit_review').length,
    parentCampaign: plan.proposals.filter(({ source }) => source === 'parent_campaign').length,
  }
}

function issueStageMetrics(plan: UnifiedMultiEntityShadowPlan): LedgerIssueStageMetrics {
  return {
    topology: plan.topologyIssues.length,
    projection: plan.projection.issues.length,
    campusBackfill: plan.campusBackfill.issues.length,
    explicitResolution: plan.explicitResolution.issues.length,
    unifiedCoverage: plan.issues.length,
  }
}

function mutableProposalSourceMetrics(): {
  campusBinding: number
  explicitReview: number
  parentCampaign: number
} {
  return { campusBinding: 0, explicitReview: 0, parentCampaign: 0 }
}

function mutableIssueStageMetrics(): {
  topology: number
  projection: number
  campusBackfill: number
  explicitResolution: number
  unifiedCoverage: number
} {
  return {
    topology: 0,
    projection: 0,
    campusBackfill: 0,
    explicitResolution: 0,
    unifiedCoverage: 0,
  }
}

function coverageBasisPoints(covered: number, total: number): number {
  if (total === 0) return 10_000
  return Math.floor((covered / total) * 10_000)
}

function assertNonNegativeSafeInteger(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Unified ledger metric must be a non-negative safe integer.')
  }
}

function safeAdd(left: number, right: number): number {
  const result = left + right
  if (!Number.isSafeInteger(result)) throw new Error('Unified ledger metric overflow.')
  return result
}
