import { describe, expect, it } from 'vitest'

import {
  StudentSchema,
  dniSchema,
  spanishIdSchema,
  validateDNIChecksum,
  validateNIEChecksum,
  validateSpanishIdChecksum,
} from '../../src/collections/Students/Students.validation'
import { validateStudentData } from '../../src/collections/Students/hooks/validateStudentData'

type HookArgs = Parameters<typeof validateStudentData>[0]

const runHook = (data: Record<string, unknown>) =>
  validateStudentData({ data, operation: 'create' } as unknown as HookArgs)

const baseStudent = {
  first_name: 'Ana',
  last_name: 'Pérez',
  email: 'ana@example.com',
  phone: '+34 612 345 678',
  gdpr_consent: true,
  privacy_policy_accepted: true,
}

describe('Students DNI/NIE validation', () => {
  describe('validateNIEChecksum', () => {
    it.each(['X1234567L', 'Y1234567X', 'Z1234567R', 'X0000000T'])('accepts valid NIE %s', (nie) => {
      expect(validateNIEChecksum(nie)).toBe(true)
    })

    it.each(['X1234567A', 'Y1234567L', 'Z1234567T'])(
      'rejects NIE with wrong control letter %s',
      (nie) => {
        expect(validateNIEChecksum(nie)).toBe(false)
      }
    )

    it.each(['A1234567L', 'X123456L', 'X12345678L', 'x1234567L', '12345678Z', ''])(
      'rejects malformed NIE %j',
      (nie) => {
        expect(validateNIEChecksum(nie)).toBe(false)
      }
    )
  })

  describe('validateSpanishIdChecksum', () => {
    it('accepts both DNI and NIE', () => {
      expect(validateSpanishIdChecksum('12345678Z')).toBe(true)
      expect(validateSpanishIdChecksum('X1234567L')).toBe(true)
    })

    it('rejects a bad DNI or NIE checksum', () => {
      expect(validateSpanishIdChecksum('12345678X')).toBe(false)
      expect(validateSpanishIdChecksum('X1234567A')).toBe(false)
    })
  })

  describe('DNI behaviour is unchanged', () => {
    it('validateDNIChecksum still accepts only DNI', () => {
      expect(validateDNIChecksum('12345678Z')).toBe(true)
      expect(validateDNIChecksum('12345678X')).toBe(false)
      expect(validateDNIChecksum('X1234567L')).toBe(false)
    })

    it('dniSchema still accepts only DNI', () => {
      expect(dniSchema.safeParse('12345678Z').success).toBe(true)
      expect(dniSchema.safeParse('X1234567L').success).toBe(false)
    })
  })

  describe('spanishIdSchema and StudentSchema', () => {
    it('accepts DNI and NIE, rejects bad checksums', () => {
      expect(spanishIdSchema.safeParse('12345678Z').success).toBe(true)
      expect(spanishIdSchema.safeParse('X1234567L').success).toBe(true)
      expect(spanishIdSchema.safeParse('X1234567A').success).toBe(false)
      expect(spanishIdSchema.safeParse('1234567Z').success).toBe(false)
    })

    it('StudentSchema accepts a student identified by NIE', () => {
      const result = StudentSchema.safeParse({ ...baseStudent, dni: 'Y1234567X' })
      expect(result.success).toBe(true)
    })

    it('StudentSchema still rejects an invalid document', () => {
      const result = StudentSchema.safeParse({ ...baseStudent, dni: 'Y1234567A' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateStudentData hook', () => {
    it('accepts a DNI', () => {
      expect(() => runHook({ dni: '12345678Z' })).not.toThrow()
    })

    it.each(['X1234567L', 'Y1234567X', 'Z1234567R'])('accepts NIE %s', (nie) => {
      expect(() => runHook({ dni: nie })).not.toThrow()
    })

    it('rejects an NIE with a wrong control letter', () => {
      expect(() => runHook({ dni: 'X1234567A' })).toThrow('DNI/NIE checksum letter is invalid')
    })

    it('rejects a DNI with a wrong control letter', () => {
      expect(() => runHook({ dni: '12345678X' })).toThrow('DNI/NIE checksum letter is invalid')
    })

    it.each(['A1234567L', '1234567Z', 'X123456L'])('rejects malformed document %s', (dni) => {
      expect(() => runHook({ dni })).toThrow('DNI/NIE must be 8 digits followed by a letter')
    })

    it('does not validate an empty document (field is optional)', () => {
      expect(() => runHook({ dni: '' })).not.toThrow()
      expect(() => runHook({})).not.toThrow()
    })
  })
})
