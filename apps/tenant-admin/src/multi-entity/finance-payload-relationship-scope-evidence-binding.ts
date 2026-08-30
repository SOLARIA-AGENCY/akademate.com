import { createHash } from 'node:crypto'

import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import {
  assertFinancePayloadRelationshipScopeStagingEvidenceManifest,
  type FinancePayloadRelationshipScopeStagingEvidenceManifest,
} from './finance-payload-relationship-scope-staging-evidence'

export const FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE =
  'payload_relationship_scope_reviewed' as const

export interface FinancePayloadRelationshipScopeBindingTarget {
  readonly artifactDigest: string
  readonly entityReviewReference: string
}

export interface FinancePayloadRelationshipScopeBindingProposalInput {
  readonly manifest: FinancePayloadRelationshipScopeStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly entities: readonly FinancePayloadRelationshipScopeBindingTarget[]
}

export interface FinancePayloadRelationshipScopeBindingProposal {
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

export type FinancePayloadRelationshipScopeBindingErrorCode =
  | 'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_BINDING_INPUT_INVALID'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MANIFEST_INVALID'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_CAMPAIGN_MISMATCH'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MAPPING_INVALID'

export class FinancePayloadRelationshipScopeBindingError extends Error {
  constructor(readonly code: FinancePayloadRelationshipScopeBindingErrorCode) {
    super('Finance Payload relationship scope evidence binding is invalid.')
    this.name = 'FinancePayloadRelationshipScopeBindingError'
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

/** Proposes three Payload-scope bindings without reading Payload. */
export function createFinancePayloadRelationshipScopeBindingProposal(
  input: FinancePayloadRelationshipScopeBindingProposalInput
): FinancePayloadRelationshipScopeBindingProposal {
  validateInput(input)
  try {
    assertFinancePayloadRelationshipScopeStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_CAMPAIGN_MISMATCH')
  }
  const targets = targetMap(input.entities, input)
  const bindings = input.manifest.entities.map((artifact) => {
    const target = targets.get(artifact.artifactDigest)
    if (
      !target ||
      digest(target.entityReviewReference) !== artifact.entityReviewReferenceDigest ||
      artifact.verdict !== 'eligible_for_manual_binding'
    ) {
      throw bindingError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MAPPING_INVALID')
    }
    return Object.freeze({
      scope: 'entity' as const,
      gate: FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_REVIEWED_READINESS_GATE,
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

function validateInput(input: FinancePayloadRelationshipScopeBindingProposalInput): void {
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
    throw bindingError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_BINDING_INPUT_INVALID')
  }
}

function targetMap(
  values: readonly FinancePayloadRelationshipScopeBindingTarget[],
  input: Pick<
    FinancePayloadRelationshipScopeBindingProposalInput,
    'campaignReviewReference' | 'readinessReviewReference'
  >
): ReadonlyMap<string, FinancePayloadRelationshipScopeBindingTarget> {
  const targets = new Map<string, FinancePayloadRelationshipScopeBindingTarget>()
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
      throw bindingError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MAPPING_INVALID')
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

function bindingError(code: FinancePayloadRelationshipScopeBindingErrorCode) {
  return new FinancePayloadRelationshipScopeBindingError(code)
}
