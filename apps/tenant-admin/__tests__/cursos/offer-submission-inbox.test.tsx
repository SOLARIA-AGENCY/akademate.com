import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { OfferSubmissionInbox } from '@/app/(app)/(dashboard)/cursos/solicitudes/OfferSubmissionInbox'

const response = {
  items: [{
    id: 91,
    courseRunId: 12,
    courseName: 'Creative Leadership',
    courseRunCode: 'CL-2026-09',
    kind: 'application',
    status: 'pending_review',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+34 600 000 000',
    message: 'I would like to join.',
    privacyNoticeVersion: '2026-08-v1',
    marketingConsent: false,
    sourceHost: 'north-star.localhost',
    sourceSlug: 'creative-leadership-weekend',
    createdAt: '2026-08-03T10:00:00.000Z',
  }],
  page: 1,
  pageSize: 25,
  total: 1,
  totalPages: 1,
}

afterEach(() => vi.restoreAllMocks())

describe('OfferSubmissionInbox', () => {
  it('shows honest request states and the academy context without implying enrolment', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }))
    render(<OfferSubmissionInbox />)

    expect((await screen.findAllByText('Ada Lovelace')).length).toBe(2)
    expect(screen.getAllByText('Creative Leadership')).toHaveLength(2)
    expect(screen.getAllByText('Pendiente de revisión').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/matrícula confirmada/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Ver convocatoria/i })[0]).toHaveAttribute(
      'href',
      '/cursos/convocatorias/12/oferta',
    )
  })

  it('reloads with bounded filter parameters', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(response), { status: 200 }),
    )
    render(<OfferSubmissionInbox />)
    await screen.findAllByText('Ada Lovelace')

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'pending_review' } })
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/next/offer-submissions?status=pending_review',
      expect.objectContaining({ cache: 'no-store' }),
    ))
  })

  it('fails closed without rendering stale PII when the API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 403 }))
    render(<OfferSubmissionInbox />)
    expect(await screen.findByText('No se pudieron cargar las solicitudes')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })
})
