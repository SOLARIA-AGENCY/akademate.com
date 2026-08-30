import type { PayloadRequest } from 'payload'

import {
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  evaluateFinanceReadAuthorizationShadow,
  type FinanceReadAuthorizationInput,
  type FinanceReadAuthorizationShadowEvaluation,
  type FinanceReconciliationShadowRunnerResult,
  type FinanceEntityShadowConfiguration,
  type FinanceEntityShadowLoaderLimits,
  type AccountingSnapshotReader,
  type ExternalOperationalFinanceReaders,
} from '../../../../packages/finance/src'
import { createPayloadFinanceEntityShadowComposition } from './finance-entity-shadow-payload-composition'
import type { ReviewedPayloadFinanceEntityPlan } from './finance-payload-relationship-readers'

export const AUTHORIZED_FINANCE_ENTITY_SHADOW_FLAG =
  'AKADEMATE_CEP_FINANCE_ENTITY_SHADOW_ENABLED' as const
export const AUTHORIZED_FINANCE_ENTITY_SHADOW_ENVIRONMENT =
  'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT' as const

export interface AuthorizedFinanceEntityShadowServiceOptions {
  readonly req: PayloadRequest
  readonly authorization: FinanceReadAuthorizationInput
  readonly configuration: FinanceEntityShadowConfiguration
  readonly reviewedPayloadPlan: ReviewedPayloadFinanceEntityPlan
  readonly accounting: AccountingSnapshotReader
  readonly externalOperations: ExternalOperationalFinanceReaders
  readonly payloadLimits?: {
    readonly pageSize?: number
    readonly maxPages?: number
    readonly maxRecords?: number
  }
  readonly reconciliationLimits?: FinanceEntityShadowLoaderLimits
}

export type AuthorizedFinanceEntityShadowServiceResult =
  | {
      readonly status: 'skipped'
      readonly reason:
        | 'feature_flag_disabled'
        | 'environment_missing_or_invalid'
        | 'production_forbidden'
        | 'legacy_access_denied'
      readonly authorization: FinanceReadAuthorizationShadowEvaluation
      readonly canReadProvider: false
      readonly canWrite: false
      readonly canApply: false
    }
  | {
      readonly status: 'observed'
      readonly reason: 'shadow_observed'
      readonly authorization: FinanceReadAuthorizationShadowEvaluation
      readonly canReadProvider: true
      readonly canWrite: false
      readonly canApply: false
      readonly observation: Extract<
        FinanceReconciliationShadowRunnerResult,
        { readonly status: 'observed' }
      >['observation']
    }
  | {
      readonly status: 'failed'
      readonly reason:
        | 'composition_invalid'
        | 'authorization_scope_mismatch'
        | 'snapshot_load_failed'
        | 'reconciliation_planning_failed'
      readonly authorization: FinanceReadAuthorizationShadowEvaluation
      readonly canReadProvider: false
      readonly canWrite: false
      readonly canApply: false
    }

export interface AuthorizedFinanceEntityShadowService {
  readonly schemaVersion: 1
  readonly mode: 'authorized_single_entity_read_only_shadow'
  readonly canWrite: false
  readonly canApply: false
  run(
    environment?: Readonly<Record<string, string | undefined>>
  ): Promise<AuthorizedFinanceEntityShadowServiceResult>
}

/**
 * Evaluates the future finance policy in shadow mode while preserving the
 * current effective decision. Provider/Payload readers are reached only when
 * the legacy decision already allows access and both staging flags are on.
 * This module is intentionally not registered as a route, job, hook or ACL.
 */
export function createAuthorizedFinanceEntityShadowService(
  options: AuthorizedFinanceEntityShadowServiceOptions
): AuthorizedFinanceEntityShadowService {
  const authorization = evaluateAuthorization(options.authorization)

  return Object.freeze({
    schemaVersion: 1 as const,
    mode: 'authorized_single_entity_read_only_shadow' as const,
    canWrite: false as const,
    canApply: false as const,
    run: (environment?: Readonly<Record<string, string | undefined>>) =>
      runService(options, authorization, environment),
  })
}

function evaluateAuthorization(
  input: FinanceReadAuthorizationInput
): FinanceReadAuthorizationShadowEvaluation {
  try {
    return evaluateFinanceReadAuthorizationShadow(input)
  } catch {
    return Object.freeze({
      mode: 'disabled',
      decisionSource: 'legacy',
      effectiveAllowed: false,
      proposedDecision: null,
      divergence: null,
      canApply: false,
      canChangePermissions: false,
    })
  }
}

