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
  canReview: true,
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

  it('requires a reason before rejecting and then refreshes the audited state', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        submissionId: 91,
        previousStatus: 'pending_review',
        status: 'rejected',
        changed: true,
        decidedAt: '2026-08-03T14:00:00.000Z',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...response,
        items: [{ ...response.items[0], status: 'rejected' }],
      }), { status: 200 }))
    render(<OfferSubmissionInbox />)
    await screen.findAllByText('Ada Lovelace')

    fireEvent.click(screen.getAllByRole('button', { name: 'Rechazar' })[0])
    const confirm = screen.getByRole('button', { name: 'Confirmar: Rechazada' })
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Nota interna (obligatoria)'), {
      target: { value: 'No cumple el requisito de acceso' },
    })
    expect(confirm).toBeEnabled()
    fireEvent.click(confirm)

    await screen.findByText('Solicitud actualizada: rechazada.')
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      '/api/next/offer-submissions/91/decision',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected', note: 'No cumple el requisito de acceso' }),
      }),
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })

  it('does not render review actions for a read-only marketing profile', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      ...response,
      canReview: false,
    }), { status: 200 }))
    render(<OfferSubmissionInbox />)
    await screen.findAllByText('Ada Lovelace')
    expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Historial' })).not.toBeInTheDocument()
  })

  it('loads the bounded actor timeline only when an authorized reviewer requests it', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(response), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        submissionId: 91,
        status: 'rejected',
        receivedAt: '2026-08-03T10:00:00.000Z',
        events: [{
          id: 501,
          actorUserId: 41,
          actorName: 'QA Manager',
          fromStatus: 'pending_review',
          toStatus: 'rejected',
          note: 'Missing prerequisite',
          createdAt: '2026-08-03T14:00:00.000Z',
        }],
        truncated: false,
      }), { status: 200 }))
    render(<OfferSubmissionInbox />)
    await screen.findAllByText('Ada Lovelace')

    fireEvent.click(screen.getAllByRole('button', { name: 'Historial' })[0])
    expect(await screen.findByText('Historial de Ada Lovelace')).toBeInTheDocument()
    expect(await screen.findByText('QA Manager · actor #41')).toBeInTheDocument()
    expect(screen.getByText('Missing prerequisite')).toBeInTheDocument()
    expect(screen.getByText('Pendiente de revisión → Rechazada')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      '/api/next/offer-submissions/91/reviews',
      expect.objectContaining({ cache: 'no-store', credentials: 'same-origin' }),
    )
  })
})
