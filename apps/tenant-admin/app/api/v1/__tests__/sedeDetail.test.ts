/**
 * @fileoverview Tests para las constantes y logica de la pagina de detalle de sede
 * Valida: SERVICE_LABELS, EQUIPMENT_LABELS, STATUS_LABELS,
 *         coherencia con la coleccion Campuses
 */

import { describe, it, expect } from 'vitest'
import { Campuses } from '../../../../src/collections/Campuses/Campuses'

// ============================================================================
// Constants extracted from sedes/[id]/page.tsx
// (Duplicated here because the page is a default-export React component
//  and cannot be imported without a DOM environment)
// ============================================================================

const SERVICE_LABELS: Record<string, string> = {
  wifi: 'WiFi gratuito',
  parking: 'Aparcamiento',
  cafeteria: 'Cafeteria',
  library: 'Biblioteca',
  accessibility: 'Acceso movilidad reducida',
  elevator: 'Ascensor',
  study_room: 'Sala de estudio',
  lockers: 'Taquillas',
  public_transport: 'Transporte publico',
  front_desk: 'Secretaria',
  break_area: 'Zona descanso',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: 'Proyector',
  digital_board: 'Pizarra digital',
  whiteboard: 'Pizarra blanca',
  wifi: 'WiFi',
  computers: 'Ordenadores',
  ac: 'A/C',
  av_system: 'Audio/Video',
  lab: 'Laboratorio',
  workshop: 'Taller',
}

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'outline' },
  enrollment_open: { label: 'Inscripcion abierta', variant: 'default' },
  in_progress: { label: 'En curso', variant: 'default' },
  completed: { label: 'Finalizada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

// ============================================================================
// Helpers to extract collection options
// ============================================================================

function getCollectionServiceOptions(): string[] {
  const field = Campuses.fields.find((f: any) => f.name === 'services') as any
  if (!field?.options) return []
  return field.options.map((o: any) => (typeof o === 'string' ? o : o.value))
}

function getCollectionEquipmentOptions(): string[] {
  const classrooms = Campuses.fields.find((f: any) => f.name === 'classrooms') as any
  if (!classrooms?.fields) return []
  const equipField = classrooms.fields.find((f: any) => f.name === 'equipment') as any
  if (!equipField?.options) return []
  return equipField.options.map((o: any) => (typeof o === 'string' ? o : o.value))
}

// ============================================================================
// Tests: SERVICE_LABELS
// ============================================================================

describe('SedeDetail: SERVICE_LABELS', () => {
  it('has 11 entries', () => {
    expect(Object.keys(SERVICE_LABELS)).toHaveLength(11)
  })

  it('every key is a non-empty string', () => {
    for (const key of Object.keys(SERVICE_LABELS)) {
      expect(key.length).toBeGreaterThan(0)
    }
  })

  it('every value is a non-empty string', () => {
    for (const value of Object.values(SERVICE_LABELS)) {
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('each key matches a valid service option from the Campuses collection', () => {
    const collectionOptions = getCollectionServiceOptions()
    for (const key of Object.keys(SERVICE_LABELS)) {
      expect(collectionOptions).toContain(key)
    }
  })

  it('covers all collection service options', () => {
    const collectionOptions = getCollectionServiceOptions()
    const labelKeys = Object.keys(SERVICE_LABELS)
    for (const option of collectionOptions) {
      expect(labelKeys).toContain(option)
    }
  })
})

// ============================================================================
// Tests: EQUIPMENT_LABELS
// ============================================================================

describe('SedeDetail: EQUIPMENT_LABELS', () => {
  it('has 9 entries', () => {
    expect(Object.keys(EQUIPMENT_LABELS)).toHaveLength(9)
  })

  it('every key is a non-empty string', () => {
    for (const key of Object.keys(EQUIPMENT_LABELS)) {
      expect(key.length).toBeGreaterThan(0)
    }
  })

  it('every value is a non-empty string', () => {
    for (const value of Object.values(EQUIPMENT_LABELS)) {
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('each key matches a valid equipment option from the Campuses collection', () => {
    const collectionOptions = getCollectionEquipmentOptions()
    for (const key of Object.keys(EQUIPMENT_LABELS)) {
      expect(collectionOptions).toContain(key)
    }
  })

  it('covers all collection equipment options', () => {
    const collectionOptions = getCollectionEquipmentOptions()
    const labelKeys = Object.keys(EQUIPMENT_LABELS)
    for (const option of collectionOptions) {
      expect(labelKeys).toContain(option)
    }
  })
})

// ============================================================================
// Tests: STATUS_LABELS
// ============================================================================

describe('SedeDetail: STATUS_LABELS', () => {
  const expectedStatuses = [
    'draft', 'published', 'enrollment_open',
    'in_progress', 'completed', 'cancelled',
  ]

  it('has 6 statuses', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(6)
  })

  it.each(expectedStatuses)('contains status: %s', (status) => {
    expect(STATUS_LABELS).toHaveProperty(status)
  })

  it('each entry has a label property (non-empty string)', () => {
    for (const [key, entry] of Object.entries(STATUS_LABELS)) {
      expect(entry.label).toBeDefined()
      expect(typeof entry.label).toBe('string')
      expect(entry.label.length).toBeGreaterThan(0)
    }
  })

  it('each entry has a variant property', () => {
    for (const [key, entry] of Object.entries(STATUS_LABELS)) {
      expect(entry.variant).toBeDefined()
      expect(typeof entry.variant).toBe('string')
    }
  })

  it('all variants are valid Badge variants', () => {
    const validVariants = ['default', 'secondary', 'outline', 'destructive']
    for (const [key, entry] of Object.entries(STATUS_LABELS)) {
      expect(validVariants).toContain(entry.variant)
    }
  })

  it('draft has secondary variant', () => {
    expect(STATUS_LABELS.draft.variant).toBe('secondary')
  })

  it('cancelled has destructive variant', () => {
    expect(STATUS_LABELS.cancelled.variant).toBe('destructive')
  })

  it('enrollment_open has default variant', () => {
    expect(STATUS_LABELS.enrollment_open.variant).toBe('default')
  })
})

// ============================================================================
// Tests: Consistency between detail page and collection
// ============================================================================

describe('SedeDetail: Collection-Page consistency', () => {
  it('SERVICE_LABELS count matches collection services options count', () => {
    const collectionCount = getCollectionServiceOptions().length
    const labelsCount = Object.keys(SERVICE_LABELS).length
    expect(labelsCount).toBe(collectionCount)
  })

  it('EQUIPMENT_LABELS count matches collection equipment options count', () => {
    const collectionCount = getCollectionEquipmentOptions().length
    const labelsCount = Object.keys(EQUIPMENT_LABELS).length
    expect(labelsCount).toBe(collectionCount)
  })
})
