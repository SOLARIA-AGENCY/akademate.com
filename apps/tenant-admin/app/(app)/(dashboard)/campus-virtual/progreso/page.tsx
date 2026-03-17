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
import { traducirEstado } from '@payload-config/lib/estados'

// TODO: Fetch from API
const progressRows: { student: string; course: string; progress: string; status: string }[] = []

export default function CampusProgresoPage() {
  return (
    <div className="space-y-6" data-oid="fx9d5dk">
      <PageHeader
        title="Progreso Alumnos"
        description="Seguimiento de avance por alumno y curso."
        icon={BarChart3}
        badge={
          <Badge variant="outline" data-oid=".pul37q">
            Vista inicial
          </Badge>
        }
        data-oid="lyyqaoa"
      />

      <Card data-oid="j6dxr5_">
        <CardHeader data-oid="3svukd_">
          <CardTitle data-oid="bwvyub_">Avance por inscripción</CardTitle>
          <CardDescription data-oid="ywvk-4f">
            Datos iniciales para validación de UX y flujos LMS
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="1haknb8">
          <Table data-oid="vhiyvca">
            <TableHeader data-oid="7v0.4hk">
              <TableRow data-oid="2ge4od3">
                <TableHead data-oid="jptuqvb">Alumno</TableHead>
                <TableHead data-oid="el:3fz2">Curso</TableHead>
                <TableHead data-oid="kg5ajz6">Progreso</TableHead>
                <TableHead data-oid="ib.bpnw">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="pd2rte7">
              {progressRows.map((row) => (
                <TableRow key={`${row.student}-${row.course}`} data-oid="20qi.c.">
                  <TableCell data-oid="jsfou5h">{row.student}</TableCell>
                  <TableCell data-oid="l:0md4m">{row.course}</TableCell>
                  <TableCell data-oid="oz8wjer">{row.progress}</TableCell>
                  <TableCell data-oid="q.5_h6d">
                    <Badge variant={traducirEstado(row.status).variant} data-oid="k5hx--z">
                      {traducirEstado(row.status).label}
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
