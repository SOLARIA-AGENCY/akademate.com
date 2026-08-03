import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PublicOfferPageView } from '@/app/(next-public)/o/[slug]/PublicOfferPageView'
import type { NextPublicOffer } from '@/src/lib/offers/public-offer-query'

const offer: NextPublicOffer = {
  tenantSlug: 'north-star',
  tenantName: 'North Star Academy',
  tenantDomain: 'learn.northstar.example',
  tenantLogoUrl: null,
  tenantPrimaryColor: '#2457F5',
  tenantContactEmail: 'hello@northstar.example',
  courseRunId: 12,
  courseId: 5,
  courseName: 'Creative Leadership',
  shortDescription: 'Build confident, collaborative leadership habits.',
  modality: 'hibrido',
  durationHours: 16,
  courseImageUrl: null,
  code: 'CL-2026-09',
  startsAt: '2026-09-12T09:00:00.000Z',
  endsAt: '2026-09-13T17:00:00.000Z',
  enrollmentDeadline: '2026-09-10T23:59:59.000Z',
  scheduleTimeStart: '09:00',
  scheduleTimeEnd: '17:00',
  maxStudents: 24,
  currentEnrollments: 16,
  availablePlaces: 8,
  campusName: 'Central Campus',
  campusCity: 'Malmö',
  campusAddress: 'Example 12',
  publicationAccess: 'unlisted',
  conversionMode: 'external_link',
  shareSlug: 'creative-leadership-weekend',
  externalActionUrl: 'https://events.example.test/creative-leadership',
  paymentPlan: null,
  priceAmount: null,
  depositAmount: null,
  ctaLabel: 'Reserve your place',
  capacityPolicy: 'limited',
}

describe('PublicOfferPageView', () => {
  afterEach(() => vi.restoreAllMocks())
  it('renders the academy, course, schedule, capacity and safe external CTA', () => {
    render(<PublicOfferPageView offer={offer} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Creative Leadership' })).toBeInTheDocument()
    expect(screen.getByText('North Star Academy')).toBeInTheDocument()
    expect(screen.getByText('8 places available')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Reserve your place/i })).toHaveAttribute(
      'href',
      'https://events.example.test/creative-leadership',
    )
    expect(screen.getByRole('link', { name: /Reserve your place/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    )
  })

  it('uses an honest contact fallback for an internal journey not yet activated', () => {
    render(<PublicOfferPageView offer={{
      ...offer,
      conversionMode: 'free_registration',
      externalActionUrl: null,
      ctaLabel: 'Register now',
    }} />)
    expect(screen.queryByRole('link', { name: 'Register now' })).not.toBeInTheDocument()
    const contact = screen.getByRole('link', { name: 'Ask about this course' })
    expect(contact.getAttribute('href')).toMatch(/^mailto:hello%40northstar\.example\?subject=/)
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  })

  it('renders a real accessible request form only when the Next submission service is configured', () => {
    render(<PublicOfferPageView
      offer={{
        ...offer,
        conversionMode: 'approval_required',
        externalActionUrl: null,
        ctaLabel: 'Apply',
      }}
      privacyNoticeUrl="https://akademate.com/legal/privacy"
    />)
    expect(screen.getByRole('form', { name: 'Course request' })).toBeInTheDocument()
    expect(screen.getByLabelText('First name')).toBeRequired()
    expect(screen.getByLabelText('Last name')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByRole('checkbox', { name: /I agree to the privacy notice/i })).toBeRequired()
    expect(screen.getByRole('checkbox', { name: /receive relevant academy updates/i })).not.toBeRequired()
    expect(screen.getByRole('button', { name: 'Send application' })).toBeInTheDocument()
  })

  it('submits consent and applicant data to the bounded Next command without claiming confirmation', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('018f6f52-86a7-7c8f-a477-01b9c6407a11')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      accepted: true,
      kind: 'registration_request',
      status: 'pending_registration',
    }), { status: 201 }))
    render(<PublicOfferPageView
      offer={{ ...offer, conversionMode: 'free_registration', externalActionUrl: null }}
      privacyNoticeUrl="https://akademate.com/legal/privacy"
    />)
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Lovelace' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.test' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree to the privacy notice/i }))
    fireEvent.submit(screen.getByRole('form', { name: 'Course request' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/next/public/offers/creative-leadership-weekend/submissions')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toMatchObject({
      idempotencyKey: '018f6f52-86a7-7c8f-a477-01b9c6407a11',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      privacyAccepted: true,
      marketingConsent: false,
    })
    expect(await screen.findByText(/enrolment request has been received/i)).toBeInTheDocument()
    expect(screen.queryByText(/confirmed place/i)).not.toBeInTheDocument()
  })

  it('does not render a fake action when the academy has no operational destination', () => {
    render(<PublicOfferPageView offer={{
      ...offer,
      tenantContactEmail: null,
      conversionMode: 'approval_required',
      externalActionUrl: null,
    }} />)
    expect(screen.queryByRole('link', { name: /apply|register|reserve/i })).not.toBeInTheDocument()
    expect(screen.getByText('Contact North Star Academy to continue with this course.')).toBeInTheDocument()
  })

  it('starts a bounded paid checkout and reports only processing after return', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('018f6f52-86a7-7c8f-a477-01b9c6407a11')
    const redirect = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
      status: 'awaiting_payment',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
    }), { status: 201 }))
    render(<PublicOfferPageView
      offer={{
        ...offer,
        conversionMode: 'paid_registration',
        externalActionUrl: null,
        paymentPlan: 'full_amount',
        priceAmount: 249,
      }}
      privacyNoticeUrl="https://akademate.com/legal/privacy"
      availablePaymentMethods={['card_or_wallet', 'sepa_debit']}
      paymentStatus="processing"
      checkoutRedirect={redirect}
    />)
    expect(screen.getByText(/Payment is being verified/i)).toBeInTheDocument()
    expect(screen.queryByText(/enrolment confirmed/i)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Lovelace' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.test' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /privacy notice for registration and payment/i }))
    fireEvent.submit(screen.getByRole('form', { name: 'Paid course registration' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, init] = fetchMock.mock.calls[0]!
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('amountCents')
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('tenantId')
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_123'))
  })
})
