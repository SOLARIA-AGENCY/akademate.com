import { describe, expect, it } from 'vitest'

import {
  assertMultiEntityAccessSurfaceBaseline,
  compareMultiEntityAccessSurfaceBaselines,
  createMultiEntityAccessSurfaceBaseline,
  serializeMultiEntityAccessSurfaceBaseline,
  type AccessSurfaceReference,
  type MultiEntityAccessSurfaceBaselineInput,
} from '../src/multi-entity-access-surface-baseline'

const ref = (value: number): AccessSurfaceReference =>
  `ref:sha256:${value.toString(16).padStart(64, '0')}`
const digest = (value: string) => `sha256:${value.repeat(64)}` as const

function input(
  overrides: Partial<MultiEntityAccessSurfaceBaselineInput> = {}
): MultiEntityAccessSurfaceBaselineInput {
  return {
    targetTenantRef: ref(1),
    sourceDigests: {
      authorizationPolicy: digest('a'),
      payloadUsersSchema: digest('b'),
      platformMembershipsSchema: digest('c'),
      payloadApiKeysSchema: digest('d'),
      platformApiKeysSchema: digest('e'),
    },
    users: [
      {
        ref: ref(10),
        source: 'payload_tenant_admin',
        tenantRef: ref(1),
        roles: ['admin'],
        status: 'active',
      },
      {
        ref: ref(11),
        source: 'platform',
        tenantRef: null,
        roles: [],
        status: 'active',
      },
    ],
    memberships: [
      {
        ref: ref(20),
        userRef: ref(11),
        tenantRef: ref(1),
        roles: ['gestor', 'instructor'],
        status: 'active',
      },
    ],
    apiKeys: [
      {
        ref: ref(30),
        source: 'payload_tenant_admin',
        tenantRef: ref(1),
        scopes: ['courses:read', 'enrollments:write'],
        status: 'active',
      },
      {
        ref: ref(31),
        source: 'platform',
        tenantRef: ref(1),
        scopes: ['analytics:read'],
        status: 'revoked',
      },
    ],
    ...overrides,
  }
}

