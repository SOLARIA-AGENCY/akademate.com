import { describe, expect, it } from 'vitest'
import {
  canEnableCheckout,
  confirmHold,
  generatePublicSlug,
  projectCourseRunToOffer,
  remainingSeats,
  tryHoldSeat,
} from '../activity-offer'

const connectedStripe = {
  tenantId: 2,
  status: 'connected' as const,
  publishableKey: 'pk_test_x',
  secretCiphertext: 'enc:v1:x',
  webhookSecretCiphertext: '',
  secretLast4: 'xxxx',
  connectAccountId: '',
  livemode: false,
}

describe('activity offer', () => {
  it('projects a convocatoria into a portable offer without FP-only fields', () => {
    const offer = projectCourseRunToOffer(
      {
        id: 84,
        codigo: 'NOR-2026-043',
        start_date: '2026-09-01',
        max_students: 12,
        current_enrollments: 3,
        price_snapshot: 49,
        course: { name: 'Taller de yoga' },
        campus: { name: 'Sede Norte', city: 'Las Palmas' },
      },
      2,
    )

    expect(offer.sourceType).toBe('course_run')
    expect(offer.sourceCourseRunId).toBe(84)
    expect(offer.activityKind).toBe('course_run')
    expect(offer.amountCents).toBe(4900)
    expect(offer.checkoutEnabled).toBe(false)
    expect(offer.publicSlug).toContain(generatePublicSlug('Taller de yoga', 'NOR-2026-043'))
    expect(JSON.stringify(offer)).not.toMatch(/fped|acaten|grado_superior/i)
  })

  it('keeps checkout default-off until Stripe is connected and the offer is enabled', () => {
    const offer = projectCourseRunToOffer({ id: 1, price_snapshot: 20, max_students: 8 }, 2)
    expect(canEnableCheckout(offer, null).ok).toBe(false)
    expect(canEnableCheckout(offer, connectedStripe).ok).toBe(false)
    expect(canEnableCheckout({ ...offer, checkoutEnabled: true }, connectedStripe).ok).toBe(true)
  })

  it('holds the last seat and rejects a concurrent second hold', () => {
    const now = new Date('2026-08-19T18:00:00.000Z')
    const offer = {
      ...projectCourseRunToOffer({ id: 1, price_snapshot: 20, max_students: 1, current_enrollments: 0 }, 2),
      checkoutEnabled: true,
    }

    const first = tryHoldSeat(offer, now, { id: 'hold_1' })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(remainingSeats(first.offer, now)).toBe(0)

    const second = tryHoldSeat(first.offer, now, { id: 'hold_2' })
    expect(second.ok).toBe(false)

    const confirmed = confirmHold(first.offer, { holdId: 'hold_1' })
    expect(confirmed.ok).toBe(true)
    if (!confirmed.ok) return
    expect(confirmed.offer.seatsTaken).toBe(1)
    expect(remainingSeats(confirmed.offer, now)).toBe(0)
  })
})
