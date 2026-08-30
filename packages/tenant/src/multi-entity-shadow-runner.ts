import { createRedactedUnifiedLedgerObservation } from './multi-entity-ledger-observability'
import {
  createUnifiedLedgerEvidenceManifest,
  type UnifiedLedgerEvidenceManifest,
} from './multi-entity-shadow-evidence'
import {
  planUnifiedMultiEntityShadow,
  type UnifiedMultiEntityShadowInput,
} from './multi-entity-unified-shadow-plan'

export const MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG =
  'AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED'
export const MULTI_ENTITY_LEDGER_SHADOW_RUNNER_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

export type UnifiedLedgerShadowRunnerGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'staging_enabled'

export type UnifiedLedgerShadowRunnerGate =
  | {
      readonly enabled: false
      readonly reason: Exclude<UnifiedLedgerShadowRunnerGateReason, 'staging_enabled'>
    }
  | {
      readonly enabled: true
      readonly reason: 'staging_enabled'
    }

export interface UnifiedLedgerShadowRunnerOptions {
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly loadSnapshot: () => Promise<UnifiedMultiEntityShadowInput>
}

export interface UnifiedLedgerShadowRunnerSkipped {
  readonly status: 'skipped'
  readonly reason: Exclude<UnifiedLedgerShadowRunnerGateReason, 'staging_enabled'>
  readonly canWrite: false
  readonly canApply: false
}

export interface UnifiedLedgerShadowRunnerFailed {
  readonly status: 'failed'
  readonly reason: 'snapshot_load_failed' | 'shadow_planning_failed'
  readonly canWrite: false
  readonly canApply: false
}

export interface UnifiedLedgerShadowRunnerObserved {
  readonly status: 'observed'
  readonly reason: 'shadow_observed'
  readonly canWrite: false
  readonly canApply: false
  readonly manifest: UnifiedLedgerEvidenceManifest
  readonly serializedManifest: string
}

export type UnifiedLedgerShadowRunnerResult =
  | UnifiedLedgerShadowRunnerSkipped
  | UnifiedLedgerShadowRunnerFailed
  | UnifiedLedgerShadowRunnerObserved

export function resolveUnifiedLedgerShadowRunnerGate(
  environment: Readonly<Record<string, string | undefined>> = process.env
): UnifiedLedgerShadowRunnerGate {
  if (environment[MULTI_ENTITY_LEDGER_SHADOW_RUNNER_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }

  const explicitEnvironment =
    environment[MULTI_ENTITY_LEDGER_SHADOW_RUNNER_ENVIRONMENT]?.trim().toLowerCase()

  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }
  if (explicitEnvironment !== 'staging') {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }
  return { enabled: true, reason: 'staging_enabled' }
}

/**
 * Runs one staging-only shadow observation through an injected read function.
 * It has no persistence callback, endpoint registration or apply capability.
 */
export async function runUnifiedLedgerShadowEvidence(
  options: UnifiedLedgerShadowRunnerOptions
): Promise<UnifiedLedgerShadowRunnerResult> {
  const gate = resolveUnifiedLedgerShadowRunnerGate(options.environment)
  if (!gate.enabled) {
    return Object.freeze({
      status: 'skipped',
      reason: gate.reason,
      canWrite: false,
      canApply: false,
    })
  }

  let snapshot: UnifiedMultiEntityShadowInput
  try {
    snapshot = await options.loadSnapshot()
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
  }

  try {
    const plan = planUnifiedMultiEntityShadow(snapshot)
    const observation = createRedactedUnifiedLedgerObservation(plan)
    const manifest = createUnifiedLedgerEvidenceManifest([observation])

    return Object.freeze({
      status: 'observed',
      reason: 'shadow_observed',
      canWrite: false,
      canApply: false,
      manifest,
      serializedManifest: JSON.stringify(manifest),
    })
  } catch {
    return Object.freeze({
      status: 'failed',
      reason: 'shadow_planning_failed',
      canWrite: false,
      canApply: false,
    })
  }
}
