import { createHash } from 'node:crypto'

import type { MultiEntityStagingEvidenceBinding } from '../../../../packages/tenant/src/multi-entity-staging-evidence-bundle'
import {
  assertObservabilityRedactionStagingEvidenceArtifact,
  type ObservabilityRedactionStagingEvidenceArtifact,
} from './observability-redaction-staging-evidence'

export const OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE =
  'observability_redaction_verified' as const

export interface ObservabilityRedactionBindingProposalInput {
  readonly artifact: ObservabilityRedactionStagingEvidenceArtifact
  readonly campaignReviewReference: string
  readonly readinessReviewReference: string
}

export interface ObservabilityRedactionBindingProposal {
  readonly schemaVersion: 1
  readonly mode: 'manual_observability_redaction_evidence_binding_proposal'
  readonly status: 'proposed'
  readonly canBindAutomatically: false
  readonly canMarkVerified: false
  readonly canEmitTelemetry: false
  readonly canPersistPayload: false
  readonly canReadRuntimeLogs: false
  readonly canDeploy: false
  readonly canActivate: false
  readonly canChangePermissions: false
  readonly binding: MultiEntityStagingEvidenceBinding
}

export type ObservabilityRedactionBindingErrorCode =
  | 'OBSERVABILITY_REDACTION_BINDING_INPUT_INVALID'
  | 'OBSERVABILITY_REDACTION_ARTIFACT_INVALID'
  | 'OBSERVABILITY_REDACTION_CONTEXT_MISMATCH'

export class ObservabilityRedactionBindingError extends Error {
  constructor(readonly code: ObservabilityRedactionBindingErrorCode) {
    super('Observability redaction evidence binding is invalid.')
    this.name = 'ObservabilityRedactionBindingError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const INPUT_KEYS = new Set(['artifact', 'campaignReviewReference', 'readinessReviewReference'])

/** Proposes one global gate without reading logs or emitting telemetry. */
export function createObservabilityRedactionBindingProposal(
  input: ObservabilityRedactionBindingProposalInput
): ObservabilityRedactionBindingProposal {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !REVIEW_REFERENCE_PATTERN.test(input.campaignReviewReference) ||
    !REVIEW_REFERENCE_PATTERN.test(input.readinessReviewReference) ||
    input.campaignReviewReference === input.readinessReviewReference
  ) {
    throw bindingError('OBSERVABILITY_REDACTION_BINDING_INPUT_INVALID')
  }
  try {
    assertObservabilityRedactionStagingEvidenceArtifact(input.artifact)
  } catch {
    throw bindingError('OBSERVABILITY_REDACTION_ARTIFACT_INVALID')
  }
  if (
    input.artifact.campaignReviewReferenceDigest !== digest(input.campaignReviewReference) ||
    input.artifact.readinessReviewReferenceDigest !== digest(input.readinessReviewReference)
  ) {
    throw bindingError('OBSERVABILITY_REDACTION_CONTEXT_MISMATCH')
  }
  const binding = Object.freeze({
    scope: 'global' as const,
    gate: OBSERVABILITY_REDACTION_VERIFIED_READINESS_GATE,
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
    mode: 'manual_observability_redaction_evidence_binding_proposal',
    status: 'proposed',
    canBindAutomatically: false,
    canMarkVerified: false,
    canEmitTelemetry: false,
    canPersistPayload: false,
    canReadRuntimeLogs: false,
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

function bindingError(code: ObservabilityRedactionBindingErrorCode) {
  return new ObservabilityRedactionBindingError(code)
}
