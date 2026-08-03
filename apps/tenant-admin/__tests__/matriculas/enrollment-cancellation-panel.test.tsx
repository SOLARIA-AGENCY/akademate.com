import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EnrollmentCancellationPanel } from '@/app/(app)/(dashboard)/matriculas/[id]/EnrollmentCancellationPanel'

afterEach(() => vi.restoreAllMocks())

describe('EnrollmentCancellationPanel', () => {
  it('stays hidden when the Next session boundary is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }))
    render(<EnrollmentCancellationPanel enrollmentId={501} status="confirmed" onCompleted={vi.fn()} />)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Gestionar baja' })).not.toBeInTheDocument()
  })

  it('requires explicit confirmation and sends only type and reason', async () => {
    const completed = {
      enrollmentId: 501,
      status: 'withdrawn' as const,
      promotedEnrollmentId: 502,
      replayed: false,
      capacityReleased: true,
      financialFollowUpRequired: true,
    }
    const onCompleted = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(completed), { status: 200 }))
    function Harness() {
      const [status, setStatus] = useState('confirmed')
      return (
        <EnrollmentCancellationPanel
          enrollmentId={501}
          status={status}
          onCompleted={(result) => {
            onCompleted(result)
            setStatus(result.status)
          }}
        />
      )
    }
    render(<Harness />)

    fireEvent.click(await screen.findByRole('button', { name: 'Gestionar baja' }))
    const confirm = screen.getByRole('button', { name: 'Confirmar baja' })
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Motivo auditado'), {
      target: { value: 'Baja solicitada por cambio de disponibilidad.' },
    })
    fireEvent.click(confirm)

    await screen.findByText('La primera persona en lista de espera ha recibido la plaza.')
    expect(screen.getByText(/seguimiento financiero por separado/i)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(2,
      '/api/next/enrollments/501/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          cancellationType: 'withdrawn',
          reason: 'Baja solicitada por cambio de disponibilidad.',
        }),
      }),
    )
    expect(onCompleted).toHaveBeenCalledWith(completed)
  })

  it('does not offer a second cancellation for terminal states', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    render(<EnrollmentCancellationPanel enrollmentId={501} status="cancelled" onCompleted={vi.fn()} />)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Gestionar baja' })).not.toBeInTheDocument()
  })
})