describe('multi-entity expanded access surface baseline', () => {
  it('captures redacted users, memberships and API key scopes without runtime capabilities', () => {
    const manifest = createMultiEntityAccessSurfaceBaseline(input())
    expect(manifest).toMatchObject({
      schemaVersion: 2,
      kind: 'cep_current_access_surface_baseline',
      mode: 'offline_read_only_source_snapshot',
      canReadRuntime: false,
      canWrite: false,
      canApply: false,
      canChangePermissions: false,
      containsSecrets: false,
      identifiersPseudonymized: true,
      metrics: {
        users: 2,
        memberships: 1,
        apiKeys: 2,
        activeMemberships: 1,
        activeApiKeys: 1,
        grantedRoles: 3,
        grantedScopes: 3,
      },
    })
    expect(manifest.digest).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(() => assertMultiEntityAccessSurfaceBaseline(manifest)).not.toThrow()
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest.memberships[0]?.roles)).toBe(true)
    expect(Object.isFrozen(manifest.apiKeys[0]?.scopes)).toBe(true)
  })

  it('is deterministic across record, role and scope ordering', () => {
    const source = input()
    const reordered = input({
      sourceDigests: {
        platformApiKeysSchema: source.sourceDigests.platformApiKeysSchema,
        payloadApiKeysSchema: source.sourceDigests.payloadApiKeysSchema,
        platformMembershipsSchema: source.sourceDigests.platformMembershipsSchema,
        payloadUsersSchema: source.sourceDigests.payloadUsersSchema,
        authorizationPolicy: source.sourceDigests.authorizationPolicy,
      },
      users: [...source.users].reverse(),
      memberships: [...source.memberships]
        .reverse()
        .map((membership) => ({ ...membership, roles: [...membership.roles].reverse() })),
      apiKeys: [...source.apiKeys]
        .reverse()
        .map((apiKey) => ({ ...apiKey, scopes: [...apiKey.scopes].reverse() })),
    })
    expect(createMultiEntityAccessSurfaceBaseline(reordered)).toEqual(
      createMultiEntityAccessSurfaceBaseline(source)
    )
  })

  it.each([
    [
      'user role',
      (source: MultiEntityAccessSurfaceBaselineInput) => ({
        users: source.users.map((user) =>
          user.ref === ref(10) ? { ...user, roles: ['gestor'] } : user
        ),
      }),
    ],
    [
      'membership status',
      (source: MultiEntityAccessSurfaceBaselineInput) => ({
        memberships: source.memberships.map((membership) => ({
          ...membership,
          status: 'suspended' as const,
        })),
      }),
    ],
    [
      'membership role',
      (source: MultiEntityAccessSurfaceBaselineInput) => ({
        memberships: source.memberships.map((membership) => ({
          ...membership,
          roles: ['admin'],
        })),
      }),
    ],
    [
      'API key scope',
      (source: MultiEntityAccessSurfaceBaselineInput) => ({
        apiKeys: source.apiKeys.map((apiKey) =>
          apiKey.ref === ref(30) ? { ...apiKey, scopes: ['courses:write'] } : apiKey
        ),
      }),
    ],
    [
      'API key status',
      (source: MultiEntityAccessSurfaceBaselineInput) => ({
        apiKeys: source.apiKeys.map((apiKey) =>
          apiKey.ref === ref(30) ? { ...apiKey, status: 'revoked' as const } : apiKey
        ),
      }),
    ],
    [
      'source authority',
      (source: MultiEntityAccessSurfaceBaselineInput) => ({
        sourceDigests: { ...source.sourceDigests, authorizationPolicy: digest('f') },
      }),
    ],
  ])('fails closed on drift in %s', (_label, change) => {
    const capturedInput = input()
    const captured = createMultiEntityAccessSurfaceBaseline(capturedInput)
    const current = createMultiEntityAccessSurfaceBaseline(input(change(capturedInput)))
    const comparison = compareMultiEntityAccessSurfaceBaselines(captured, current)
    expect(comparison.verdict).toBe('changed')
    expect(comparison.currentDigest).not.toBe(comparison.capturedDigest)
  })

  it('rejects raw identities, secret-shaped fields and widened records', () => {
    const source = input()
    const invalidCases = [
      { ...source, targetTenantRef: 'tenant-cep' },
      {
        ...source,
        users: [{ ...source.users[0]!, email: 'private@example.test' }],
      },
      {
        ...source,
        memberships: [{ ...source.memberships[0]!, userRef: 'raw-user-id' }],
      },
      {
        ...source,
        apiKeys: [{ ...source.apiKeys[0]!, keyHash: 'private-key-material' }],
      },
      {
        ...source,
        apiKeys: [{ ...source.apiKeys[0]!, scopes: ['Bearer secret'] }],
      },
    ]
    for (const invalid of invalidCases) {
      expect(() => createMultiEntityAccessSurfaceBaseline(invalid as never)).toThrow(
        'MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID'
      )
    }
  })

  it('rejects cross-tenant records and orphan memberships', () => {
    const source = input()
    for (const change of [
      { users: [{ ...source.users[0]!, tenantRef: ref(2) }, source.users[1]!] },
      { memberships: [{ ...source.memberships[0]!, tenantRef: ref(2) }] },
      { memberships: [{ ...source.memberships[0]!, userRef: ref(99) }] },
      { apiKeys: [{ ...source.apiKeys[0]!, tenantRef: ref(2) }, source.apiKeys[1]!] },
    ]) {
      expect(() => createMultiEntityAccessSurfaceBaseline(input(change as never))).toThrow(
        'MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID'
      )
    }
  })

  it('rejects platform memberships bound to Payload users', () => {
    const source = input()
    expect(() =>
      createMultiEntityAccessSurfaceBaseline(
        input({
          memberships: [
            {
              ...source.memberships[0]!,
              userRef: source.users.find(({ source }) => source === 'payload_tenant_admin')!.ref,
            },
          ],
        })
      )
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID')
  })

  it('rejects ambiguous role authority and cross-surface pseudonym reuse', () => {
    const source = input()
    for (const change of [
      {
        users: source.users.map((user) =>
          user.source === 'platform' ? { ...user, roles: ['admin'] } : user
        ),
      },
      {
        users: source.users.map((user) =>
          user.source === 'payload_tenant_admin' ? { ...user, roles: [] } : user
        ),
      },
      {
        users: source.users.map((user) =>
          user.source === 'payload_tenant_admin'
            ? { ...user, roles: ['superadmin'], tenantRef: ref(1) }
            : user
        ),
      },
      {
        apiKeys: [{ ...source.apiKeys[0]!, ref: source.users[0]!.ref }, source.apiKeys[1]!],
      },
    ]) {
      expect(() => createMultiEntityAccessSurfaceBaseline(input(change as never))).toThrow(
        'MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID'
      )
    }
  })

  it('rejects duplicate records and duplicate grants', () => {
    const source = input()
    for (const change of [
      { users: [...source.users, source.users[0]!] },
      {
        memberships: [{ ...source.memberships[0]!, roles: ['gestor', 'gestor'] }],
      },
      {
        apiKeys: [
          { ...source.apiKeys[0]!, scopes: ['courses:read', 'courses:read'] },
          source.apiKeys[1]!,
        ],
      },
    ]) {
      expect(() => createMultiEntityAccessSurfaceBaseline(input(change as never))).toThrow(
        'MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID'
      )
    }
  })

  it('enforces independent bounded surfaces', () => {
    expect(() =>
      createMultiEntityAccessSurfaceBaseline(input({ maxRecordsPerSurface: 1 }))
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_RECORD_LIMIT_EXCEEDED')
    expect(() =>
      createMultiEntityAccessSurfaceBaseline(input({ maxRecordsPerSurface: 100_001 }))
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID')
  })

  it('revalidates a reviewed snapshot above the default but below the hard limit', () => {
    const users = Array.from({ length: 10_001 }, (_, index) => ({
      ref: ref(index + 100),
      source: 'platform' as const,
      tenantRef: null,
      roles: [],
      status: 'active' as const,
    }))
    const manifest = createMultiEntityAccessSurfaceBaseline(
      input({
        users,
        memberships: [],
        apiKeys: [],
        maxRecordsPerSurface: users.length,
      })
    )
    expect(() => assertMultiEntityAccessSurfaceBaseline(manifest)).not.toThrow()
  })

  it('rejects forged manifests before comparison', () => {
    const manifest = createMultiEntityAccessSurfaceBaseline(input())
    expect(() => assertMultiEntityAccessSurfaceBaseline({ ...manifest, canWrite: true })).toThrow(
      'MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID'
    )
    expect(() =>
      compareMultiEntityAccessSurfaceBaselines({ ...manifest, digest: digest('f') }, manifest)
    ).toThrow('MULTI_ENTITY_ACCESS_SURFACE_BASELINE_INVALID')
  })

  it('serializes no raw IDs, emails, key material or runtime adapter', async () => {
    const serialized = serializeMultiEntityAccessSurfaceBaseline(input())
    for (const forbidden of [
      'private@example.test',
      'raw-user-id',
      'private-key-material',
      'keyHash',
      'Bearer private-credential',
      'api-key-plaintext-value',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
    const module = await import('../src/multi-entity-access-surface-baseline')
    expect(
      Object.keys(module).filter((name) =>
        /apply|write|execute|load|fetch|query|connect/i.test(name)
      )
    ).toEqual([])
  })
})
