import { describe, expect, it } from 'vitest'
import {
  normalizeStaffEmail,
  normalizeStaffNif,
  validateStaffEmail,
  validateStaffNif,
} from './staff-contact'

describe('staff contact normalization', () => {
  it('normalizes email copied with non-standard spaces and invisible characters', () => {
    expect(normalizeStaffEmail('\u00A0MEDICINAESTETICALUJO@YAHOO.ES\u200B')).toBe(
      'medicinaesteticalujo@yahoo.es'
    )
  })

  it('rejects emails that only look valid because of permissive punctuation', () => {
    expect(validateStaffEmail('medicinaesteticalujo@yahoo.es.')).toMatchObject({
      valid: false,
      reason: 'invalid_email_format',
    })
  })

  it('normalizes DNI/NIF/NIE pasted with prefixes and separators', () => {
    expect(normalizeStaffNif(' DNI 00000000-A\u200B ')).toBe('00000000A')
  })

  it('rejects documents outside the accepted alphanumeric length', () => {
    expect(validateStaffNif('A')).toMatchObject({
      valid: false,
      reason: 'invalid_nif_length',
    })
  })
})
