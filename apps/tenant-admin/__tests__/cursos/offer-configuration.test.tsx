import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { OfferConfigurationForm } from '@/app/(app)/(dashboard)/cursos/convocatorias/[id]/oferta/OfferConfigurationPage'

const record = {
  courseRunId: 12,
  courseId: 5,
  courseName: 'Creative Leadership',
  code: 'CL-2026-09',
  startsAt: '2026-09-12T09:00:00.000Z',
  endsAt: '2026-09-13T17:00:00.000Z',
  publicationAccess: 'private' as const,
  conversionMode: 'information_only' as const,
  shareSlug: null,
  formTemplateKey: null,
  externalActionUrl: null,
  paymentPlan: null,
  priceAmount: null,
  depositAmount: null,
  ctaLabel: null,
  capacityPolicy: 'limited' as const,
}

describe('OfferConfigurationForm', () => {
  it('offers one explicit outcome for information, forms, registration, payment and external links', () => {
    render(<OfferConfigurationForm record={record} onSave={vi.fn()} />)

    expect(screen.getByRole('group', { name: '¿Qué debe poder hacer el visitante?' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Página informativa/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Formulario de interés/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Inscripción sin pago/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Solicitud con aprobación/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Inscripción con pago/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Enlace externo · Luma y otros/i })).toBeInTheDocument()
    expect(screen.getByText('La página compartible es independiente')).toBeInTheDocument()
  })

  it('reveals only the fields belonging to the selected conversion mode', () => {
    render(<OfferConfigurationForm record={record} onSave={vi.fn()} />)

    expect(screen.queryByLabelText('Precio total')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /Inscripción con pago/i }))
    expect(screen.getByLabelText('Precio total')).toBeInTheDocument()
    expect(screen.getByLabelText('Modalidad')).toBeInTheDocument()
    expect(screen.queryByLabelText('Destino HTTPS')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Modalidad'), { target: { value: 'deposit' } })
    expect(screen.getByLabelText('Depósito')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /Enlace externo/i }))
    expect(screen.getByLabelText('Destino HTTPS')).toBeInTheDocument()
    expect(screen.queryByLabelText('Precio total')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Depósito')).not.toBeInTheDocument()
  })

  it('submits an external journey without stale payment fields', async () => {
    const onSave = vi.fn(async (input) => ({
      ...record,
      conversionMode: input.conversionMode,
      externalActionUrl: input.externalActionUrl ?? null,
    }))
    render(<OfferConfigurationForm record={record} onSave={onSave} />)

    fireEvent.click(screen.getByRole('radio', { name: /Inscripción con pago/i }))
    fireEvent.change(screen.getByLabelText('Precio total'), { target: { value: '249' } })
    fireEvent.click(screen.getByRole('radio', { name: /Enlace externo/i }))
    fireEvent.change(screen.getByLabelText('Destino HTTPS'), {
      target: { value: 'https://events.example.com/creative-leadership' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar recorrido' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith({
      publicationAccess: 'private',
      conversionMode: 'external_link',
      externalActionUrl: 'https://events.example.com/creative-leadership',
      capacityPolicy: 'limited',
    })
  })

  it('submits an interest form without hidden registration, payment or redirect settings', async () => {
    const onSave = vi.fn(async (input) => ({
      ...record,
      conversionMode: input.conversionMode,
      formTemplateKey: input.formTemplateKey ?? null,
    }))
    render(<OfferConfigurationForm record={record} onSave={onSave} />)

    fireEvent.click(screen.getByRole('radio', { name: /Formulario de interés/i }))
    expect(screen.getByText('Formulario estándar de contacto')).toBeInTheDocument()
    expect(screen.getByText('Nombre y apellidos · Email · Teléfono · Mensaje')).toBeInTheDocument()
    expect(screen.queryByLabelText('Formulario conectado')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar recorrido' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith({
      publicationAccess: 'private',
      conversionMode: 'interest_form',
      formTemplateKey: 'lead-standard',
      capacityPolicy: 'limited',
    })
  })

  it('connects the review application preset automatically and does not expose its technical key', async () => {
    const onSave = vi.fn(async (input) => ({
      ...record,
      conversionMode: input.conversionMode,
      formTemplateKey: input.formTemplateKey ?? null,
    }))
    render(<OfferConfigurationForm record={record} onSave={onSave} />)

    fireEvent.click(screen.getByRole('radio', { name: /Solicitud con aprobación/i }))

    expect(screen.getByText('Formulario estándar de solicitud')).toBeInTheDocument()
    expect(screen.queryByLabelText('Formulario conectado')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar recorrido' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith({
      publicationAccess: 'private',
      conversionMode: 'approval_required',
      formTemplateKey: 'application-standard',
      capacityPolicy: 'limited',
    })
  })

  it('fails closed when a public offer has no shareable slug', () => {
    render(<OfferConfigurationForm record={record} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Visibilidad'), { target: { value: 'public' } })
    expect(screen.getByRole('button', { name: 'Guardar recorrido' })).toBeDisabled()
    expect(screen.getByLabelText('URL compartible')).toHaveAttribute('aria-invalid', 'true')
  })
})
