import { describe, expect, it } from 'vitest'

import { OfferPublicationSchema, resolveOfferAction } from '../src/offer-publication.js'

describe('OfferPublicationSchema', () => {
  it('defaults to a private information-only offer', () => {
    expect(OfferPublicationSchema.parse({})).toEqual({
      publicationAccess: 'private',
      conversionMode: 'information_only',
      capacityPolicy: 'limited',
    })
  })

  it.each([
    ['information_only', { publicationAccess: 'public', shareSlug: 'summer-workshop' }],
    [
      'interest_form',
      {
        publicationAccess: 'public',
        shareSlug: 'summer-workshop',
        formTemplateKey: 'interest-default',
      },
    ],
    ['free_registration', { publicationAccess: 'unlisted', shareSlug: 'private-masterclass' }],
    [
      'approval_required',
      {
        publicationAccess: 'public',
        shareSlug: 'regulated-course',
        formTemplateKey: 'admission-review',
      },
    ],
    [
      'paid_registration',
      {
        publicationAccess: 'public',
        shareSlug: 'paid-course',
        paymentPlan: 'full_amount',
        priceAmount: 249,
      },
    ],
    [
      'external_link',
      {
        publicationAccess: 'public',
        shareSlug: 'partner-event',
        externalActionUrl: 'https://events.example.com/apply',
      },
    ],
  ] as const)('accepts %s when its required configuration exists', (conversionMode, fields) => {
    expect(() => OfferPublicationSchema.parse({ conversionMode, ...fields })).not.toThrow()
  })

  it('maps each mode to one explicit public action', () => {
    expect(resolveOfferAction({})).toEqual({ kind: 'none' })
    expect(resolveOfferAction({ conversionMode: 'free_registration' })).toEqual({
      kind: 'enrollment',
    })
    expect(
      resolveOfferAction({
        conversionMode: 'interest_form',
        formTemplateKey: 'interest-default',
      })
    ).toEqual({ kind: 'lead', requiresApproval: false, formTemplateKey: 'interest-default' })
    expect(
      resolveOfferAction({
        conversionMode: 'approval_required',
        formTemplateKey: 'admission-review',
      })
    ).toEqual({ kind: 'lead', requiresApproval: true, formTemplateKey: 'admission-review' })
    expect(
      resolveOfferAction({
        conversionMode: 'paid_registration',
        paymentPlan: 'deposit',
        priceAmount: 249,
        depositAmount: 50,
      })
    ).toEqual({ kind: 'payment', priceAmount: 249, paymentPlan: 'deposit', depositAmount: 50 })
    expect(
      resolveOfferAction({
        conversionMode: 'external_link',
        externalActionUrl: 'https://events.example.com/apply',
      })
    ).toEqual({ kind: 'redirect', url: 'https://events.example.com/apply' })
  })

  it.each([
    [{ publicationAccess: 'public' }, 'public page without slug'],
    [{ conversionMode: 'interest_form' }, 'lead form without template'],
    [{ conversionMode: 'approval_required' }, 'approval request without template'],
    [{ conversionMode: 'external_link' }, 'external mode without destination'],
    [
      { conversionMode: 'external_link', externalActionUrl: 'http://events.example.com/apply' },
      'non-HTTPS redirect',
    ],
    [
      { conversionMode: 'free_registration', paymentPlan: 'full_amount' },
      'payment attached to free registration',
    ],
    [{ conversionMode: 'paid_registration' }, 'paid mode without payment plan and price'],
    [
      { conversionMode: 'paid_registration', paymentPlan: 'full_amount' },
      'paid mode without price',
    ],
    [
      { conversionMode: 'paid_registration', paymentPlan: 'deposit', priceAmount: 249 },
      'deposit without amount',
    ],
    [
      {
        conversionMode: 'paid_registration',
        paymentPlan: 'deposit',
        priceAmount: 100,
        depositAmount: 100,
      },
      'deposit equal to full price',
    ],
    [
      {
        conversionMode: 'paid_registration',
        paymentPlan: 'full_amount',
        priceAmount: 100,
        depositAmount: 20,
      },
      'deposit attached to full payment',
    ],
    [
      { conversionMode: 'information_only', formTemplateKey: 'hidden-form' },
      'hidden form attached to information page',
    ],
    [
      { conversionMode: 'free_registration', externalActionUrl: 'https://example.com' },
      'external destination attached to internal registration',
    ],
  ])('rejects %s (%s)', (input) => {
    expect(OfferPublicationSchema.safeParse(input).success).toBe(false)
  })
})
