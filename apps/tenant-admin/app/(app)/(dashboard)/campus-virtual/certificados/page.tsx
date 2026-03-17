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
import { Award } from 'lucide-react'

const certificateRows = [
  {
    id: 'CERT-001',
    student: 'Nora Ramos',
    course: 'Marketing Digital',
    issuedAt: '2026-02-12',
    status: 'issued',
  },
  {
    id: 'CERT-002',
    student: 'Carlos Vega',
    course: 'React Inicial',
    issuedAt: '2026-02-09',
    status: 'issued',
  },
  {
    id: 'CERT-003',
    student: 'Ana Pérez',
    course: 'Node Backend',
    issuedAt: '2026-02-20',
    status: 'pending',
  },
]

export default function CampusCertificadosPage() {
  return (
    <div className="space-y-6" data-oid="c2ok:6_">
      <PageHeader
        title="Certificados"
        description="Seguimiento de certificados emitidos en el tenant."
        icon={Award}
        badge={
          <Badge variant="outline" data-oid="_1v315f">
            Certificación
          </Badge>
        }
        data-oid="8__4t5n"
      />

      <Card data-oid="-atmyp1">
        <CardHeader data-oid="tc3j39y">
          <CardTitle data-oid="r5vtgey">Emisión de certificados</CardTitle>
          <CardDescription data-oid="up4dep1">Control de expediciones recientes</CardDescription>
        </CardHeader>
        <CardContent data-oid="chzd8v2">
          <Table data-oid="7:nc4ua">
            <TableHeader data-oid="c0pxsrp">
              <TableRow data-oid="cu-ug31">
                <TableHead data-oid="f-9mv3u">ID</TableHead>
                <TableHead data-oid="z72k2ca">Alumno</TableHead>
                <TableHead data-oid="tfq03ij">Curso</TableHead>
                <TableHead data-oid="2dx-q54">Fecha</TableHead>
                <TableHead data-oid="d-ro.ia">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="zqwp42a">
              {certificateRows.map((row) => (
                <TableRow key={row.id} data-oid="5kdt94k">
                  <TableCell data-oid="8y8hffk">{row.id}</TableCell>
                  <TableCell data-oid="xpfvh3t">{row.student}</TableCell>
                  <TableCell data-oid="-3a3aep">{row.course}</TableCell>
                  <TableCell data-oid="1f3opc8">
                    {new Date(row.issuedAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell data-oid="3kn.2cz">
                    <Badge
                      variant={row.status === 'issued' ? 'default' : 'secondary'}
                      data-oid="h01q3a8"
                    >
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
