// Mock data for classroom availability (temporary until full implementation)

export interface Aula {
  id: string
  nombre: string
  codigo: string
  sede: string
  capacidad: number
}

export interface HorarioDetallado {
  aula_id: string
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'
  hora_inicio: string
  hora_fin: string
  curso_nombre: string
  profesor: string
  color?: string
}

// Sample classroom data
export const aulasMockData: Aula[] = [
  {
    id: 'aula-1',
    nombre: 'Aula Principal',
    codigo: 'A-101',
    sede: 'CEP Norte',
    capacidad: 30,
  },
  {
    id: 'aula-2',
    nombre: 'Laboratorio',
    codigo: 'LAB-1',
    sede: 'CEP Sur',
    capacidad: 25,
  },
]

// Sample schedule data
export const horariosDetalladosMock: HorarioDetallado[] = [
  {
    aula_id: 'aula-1',
    dia: 'lunes',
    hora_inicio: '08:00',
    hora_fin: '10:00',
    curso_nombre: 'Gestión Administrativa',
    profesor: 'María García',
    color: '#3b82f6',
  },
  {
    aula_id: 'aula-1',
    dia: 'miercoles',
    hora_inicio: '14:00',
    hora_fin: '18:00',
    curso_nombre: 'Marketing Digital',
    profesor: 'Ana Rodríguez',
    color: '#f59e0b',
  },
]
