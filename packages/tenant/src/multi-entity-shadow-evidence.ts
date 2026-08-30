import {
  summarizeUnifiedLedgerObservations,
  type RedactedUnifiedLedgerObservation,
  type UnifiedLedgerMetrics,
} from './multi-entity-ledger-observability'

export type UnifiedLedgerEvidenceVerdict = 'insufficient_evidence' | 'ready' | 'blocked'

export interface UnifiedLedgerEvidenceManifest {
  readonly schemaVersion: 1
  readonly kind: 'cep_multi_entity_unified_ledger'
  readonly mode: 'shadow_evidence'
  readonly canWrite: false
  readonly canApply: false
  readonly verdict: UnifiedLedgerEvidenceVerdict
  readonly metrics: UnifiedLedgerMetrics
}

/**
 * Builds a deterministic, identifier-free evidence artifact from validated
 * redacted observations. The manifest contains no timestamp or generated ID,
 * so equivalent observation sets serialize to identical bytes.
 */
export function createUnifiedLedgerEvidenceManifest(
  observations: readonly RedactedUnifiedLedgerObservation[]
): UnifiedLedgerEvidenceManifest {
  const metrics = freezeMetrics(summarizeUnifiedLedgerObservations(observations))
  const verdict = evidenceVerdict(metrics)

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_multi_entity_unified_ledger',
    mode: 'shadow_evidence',
    canWrite: false,
    canApply: false,
    verdict,
    metrics,
  })
}

/**
 * Serializes a newly validated manifest in a fixed property order. This is a
 * reproducibility fingerprint, not a signature or proof of authenticity.
 */
export function serializeUnifiedLedgerEvidenceManifest(
  observations: readonly RedactedUnifiedLedgerObservation[]
): string {
  return JSON.stringify(createUnifiedLedgerEvidenceManifest(observations))
}

function evidenceVerdict(metrics: UnifiedLedgerMetrics): UnifiedLedgerEvidenceVerdict {
  if (metrics.runs === 0) return 'insufficient_evidence'
  if (
    metrics.blockedRuns > 0 ||
    metrics.unresolvedRecords > 0 ||
    metrics.blockedIssues > 0 ||
    metrics.coverageBasisPoints !== 10_000
  ) {
    return 'blocked'
  }
  return 'ready'
}

function freezeMetrics(metrics: UnifiedLedgerMetrics): UnifiedLedgerMetrics {
  Object.freeze(metrics.proposalSources)
  Object.freeze(metrics.issueStages)
  return Object.freeze(metrics)
}
