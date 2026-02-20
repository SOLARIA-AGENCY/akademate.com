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
  { id: 'CERT-001', student: 'Nora Ramos', course: 'Marketing Digital', issuedAt: '2026-02-12', status: 'issued' },
  { id: 'CERT-002', student: 'Carlos Vega', course: 'React Inicial', issuedAt: '2026-02-09', status: 'issued' },
  { id: 'CERT-003', student: 'Ana Pérez', course: 'Node Backend', issuedAt: '2026-02-20', status: 'pending' },
]

export default function CampusCertificadosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificados"
        description="Seguimiento de certificados emitidos en el tenant."
        icon={Award}
        badge={<Badge variant="outline">Certificación</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Emisión de certificados</CardTitle>
          <CardDescription>Control de expediciones recientes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificateRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.student}</TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{new Date(row.issuedAt).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'issued' ? 'default' : 'secondary'}>
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
