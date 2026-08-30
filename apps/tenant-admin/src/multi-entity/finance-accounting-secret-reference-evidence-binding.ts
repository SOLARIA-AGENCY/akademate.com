import { createHash } from 'node:crypto'

import {
  assertFinanceAccountingSecretReferenceStagingEvidenceManifest,
  type FinanceAccountingSecretReferenceStagingEvidenceManifest,
} from '../../../../packages/finance/src'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE =
  'secret_reference_configured' as const

export interface FinanceAccountingSecretReferenceBindingTarget {
  readonly artifactDigest: string
  readonly entityReviewReference: string
}

export interface FinanceAccountingSecretReferenceBindingProposalInput {
  readonly manifest: FinanceAccountingSecretReferenceStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly entities: readonly FinanceAccountingSecretReferenceBindingTarget[]
}

export interface FinanceAccountingSecretReferenceBindingProposal {
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

export type FinanceAccountingSecretReferenceBindingErrorCode =
  | 'FINANCE_ACCOUNTING_SECRET_REFERENCE_BINDING_INPUT_INVALID'
  | 'FINANCE_ACCOUNTING_SECRET_REFERENCE_MANIFEST_INVALID'
  | 'FINANCE_ACCOUNTING_SECRET_REFERENCE_CAMPAIGN_MISMATCH'
  | 'FINANCE_ACCOUNTING_SECRET_REFERENCE_MAPPING_INVALID'

export class FinanceAccountingSecretReferenceBindingError extends Error {
  constructor(readonly code: FinanceAccountingSecretReferenceBindingErrorCode) {
    super('Finance accounting secret reference evidence binding is invalid.')
    this.name = 'FinanceAccountingSecretReferenceBindingError'
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

/** Proposes three secret-reference bindings without resolving credentials. */
export function createFinanceAccountingSecretReferenceBindingProposal(
  input: FinanceAccountingSecretReferenceBindingProposalInput
): FinanceAccountingSecretReferenceBindingProposal {
  validateEnvelope(input)
  try {
    assertFinanceAccountingSecretReferenceStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('FINANCE_ACCOUNTING_SECRET_REFERENCE_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('FINANCE_ACCOUNTING_SECRET_REFERENCE_CAMPAIGN_MISMATCH')
  }
  const targets = validateTargets(input.entities, input)
  const bindings = input.manifest.entities.map((artifact) => {
    const target = targets.get(artifact.artifactDigest)
    if (
      !target ||
      digest(target.entityReviewReference) !== artifact.entityReviewReferenceDigest ||
      artifact.verdict !== 'eligible_for_manual_binding'
    ) {
      throw bindingError('FINANCE_ACCOUNTING_SECRET_REFERENCE_MAPPING_INVALID')
    }
    return Object.freeze({
      scope: 'entity' as const,
      gate: FINANCE_ACCOUNTING_SECRET_REFERENCE_READINESS_GATE,
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

function validateEnvelope(input: FinanceAccountingSecretReferenceBindingProposalInput): void {
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
    throw bindingError('FINANCE_ACCOUNTING_SECRET_REFERENCE_BINDING_INPUT_INVALID')
  }
}

function validateTargets(
  entities: readonly FinanceAccountingSecretReferenceBindingTarget[],
  input: Pick<
    FinanceAccountingSecretReferenceBindingProposalInput,
    'campaignReviewReference' | 'readinessReviewReference'
  >
): ReadonlyMap<string, FinanceAccountingSecretReferenceBindingTarget> {
  const targets = new Map<string, FinanceAccountingSecretReferenceBindingTarget>()
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
      throw bindingError('FINANCE_ACCOUNTING_SECRET_REFERENCE_MAPPING_INVALID')
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

function bindingError(code: FinanceAccountingSecretReferenceBindingErrorCode) {
  return new FinanceAccountingSecretReferenceBindingError(code)
}
