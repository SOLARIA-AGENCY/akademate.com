import { describe, expect, it } from 'vitest'
import { dedupeIdenticalNextFlight } from './flight-dedupe'

describe('dedupeIdenticalNextFlight', () => {
  it('keeps the first copy of an identical flight script', () => {
    const flight = '<script nonce="a">self.__next_f.push([1,"mismo"])</script>'
    const other = '<script nonce="b">self.__next_f.push([1,"unico"])</script>'
    const html = `${flight}${flight}${other}${flight}`
    const next = dedupeIdenticalNextFlight(html)
    expect(next.match(/mismo/g)?.length).toBe(1)
    expect(next).toContain('unico')
    expect(next.indexOf('mismo')).toBeLessThan(next.indexOf('unico'))
  })

  it('leaves different flight scripts and repeated plain scripts in place', () => {
    const html = [
      '<script>self.__next_f.push([1,"uno"])</script>',
      '<script>self.__next_f.push([1,"dos"])</script>',
      '<script src="/app.js"></script>',
      '<script src="/app.js"></script>',
    ].join('')
    expect(dedupeIdenticalNextFlight(html)).toBe(html)
  })
})
