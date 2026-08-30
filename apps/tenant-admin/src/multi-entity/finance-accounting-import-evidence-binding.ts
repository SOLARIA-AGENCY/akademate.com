import { createHash } from 'node:crypto'

import {
  assertAccountingImportStagingEvidenceArtifact,
  type AccountingImportStagingEvidenceArtifact,
} from '../../../../packages/finance/src'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const ACCOUNTING_IMPORT_STAGING_READINESS_GATE =
  'accounting_import_staging_verified' as const

export interface AccountingImportEvidenceBindingProposalInput {
  readonly artifact: AccountingImportStagingEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface AccountingImportEvidenceBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_staging_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

export type AccountingImportEvidenceBindingErrorCode =
  | 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_BINDING_INPUT_INVALID'
  | 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_ARTIFACT_INVALID'
  | 'FINANCE_ACCOUNTING_IMPORT_EVIDENCE_CAMPAIGN_MISMATCH'

export class AccountingImportEvidenceBindingError extends Error {
  constructor(readonly code: AccountingImportEvidenceBindingErrorCode) {
    super('Finance accounting import evidence binding is invalid.')
    this.name = 'AccountingImportEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/**
 * Builds an internal proposal for the exact global readiness gate. It neither
 * mutates readiness nor marks evidence verified; the complete staging bundle
 * remains the only consumer allowed to evaluate the binding.
 */
export function createAccountingImportEvidenceBindingProposal(
  input: AccountingImportEvidenceBindingProposalInput
): AccountingImportEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('FINANCE_ACCOUNTING_IMPORT_EVIDENCE_BINDING_INPUT_INVALID')
  }

  try {
    assertAccountingImportStagingEvidenceArtifact(input.artifact)
  } catch {
    throw bindingError('FINANCE_ACCOUNTING_IMPORT_EVIDENCE_ARTIFACT_INVALID')
  }

  if (
    digest(input.campaignReviewReference) !== input.artifact.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.artifact.readinessReviewReferenceDigest
  ) {
    throw bindingError('FINANCE_ACCOUNTING_IMPORT_EVIDENCE_CAMPAIGN_MISMATCH')
  }

  const binding: MultiEntityStagingEvidenceBinding = Object.freeze({
    scope: 'global',
    gate: ACCOUNTING_IMPORT_STAGING_READINESS_GATE,
    reviewReference: input.readinessReviewReference,
    evidenceReference: input.artifact.evidenceReference,
    campaignReviewReference: input.campaignReviewReference,
    sourceDigest: input.artifact.sourceDigest,
    targetTenantDigest: input.artifact.targetTenantDigest,
    artifactKind: input.artifact.kind,
    artifactDigest: input.artifact.artifactDigest,
  })

  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_staging_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canDeploy: false,
    canActivate: false,
    canChangePermissions: false,
    binding,
  })
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}

function digest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function bindingError(code: AccountingImportEvidenceBindingErrorCode) {
  return new AccountingImportEvidenceBindingError(code)
}
