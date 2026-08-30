import type { MultiEntityStagingEvidenceBundleVerdict } from './multi-entity-staging-evidence-bundle'

export type NominalPermissionLockedPhase = 'implementation' | 'staging_validation'
export type NominalPermissionRequestedAction = 'generate_nominal_matrix' | 'apply_permission_change'

export interface NominalPermissionPhaseLockInput {
  readonly phase: NominalPermissionLockedPhase
  readonly requestedAction: NominalPermissionRequestedAction
  readonly authorizationMode: 'disabled' | 'shadow'
  readonly accessBaselineVerdict: 'unchanged' | 'changed'
  readonly stagingBundleVerdict: MultiEntityStagingEvidenceBundleVerdict
  readonly requestReviewReference: string
}

export type NominalPermissionPhaseLockReason =
  | 'access_baseline_changed'
  | 'authorization_mode_not_disabled'
  | 'staging_bundle_not_ready'
  | 'final_solution_validation_not_proven'
  | 'explicit_manual_authorization_missing'
  | 'manual_per_user_rollback_not_approved'
  | 'platform_superadmin_not_business_authority'
  | 'matrix_generation_forbidden_during_implementation'
  | 'permission_application_forbidden_during_implementation'

export interface NominalPermissionPhaseLockObservation {
  readonly schemaVersion: 1
  readonly kind: 'cep_nominal_permission_phase_lock'
  readonly mode: 'deny_only_during_implementation'
  readonly verdict: 'locked'
  readonly canGenerateNominalMatrix: false
  readonly canApplyPermissionChange: false
  readonly canBulkChangePermissions: false
  readonly canUsePlatformSuperadmin: false
  readonly requiresManualPerUserRollback: true
  readonly reasons: readonly NominalPermissionPhaseLockReason[]
  readonly metrics: {
    readonly blockingReasons: number
    readonly accessBaselineUnchanged: boolean
    readonly stagingBundleReadyForReview: boolean
    readonly authorizationDisabled: boolean
  }
}

const INPUT_KEYS = new Set([
  'phase',
  'requestedAction',
  'authorizationMode',
  'accessBaselineVerdict',
  'stagingBundleVerdict',
  'requestReviewReference',
])
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const PHASES = new Set<NominalPermissionLockedPhase>(['implementation', 'staging_validation'])
const ACTIONS = new Set<NominalPermissionRequestedAction>([
  'generate_nominal_matrix',
  'apply_permission_change',
])
const BUNDLE_VERDICTS = new Set<MultiEntityStagingEvidenceBundleVerdict>([
  'insufficient_evidence',
  'blocked',
  'ready_for_manual_staging_review',
])

/**
 * Produces an identifier-free deny-only observation. There is intentionally no
 * unlock, generation or apply branch in this module; a later final-validation
 * contract must be reviewed separately before Fase 6 can exist.
 */
export function createNominalPermissionPhaseLock(
  input: NominalPermissionPhaseLockInput
): NominalPermissionPhaseLockObservation {
  validateInput(input)

  const accessBaselineUnchanged = input.accessBaselineVerdict === 'unchanged'
  const stagingBundleReadyForReview =
    input.stagingBundleVerdict === 'ready_for_manual_staging_review'
  const authorizationDisabled = input.authorizationMode === 'disabled'
  const reasons: NominalPermissionPhaseLockReason[] = []

  if (!accessBaselineUnchanged) reasons.push('access_baseline_changed')
  if (!authorizationDisabled) reasons.push('authorization_mode_not_disabled')
  if (!stagingBundleReadyForReview) reasons.push('staging_bundle_not_ready')
  reasons.push(
    'final_solution_validation_not_proven',
    'explicit_manual_authorization_missing',
    'manual_per_user_rollback_not_approved',
    'platform_superadmin_not_business_authority',
    input.requestedAction === 'generate_nominal_matrix'
      ? 'matrix_generation_forbidden_during_implementation'
      : 'permission_application_forbidden_during_implementation'
  )

  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_nominal_permission_phase_lock',
    mode: 'deny_only_during_implementation',
    verdict: 'locked',
    canGenerateNominalMatrix: false,
    canApplyPermissionChange: false,
    canBulkChangePermissions: false,
    canUsePlatformSuperadmin: false,
    requiresManualPerUserRollback: true,
    reasons: Object.freeze(reasons),
    metrics: Object.freeze({
      blockingReasons: reasons.length,
      accessBaselineUnchanged,
      stagingBundleReadyForReview,
      authorizationDisabled,
    }),
  })
}

export function serializeNominalPermissionPhaseLock(
  input: NominalPermissionPhaseLockInput
): string {
  return JSON.stringify(createNominalPermissionPhaseLock(input))
}

function validateInput(input: NominalPermissionPhaseLockInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS) ||
    !PHASES.has(input.phase) ||
    !ACTIONS.has(input.requestedAction) ||
    !['disabled', 'shadow'].includes(input.authorizationMode) ||
    !['unchanged', 'changed'].includes(input.accessBaselineVerdict) ||
    !BUNDLE_VERDICTS.has(input.stagingBundleVerdict) ||
    !REVIEW_REFERENCE_PATTERN.test(input.requestReviewReference)
  ) {
    throw new Error('MULTI_ENTITY_NOMINAL_PERMISSION_PHASE_LOCK_INPUT_INVALID')
  }
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
  )
}
