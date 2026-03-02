'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { BookOpen, Search, Edit } from 'lucide-react'
import { traducirEstado } from '@payload-config/lib/estados'

const contentRows = [
  { course: 'React Inicial', modules: 8, lessons: 42, status: 'published' },
  { course: 'Node Backend', modules: 6, lessons: 31, status: 'published' },
  { course: 'Marketing Digital', modules: 5, lessons: 24, status: 'draft' },
]

export default function CampusContenidoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredRows = contentRows.filter((row) => {
    const matchNombre = row.course.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filterStatus === 'all' || row.status === filterStatus
    return matchNombre && matchEstado
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos y Lecciones"
        description="Estado de contenido estructurado por curso."
        icon={BookOpen}
        badge={<Badge variant="outline">Contenido LMS</Badge>}
      />

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por curso..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
            </select>
          </div>
        </CardContent>
      </Card>

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
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.course}>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.modules}</TableCell>
                  <TableCell>{row.lessons}</TableCell>
                  <TableCell>
                    <Badge variant={traducirEstado(row.status).variant}>
                      {traducirEstado(row.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar {row.course}</span>
                    </Button>
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
