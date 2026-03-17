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

const contentRows: { course: string; modules: number; lessons: number; status: string }[] = []

export default function CampusContenidoPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredRows = contentRows.filter((row) => {
    const matchNombre = row.course.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEstado = filterStatus === 'all' || row.status === filterStatus
    return matchNombre && matchEstado
  })

  return (
    <div className="space-y-6" data-oid="lhjov59">
      <PageHeader
        title="Módulos y Lecciones"
        description="Estado de contenido estructurado por curso."
        icon={BookOpen}
        badge={
          <Badge variant="outline" data-oid="4u49b3c">
            Contenido LMS
          </Badge>
        }
        data-oid="6tgz:2s"
      />

      <Card data-oid="2f92z5r">
        <CardContent className="pt-4" data-oid="gclp2q4">
          <div className="flex items-center gap-3" data-oid="y2tybzt">
            <div className="relative flex-1" data-oid="3t7.dfw">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                data-oid="ejro1bc"
              />
              <Input
                placeholder="Buscar por curso..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-oid="ji02vn:"
              />
            </div>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              data-oid="vzuzllx"
            >
              <option value="all" data-oid="72-0nzf">
                Todos los estados
              </option>
              <option value="published" data-oid="qgm0gnn">
                Publicado
              </option>
              <option value="draft" data-oid="ypmkbp6">
                Borrador
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="rhrr4jf">
        <CardHeader data-oid=":muskb7">
          <CardTitle data-oid="feiebkz">Inventario de contenido</CardTitle>
          <CardDescription data-oid="u:rmyne">
            Resumen base de cursos, módulos y lecciones
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="7hz0xx9">
          <Table data-oid="-m:-h7y">
            <TableHeader data-oid="y65fnx:">
              <TableRow data-oid="htfsops">
                <TableHead data-oid="456brj0">Curso</TableHead>
                <TableHead data-oid="laf0dhu">Módulos</TableHead>
                <TableHead data-oid="zfauq8b">Lecciones</TableHead>
                <TableHead data-oid="rvy0d50">Estado</TableHead>
                <TableHead className="text-right" data-oid="nz8u1q2">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="twpnwg:">
              {filteredRows.map((row) => (
                <TableRow key={row.course} data-oid="bcusjdr">
                  <TableCell data-oid="90m8v.y">{row.course}</TableCell>
                  <TableCell data-oid="8c:v7g0">{row.modules}</TableCell>
                  <TableCell data-oid="ik4qlej">{row.lessons}</TableCell>
                  <TableCell data-oid="wghx-pd">
                    <Badge variant={traducirEstado(row.status).variant} data-oid="3_02k5l">
                      {traducirEstado(row.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" data-oid="zwfz.:a">
                    <Button variant="ghost" size="icon" data-oid="cxmmcps">
                      <Edit className="h-4 w-4" data-oid="g5l2gwk" />
                      <span className="sr-only" data-oid="j-_z_jm">
                        Editar {row.course}
                      </span>
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
