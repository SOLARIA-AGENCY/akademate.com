import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
})
