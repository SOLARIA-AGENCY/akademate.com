import { createHash } from 'node:crypto'

import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import {
  assertEntityRollbackStagingEvidenceManifest,
  type EntityRollbackStagingEvidenceManifest,
} from './entity-rollback-staging-evidence'

export const ENTITY_ROLLBACK_REVIEWED_READINESS_GATE = 'entity_rollback_reviewed' as const

export interface EntityRollbackBindingTarget {
  readonly artifactDigest: string
  readonly entityReviewReference: string
}

export interface EntityRollbackBindingProposalInput {
  readonly manifest: EntityRollbackStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly entities: readonly EntityRollbackBindingTarget[]
}

export interface EntityRollbackBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_entity_staging_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canWrite: false
  readonly canApply: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly bindings: readonly MultiEntityStagingEvidenceBinding[]
}

export type EntityRollbackBindingErrorCode =
  | 'ENTITY_ROLLBACK_BINDING_INPUT_INVALID'
  | 'ENTITY_ROLLBACK_MANIFEST_INVALID'
  | 'ENTITY_ROLLBACK_CAMPAIGN_MISMATCH'
  | 'ENTITY_ROLLBACK_MAPPING_INVALID'

export class EntityRollbackBindingError extends Error {
  constructor(readonly code: EntityRollbackBindingErrorCode) {
    super('Entity rollback evidence binding is invalid.')
    this.name = 'EntityRollbackBindingError'
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

/** Proposes three entity rollback bindings without applying rollback. */
export function createEntityRollbackBindingProposal(
  input: EntityRollbackBindingProposalInput
): EntityRollbackBindingProposal {
  validateInput(input)
  try {
    assertEntityRollbackStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('ENTITY_ROLLBACK_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('ENTITY_ROLLBACK_CAMPAIGN_MISMATCH')
  }
  const targets = targetMap(input.entities, input)
  const bindings = input.manifest.entities.map((artifact) => {
    const target = targets.get(artifact.artifactDigest)
    if (
      !target ||
      digest(target.entityReviewReference) !== artifact.entityReviewReferenceDigest ||
      artifact.verdict !== 'eligible_for_manual_binding'
    ) {
      throw bindingError('ENTITY_ROLLBACK_MAPPING_INVALID')
    }
    return Object.freeze({
      scope: 'entity' as const,
      gate: ENTITY_ROLLBACK_REVIEWED_READINESS_GATE,
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
    canWrite: false,
    canApply: false,
    canDeploy: false,
    canActivate: false,
    canChangePermissions: false,
    bindings: Object.freeze(bindings),
  })
}

function validateInput(input: EntityRollbackBindingProposalInput): void {
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
    throw bindingError('ENTITY_ROLLBACK_BINDING_INPUT_INVALID')
  }
}

function targetMap(
  values: readonly EntityRollbackBindingTarget[],
  input: Pick<
    EntityRollbackBindingProposalInput,
    'campaignReviewReference' | 'readinessReviewReference'
  >
): ReadonlyMap<string, EntityRollbackBindingTarget> {
  const targets = new Map<string, EntityRollbackBindingTarget>()
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
      throw bindingError('ENTITY_ROLLBACK_MAPPING_INVALID')
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

function bindingError(code: EntityRollbackBindingErrorCode) {
  return new EntityRollbackBindingError(code)
}
