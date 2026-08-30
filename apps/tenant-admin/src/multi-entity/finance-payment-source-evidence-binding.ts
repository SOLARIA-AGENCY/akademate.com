import { createHash } from 'node:crypto'

import {
  assertFinancePaymentSourceStagingEvidenceManifest,
  type FinancePaymentSourceStagingEvidenceManifest,
} from '../../../../packages/finance/src'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE = 'payment_source_reviewed' as const

export interface FinancePaymentSourceBindingTarget {
  readonly artifactDigest: string
  readonly entityReviewReference: string
}

export interface FinancePaymentSourceBindingProposalInput {
  readonly manifest: FinancePaymentSourceStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly entities: readonly FinancePaymentSourceBindingTarget[]
}

export interface FinancePaymentSourceBindingProposal {
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

export type FinancePaymentSourceBindingErrorCode =
  | 'FINANCE_PAYMENT_SOURCE_BINDING_INPUT_INVALID'
  | 'FINANCE_PAYMENT_SOURCE_MANIFEST_INVALID'
  | 'FINANCE_PAYMENT_SOURCE_CAMPAIGN_MISMATCH'
  | 'FINANCE_PAYMENT_SOURCE_MAPPING_INVALID'

export class FinancePaymentSourceBindingError extends Error {
  constructor(readonly code: FinancePaymentSourceBindingErrorCode) {
    super('Finance payment source evidence binding is invalid.')
    this.name = 'FinancePaymentSourceBindingError'
  }
}

const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set([
  'manifest',
  'campaignReviewReference',
  'readinessReviewReference',
  'entities',
])
const ENTITY_KEYS = new Set(['artifactDigest', 'entityReviewReference'])

/** Proposes three payment-source bindings without invoking a provider. */
export function createFinancePaymentSourceBindingProposal(
  input: FinancePaymentSourceBindingProposalInput
): FinancePaymentSourceBindingProposal {
  validateEnvelope(input)
  try {
    assertFinancePaymentSourceStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('FINANCE_PAYMENT_SOURCE_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('FINANCE_PAYMENT_SOURCE_CAMPAIGN_MISMATCH')
  }
  const targets = validateTargets(input.entities, input)
  const bindings = input.manifest.entities.map((artifact) => {
    const target = targets.get(artifact.artifactDigest)
    if (
      !target ||
      digest(target.entityReviewReference) !== artifact.entityReviewReferenceDigest ||
      artifact.verdict !== 'eligible_for_manual_binding'
    ) {
      throw bindingError('FINANCE_PAYMENT_SOURCE_MAPPING_INVALID')
    }
    return Object.freeze({
      scope: 'entity' as const,
      gate: FINANCE_PAYMENT_SOURCE_REVIEWED_READINESS_GATE,
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

function validateEnvelope(input: FinancePaymentSourceBindingProposalInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !validReviewReference(input.campaignReviewReference) ||
    !validReviewReference(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference ||
    !Array.isArray(input.entities) ||
    input.entities.length !== 3
  ) {
    throw bindingError('FINANCE_PAYMENT_SOURCE_BINDING_INPUT_INVALID')
  }
}

function validateTargets(
  entities: readonly FinancePaymentSourceBindingTarget[],
  input: Pick<
    FinancePaymentSourceBindingProposalInput,
    'campaignReviewReference' | 'readinessReviewReference'
  >
): ReadonlyMap<string, FinancePaymentSourceBindingTarget> {
  const targets = new Map<string, FinancePaymentSourceBindingTarget>()
  const reviews = new Set([input.campaignReviewReference, input.readinessReviewReference])
  for (const entity of entities) {
    if (
      !entity ||
      typeof entity !== 'object' ||
      !exactKeys(entity, ENTITY_KEYS) ||
      !DIGEST_PATTERN.test(entity.artifactDigest) ||
      !validReviewReference(entity.entityReviewReference) ||
      targets.has(entity.artifactDigest) ||
      reviews.has(entity.entityReviewReference)
    ) {
      throw bindingError('FINANCE_PAYMENT_SOURCE_MAPPING_INVALID')
    }
    targets.set(entity.artifactDigest, Object.freeze({ ...entity }))
    reviews.add(entity.entityReviewReference)
  }
  return targets
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function bindingError(code: FinancePaymentSourceBindingErrorCode) {
  return new FinancePaymentSourceBindingError(code)
}
