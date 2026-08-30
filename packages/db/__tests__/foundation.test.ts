import { describe, expect, it } from 'vitest'
import {
  ActorType,
  CapabilityKey,
  commercialPlanFromStored,
  storedPlanFromCommercial,
} from '@akademate/types'
import {
  assertNotUsedAsCapability,
  blueprintDefaultCapabilities,
  buildAuditEvent,
  createActorContext,
  defaultPlacement,
  generateCorrelationId,
  groupMembershipGrantsTenantAccess,
  isProductCapability,
  isUuid,
  isValidPlanDeploymentPair,
  isValidTenantId,
  organizationModelFor,
  pairPlanAndDeployment,
  requiresNewTenant,
  resolveCapability,
  resolvePolicy,
  tenantScopedRows,
} from '../src/index'
import {
  auditLogs,
  blueprints,
  campuses,
  capabilities,
  centers,
  featureFlags,
  legalEntities,
  memberships,
  organizationGroupMemberships,
  organizationGroups,
  policies,
  tenantCapabilities,
  tenants,
  users,
} from '../src/schema'

const hasColumn = (table: Record<string, unknown>, column: string): boolean => Boolean(table?.[column])

describe('foundation schema expand', () => {
  it('organization_groups exist as Account, distinct from Better Auth accounts', () => {
    expect(hasColumn(organizationGroups, 'slug')).toBe(true)
    expect(hasColumn(organizationGroups, 'name')).toBe(true)
  })

  it('tenants carry group, blueprint, organization model, deployment and cell metadata', () => {
    expect(hasColumn(tenants, 'organizationGroupId')).toBe(true)
    expect(hasColumn(tenants, 'blueprintKey')).toBe(true)
    expect(hasColumn(tenants, 'organizationModel')).toBe(true)
    expect(hasColumn(tenants, 'deploymentMode')).toBe(true)
    expect(hasColumn(tenants, 'regionId')).toBe(true)
    expect(hasColumn(tenants, 'cellId')).toBe(true)
    expect(hasColumn(tenants, 'deploymentId')).toBe(true)
    expect(hasColumn(tenants, 'plan')).toBe(true)
  })

  it('users evolve toward global Person without a parallel persons table', () => {
    expect(hasColumn(users, 'email')).toBe(true)
    expect(hasColumn(users, 'givenName')).toBe(true)
    expect(hasColumn(users, 'familyName')).toBe(true)
    expect(hasColumn(users, 'status')).toBe(true)
  })

  it('memberships remain tenant-scoped TenantMembership', () => {
    expect(hasColumn(memberships, 'userId')).toBe(true)
    expect(hasColumn(memberships, 'tenantId')).toBe(true)
    expect(hasColumn(memberships, 'roles')).toBe(true)
    expect(hasColumn(organizationGroupMemberships, 'organizationGroupId')).toBe(true)
  })

  it('legal entities, locations and campuses are distinct', () => {
    expect(hasColumn(legalEntities, 'tenantId')).toBe(true)
    expect(hasColumn(legalEntities, 'legalName')).toBe(true)
    expect(hasColumn(centers, 'locationKind')).toBe(true)
    expect(hasColumn(campuses, 'kind')).toBe(true)
    expect(hasColumn(campuses, 'locationId')).toBe(true)
  })

  it('capabilities, policies and feature flags are separate tables', () => {
    expect(hasColumn(capabilities, 'key')).toBe(true)
    expect(hasColumn(tenantCapabilities, 'capabilityKey')).toBe(true)
    expect(hasColumn(policies, 'kind')).toBe(true)
    expect(hasColumn(featureFlags, 'purpose')).toBe(true)
    expect(hasColumn(blueprints, 'key')).toBe(true)
  })

  it('audit logs carry correlation and actor type', () => {
    expect(hasColumn(auditLogs, 'correlationId')).toBe(true)
    expect(hasColumn(auditLogs, 'actorType')).toBe(true)
    expect(hasColumn(auditLogs, 'purpose')).toBe(true)
  })
})

describe('plan vs deployment', () => {
  it('maps stored starter/pro/enterprise to Launch/Business/Enterprise without rewriting the enum', () => {
    expect(commercialPlanFromStored('starter')).toBe('launch')
    expect(commercialPlanFromStored('pro')).toBe('business')
    expect(commercialPlanFromStored('enterprise')).toBe('enterprise')
    expect(storedPlanFromCommercial('launch')).toBe('starter')
  })

  it('keeps plan independent from deployment', () => {
    const pair = pairPlanAndDeployment('enterprise', 'on_premise')
    expect(pair.commercialPlan).toBe('enterprise')
    expect(pair.deploymentMode).toBe('on_premise')
    expect(isValidPlanDeploymentPair('enterprise', 'dedicated_cloud')).toBe(true)
    expect(isValidPlanDeploymentPair('starter', 'on_premise')).toBe(false)
    expect(isValidPlanDeploymentPair('pro', 'managed_cloud')).toBe(true)
  })

  it('defaults region/cell/deployment for V1', () => {
    expect(defaultPlacement()).toEqual({
      regionId: 'eu',
      cellId: 'eu-01',
      deploymentId: 'eu-01',
    })
  })
})

