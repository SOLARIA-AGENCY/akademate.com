import type { Meta, StoryObj } from '@storybook/nextjs'
import { ConvocationCard } from '@payload-config/components/ui/ConvocationCard'
import type { InstanciaVistaCompleta } from '@/types'

const base: InstanciaVistaCompleta = {
  id: '1',
  plantillaId: 'p1',
  nombreCurso: 'React Avanzado con Next.js',
  descripcionCurso: 'Aprende las técnicas avanzadas de React y Next.js para construir aplicaciones web modernas con SSR, SSG y Server Actions.',
  imagenPortada: '/placeholder-course.svg',
  codigoCompleto: 'CEP-2026-MAR-001',
  tipo: 'privados',
  modalidad: 'online',
  estado: 'abierta',
  fechaInicio: '2026-03-15T00:00:00Z',
  fechaFin: '2026-06-15T00:00:00Z',
  horario: 'Lun-Mié-Vie 18:00-20:00',
  duracionHoras: 180,
  precio: 299,
  plazasTotales: 30,
  plazasOcupadas: 18,
  porcentajeOcupacion: 60,
  profesorId: 'prof1',
  profesorNombre: 'Carlos Martínez',
  sedeId: 'sede1',
  sedeNombre: 'Madrid Centro',
  aulaId: 'aula1',
  aulaNombre: 'Aula 3',
  subvencionado: 'no',
  entidadesFinanciadoras: [],
}

const meta = {
  title: 'Akademate/ConvocationCard',
  component: ConvocationCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    instance: base,
    onClick: () => {},
  },
} satisfies Meta<typeof ConvocationCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Subvencionado: Story = {
  args: {
    instance: {
      ...base,
      id: '2',
      nombreCurso: 'Atención al Cliente',
      codigoCompleto: 'CEP-2026-MAR-002',
      tipo: 'ocupados',
      precio: 0,
      plazasOcupadas: 12,
      plazasTotales: 20,
      porcentajeOcupacion: 60,
      subvencionado: 'total',
      entidadesFinanciadoras: [
        { id: 'e1', nombre: 'FUNDAE' },
        { id: 'e2', nombre: 'Junta de Andalucía' },
      ],
    },
  },
}

export const ConDescuento: Story = {
  args: {
    instance: {
      ...base,
      id: '3',
      nombreCurso: 'Diseño Gráfico con Adobe CC',
      codigoCompleto: 'CEP-2026-MAR-003',
      tipo: 'privados',
      precio: 199,
      precioConDescuento: 149,
      plazasOcupadas: 25,
      plazasTotales: 25,
      porcentajeOcupacion: 100,
    },
  },
}

export const Completo: Story = {
  args: {
    instance: {
      ...base,
      id: '4',
      nombreCurso: 'Marketing Digital',
      codigoCompleto: 'CEP-2026-FEB-010',
      tipo: 'teleformacion',
      plazasOcupadas: 30,
      plazasTotales: 30,
      porcentajeOcupacion: 100,
    },
  },
}

export const Desempleados: Story = {
  args: {
    instance: {
      ...base,
      id: '5',
      nombreCurso: 'Operador de Almacén y Logística',
      codigoCompleto: 'CEP-2026-ABR-005',
      tipo: 'desempleados',
      precio: 0,
      modalidad: 'presencial',
      plazasOcupadas: 8,
      plazasTotales: 20,
      porcentajeOcupacion: 40,
      subvencionado: 'total',
      entidadesFinanciadoras: [{ id: 'e3', nombre: 'SEPE' }],
    },
  },
}
