import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { ActivityOffers } from '../../src/collections/ActivityOffers/ActivityOffers'
import { TenantPaymentProviders } from '../../src/collections/TenantPaymentProviders/TenantPaymentProviders'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('optional payment landing contract', () => {
  it('keeps the default convocatoria page as enquiry-only', () => {
    const page = readFileSync(
      path.join(root, 'app/(public)/p/convocatorias/[slug]/page.tsx'),
      'utf8',
    )
    expect(page).toContain('PreinscripcionForm')
    expect(page).not.toContain('/api/offers/')
    expect(page).not.toContain('checkout.sessions')
  })

  it('exposes Stripe learner settings outside platform billing', () => {
    const settings = readFileSync(
      path.join(root, 'app/(app)/(dashboard)/configuracion/page.tsx'),
      'utf8',
    )
    const stripeRoute = readFileSync(
      path.join(root, 'app/api/tenant-payments/stripe/route.ts'),
      'utf8',
    )
    expect(settings).toContain('LearnerStripeSettingsCard')
    expect(stripeRoute).not.toContain('STRIPE_SECRET_KEY')
  })

  it('keeps activity offers default-off and hides payment secrets from admin reads', () => {
    const offerFields = ActivityOffers.fields as Array<{ name?: string; defaultValue?: unknown; access?: { read?: () => boolean } }>
    const providerFields = TenantPaymentProviders.fields as Array<{ name?: string; access?: { read?: () => boolean }; admin?: { hidden?: boolean } }>
    const checkout = offerFields.find((field) => field.name === 'checkout_enabled')
    const secret = providerFields.find((field) => field.name === 'secret_ciphertext')
    expect(ActivityOffers.slug).toBe('activity-offers')
    expect(checkout?.defaultValue).toBe(false)
    expect(secret?.access?.read?.()).toBe(false)
    expect(secret?.admin?.hidden).toBe(true)
  })

  it('places the generate action on convocatoria admin surfaces', () => {
    const programacion = readFileSync(
      path.join(root, 'app/(app)/(dashboard)/programacion/[id]/ficha/page.tsx'),
      'utf8',
    )
    const web = readFileSync(
      path.join(root, 'app/(app)/(dashboard)/web/convocatorias/[id]/page.tsx'),
      'utf8',
    )
    expect(programacion).toContain('OfferPaymentCard')
    expect(web).toContain('OfferPaymentCard')
  })
})
