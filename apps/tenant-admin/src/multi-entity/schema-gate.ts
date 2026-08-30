import type { CollectionConfig } from 'payload'
import { CEP_MULTI_ENTITY_SHADOW_COLLECTIONS } from './shadow-collections'

export const CEP_MULTI_ENTITY_SCHEMA_FLAG = 'AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED'
export const CEP_MULTI_ENTITY_ENVIRONMENT = 'AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT'

type EnvironmentSource = Readonly<Record<string, string | undefined>>

export type MultiEntitySchemaGateReason =
  | 'flag_disabled'
  | 'environment_missing_or_invalid'
  | 'production_forbidden'
  | 'shadow_enabled'

export interface MultiEntitySchemaGate {
  readonly enabled: boolean
  readonly reason: MultiEntitySchemaGateReason
}

const NON_PRODUCTION_ENVIRONMENTS = new Set(['local', 'development', 'test', 'staging'])

export function resolveMultiEntitySchemaGate(
  environment: EnvironmentSource = process.env
): MultiEntitySchemaGate {
  if (environment[CEP_MULTI_ENTITY_SCHEMA_FLAG] !== 'true') {
    return { enabled: false, reason: 'flag_disabled' }
  }

  const explicitEnvironment = environment[CEP_MULTI_ENTITY_ENVIRONMENT]?.trim().toLowerCase()

  if (explicitEnvironment === 'production') {
    return { enabled: false, reason: 'production_forbidden' }
  }

  if (!explicitEnvironment || !NON_PRODUCTION_ENVIRONMENTS.has(explicitEnvironment)) {
    return { enabled: false, reason: 'environment_missing_or_invalid' }
  }

  return { enabled: true, reason: 'shadow_enabled' }
}

export function getMultiEntityShadowCollections(
  environment: EnvironmentSource = process.env
): readonly CollectionConfig[] {
  return resolveMultiEntitySchemaGate(environment).enabled
    ? CEP_MULTI_ENTITY_SHADOW_COLLECTIONS
    : []
}
