import type { Payload } from 'payload'

export type StudentProfileInput = {
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  tenantId?: number | null
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function fallbackPhone(phone: string | null | undefined): string {
  const trimmed = (phone ?? '').trim()
  return trimmed || '+34 600 000 000'
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export async function findOrCreateStudent(
  payload: Payload,
  input: StudentProfileInput,
): Promise<{ id: number; created: boolean }> {
  const email = normalizeEmail(input.email)
  if (!email) {
    throw new Error('Email de alumno requerido')
  }

  const existing = await payload.find({
    collection: 'students',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const existingId = toPositiveInt(existing.docs[0]?.id)
  if (existingId) {
    return { id: existingId, created: false }
  }

  const created = await payload.create({
    collection: 'students',
    overrideAccess: true,
    data: {
      first_name: input.firstName.trim() || 'Alumno',
      last_name: input.lastName.trim() || 'Sin apellido',
      email,
      phone: fallbackPhone(input.phone),
      gdpr_consent: true,
      privacy_policy_accepted: true,
      consent_timestamp: new Date().toISOString(),
      status: 'active',
      ...(input.tenantId ? { tenant: input.tenantId } : {}),
    } as never,
  })

  const id = toPositiveInt(created.id)
  if (!id) {
    throw new Error('No se pudo crear el alumno')
  }
  return { id, created: true }
}
