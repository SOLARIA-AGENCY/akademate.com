export type ConvocatoriaCampaignLinkStatus = 'linked' | 'not_linked' | 'ambiguous' | 'unavailable'

export type ConvocatoriaCampaignWorkflowStatus =
  | 'draft'
  | 'review'
  | 'meta_paused'
  | 'active'
  | 'error'
  | 'ended'

export type ConvocatoriaCampaignDeliveryStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'draft'
  | 'unknown'

export interface ConvocatoriaCampaignDraft {
  readonly id: string
  readonly status: string | null
  readonly metaCampaignId: string | null
  readonly metaAdSetId: string | null
  readonly metaAdId: string | null
  readonly createdAt: string | null
  readonly updatedAt: string | null
  readonly metaAds?: readonly ConvocatoriaCampaignDraftAd[]
}

export interface ConvocatoriaCampaignDraftAd {
  readonly metaAdId?: string | null
  readonly metaAdSetId?: string | null
}

export interface ConvocatoriaCampaignCandidate {
  readonly localCampaignId: string
  readonly name: string
  readonly reason: 'course_heuristic'
}

export interface ConvocatoriaCampaignResolution {
  readonly linkStatus: ConvocatoriaCampaignLinkStatus
  readonly workflowStatus: ConvocatoriaCampaignWorkflowStatus | null
  readonly deliveryStatus: ConvocatoriaCampaignDeliveryStatus
  readonly metaCampaignId: string | null
  readonly metaAdSetId: string | null
  readonly primaryMetaAdId: string | null
  readonly candidateCount: number
  readonly candidates: readonly ConvocatoriaCampaignCandidate[]
  readonly source: 'workflow' | 'unavailable'
}

const ENDED_WORKFLOW_STATUSES = new Set(['ended', 'completed', 'archived'])

/**
 * Resolves only explicit draft-to-convocation relationships.
 *
 * Course-based candidates are deliberately returned as suggestions and never
 * become the linked campaign. Multiple current explicit campaigns fail closed
 * instead of selecting whichever row happens to be first.
 */
export function resolveConvocatoriaCampaign(input: {
  readonly drafts: readonly ConvocatoriaCampaignDraft[]
  readonly candidates?: readonly ConvocatoriaCampaignCandidate[]
  readonly draftsAvailable?: boolean
  readonly candidatesAvailable?: boolean
}): ConvocatoriaCampaignResolution {
  const candidates = normalizeCandidates(input.candidates ?? [])
  const draftsAvailable = input.draftsAvailable !== false
  const candidatesAvailable = input.candidatesAvailable !== false

  if (!draftsAvailable) {
    return unavailableResolution(candidates)
  }

  const usableDrafts = input.drafts
    .filter((draft) => isValidDraft(draft))
    .map((draft) => normalizeDraft(draft))
    .sort(compareDrafts)

  if (usableDrafts.length === 0) {
    if (candidates.length === 0 && !candidatesAvailable) {
      return unavailableResolution(candidates)
    }
    return Object.freeze({
      linkStatus: candidates.length > 1 ? 'ambiguous' : 'not_linked',
      workflowStatus: null,
      deliveryStatus: 'unknown',
      metaCampaignId: null,
      metaAdSetId: null,
      primaryMetaAdId: null,
      candidateCount: candidates.length,
      candidates: Object.freeze(candidates),
      source: 'workflow',
    })
  }

  const currentCampaignIds = unique(
    usableDrafts
      .filter((draft) => normalizeWorkflowStatus(draft.status) !== 'ended')
      .map((draft) => draft.metaCampaignId)
  )

  if (currentCampaignIds.length > 1) {
    return ambiguousResolution(candidates)
  }

  const campaignId =
    currentCampaignIds[0] ?? unique(usableDrafts.map((draft) => draft.metaCampaignId))[0]
  if (!campaignId) {
    return Object.freeze({
      linkStatus: candidates.length > 1 ? 'ambiguous' : 'not_linked',
      workflowStatus: null,
      deliveryStatus: 'unknown',
      metaCampaignId: null,
      metaAdSetId: null,
      primaryMetaAdId: null,
      candidateCount: candidates.length,
      candidates: Object.freeze(candidates),
      source: 'workflow',
    })
  }

  const selected = usableDrafts.find((draft) => draft.metaCampaignId === campaignId)!
  const workflowStatus = normalizeWorkflowStatus(selected.status)
  return Object.freeze({
    linkStatus: 'linked',
    workflowStatus,
    deliveryStatus: deliveryStatusForWorkflow(workflowStatus),
    metaCampaignId: campaignId,
    metaAdSetId: selected.metaAdSetId,
    primaryMetaAdId: selected.metaAdId ?? selected.metaAds?.[0]?.metaAdId ?? null,
    candidateCount: candidates.length,
    candidates: Object.freeze(candidates),
    source: 'workflow',
  })
}