async function runService(
  options: AuthorizedFinanceEntityShadowServiceOptions,
  authorization: FinanceReadAuthorizationShadowEvaluation,
  environment: Readonly<Record<string, string | undefined>> = process.env
): Promise<AuthorizedFinanceEntityShadowServiceResult> {
  const gate = resolveGate(environment)
  if (gate !== 'enabled') {
    return skipped(gate, authorization)
  }
  if (!authorization.effectiveAllowed) {
    return skipped('legacy_access_denied', authorization)
  }
  if (!authorizationScopeMatchesConfiguration(options.authorization.scope, options.configuration)) {
    return failed('authorization_scope_mismatch', authorization)
  }

  let composition: ReturnType<typeof createPayloadFinanceEntityShadowComposition>
  try {
    composition = createPayloadFinanceEntityShadowComposition({
      req: options.req,
      configuration: options.configuration,
      reviewedPayloadPlan: options.reviewedPayloadPlan,
      accounting: options.accounting,
      externalOperations: options.externalOperations,
      payloadLimits: options.payloadLimits,
      reconciliationLimits: options.reconciliationLimits,
    })
  } catch {
    return failed('composition_invalid', authorization)
  }

  try {
    const result = await composition.run(environment)
    if (result.status === 'observed') {
      return Object.freeze({
        status: 'observed',
        reason: 'shadow_observed',
        authorization,
        canReadProvider: true,
        canWrite: false,
        canApply: false,
        observation: result.observation,
      })
    }
    if (result.status === 'failed') {
      return failed(result.reason, authorization)
    }
    return failed('snapshot_load_failed', authorization)
  } catch {
    return failed('snapshot_load_failed', authorization)
  }
}

type GateReason =
  | 'enabled'
  | 'feature_flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'

function resolveGate(environment: Readonly<Record<string, string | undefined>>): GateReason {
  if (environment[AUTHORIZED_FINANCE_ENTITY_SHADOW_FLAG] !== 'true') {
    return 'feature_flag_disabled'
  }
  if (environment[FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG] !== 'true') {
    return 'feature_flag_disabled'
  }
  const value = environment[AUTHORIZED_FINANCE_ENTITY_SHADOW_ENVIRONMENT]?.trim().toLowerCase()
  if (value === 'production') return 'production_forbidden'
  if (value !== 'staging') return 'environment_missing_or_invalid'
  const reconciliationEnvironment =
    environment[FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]?.trim().toLowerCase()
  if (reconciliationEnvironment === 'production') return 'production_forbidden'
  if (reconciliationEnvironment !== 'staging') return 'environment_missing_or_invalid'
  return 'enabled'
}

function skipped(
  reason: Exclude<GateReason, 'enabled'> | 'legacy_access_denied',
  authorization: FinanceReadAuthorizationShadowEvaluation
): AuthorizedFinanceEntityShadowServiceResult {
  return Object.freeze({
    status: 'skipped',
    reason,
    authorization,
    canReadProvider: false,
    canWrite: false,
    canApply: false,
  })
}

function failed(
  reason:
    | 'composition_invalid'
    | 'authorization_scope_mismatch'
    | 'snapshot_load_failed'
    | 'reconciliation_planning_failed',
  authorization: FinanceReadAuthorizationShadowEvaluation
): AuthorizedFinanceEntityShadowServiceResult {
  return Object.freeze({
    status: 'failed',
    reason,
    authorization,
    canReadProvider: false,
    canWrite: false,
    canApply: false,
  })
}

/**
 * The authorization decision and the data readers must describe exactly one
 * entity and accounting connection. This is an integrity check for shadow
 * mode only; it never grants, revokes or changes the legacy decision.
 */
function authorizationScopeMatchesConfiguration(
  scope: unknown,
  configuration: FinanceEntityShadowConfiguration
): boolean {
  if (!scope || typeof scope !== 'object') return false
  const candidate = scope as Record<string, unknown>
  return (
    candidate.tenantId === configuration.tenantId &&
    candidate.legalEntityId === configuration.legalEntityId &&
    candidate.connectionId === configuration.accountingConnectionId
  )
}
