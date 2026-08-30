import { describe, expect, it } from 'vitest'
import { normalizeConvocatoriaRecord } from '@/app/lib/programacion/convocatoria-normalization'

const statusColors = { enrollment_open: 'bg-green', draft: 'bg-gray' }

describe('programacion convocatoria normalization', () => {
  it('normalizes Payload relations, schedule text and numeric catalog values', () => {
    const result = normalizeConvocatoriaRecord(
      {
        id: 10,
        codigo: 'ACV-2026',
        cursoNombre: 'Auxiliar Clínico Veterinario',
        cursoId: { id: 20 },
        cursoTipo: 'privado',
        campusNombre: 'Santa Cruz',
        campusId: 3,
        aulaNombre: 'Aula 4',
        aulaId: { id: 4 },
        horario: 'Lunes 09:30 - 13:45',
        dias: ['monday', 7, null],
        plazasTotales: '24',
        plazasOcupadas: 5,
        precio: '1250',
        profesor: { id: 7, first_name: 'Lucia', last_name: 'Corominas' },
        profesores: [{ id: 8, full_name: 'Luis Gonzalez' }],
        estado: 'enrollment_open',
      },
      statusColors
    )

    expect(result).toMatchObject({
      id: '10',
      cursoId: '20',
      sedeId: '3',
      aulaId: '4',
      horaInicio: '09:30',
      horaFin: '13:45',
      dias: ['monday'],
      plazas: 24,
      inscritos: 5,
      precio: 1250,
      profesores: ['Lucia Corominas', 'Luis Gonzalez'],
      profesor: 'Lucia Corominas',
      estado: 'enrollment_open',
      color: 'bg-green',
    })
    expect(result.profesorRefs).toEqual([
      { id: '7', name: 'Lucia Corominas' },
      { id: '8', name: 'Luis Gonzalez' },
    ])
  })

  it('prefers direct valid times and rejects invalid numeric values', () => {
    const result = normalizeConvocatoriaRecord(
      {
        horaInicio: '08:15:99',
        horaFin: '12:30',
        horario: 'Lunes 09:00-11:00',
        plazasTotales: -1,
        plazasOcupadas: Number.POSITIVE_INFINITY,
        precio: 'not-a-number',
        matricula: 150,
        horasPracticas: ' 40 horas ',
        certificacion: ' ',
        profesor: '  Lucia Ortega  ',
        estado: 'draft',
      },
      statusColors
    )

    expect(result.horaInicio).toBe('09:00')
    expect(result.horaFin).toBe('12:30')
    expect(result.plazas).toBe(0)
    expect(result.inscritos).toBe(0)
    expect(result.precio).toBe(0)
    expect(result.matricula).toBe(150)
    expect(result.horasPracticas).toBe('40 horas')
    expect(result.certificacion).toBeNull()
  })

  it('fails closed for null and malformed records without rendering objects', () => {
    expect(normalizeConvocatoriaRecord(null, statusColors)).toMatchObject({
      id: '',
      curso: 'Curso',
      sede: 'Sin sede',
      aula: 'Sin aula',
      horaInicio: '09:00',
      horaFin: '14:00',
      profesor: 'Sin docente',
      profesores: [],
      profesorRefs: [],
      estado: 'draft',
      color: 'bg-gray',
    })

    expect(
      normalizeConvocatoriaRecord(
        { estado: { value: 'unknown' }, horario: { start: '09:00' } },
        statusColors
      ).color
    ).toBe('bg-gray')
  })
})
