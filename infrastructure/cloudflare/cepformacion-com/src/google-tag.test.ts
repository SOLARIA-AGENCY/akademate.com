import { describe, expect, it } from 'vitest'
import { CEP_GA4_MEASUREMENT_ID, hasCanonicalGoogleTag, injectGoogleTag } from './google-tag'

describe('injectGoogleTag', () => {
  it('places consent defaults before gtag config immediately after head', () => {
    const html = injectGoogleTag('<!doctype html><html><head><title>CEP</title></head><body>ok</body></html>')
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
    expect(head.indexOf("gtag('consent', 'default'")).toBeGreaterThan(-1)
    expect(head.indexOf('analytics_storage')).toBeGreaterThan(-1)
    expect(head.indexOf('ad_user_data')).toBeGreaterThan(-1)
    expect(head.indexOf('wait_for_update')).toBeGreaterThan(-1)
    expect(head.indexOf(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`)).toBeGreaterThan(head.indexOf('analytics_storage'))
    expect(head.indexOf(`gtag('config', '${CEP_GA4_MEASUREMENT_ID}'`)).toBeGreaterThan(
      head.indexOf(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`),
    )
    expect(head).toContain('anonymize_ip: true')
    expect(html.split(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`)).toHaveLength(2)
    expect(html).not.toContain('G-347NGFNZ90')
    expect(html).not.toContain('GTM-5D4839F3')
    expect(html).not.toContain('G-XG7SZHEM8X')
    expect(html).not.toContain('GTM-TKSVM638')
  })

  it('collapses repeated canonical tags to one snippet', () => {
    const duplicate = `<html><head>
<script>gtag('consent', 'default', { analytics_storage: 'denied' });</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${CEP_GA4_MEASUREMENT_ID}"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${CEP_GA4_MEASUREMENT_ID}"></script>
<script>gtag('config', '${CEP_GA4_MEASUREMENT_ID}');</script>
<script>gtag('config', '${CEP_GA4_MEASUREMENT_ID}');</script>
</head><body></body></html>`
    const html = injectGoogleTag(duplicate)
    expect(html.split(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`)).toHaveLength(2)
    expect(html.split(`gtag('config', '${CEP_GA4_MEASUREMENT_ID}'`)).toHaveLength(2)
  })

  it('keeps a flight chunk that mentions the measurement id', () => {
    const flight = `<script>self.__next_f.push([1,"gtag('config', '${CEP_GA4_MEASUREMENT_ID}'"])</script>`
    const html = injectGoogleTag(`<html><head>${flight}<script src="/_next/static/chunks/main-app.js"></script></head><body><header>Campus</header></body></html>`)
    expect(html).toContain('self.__next_f.push')
    expect(html).toContain('main-app.js')
    expect(html).toContain('<header>Campus</header>')
  })

  it('does not dual-load when the canonical tag is already present', () => {
    const first = injectGoogleTag('<html><head></head><body></body></html>')
    const second = injectGoogleTag(first)
    expect(hasCanonicalGoogleTag(second)).toBe(true)
    expect(second.split(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`)).toHaveLength(2)
  })

  it('strips forbidden measurement and container IDs', () => {
    const html = injectGoogleTag(
      '<html><head><script src="https://www.googletagmanager.com/gtag/js?id=G-347NGFNZ90"></script><script src="https://www.googletagmanager.com/gtm.js?id=GTM-5D4839F3"></script></head><body></body></html>',
    )
    expect(html).not.toContain('G-347NGFNZ90')
    expect(html).not.toContain('GTM-5D4839F3')
    expect(html).toContain(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`)
  })
})
