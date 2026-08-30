import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'
import {
  MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG,
} from '../../../../../packages/tenant/src/multi-entity-public-projection-runner'
import { createPayloadPublicProjectionShadowComparison } from '../public-projection-shadow-payload-composition'

function projectionPage(docs: readonly Record<string, unknown>[]) {
  return {
    docs,
    page: 1,
    totalDocs: docs.length,
    totalPages: docs.length === 0 ? 0 : 1,
    hasNextPage: false,
    nextPage: null,
  }
}

function requestWith(find: ReturnType<typeof vi.fn>): PayloadRequest {
  return { payload: { find } } as unknown as PayloadRequest
}

function options(
  find: ReturnType<typeof vi.fn>,
  environment: Readonly<Record<string, string | undefined>>
) {
  return {
    req: requestWith(find),
    targetTenantId: '7',
    legalEntities: [{ id: 'entity-norte', tenantId: '7', status: 'validated' as const }],
    campusBindings: [
      {
        id: 'binding-norte',
        tenantId: '7',
        legalEntityId: 'entity-norte',
        campusId: '20',
        status: 'validated' as const,
      },
    ],
    reviewedEntityResolutions: [
      {
        courseRunId: '30',
        legalEntityId: 'entity-norte',
        reviewReference: 'review://public-run-30',
      },
    ],
    environment,
  }
}

const staging = {
  [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG]: 'true',
  [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

function alignedFind() {
  return vi.fn(async (request: any) => {
    const baselineRead = Object.keys(request.select).length === 1
    if (baselineRead) {
      if (request.collection === 'courses') return { docs: [{ id: 10, slug: 'curso-publico' }] }
      if (request.collection === 'cycles') return { docs: [] }
      if (request.collection === 'campuses') return { docs: [{ id: 20, slug: 'sede-norte' }] }
      return { docs: [{ id: 30, codigo: 'NOR-2026-001' }] }
    }

    if (request.collection === 'courses') {
      return projectionPage([
        {
          id: 10,
          tenant: 7,
          slug: 'curso-publico',
          name: 'Curso público',
          active: true,
          modality: 'presencial',
        },
      ])
    }
    if (request.collection === 'cycles') return projectionPage([])
    if (request.collection === 'campuses') {
      return projectionPage([
        {
          id: 20,
          tenant: 7,
          slug: 'sede-norte',
          name: 'CEP Norte',
          city: 'La Orotava',
          active: true,
        },
      ])
    }
    return projectionPage([
      {
        id: 30,
        tenant: 7,
        course: 10,
        cycle: null,
        campus: 20,
        codigo: 'NOR-2026-001',
        status: 'enrollment_open',
        start_date: '2026-09-01',
      },
    ])
  })
}

describe('Payload public projection shadow composition', () => {
  it.each([
    [{}, 'flag_disabled'],
    [
      {
        [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG]: 'true',
        [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('performs no Payload I/O while gate is closed: %s', async (environment, reason) => {
    const find = alignedFind()
    const compare = createPayloadPublicProjectionShadowComparison(options(find, environment))
    await expect(compare()).resolves.toEqual({
      status: 'skipped',
      reason,
      canPublish: false,
      canActivate: false,
    })
    expect(find).not.toHaveBeenCalled()
  })

  it('compares both snapshots in staging and emits only redacted counts', async () => {
    const find = alignedFind()
    const compare = createPayloadPublicProjectionShadowComparison(options(find, staging))
    const result = await compare()

    expect(find).toHaveBeenCalledTimes(8)
    expect(result).toMatchObject({
      status: 'observed',
      reason: 'shadow_compared',
      canPublish: false,
      canActivate: false,
      observation: {
        verdict: 'aligned',
        comparison: { totalDifferences: 0 },
      },
    })
    const serialized = JSON.stringify(result)
    for (const value of ['entity-norte', 'curso-publico', 'sede-norte', 'NOR-2026-001']) {
      expect(serialized).not.toContain(value)
    }
  })

  it('redacts snapshot failures and never starts the baseline after projection failure', async () => {
    const find = vi.fn(async () => {
      throw new Error('postgres://admin:secret@example.test')
    })
    const result = await createPayloadPublicProjectionShadowComparison(options(find, staging))()
    expect(result).toEqual({
      status: 'failed',
      reason: 'projection_snapshot_load_failed',
      canPublish: false,
      canActivate: false,
    })
    expect(find).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(result)).not.toContain('admin:secret')
  })

  it('copies only the two gate values and ignores later environment mutation', async () => {
    const find = alignedFind()
    const environment: Record<string, string | undefined> = { ...staging, DATABASE_URL: 'secret' }
    const compare = createPayloadPublicProjectionShadowComparison(options(find, environment))
    environment[MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT] = 'production'
    const result = await compare()
    expect(result.status).toBe('observed')
    expect(JSON.stringify(result)).not.toContain('DATABASE_URL')
    expect(JSON.stringify(result)).not.toContain('secret')
  })

  it('remains disconnected from Payload config, routes and jobs', () => {
    const workspaceConfig = resolve(process.cwd(), 'src/payload.config.ts')
    const repositoryConfig = resolve(process.cwd(), 'apps/tenant-admin/src/payload.config.ts')
    const payloadConfig = readFileSync(
      existsSync(workspaceConfig) ? workspaceConfig : repositoryConfig,
      'utf8'
    )
    expect(payloadConfig).not.toContain('public-projection-shadow-payload-composition')
    expect(payloadConfig).not.toContain('createPayloadPublicProjectionShadowComparison')
  })
})
