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
import { BookOpen } from 'lucide-react'

const contentRows = [
  { course: 'React Inicial', modules: 8, lessons: 42, status: 'published' },
  { course: 'Node Backend', modules: 6, lessons: 31, status: 'published' },
  { course: 'Marketing Digital', modules: 5, lessons: 24, status: 'draft' },
]

export default function CampusContenidoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos y Lecciones"
        description="Estado de contenido estructurado por curso."
        icon={BookOpen}
        badge={<Badge variant="outline">Contenido LMS</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Inventario de contenido</CardTitle>
          <CardDescription>Resumen base de cursos, módulos y lecciones</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Lecciones</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentRows.map((row) => (
                <TableRow key={row.course}>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.modules}</TableCell>
                  <TableCell>{row.lessons}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'published' ? 'default' : 'secondary'}>
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
