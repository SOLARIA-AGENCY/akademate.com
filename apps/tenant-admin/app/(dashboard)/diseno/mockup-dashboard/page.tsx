'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Progress } from '@payload-config/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { CalendarDays, GraduationCap, Users, BookOpen, ArrowUpRight, Layers3, CalendarClock, CalendarRange, CalendarCheck2 } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

const kpiCards = [
  { title: 'Alumnos Activos', value: '1.284', delta: '+8.2%', icon: Users },
  { title: 'Cursos Activos', value: '42', delta: '+3', icon: BookOpen },
  { title: 'Convocatorias', value: '19', delta: '+2', icon: CalendarDays },
  { title: 'Certificados', value: '367', delta: '+11%', icon: GraduationCap },
]

const funnelData = [
  { etapa: 'Leads', total: 420 },
  { etapa: 'Inscritos', total: 238 },
  { etapa: 'Activos', total: 191 },
  { etapa: 'Finalizados', total: 129 },
]

const enrollmentRows = [
  { alumno: 'Laura Díaz', curso: 'Marketing Digital', estado: 'active', progreso: 72 },
  { alumno: 'Hugo Martín', curso: 'Diseño UX', estado: 'active', progreso: 61 },
  { alumno: 'Elena Ruiz', curso: 'FP Comercio', estado: 'pending', progreso: 14 },
  { alumno: 'Daniel López', curso: 'Data Analytics', estado: 'completed', progreso: 100 },
]

const dayAgenda = [
  { hour: '08:00', label: 'Inicio Aula 2 · FP Comercio' },
  { hour: '10:00', label: 'Clase Marketing · Aula 4' },
  { hour: '12:00', label: 'Tutoría online · Campus' },
  { hour: '16:00', label: 'Refuerzo analítica · Lab 1' },
]

function statusVariant(status: string): 'secondary' | 'outline' | 'default' {
  if (status === 'active') return 'secondary'
  if (status === 'completed') return 'default'
  return 'outline'
}

function statusLabel(status: string): string {
  if (status === 'active') return 'Activo'
  if (status === 'completed') return 'Completado'
  return 'Pendiente'
}

export default function ClientDashboardMockupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mockup Dashboard Cliente v2"
        description="Propuesta visual basada en componentes shadcn para optimizar jerarquía, densidad y lectura"
        icon={Layers3}
        badge={<Badge>PROTOTIPO</Badge>}
        actions={
          <>
            <Button variant="outline">Comparar con actual</Button>
            <Button>
              Aplicar patrón
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">Variación mensual: {kpi.delta}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Embudo Comercial-Académico</CardTitle>
            <CardDescription>Conversión de leads a alumnos finalizados</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="etapa" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objetivos del Mes</CardTitle>
            <CardDescription>Seguimiento operativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Nuevas matrículas</span>
                <span className="font-medium">74%</span>
              </div>
              <Progress value={74} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Retención alumnos</span>
                <span className="font-medium">83%</span>
              </div>
              <Progress value={83} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Publicación contenidos</span>
                <span className="font-medium">58%</span>
              </div>
              <Progress value={58} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inscripciones recientes</CardTitle>
              <CardDescription>Últimos movimientos de campus virtual</CardDescription>
            </div>
            <Button variant="outline" size="sm">Ver todas</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Progreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollmentRows.map((row) => (
                  <TableRow key={`${row.alumno}-${row.curso}`}>
                    <TableCell className="font-medium">{row.alumno}</TableCell>
                    <TableCell>{row.curso}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.estado)}>{statusLabel(row.estado)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.progreso}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Flujos más usados por equipos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start">Nueva convocatoria</Button>
            <Button variant="outline" className="w-full justify-start">Alta de alumno</Button>
            <Button variant="outline" className="w-full justify-start">Asignar profesor</Button>
            <Button variant="outline" className="w-full justify-start">Crear campaña</Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Planner Académico Unificado</CardTitle>
            <CardDescription>Patrones de calendario diario, semanal, mensual y anual para operación de sedes y campus.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="semanal" className="space-y-4">
              <TabsList className="h-auto flex flex-wrap">
                <TabsTrigger value="diario"><CalendarClock className="mr-2 h-4 w-4" />Diario</TabsTrigger>
                <TabsTrigger value="semanal"><CalendarRange className="mr-2 h-4 w-4" />Semanal</TabsTrigger>
                <TabsTrigger value="mensual"><CalendarCheck2 className="mr-2 h-4 w-4" />Mensual</TabsTrigger>
                <TabsTrigger value="anual">Anual</TabsTrigger>
              </TabsList>

              <TabsContent value="diario">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {dayAgenda.map((entry) => (
                    <div key={entry.hour} className="rounded-md border p-3">
                      <p className="font-mono text-xs text-muted-foreground">{entry.hour}</p>
                      <p className="mt-1 text-sm font-medium">{entry.label}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="semanal">
                <div className="grid gap-2 sm:grid-cols-5">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, index) => (
                    <div key={day} className="rounded-md border p-3">
                      <p className="text-sm font-semibold">{day}</p>
                      <p className="text-xs text-muted-foreground mt-1">{18 + index * 3}h asignadas</p>
                      <Progress className="mt-2" value={58 + index * 8} />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="mensual">
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <div key={d} className="rounded border bg-muted/40 py-1 text-center font-medium">{d}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded border p-1 text-right ${[4, 9, 16, 23, 29].includes(i) ? 'bg-primary/15 border-primary/30' : 'bg-background'}`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="anual">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                    <div key={quarter} className="rounded-md border p-3">
                      <p className="text-sm font-semibold">{quarter}</p>
                      <p className="text-xs text-muted-foreground mt-1">Planificación trimestral de campus</p>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {['M1', 'M2', 'M3'].map((m) => (
                          <div key={`${quarter}-${m}`} className="rounded bg-muted px-2 py-1 text-[11px] text-center">{m}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
