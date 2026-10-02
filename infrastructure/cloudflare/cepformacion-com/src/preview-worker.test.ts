import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const live = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8')) as {
  name: string
  routes?: Array<{ pattern: string }>
  vars: { ORIGIN_API_URL: string; DASHBOARD_ORIGIN_URL: string }
}
const preview = JSON.parse(readFileSync(new URL('../wrangler.preview.jsonc', import.meta.url), 'utf8')) as {
  name: string
  routes?: Array<{ pattern: string }>
  vars: { ORIGIN_API_URL: string; DASHBOARD_ORIGIN_URL: string; CAMPUS_ORIGIN_URL: string }
}

const PRODUCTION_HOSTS = ['cepformacion.com', 'www.cepformacion.com', 'dashboard.cepformacion.com', 'campus.cepformacion.com']

describe('preview worker stays off production routes', () => {
  it('keeps the live worker origins', () => {
    expect(live.name).toBe('cepformacion-com')
    expect(live.vars.ORIGIN_API_URL).toBe('https://origin.cepformacion.com')
    expect(live.vars.DASHBOARD_ORIGIN_URL).toBe('https://origin.cepformacion.com')
    expect(live.routes?.map((route) => route.pattern)).toEqual(PRODUCTION_HOSTS)
  })

  it('leaves the campus host on the live worker', () => {
    expect(preview.name).toBe('cepformacion-com-preview')
    expect(preview.routes ?? []).toEqual([])
    expect(preview.vars.ORIGIN_API_URL).toBe('https://origin.cepformacion.com')
    expect(preview.vars.DASHBOARD_ORIGIN_URL).toBe('https://origin.cepformacion.com')
    expect(preview.vars.ORIGIN_API_URL).toBe(live.vars.ORIGIN_API_URL)
    expect(preview.vars.DASHBOARD_ORIGIN_URL).toBe(live.vars.DASHBOARD_ORIGIN_URL)
    for (const host of PRODUCTION_HOSTS) {
      expect(JSON.stringify(preview)).not.toContain(`"pattern": "${host}"`)
    }
  })
})
