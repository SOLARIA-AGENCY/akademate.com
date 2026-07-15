import { describe, expect, it } from 'vitest'
import { formatStaffApiError } from '../staff-api-error'

describe('formatStaffApiError', () => {
  it('keeps actionable validation messages for duplicated identity fields', () => {
    expect(formatStaffApiError(new Error('duplicate key value violates unique constraint on email')))
      .toBe('Ya existe una ficha de personal con este email.')
  })

  it('does not expose SQL or schema details to the browser for internal failures', () => {
    expect(formatStaffApiError(new Error('column payload_locked_documents_rels.campus_enrollments_id does not exist')))
      .toBe('No se pudo guardar la ficha de personal. Inténtalo de nuevo o contacta con soporte.')
    expect(formatStaffApiError(new Error('relation staff does not exist'), 'load'))
      .toBe('No se pudo cargar el personal. Inténtalo de nuevo o contacta con soporte.')
  })
})
