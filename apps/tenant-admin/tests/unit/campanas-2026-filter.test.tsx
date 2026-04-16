import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '../utils/test-utils'
import CampanasPage from '../../app/(app)/(dashboard)/campanas/page'

function emptyPayload() {
  return {
    docs: [],
    totalDocs: 0,
    page: 1,
    limit: 100,
    sort: 'updated_time',
    order: 'desc',
    stale: false,
    diagnostics: { warnings: [], errors: [] },
    generated_at: '2026-04-16T00:00:00.000Z',
  }
}

describe('CampanasPage 2026 paused defaults', () => {
  it('requests paused campaigns for full year 2026 by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(emptyPayload()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    global.fetch = fetchMock

    render(<CampanasPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const requestUrl = String(fetchMock.mock.calls[0]?.[0] ?? '')
    expect(requestUrl).toContain('range=custom')
    expect(requestUrl).toContain('since=2026-01-01')
    expect(requestUrl).toContain('until=2026-12-31')
    expect(requestUrl).toContain('status=paused')
  })
})
