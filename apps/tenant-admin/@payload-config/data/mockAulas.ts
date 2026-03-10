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

// No hay tabla de aulas en la base de datos todavía — pendiente implementar
export const aulasMockData: Aula[] = []
export const horariosDetalladosMock: HorarioDetallado[] = []
