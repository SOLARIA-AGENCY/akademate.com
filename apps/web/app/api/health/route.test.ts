// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import { GET } from './route'

const originalRevision = process.env.APP_REVISION

afterEach(() => {
  if (originalRevision === undefined) delete process.env.APP_REVISION
  else process.env.APP_REVISION = originalRevision
})

describe('public web health evidence', () => {
  it('returns the exact runtime revision without caching', async () => {
    process.env.APP_REVISION = 'release-sha-123'
    const response = GET()

    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0')
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'akademate-web',
      revision: 'release-sha-123',
    })
  })

  it('does not invent a revision when the deployment omitted it', async () => {
    delete process.env.APP_REVISION
    await expect(GET().json()).resolves.toMatchObject({ revision: 'unknown' })
  })
})