function isValidDraft(draft: ConvocatoriaCampaignDraft): boolean {
  return Boolean(
    draft &&
    typeof draft === 'object' &&
    typeof draft.id === 'string' &&
    typeof draft.metaCampaignId === 'string' &&
    draft.metaCampaignId.trim().length > 0
  )
}

function normalizeDraft(draft: ConvocatoriaCampaignDraft): ConvocatoriaCampaignDraft {
  return {
    ...draft,
    id: draft.id.trim(),
    status: typeof draft.status === 'string' ? draft.status.trim().toLowerCase() : null,
    metaCampaignId: draft.metaCampaignId?.trim() || null,
    metaAdSetId: draft.metaAdSetId?.trim() || null,
    metaAdId: draft.metaAdId?.trim() || null,
  }
}

function compareDrafts(left: ConvocatoriaCampaignDraft, right: ConvocatoriaCampaignDraft): number {
  const leftTime = timestamp(left.updatedAt ?? left.createdAt)
  const rightTime = timestamp(right.updatedAt ?? right.createdAt)
  if (leftTime !== rightTime) return rightTime - leftTime
  return right.id.localeCompare(left.id)
}

function timestamp(value: string | null): number {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function normalizeCandidates(
  candidates: readonly ConvocatoriaCampaignCandidate[]
): ConvocatoriaCampaignCandidate[] {
  const seen = new Set<string>()
  return candidates
    .filter(
      (candidate) =>
        candidate &&
        typeof candidate.localCampaignId === 'string' &&
        candidate.localCampaignId.trim() &&
        typeof candidate.name === 'string'
    )
    .map((candidate) => ({
      localCampaignId: candidate.localCampaignId.trim(),
      name: candidate.name.trim(),
      reason: 'course_heuristic' as const,
    }))
    .filter((candidate) => {
      if (seen.has(candidate.localCampaignId)) return false
      seen.add(candidate.localCampaignId)
      return true
    })
    .sort((left, right) => left.localCampaignId.localeCompare(right.localCampaignId))
}

function normalizeStatus(status: string | null): string {
  return status?.trim().toLowerCase() ?? ''
}

function normalizeWorkflowStatus(status: string | null): ConvocatoriaCampaignWorkflowStatus {
  const normalized = normalizeStatus(status)
  if (
    normalized === 'draft' ||
    normalized === 'review' ||
    normalized === 'meta_paused' ||
    normalized === 'active' ||
    normalized === 'error' ||
    normalized === 'ended'
  ) {
    return normalized
  }
  if (ENDED_WORKFLOW_STATUSES.has(normalized)) return 'ended'
  return 'error'
}

function deliveryStatusForWorkflow(
  workflowStatus: ConvocatoriaCampaignWorkflowStatus
): ConvocatoriaCampaignDeliveryStatus {
  if (workflowStatus === 'active') return 'active'
  if (workflowStatus === 'meta_paused') return 'paused'
  if (workflowStatus === 'ended') return 'completed'
  if (workflowStatus === 'draft' || workflowStatus === 'review') return 'draft'
  return 'unknown'
}

function unique(values: readonly (string | null)[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

function unavailableResolution(
  candidates: readonly ConvocatoriaCampaignCandidate[]
): ConvocatoriaCampaignResolution {
  return Object.freeze({
    linkStatus: 'unavailable',
    workflowStatus: null,
    deliveryStatus: 'unknown',
    metaCampaignId: null,
    metaAdSetId: null,
    primaryMetaAdId: null,
    candidateCount: candidates.length,
    candidates: Object.freeze([...candidates]),
    source: 'unavailable',
  })
}

function ambiguousResolution(
  candidates: readonly ConvocatoriaCampaignCandidate[]
): ConvocatoriaCampaignResolution {
  return Object.freeze({
    linkStatus: 'ambiguous',
    workflowStatus: null,
    deliveryStatus: 'unknown',
    metaCampaignId: null,
    metaAdSetId: null,
    primaryMetaAdId: null,
    candidateCount: candidates.length,
    candidates: Object.freeze([...candidates]),
    source: 'workflow',
  })
}
