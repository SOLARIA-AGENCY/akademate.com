'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { BarChart3 } from 'lucide-react'

const progressRows = [
  { student: 'Ana Pérez', course: 'React Inicial', progress: '82%', status: 'active' },
  { student: 'Luis Martín', course: 'Node Backend', progress: '67%', status: 'active' },
  { student: 'Nora Ramos', course: 'Marketing Digital', progress: '100%', status: 'completed' },
]

export default function CampusProgresoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Progreso Alumnos"
        description="Seguimiento de avance por alumno y curso."
        icon={BarChart3}
        badge={<Badge variant="outline">Vista inicial</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Avance por inscripción</CardTitle>
          <CardDescription>Datos iniciales para validación de UX y flujos LMS</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressRows.map((row) => (
                <TableRow key={`${row.student}-${row.course}`}>
                  <TableCell>{row.student}</TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.progress}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'completed' ? 'secondary' : 'default'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