describe('organization fiscal rule', () => {
  it('a new location of the same company does not create a tenant', () => {
    expect(requiresNewTenant({ newLocation: { name: 'Sede Norte' } })).toBe(false)
  })

  it('a new legal entity creates a tenant', () => {
    expect(requiresNewTenant({ newLegalEntity: { legalName: 'Empresa B SL', taxId: 'B123' } })).toBe(
      true,
    )
  })

  it('group membership does not grant tenant access', () => {
    expect(groupMembershipGrantsTenantAccess()).toBe(false)
  })

  it('derives organization model from counts', () => {
    expect(organizationModelFor(1, 1)).toBe('single_tenant')
    expect(organizationModelFor(1, 3)).toBe('multi_location')
    expect(organizationModelFor(5, 1)).toBe('multi_tenant_group')
  })
})

describe('capability vs feature flag', () => {
  it('resolves blueprint defaults unless overridden', () => {
    expect(resolveCapability({
      capabilityKey: CapabilityKey.ACADEMIC_PHASES,
      blueprintKey: 'professional_training',
      overrides: [],
    })).toBe(true)

    expect(resolveCapability({
      capabilityKey: CapabilityKey.ACADEMIC_PHASES,
      blueprintKey: 'professional_training',
      overrides: [{ key: CapabilityKey.ACADEMIC_PHASES, enabled: false, source: 'override' }],
    })).toBe(false)
  })

  it('wellness blueprint does not get regulated programmes by default', () => {
    expect(blueprintDefaultCapabilities('wellness')).not.toContain(
      CapabilityKey.ACADEMIC_REGULATED_PROGRAMMES,
    )
  })

  it('rejects using a product capability key as a feature flag', () => {
    expect(isProductCapability(CapabilityKey.LEARNING_LMS)).toBe(true)
    expect(() =>
      assertNotUsedAsCapability({
        key: CapabilityKey.LEARNING_LMS,
        purpose: 'rollout',
        defaultValue: true,
        overrides: [],
      }),
    ).toThrow(/collides with a product capability/)
  })
})

describe('ActorContext and audit', () => {
  it('requires actor, purpose and correlation id', () => {
    const actor = createActorContext({
      actorType: ActorType.HUMAN,
      actorId: 'user-1',
      purpose: 'tenant.read',
      channel: 'api',
      tenantId: '11111111-1111-4111-8111-111111111111',
    })
    expect(actor.correlationId).toBeTruthy()
    expect(isUuid(actor.correlationId)).toBe(true)

    const event = buildAuditEvent({
      actor,
      action: 'tenant.read',
      resource: 'tenants',
      resourceId: actor.tenantId ?? 'unknown',
    })
    expect(event.correlationId).toBe(actor.correlationId)
    expect(event.actorType).toBe('human')
    expect(event.purpose).toBe('tenant.read')
  })

  it('refuses empty purpose', () => {
    expect(() =>
      createActorContext({
        actorType: ActorType.SERVICE,
        actorId: 'worker',
        purpose: '   ',
        channel: 'worker',
      }),
    ).toThrow(/purpose/)
  })

  it('generates unique correlation ids', () => {
    expect(generateCorrelationId()).not.toBe(generateCorrelationId())
  })
})

describe('policy resolution', () => {
  it('prefers tenant override over group and platform defaults', () => {
    const resolved = resolvePolicy(
      [
        { kind: 'privacy', key: 'retention', document: { days: 365 }, version: 1 },
        {
          kind: 'privacy',
          key: 'retention',
          organizationGroupId: 'g1',
          document: { days: 180 },
          version: 1,
        },
        {
          kind: 'privacy',
          key: 'retention',
          tenantId: 't1',
          document: { days: 30 },
          version: 2,
        },
      ],
      { tenantId: 't1', organizationGroupId: 'g1', kind: 'privacy', key: 'retention' },
    )
    expect(resolved?.document.days).toBe(30)
  })
})

describe('application-layer tenant isolation', () => {
  it('filters rows by tenant id', () => {
    const rows = [
      { tenantId: 'a', title: 'A' },
      { tenantId: 'b', title: 'B' },
      { tenantId: 'a', title: 'A2' },
    ]
    expect(tenantScopedRows(rows, 'a').map((row) => row.title)).toEqual(['A', 'A2'])
    expect(tenantScopedRows(rows, 'b')).toHaveLength(1)
    expect(tenantScopedRows(rows, 'missing')).toEqual([])
  })
})

describe('tenant id validation', () => {
  it('accepts UUIDs and positive integers', () => {
    expect(isValidTenantId('11111111-1111-4111-8111-111111111111')).toBe(true)
    expect(isValidTenantId(42)).toBe(true)
    expect(isValidTenantId('42')).toBe(true)
    expect(isValidTenantId(0)).toBe(false)
    expect(isValidTenantId('invalid')).toBe(false)
    expect(isValidTenantId('')).toBe(false)
  })
})
