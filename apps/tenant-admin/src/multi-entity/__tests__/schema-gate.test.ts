import { describe, expect, it } from 'vitest'
import {
  CEP_MULTI_ENTITY_ENVIRONMENT,
  CEP_MULTI_ENTITY_SCHEMA_FLAG,
  getMultiEntityShadowCollections,
  resolveMultiEntitySchemaGate,
} from '../schema-gate'
import {
  CEP_MULTI_ENTITY_SHADOW_COLLECTIONS,
  CepAccountingConnectionsShadow,
  validateSecretReference,
} from '../shadow-collections'

describe('CEP multi-entity schema gate', () => {
  it('keeps the legacy Payload collection list when the flag is absent', () => {
    expect(getMultiEntityShadowCollections({})).toEqual([])
    expect(resolveMultiEntitySchemaGate({})).toEqual({
      enabled: false,
      reason: 'flag_disabled',
    })
  })

  it('fails closed when the explicit environment is missing or unknown', () => {
    const flagOnly = { [CEP_MULTI_ENTITY_SCHEMA_FLAG]: 'true' }
    const unknown = {
      ...flagOnly,
      [CEP_MULTI_ENTITY_ENVIRONMENT]: 'preview',
      NODE_ENV: 'test',
    }

    expect(resolveMultiEntitySchemaGate(flagOnly).enabled).toBe(false)
    expect(resolveMultiEntitySchemaGate(unknown)).toEqual({
      enabled: false,
      reason: 'environment_missing_or_invalid',
    })
  })

  it('refuses production even when the feature flag is enabled', () => {
    expect(
      resolveMultiEntitySchemaGate({
        [CEP_MULTI_ENTITY_SCHEMA_FLAG]: 'true',
        [CEP_MULTI_ENTITY_ENVIRONMENT]: 'production',
      })
    ).toEqual({ enabled: false, reason: 'production_forbidden' })
  })

  it.each(['local', 'development', 'test', 'staging'])(
    'allows %s shadow schema explicitly',
    (environment) => {
      const collections = getMultiEntityShadowCollections({
        [CEP_MULTI_ENTITY_SCHEMA_FLAG]: 'true',
        [CEP_MULTI_ENTITY_ENVIRONMENT]: environment,
      })

      expect(collections).toBe(CEP_MULTI_ENTITY_SHADOW_COLLECTIONS)
    }
  )

  it('registers only hidden collections whose user-facing access is denied', () => {
    expect(CEP_MULTI_ENTITY_SHADOW_COLLECTIONS.map(({ slug }) => slug)).toEqual([
      'cep-legal-entities',
      'cep-entity-campus-bindings',
      'cep-staff-entity-assignments',
      'cep-accounting-connections',
    ])

    for (const collection of CEP_MULTI_ENTITY_SHADOW_COLLECTIONS) {
      expect(collection.admin?.hidden).toBe(true)
      for (const operation of [
        collection.access?.read,
        collection.access?.create,
        collection.access?.update,
        collection.access?.delete,
      ]) {
        expect(operation).toBeTypeOf('function')
        if (typeof operation === 'function') {
          expect(operation({} as never)).toBe(false)
        }
      }
    }
  })

  it('does not introduce a users or memberships relation', () => {
    const serializedSchema = JSON.stringify(CEP_MULTI_ENTITY_SHADOW_COLLECTIONS)

    expect(serializedSchema).not.toContain('users')
    expect(serializedSchema).not.toContain('membership')
  })
})

describe('shadow accounting connection contract', () => {
  it('offers read-only integration as the only mode', () => {
    const integrationMode = CepAccountingConnectionsShadow.fields.find(
      (field) => 'name' in field && field.name === 'integrationMode'
    )

    expect(integrationMode).toMatchObject({
      type: 'select',
      defaultValue: 'read_only',
      options: [{ value: 'read_only' }],
    })
  })

  it.each(['op://cep/accounting/token', 'vault://cep-sur/api-key', 'aws-sm://cep/norte'])(
    'accepts an opaque secret-manager reference: %s',
    (reference) => {
      expect(validateSecretReference(reference)).toBe(true)
    }
  )

  it.each(['raw-token-value', 'Bearer secret', '', 'https://vault.example/secret'])(
    'rejects a credential or unsupported location: %s',
    (value) => {
      expect(validateSecretReference(value)).not.toBe(true)
    }
  )
})
