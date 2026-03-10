import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Badge } from '@payload-config/components/ui/badge'

const meta = {
  title: 'Foundations/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const cursos = [
  {
    codigo: 'DWF-2026-01',
    nombre: 'Desarrollo Web Full-Stack',
    alumnos: 24,
    inicio: '03/02/2026',
    estado: 'Activo' as const,
  },
  {
    codigo: 'MKD-2026-01',
    nombre: 'Marketing Digital',
    alumnos: 18,
    inicio: '10/02/2026',
    estado: 'Activo' as const,
  },
  {
    codigo: 'UXD-2025-03',
    nombre: 'Diseño UX/UI',
    alumnos: 15,
    inicio: '15/11/2025',
    estado: 'Finalizado' as const,
  },
  {
    codigo: 'PDS-2026-01',
    nombre: 'Python Data Science',
    alumnos: 0,
    inicio: '01/04/2026',
    estado: 'Planificado' as const,
  },
]

const estadoVariant: Record<string, 'success' | 'default' | 'info' | 'secondary'> = {
  Activo: 'success',
  Finalizado: 'default',
  Planificado: 'info',
  Borrador: 'secondary',
}

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Listado de cursos del período 2025–2026</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nombre del curso</TableHead>
          <TableHead className="text-right">Alumnos</TableHead>
          <TableHead>Inicio</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cursos.map((curso) => (
          <TableRow key={curso.codigo}>
            <TableCell className="font-mono text-xs">{curso.codigo}</TableCell>
            <TableCell className="font-medium">{curso.nombre}</TableCell>
            <TableCell className="text-right">{curso.alumnos}</TableCell>
            <TableCell className="text-muted-foreground">{curso.inicio}</TableCell>
            <TableCell>
              <Badge variant={estadoVariant[curso.estado] ?? 'secondary'}>{curso.estado}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const Simple: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Alumno</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Asistencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { nombre: 'Ana Martínez López', email: 'ana.martinez@email.com', asistencia: '92%' },
          { nombre: 'Carlos Ruiz García', email: 'carlos.ruiz@email.com', asistencia: '78%' },
          { nombre: 'María González Vega', email: 'maria.gv@email.com', asistencia: '100%' },
        ].map((alumno) => (
          <TableRow key={alumno.email}>
            <TableCell className="font-medium">{alumno.nombre}</TableCell>
            <TableCell className="text-muted-foreground">{alumno.email}</TableCell>
            <TableCell className="text-right">{alumno.asistencia}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
