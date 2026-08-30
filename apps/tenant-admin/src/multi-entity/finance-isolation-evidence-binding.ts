import { createHash } from 'node:crypto'

import {
  assertFinanceIsolationStagingEvidenceManifest,
  type FinanceIsolationStagingEvidenceManifest,
} from '../../../../packages/finance/src'
import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'

export const FINANCE_ISOLATION_STAGING_READINESS_GATE =
  'financial_isolation_harness_verified' as const

export interface FinanceIsolationEvidenceBindingProposalInput {
  readonly manifest: FinanceIsolationStagingEvidenceManifest
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface FinanceIsolationEvidenceBindingProposal {
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

export type FinanceIsolationEvidenceBindingErrorCode =
  | 'FINANCE_ISOLATION_EVIDENCE_BINDING_INPUT_INVALID'
  | 'FINANCE_ISOLATION_EVIDENCE_MANIFEST_INVALID'
  | 'FINANCE_ISOLATION_EVIDENCE_CAMPAIGN_MISMATCH'

export class FinanceIsolationEvidenceBindingError extends Error {
  constructor(readonly code: FinanceIsolationEvidenceBindingErrorCode) {
    super('Finance isolation evidence binding is invalid.')
    this.name = 'FinanceIsolationEvidenceBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['manifest', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes a global binding but never marks readiness or mutates state. */
export function createFinanceIsolationEvidenceBindingProposal(
  input: FinanceIsolationEvidenceBindingProposalInput
): FinanceIsolationEvidenceBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('FINANCE_ISOLATION_EVIDENCE_BINDING_INPUT_INVALID')
  }
  try {
    assertFinanceIsolationStagingEvidenceManifest(input.manifest)
  } catch {
    throw bindingError('FINANCE_ISOLATION_EVIDENCE_MANIFEST_INVALID')
  }
  if (
    digest(input.campaignReviewReference) !== input.manifest.campaignReviewReferenceDigest ||
    digest(input.readinessReviewReference) !== input.manifest.readinessReviewReferenceDigest
  ) {
    throw bindingError('FINANCE_ISOLATION_EVIDENCE_CAMPAIGN_MISMATCH')
  }

  return Object.freeze({
    schemaVersion: 1,
    mode: 'manual_staging_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canDeploy: false,
    canActivate: false,
    canChangePermissions: false,
    binding: Object.freeze({
      scope: 'global',
      gate: FINANCE_ISOLATION_STAGING_READINESS_GATE,
      reviewReference: input.readinessReviewReference,
      evidenceReference: input.manifest.evidenceReference,
      campaignReviewReference: input.campaignReviewReference,
      sourceDigest: input.manifest.sourceDigest,
      targetTenantDigest: input.manifest.targetTenantDigest,
      artifactKind: input.manifest.kind,
      artifactDigest: input.manifest.artifactDigest,
    }),
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

function bindingError(code: FinanceIsolationEvidenceBindingErrorCode) {
  return new FinanceIsolationEvidenceBindingError(code)
}
