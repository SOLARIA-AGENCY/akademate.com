import { describe, expect, it } from 'vitest'
import {
  compareMultiEntityAccessBaselines,
  createMultiEntityAccessBaseline,
  serializeMultiEntityAccessBaseline,
  type MultiEntityAccessBaselineInput,
} from '../src/multi-entity-access-baseline'
import { planMultiEntityRollbackDrill } from '../src/multi-entity-rollback-drill'

const POLICY_DIGEST = `sha256:${'a'.repeat(64)}`

function input(
  overrides: Partial<MultiEntityAccessBaselineInput> = {}
): MultiEntityAccessBaselineInput {
  return {
    targetTenantId: '7',
    policyDigest: POLICY_DIGEST,
    users: [
      { id: '10', role: 'admin', tenantId: '7', isActive: true },
      { id: '11', role: 'marketing', tenantId: '7', isActive: true },
      { id: '12', role: 'lectura', tenantId: '7', isActive: false },
      { id: '1', role: 'superadmin', tenantId: null, isActive: true },
    ],
    ...overrides,
  }
}

describe('current access baseline', () => {
  it('captures role, tenant and active-state assignments without identity fields', () => {
    const manifest = createMultiEntityAccessBaseline(input())
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_current_access_baseline',
      mode: 'capture_only',
      canChangePermissions: false,
      canActivateAuthorization: false,
      policyDigest: POLICY_DIGEST,
      metrics: {
        users: 4,
        activeUsers: 3,
        inactiveUsers: 1,
        unsetActiveStateUsers: 0,
        tenantUsers: 3,
        platformSuperadmins: 1,
        roles: {
          superadmin: 1,
          admin: 1,
          gestor: 0,
          marketing: 1,
          asesor: 0,
          lectura: 1,
        },
      },
    })
    expect(manifest.digest).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('is deterministic and independent of source order', () => {
    const source = input()
    const before = JSON.stringify(source)
    const first = createMultiEntityAccessBaseline(source)
    const second = createMultiEntityAccessBaseline({
      ...source,
      users: [...source.users].reverse(),
    })
    expect(first).toEqual(second)
    expect(JSON.stringify(source)).toBe(before)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.metrics.roles)).toBe(true)
  })

  it.each([
    [
      'role',
      {
        users: input().users.map((user) =>
          user.id === '11' ? { ...user, role: 'gestor' as const } : user
        ),
      },
    ],
    [
      'tenant',
      {
        users: input().users.map((user) => (user.id === '11' ? { ...user, tenantId: '8' } : user)),
      },
    ],
    [
      'active state',
      {
        users: input().users.map((user) =>
          user.id === '11' ? { ...user, isActive: false } : user
        ),
      },
    ],
    ['policy', { policyDigest: `sha256:${'b'.repeat(64)}` }],
  ])('changes the digest or rejects an invalid %s mutation', (_label, override) => {
    const captured = createMultiEntityAccessBaseline(input())
    if (_label === 'tenant') {
      expect(() => createMultiEntityAccessBaseline(input(override as never))).toThrow(
        'MULTI_ENTITY_ACCESS_BASELINE_INVALID'
      )
      return
    }
    const current = createMultiEntityAccessBaseline(input(override as never))
    expect(current.digest).not.toBe(captured.digest)
    expect(compareMultiEntityAccessBaselines(captured, current).verdict).toBe('changed')
  })

  it('produces the exact digest pair consumed by the rollback drill', () => {
    const captured = createMultiEntityAccessBaseline(input())
    const current = createMultiEntityAccessBaseline(input())
    const comparison = compareMultiEntityAccessBaselines(captured, current)
    expect(comparison).toMatchObject({
      verdict: 'unchanged',
      canChangePermissions: false,
      capturedDigest: captured.digest,
      currentDigest: current.digest,
      metrics: { policyUnchanged: true, userCountDelta: 0 },
    })

    const rollback = planMultiEntityRollbackDrill({
      targetTenantId: '7',
      reviewReference: 'review://rollback/access-baseline',
      accessBaseline: {
        capturedDigest: comparison.capturedDigest,
        currentDigest: comparison.currentDigest,
      },
      flagState: {
        AKADEMATE_CEP_MULTI_ENTITY_SCHEMA_SHADOW_ENABLED: false,
        AKADEMATE_CEP_MULTI_ENTITY_LEDGER_SHADOW_ENABLED: false,
        AKADEMATE_CEP_TEACHER_SCHEDULE_SHADOW_ENABLED: false,
        AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED: false,
        AKADEMATE_CEP_FINANCE_RECONCILIATION_SHADOW_ENABLED: false,
        AKADEMATE_CEP_FINANCE_ISOLATION_AUDIT_ENABLED: false,
        AKADEMATE_CEP_FINANCE_ACCOUNTING_SYNC_SHADOW_ENABLED: false,
        AKADEMATE_CEP_FINANCE_ACCOUNTING_IMPORT_STAGING_ENABLED: false,
        AKADEMATE_MULTI_ENTITY_AUTHORIZATION_MODE: 'disabled',
      },
      records: [],
    })
    expect(rollback.accessBaselineMatches).toBe(true)
  })

  it('rejects duplicates, cross-tenant users, invalid superadmins and widened records', () => {
    const source = input()
    const invalidCases = [
      { ...source, users: [...source.users, source.users[0]!] },
      {
        ...source,
        users: source.users.map((user) => (user.id === '11' ? { ...user, tenantId: '8' } : user)),
      },
      {
        ...source,
        users: source.users.map((user) =>
          user.role === 'superadmin' ? { ...user, tenantId: '7' } : user
        ),
      },
      { ...source, users: [{ ...source.users[0]!, email: 'private@example.test' } as never] },
      { ...source, authorizationMode: 'active' },
    ]
    for (const value of invalidCases) {
      expect(() => createMultiEntityAccessBaseline(value as never)).toThrow(
        'MULTI_ENTITY_ACCESS_BASELINE_INVALID'
      )
    }
  })

  it('enforces a bounded snapshot and a reviewed SHA-256 policy digest', () => {
    expect(() => createMultiEntityAccessBaseline(input({ maxUsers: 3 }))).toThrow(
      'MULTI_ENTITY_ACCESS_BASELINE_USER_LIMIT_EXCEEDED'
    )
    expect(() => createMultiEntityAccessBaseline(input({ policyDigest: 'git:main' }))).toThrow(
      'MULTI_ENTITY_ACCESS_BASELINE_INVALID'
    )
  })

  it('rejects forged manifests before comparison', () => {
    const captured = createMultiEntityAccessBaseline(input())
    expect(() =>
      compareMultiEntityAccessBaselines(
        { ...captured, canChangePermissions: true } as never,
        captured
      )
    ).toThrow('MULTI_ENTITY_ACCESS_BASELINE_INVALID')
    expect(() =>
      compareMultiEntityAccessBaselines(
        {
          ...captured,
          metrics: { ...captured.metrics, users: captured.metrics.users + 1 },
        },
        captured
      )
    ).toThrow('MULTI_ENTITY_ACCESS_BASELINE_INVALID')
  })

  it('serializes no names, emails, tenant IDs or user IDs', () => {
    const serialized = serializeMultiEntityAccessBaseline(input())
    for (const value of ['private@example.test', 'targetTenantId', '"7"', '"10"', '"11"']) {
      expect(serialized).not.toContain(value)
    }
  })

  it('exports no apply, mutation, activation or permission-writing function', async () => {
    const module = await import('../src/multi-entity-access-baseline')
    expect(
      Object.keys(module).filter((key) =>
        /apply|mutate|activate|permission|write|execute/i.test(key)
      )
    ).toEqual([])
  })
})
