import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Badge } from '@payload-config/components/ui/badge'
import { Progress } from '@payload-config/components/ui/progress'
import { Button } from '@payload-config/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

const meta = {
  title: 'Akademate/CourseTable',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const courses = [
  {
    id: '1',
    nombre: 'React Avanzado con Next.js',
    modalidad: 'Online',
    sede: 'Madrid Centro',
    estado: 'activo',
    progreso: 68,
    alumnos: '24/30',
  },
  {
    id: '2',
    nombre: 'Marketing Digital y Analítica',
    modalidad: 'Presencial',
    sede: 'Barcelona',
    estado: 'activo',
    progreso: 45,
    alumnos: '18/25',
  },
  {
    id: '3',
    nombre: 'Gestión de Equipos y Liderazgo',
    modalidad: 'Híbrido',
    sede: 'Sevilla',
    estado: 'borrador',
    progreso: 0,
    alumnos: '0/20',
  },
  {
    id: '4',
    nombre: 'Diseño UX/UI con Figma',
    modalidad: 'Online',
    sede: 'Valencia',
    estado: 'activo',
    progreso: 100,
    alumnos: '20/20',
  },
  {
    id: '5',
    nombre: 'Inglés para Negocios B2',
    modalidad: 'Presencial',
    sede: 'Madrid Norte',
    estado: 'archivado',
    progreso: 100,
    alumnos: '15/15',
  },
]

const estadoVariant: Record<string, 'success' | 'secondary' | 'neutral'> = {
  activo: 'success',
  borrador: 'secondary',
  archivado: 'neutral',
}

const estadoLabel: Record<string, string> = {
  activo: 'Activo',
  borrador: 'Borrador',
  archivado: 'Archivado',
}

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Curso</TableHead>
          <TableHead>Modalidad</TableHead>
          <TableHead>Sede</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Progreso</TableHead>
          <TableHead>Alumnos</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-medium">{course.nombre}</TableCell>
            <TableCell>{course.modalidad}</TableCell>
            <TableCell>{course.sede}</TableCell>
            <TableCell>
              <Badge variant={estadoVariant[course.estado]}>
                {estadoLabel[course.estado]}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 min-w-24">
                <Progress value={course.progreso} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {course.progreso}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{course.alumnos}</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
