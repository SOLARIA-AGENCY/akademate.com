import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'

const progressRows = [
  { student: 'Ana Pérez', course: 'React Inicial', progress: '82%', status: 'active' },
  { student: 'Luis Martín', course: 'Node Backend', progress: '67%', status: 'active' },
  { student: 'Nora Ramos', course: 'Marketing Digital', progress: '100%', status: 'completed' },
]

export default function CampusProgresoPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Progreso Alumnos</h1>
          <Badge variant="outline">Vista inicial</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Seguimiento de avance por alumno y curso.
        </p>
      </header>

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
