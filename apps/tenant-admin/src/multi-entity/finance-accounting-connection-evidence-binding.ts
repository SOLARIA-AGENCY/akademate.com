import { createHash } from 'node:crypto'

import {
  assertFinanceAccountingConnectionStagingEvidenceManifest,
  type FinanceAccountingConnectionStagingEvidenceManifest,
} from '../../../../packages/finance/src'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE =
  'accounting_connection_reviewed' as const

export interface FinanceAccountingConnectionBindingTarget {
  readonly artifactDigest: string
  readonly entityReviewReference: string
}

export interface FinanceAccountingConnectionBindingProposalInput {
  readonly manifest: FinanceAccountingConnectionStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
  readonly entities: readonly FinanceAccountingConnectionBindingTarget[]
}

export interface FinanceAccountingConnectionBindingProposal {
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

export type FinanceAccountingConnectionBindingErrorCode =
  | 'FINANCE_ACCOUNTING_CONNECTION_BINDING_INPUT_INVALID'
  | 'FINANCE_ACCOUNTING_CONNECTION_MANIFEST_INVALID'
  | 'FINANCE_ACCOUNTING_CONNECTION_CAMPAIGN_MISMATCH'
  | 'FINANCE_ACCOUNTING_CONNECTION_MAPPING_INVALID'

export class FinanceAccountingConnectionBindingError extends Error {
  constructor(readonly code: FinanceAccountingConnectionBindingErrorCode) {
    super('Finance accounting connection evidence binding is invalid.')
    this.name = 'FinanceAccountingConnectionBindingError'
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

/** Proposes three connection-review bindings without resolving any connection. */
export function createFinanceAccountingConnectionBindingProposal(
  input: FinanceAccountingConnectionBindingProposalInput
): FinanceAccountingConnectionBindingProposal {
  validateEnvelope(input)
  try {
    assertFinanceAccountingConnectionStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('FINANCE_ACCOUNTING_CONNECTION_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('FINANCE_ACCOUNTING_CONNECTION_CAMPAIGN_MISMATCH')
  }
  const targets = validateTargets(input.entities, input)
  const bindings = input.manifest.entities.map((artifact) => {
    const target = targets.get(artifact.artifactDigest)
    if (
      !target ||
      digest(target.entityReviewReference) !== artifact.entityReviewReferenceDigest ||
      artifact.verdict !== 'eligible_for_manual_binding'
    ) {
      throw bindingError('FINANCE_ACCOUNTING_CONNECTION_MAPPING_INVALID')
    }
    return Object.freeze({
      scope: 'entity' as const,
      gate: FINANCE_ACCOUNTING_CONNECTION_REVIEWED_READINESS_GATE,
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

function validateEnvelope(input: FinanceAccountingConnectionBindingProposalInput): void {
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
    throw bindingError('FINANCE_ACCOUNTING_CONNECTION_BINDING_INPUT_INVALID')
  }
}

function validateTargets(
  entities: readonly FinanceAccountingConnectionBindingTarget[],
  input: Pick<
    FinanceAccountingConnectionBindingProposalInput,
    'campaignReviewReference' | 'readinessReviewReference'
  >
): ReadonlyMap<string, FinanceAccountingConnectionBindingTarget> {
  const targets = new Map<string, FinanceAccountingConnectionBindingTarget>()
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
      throw bindingError('FINANCE_ACCOUNTING_CONNECTION_MAPPING_INVALID')
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

function bindingError(code: FinanceAccountingConnectionBindingErrorCode) {
  return new FinanceAccountingConnectionBindingError(code)
}
