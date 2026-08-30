import type {
  GroupCapability,
  LegalEntityCapability,
  MultiEntityAccessRequest,
  MultiEntityShadowEvaluation,
  ProposedDecisionReason,
} from './multi-entity-shadow'
import { GROUP_CAPABILITIES, LEGAL_ENTITY_CAPABILITIES } from './multi-entity-shadow'

export type MultiEntityCapability = GroupCapability | LegalEntityCapability

export interface RedactedMultiEntityShadowObservation {
  readonly mode: 'disabled' | 'shadow'
  readonly scope: 'group' | 'legal-entity'
  readonly capability: MultiEntityCapability
  readonly legacyAllowed: boolean
  readonly proposedAllowed: boolean | null
  readonly proposedReason: ProposedDecisionReason | null
  readonly divergence: boolean | null
}

export interface MultiEntityShadowCapabilityMetrics {
  readonly evaluated: number
  readonly divergences: number
  readonly wouldGrant: number
  readonly wouldRevoke: number
  readonly alignedAllow: number
  readonly alignedDeny: number
}

export interface MultiEntityShadowMetrics {
  readonly total: number
  readonly disabled: number
  readonly evaluated: number
  readonly divergences: number
  readonly wouldGrant: number
  readonly wouldRevoke: number
  readonly byCapability: Readonly<
    Partial<Record<MultiEntityCapability, MultiEntityShadowCapabilityMetrics>>
  >
}

const GROUP_CAPABILITY_SET = new Set<MultiEntityCapability>(GROUP_CAPABILITIES)
const LEGAL_ENTITY_CAPABILITY_SET = new Set<MultiEntityCapability>(LEGAL_ENTITY_CAPABILITIES)
const PROPOSED_REASON_SET = new Set<ProposedDecisionReason>([
  'membership_allows',
  'no_active_membership',
  'capability_missing',
  'campus_required',
  'campus_out_of_scope',
])

/**
 * Creates an allow-listed telemetry event. User, group, entity, campus and
 * membership identifiers are deliberately not copied from the request.
 */
export function createRedactedMultiEntityShadowObservation(
  request: MultiEntityAccessRequest,
  evaluation: MultiEntityShadowEvaluation
): RedactedMultiEntityShadowObservation {
  assertEvaluationContract(evaluation)
  assertScopeCapability(request.scope, request.capability)

  return {
    mode: evaluation.mode,
    scope: request.scope,
    capability: request.capability,
    legacyAllowed: evaluation.effectiveAllowed,
    proposedAllowed: evaluation.proposedDecision?.allowed ?? null,
    proposedReason: evaluation.proposedDecision?.reason ?? null,
    divergence: evaluation.divergence,
  }
}

export function summarizeMultiEntityShadowObservations(
  observations: readonly RedactedMultiEntityShadowObservation[]
): MultiEntityShadowMetrics {
  const mutable = new Map<MultiEntityCapability, MutableCapabilityMetrics>()
  let disabled = 0
  let evaluated = 0
  let divergences = 0
  let wouldGrant = 0
  let wouldRevoke = 0

  for (const observation of observations) {
    assertObservationContract(observation)
    if (observation.mode === 'disabled') {
      disabled += 1
      continue
    }

    evaluated += 1
    const capabilityMetrics = mutable.get(observation.capability) ?? emptyCapabilityMetrics()
    capabilityMetrics.evaluated += 1

    if (observation.divergence) {
      divergences += 1
      capabilityMetrics.divergences += 1
      if (observation.legacyAllowed) {
        wouldRevoke += 1
        capabilityMetrics.wouldRevoke += 1
      } else {
        wouldGrant += 1
        capabilityMetrics.wouldGrant += 1
      }
    } else if (observation.legacyAllowed) {
      capabilityMetrics.alignedAllow += 1
    } else {
      capabilityMetrics.alignedDeny += 1
    }

    mutable.set(observation.capability, capabilityMetrics)
  }

  const byCapability = Object.fromEntries(
    [...mutable.keys()].sort().map((capability) => [capability, { ...mutable.get(capability)! }])
  ) as Partial<Record<MultiEntityCapability, MultiEntityShadowCapabilityMetrics>>

  return {
    total: observations.length,
    disabled,
    evaluated,
    divergences,
    wouldGrant,
    wouldRevoke,
    byCapability,
  }
}

interface MutableCapabilityMetrics {
  evaluated: number
  divergences: number
  wouldGrant: number
  wouldRevoke: number
  alignedAllow: number
  alignedDeny: number
}

function emptyCapabilityMetrics(): MutableCapabilityMetrics {
  return {
    evaluated: 0,
    divergences: 0,
    wouldGrant: 0,
    wouldRevoke: 0,
    alignedAllow: 0,
    alignedDeny: 0,
  }
}

function assertEvaluationContract(evaluation: MultiEntityShadowEvaluation): void {
  const disabledShape =
    evaluation.mode === 'disabled' &&
    evaluation.decisionSource === 'legacy' &&
    evaluation.proposedDecision === null &&
    evaluation.divergence === null
  const shadowShape =
    evaluation.mode === 'shadow' &&
    evaluation.decisionSource === 'legacy' &&
    evaluation.proposedDecision !== null &&
    evaluation.divergence ===
      (evaluation.effectiveAllowed !== evaluation.proposedDecision?.allowed) &&
    decisionReasonIsConsistent(
      evaluation.proposedDecision?.allowed,
      evaluation.proposedDecision?.reason
    )

  if (!disabledShape && !shadowShape) {
    throw new Error('Invalid multi-entity shadow evaluation contract.')
  }
}

function assertObservationContract(observation: RedactedMultiEntityShadowObservation): void {
  assertScopeCapability(observation.scope, observation.capability)

  const disabledShape =
    observation.mode === 'disabled' &&
    observation.proposedAllowed === null &&
    observation.proposedReason === null &&
    observation.divergence === null
  const shadowShape =
    observation.mode === 'shadow' &&
    typeof observation.proposedAllowed === 'boolean' &&
    observation.proposedReason !== null &&
    PROPOSED_REASON_SET.has(observation.proposedReason) &&
    observation.divergence === (observation.legacyAllowed !== observation.proposedAllowed) &&
    decisionReasonIsConsistent(observation.proposedAllowed, observation.proposedReason)

  if (!disabledShape && !shadowShape) {
    throw new Error('Invalid redacted multi-entity shadow observation contract.')
  }
}

function assertScopeCapability(
  scope: RedactedMultiEntityShadowObservation['scope'],
  capability: MultiEntityCapability
): void {
  const valid =
    (scope === 'group' && GROUP_CAPABILITY_SET.has(capability)) ||
    (scope === 'legal-entity' && LEGAL_ENTITY_CAPABILITY_SET.has(capability))

  if (!valid) throw new Error('Invalid multi-entity scope/capability telemetry contract.')
}

function decisionReasonIsConsistent(
  allowed: boolean | undefined,
  reason: ProposedDecisionReason | undefined
): boolean {
  return allowed === true
    ? reason === 'membership_allows'
    : allowed === false && reason !== undefined && reason !== 'membership_allows'
}
