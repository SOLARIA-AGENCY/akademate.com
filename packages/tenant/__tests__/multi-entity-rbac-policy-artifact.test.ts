import { describe, expect, it } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverCepRbacPolicySources } from '../../../scripts/generate-cep-rbac-policy-artifact'
import {
  MULTI_ENTITY_RBAC_INVENTORY_VERSION,
  MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES,
  createMultiEntityRbacPolicyArtifact,
  isMultiEntityRbacPolicyAuthoritySource,
  serializeMultiEntityRbacPolicyArtifact,
  type MultiEntityRbacPolicySource,
} from '../src/multi-entity-rbac-policy-artifact'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

function requiredSources(): MultiEntityRbacPolicySource[] {
  return MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.map((path) => ({
    path,
    content: `export const access = ${JSON.stringify(path)}`,
  }))
}

describe('current RBAC policy artifact', () => {
  it('creates a deterministic reviewable inventory without source contents', () => {
    const sources = requiredSources()
    const first = createMultiEntityRbacPolicyArtifact(sources)
    const second = createMultiEntityRbacPolicyArtifact([...sources].reverse())

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      schemaVersion: 1,
      kind: 'cep_current_rbac_policy_artifact',
      mode: 'source_inventory_hash_only',
      inventoryVersion: MULTI_ENTITY_RBAC_INVENTORY_VERSION,
      canChangePermissions: false,
      policyDigest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      metrics: {
        files: MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.length,
        requiredAuthorities: MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.length,
      },
    })
    expect(first.sources.every(({ digest }) => /^sha256:[a-f0-9]{64}$/.test(digest))).toBe(true)
    expect(first.sources.map(({ path }) => path)).toEqual(
      [...MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES].sort((left, right) => left.localeCompare(right))
    )
    expect(JSON.stringify(first)).not.toContain('export const access')
  })

  it('changes the policy digest for source content, inventory or version-relevant path drift', () => {
    const sources = requiredSources()
    const baseline = createMultiEntityRbacPolicyArtifact(sources)
    const contentChanged = createMultiEntityRbacPolicyArtifact(
      sources.map((source, index) =>
        index === 0 ? { ...source, content: `${source.content}\n// changed authorization` } : source
      )
    )
    const additionalSource = createMultiEntityRbacPolicyArtifact([
      ...sources,
      {
        path: 'apps/tenant-admin/app/api/private/route.ts',
        content: 'export const GET = ({ req }: any) => req.user?.role === "admin"',
      },
    ])
    expect(contentChanged.policyDigest).not.toBe(baseline.policyDigest)
    expect(additionalSource.policyDigest).not.toBe(baseline.policyDigest)
  })

  it('requires every core authority and rejects duplicate, test, generated or shadow sources', () => {
    const sources = requiredSources()
    expect(() => createMultiEntityRbacPolicyArtifact(sources.slice(1))).toThrow(
      'MULTI_ENTITY_RBAC_POLICY_REQUIRED_AUTHORITY_MISSING'
    )
    for (const invalid of [
      [...sources, sources[0]!],
      [...sources, { path: 'apps/tenant-admin/src/access/roles.test.ts', content: 'access: true' }],
      [...sources, { path: 'apps/tenant-admin/src/payload-types.ts', content: 'access: true' }],
      [
        ...sources,
        {
          path: 'apps/tenant-admin/src/multi-entity/proposed-access.ts',
          content: 'access: true',
        },
      ],
      [...sources, { path: '../outside.ts', content: 'access: true' }],
    ]) {
      expect(() => createMultiEntityRbacPolicyArtifact(invalid)).toThrow(
        'MULTI_ENTITY_RBAC_POLICY_ARTIFACT_INVALID'
      )
    }
  })

  it('selects authority signals while excluding tests and disconnected multi-entity code', () => {
    expect(
      isMultiEntityRbacPolicyAuthoritySource(
        'apps/tenant-admin/app/api/private/route.ts',
        'return request.user?.role === "admin"'
      )
    ).toBe(true)
    expect(
      isMultiEntityRbacPolicyAuthoritySource(
        'apps/tenant-admin/app/api/public/route.ts',
        'export function GET() { return new Response("ok") }'
      )
    ).toBe(false)
    expect(
      isMultiEntityRbacPolicyAuthoritySource(
        'apps/tenant-admin/app/api/private/route.test.ts',
        'return request.user?.role === "admin"'
      )
    ).toBe(false)
    expect(
      isMultiEntityRbacPolicyAuthoritySource(
        'apps/tenant-admin/src/multi-entity/new-policy.ts',
        'access: { read: true }'
      )
    ).toBe(false)
  })

  it('discovers a complete artifact from the current repository without writing files', async () => {
    const sources = await discoverCepRbacPolicySources(repositoryRoot)
    const artifact = createMultiEntityRbacPolicyArtifact(sources)
    expect(artifact.metrics.files).toBeGreaterThan(MULTI_ENTITY_RBAC_REQUIRED_AUTHORITIES.length)
    expect(artifact.sources.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        'apps/tenant-admin/middleware.ts',
        'apps/tenant-admin/src/access/roles.ts',
        'apps/tenant-admin/src/collections/Users/access/canReadUsers.ts',
        'apps/tenant-admin/app/api/auth/impersonate/route.ts',
      ])
    )
    expect(
      artifact.sources.some(({ path }) =>
        /(?:__tests__|\.test\.|\/src\/multi-entity\/|payload-types)/.test(path)
      )
    ).toBe(false)
  })

  it('serializes only paths, byte counts and digests', () => {
    const secret = 'DATABASE_URL=postgres://admin:secret@example.test'
    const sources = requiredSources().map((source, index) =>
      index === 0 ? { ...source, content: `${source.content}\n// ${secret}` } : source
    )
    const serialized = serializeMultiEntityRbacPolicyArtifact(sources)
    expect(serialized).not.toContain(secret)
    expect(serialized).not.toContain('postgres://')
  })

  it('exports no apply, mutation, activation or permission-writing function', async () => {
    const module = await import('../src/multi-entity-rbac-policy-artifact')
    expect(
      Object.keys(module).filter((key) => /apply|mutate|activate|write|execute/i.test(key))
    ).toEqual([])
  })
})
