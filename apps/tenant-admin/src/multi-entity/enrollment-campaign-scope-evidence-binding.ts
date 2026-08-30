import { createHash } from 'node:crypto'

import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import {
  assertEnrollmentCampaignScopeStagingEvidenceManifest,
  type EnrollmentCampaignScopeStagingEvidenceManifest,
} from './enrollment-campaign-scope-staging-evidence'

export const ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE =
  'enrollment_campaign_scope_reviewed' as const

export interface EnrollmentCampaignScopeBindingTarget {
  readonly artifactDigest: string
  readonly entityReviewReference: string
}

export interface EnrollmentCampaignScopeBindingProposalInput {
  readonly manifest: EnrollmentCampaignScopeStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly entities: readonly EnrollmentCampaignScopeBindingTarget[]
}

export interface EnrollmentCampaignScopeBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_entity_staging_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly bindings: readonly MultiEntityStagingEvidenceBinding[]
}

export type EnrollmentCampaignScopeBindingErrorCode =
  | 'ENROLLMENT_CAMPAIGN_SCOPE_BINDING_INPUT_INVALID'
  | 'ENROLLMENT_CAMPAIGN_SCOPE_MANIFEST_INVALID'
  | 'ENROLLMENT_CAMPAIGN_SCOPE_CAMPAIGN_MISMATCH'
  | 'ENROLLMENT_CAMPAIGN_SCOPE_MAPPING_INVALID'

export class EnrollmentCampaignScopeBindingError extends Error {
  constructor(readonly code: EnrollmentCampaignScopeBindingErrorCode) {
    super('Enrollment/campaign scope evidence binding is invalid.')
    this.name = 'EnrollmentCampaignScopeBindingError'
  }
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'manifest',
  'campaignReviewReference',
  'readinessReviewReference',
  'entities',
])
const TARGET_KEYS = new Set(['artifactDigest', 'entityReviewReference'])

/** Proposes three reviewed relationship bindings without applying them. */
export function createEnrollmentCampaignScopeBindingProposal(
  input: EnrollmentCampaignScopeBindingProposalInput
): EnrollmentCampaignScopeBindingProposal {
  validateInput(input)
  try {
    assertEnrollmentCampaignScopeStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('ENROLLMENT_CAMPAIGN_SCOPE_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('ENROLLMENT_CAMPAIGN_SCOPE_CAMPAIGN_MISMATCH')
  }
  const targets = targetMap(input.entities, input)
  const bindings = input.manifest.entities.map((artifact) => {
    const target = targets.get(artifact.artifactDigest)
    if (
      !target ||
      digest(target.entityReviewReference) !== artifact.entityReviewReferenceDigest ||
      artifact.verdict !== 'eligible_for_manual_binding'
    ) {
      throw bindingError('ENROLLMENT_CAMPAIGN_SCOPE_MAPPING_INVALID')
    }
    return Object.freeze({
      scope: 'entity' as const,
      gate: ENROLLMENT_CAMPAIGN_SCOPE_REVIEWED_READINESS_GATE,
      reviewReference: target.entityReviewReference,
      evidenceReference: artifact.evidenceReference,
      campaignReviewReference: input.campaignReviewReference,
      sourceDigest: input.manifest.sourceDigest,
      targetTenantDigest: input.manifest.targetTenantDigest,
      artifactKind: artifact.kind,
      artifactDigest: artifact.artifactDigest,
    })
  })
  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_entity_staging_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canDeploy: false,
    canActivate: false,
    canChangePermissions: false,
    bindings: Object.freeze(bindings),
  })
}

function validateInput(input: EnrollmentCampaignScopeBindingProposalInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !validReview(input.campaignReviewReference) ||
    !validReview(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !Array.isArray(input.entities) ||
    input.entities.length !== 3
  ) {
    throw bindingError('ENROLLMENT_CAMPAIGN_SCOPE_BINDING_INPUT_INVALID')
  }
}

function targetMap(
  values: readonly EnrollmentCampaignScopeBindingTarget[],
  input: Pick<
    EnrollmentCampaignScopeBindingProposalInput,
    'campaignReviewReference' | 'readinessReviewReference'
  >
): ReadonlyMap<string, EnrollmentCampaignScopeBindingTarget> {
  const targets = new Map<string, EnrollmentCampaignScopeBindingTarget>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  for (const value of values) {
    if (
      !value ||
      typeof value !== 'object' ||
      !exactKeys(value, TARGET_KEYS) ||
      !DIGEST_PATTERN.test(value.artifactDigest) ||
      !validReview(value.entityReviewReference) ||
      targets.has(value.artifactDigest) ||
      reviews.has(value.entityReviewReference)
    ) {
      throw bindingError('ENROLLMENT_CAMPAIGN_SCOPE_MAPPING_INVALID')
    }
    targets.set(value.artifactDigest, Object.freeze({ ...value }))
    reviews.add(value.entityReviewReference)
  }
  return targets
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.size && keys.every((key) => expected.has(key))
}

function validReview(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function bindingError(code: EnrollmentCampaignScopeBindingErrorCode) {
  return new EnrollmentCampaignScopeBindingError(code)
}
