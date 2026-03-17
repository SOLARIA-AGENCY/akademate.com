'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
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
import {
  CalendarDays,
  GraduationCap,
  Users,
  BookOpen,
  ArrowUpRight,
  Layers3,
  CalendarClock,
  CalendarRange,
  CalendarCheck2,
} from 'lucide-react'
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
    <div className="space-y-6" data-oid="awr.:7b">
      <PageHeader
        title="Mockup Dashboard Cliente v2"
        description="Propuesta visual basada en componentes shadcn para optimizar jerarquía, densidad y lectura"
        icon={Layers3}
        badge={<Badge data-oid="0lohh6v">PROTOTIPO</Badge>}
        actions={
          <>
            <Button variant="outline" data-oid="vd3a:fx">
              Comparar con actual
            </Button>
            <Button data-oid="f.8299l">
              Aplicar patrón
              <ArrowUpRight className="ml-2 h-4 w-4" data-oid="gcid0ox" />
            </Button>
          </>
        }
        data-oid="zpadmx6"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-oid="azfzzlv">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} data-oid="cac71ho">
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid="ilycyzj"
              >
                <CardTitle className="text-sm font-medium" data-oid="dv06t22">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" data-oid=":20rkfr" />
              </CardHeader>
              <CardContent data-oid="xss:dlh">
                <div className="text-2xl font-bold" data-oid="j_8t33z">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground" data-oid="v6s4bqr">
                  Variación mensual: {kpi.delta}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-3" data-oid="498ztd3">
        <Card className="xl:col-span-2" data-oid="d4lqg9k">
          <CardHeader data-oid="afz5bm6">
            <CardTitle data-oid="n3s1ddl">Embudo Comercial-Académico</CardTitle>
            <CardDescription data-oid="q22gbhf">
              Conversión de leads a alumnos finalizados
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80" data-oid="bd.smj3">
            <ResponsiveContainer width="100%" height="100%" data-oid="7vamcun">
              <BarChart data={funnelData} data-oid="4mvlwvw">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" data-oid="m5hak5h" />
                <XAxis dataKey="etapa" data-oid="fc7jflo" />
                <YAxis data-oid="y5p.ck1" />
                <Tooltip data-oid="qtuqa-." />
                <Bar
                  dataKey="total"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                  data-oid="82pkh7l"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-oid="q4mg5ur">
          <CardHeader data-oid="cn6:tu5">
            <CardTitle data-oid="3h2o2rs">Objetivos del Mes</CardTitle>
            <CardDescription data-oid="qa0_aks">Seguimiento operativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="yt0ga0p">
            <div className="space-y-2" data-oid="ne9_1lg">
              <div className="flex items-center justify-between text-sm" data-oid="sjqiz2c">
                <span data-oid="urws.ne">Nuevas matrículas</span>
                <span className="font-medium" data-oid="t_zmif3">
                  74%
                </span>
              </div>
              <Progress value={74} data-oid="lw1l:km" />
            </div>
            <div className="space-y-2" data-oid="vb.8p6o">
              <div className="flex items-center justify-between text-sm" data-oid="ohk3__y">
                <span data-oid=".uz55pm">Retención alumnos</span>
                <span className="font-medium" data-oid=".362e8k">
                  83%
                </span>
              </div>
              <Progress value={83} data-oid="yfo0kbg" />
            </div>
            <div className="space-y-2" data-oid="-kmzhhk">
              <div className="flex items-center justify-between text-sm" data-oid="qhg7zme">
                <span data-oid="3jqnyku">Publicación contenidos</span>
                <span className="font-medium" data-oid="td3_6yh">
                  58%
                </span>
              </div>
              <Progress value={58} data-oid="97oa.rd" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3" data-oid="-8kj3q5">
        <Card className="xl:col-span-2" data-oid="gnoikv_">
          <CardHeader className="flex flex-row items-center justify-between" data-oid="iicrjfz">
            <div data-oid="7x:v0i2">
              <CardTitle data-oid="vsvabia">Inscripciones recientes</CardTitle>
              <CardDescription data-oid="ul0vybk">
                Últimos movimientos de campus virtual
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" data-oid="ya8z8dk">
              Ver todas
            </Button>
          </CardHeader>
          <CardContent data-oid="rjhorwz">
            <Table data-oid="yb0i3zq">
              <TableHeader data-oid="qsx-9cd">
                <TableRow data-oid="mmxfkr6">
                  <TableHead data-oid="an6mfgz">Alumno</TableHead>
                  <TableHead data-oid="tagu3:g">Curso</TableHead>
                  <TableHead data-oid="ouljqu_">Estado</TableHead>
                  <TableHead className="text-right" data-oid="8m7.65k">
                    Progreso
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-oid=".:l18z.">
                {enrollmentRows.map((row) => (
                  <TableRow key={`${row.alumno}-${row.curso}`} data-oid="316iftl">
                    <TableCell className="font-medium" data-oid="sklsqc8">
                      {row.alumno}
                    </TableCell>
                    <TableCell data-oid="xwgydu7">{row.curso}</TableCell>
                    <TableCell data-oid="la.84wj">
                      <Badge variant={statusVariant(row.estado)} data-oid=".6qs5p.">
                        {statusLabel(row.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" data-oid="eef3-q:">
                      {row.progreso}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-oid="6b6vn-t">
          <CardHeader data-oid="-w9ds.t">
            <CardTitle data-oid="_43dy_u">Acciones Rápidas</CardTitle>
            <CardDescription data-oid="hhuoboo">Flujos más usados por equipos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2" data-oid="d.ged1u">
            <Button className="w-full justify-start" data-oid="fitll:j">
              Nueva convocatoria
            </Button>
            <Button variant="outline" className="w-full justify-start" data-oid="kahzkp8">
              Alta de alumno
            </Button>
            <Button variant="outline" className="w-full justify-start" data-oid="_e-_u1n">
              Asignar profesor
            </Button>
            <Button variant="outline" className="w-full justify-start" data-oid=":81xe:-">
              Crear campaña
            </Button>
          </CardContent>
        </Card>
      </section>

      <section data-oid="0wf:l89">
        <Card data-oid="p6icx71">
          <CardHeader data-oid="4-whq8s">
            <CardTitle data-oid="mizcdij">Planner Académico Unificado</CardTitle>
            <CardDescription data-oid="pw6c0h0">
              Patrones de calendario diario, semanal, mensual y anual para operación de sedes y
              campus.
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="2z3awjc">
            <Tabs defaultValue="semanal" className="space-y-4" data-oid="cs82dw5">
              <TabsList className="h-auto flex flex-wrap" data-oid=":w9l9h.">
                <TabsTrigger value="diario" data-oid=".usm-i5">
                  <CalendarClock className="mr-2 h-4 w-4" data-oid="u.lf-q0" />
                  Diario
                </TabsTrigger>
                <TabsTrigger value="semanal" data-oid="bc9617:">
                  <CalendarRange className="mr-2 h-4 w-4" data-oid="wvp9ddu" />
                  Semanal
                </TabsTrigger>
                <TabsTrigger value="mensual" data-oid="plcdcov">
                  <CalendarCheck2 className="mr-2 h-4 w-4" data-oid=".6t3z64" />
                  Mensual
                </TabsTrigger>
                <TabsTrigger value="anual" data-oid="sp:059a">
                  Anual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="diario" data-oid="wc02lv7">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-oid="svz202s">
                  {dayAgenda.map((entry) => (
                    <div key={entry.hour} className="rounded-md border p-3" data-oid="pvq:-pd">
                      <p className="font-mono text-xs text-muted-foreground" data-oid="zv0zxdq">
                        {entry.hour}
                      </p>
                      <p className="mt-1 text-sm font-medium" data-oid="zs7ca32">
                        {entry.label}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="semanal" data-oid="o5yu11t">
                <div className="grid gap-2 sm:grid-cols-5" data-oid="ifc6wwo">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day, index) => (
                    <div key={day} className="rounded-md border p-3" data-oid="72mfg5n">
                      <p className="text-sm font-semibold" data-oid="n-bms82">
                        {day}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-oid="gmffx9u">
                        {18 + index * 3}h asignadas
                      </p>
                      <Progress className="mt-2" value={58 + index * 8} data-oid="a3kg6-k" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="mensual" data-oid="p.:o:pn">
                <div className="grid grid-cols-7 gap-2 text-xs" data-oid="n623o6.">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                    <div
                      key={d}
                      className="rounded border bg-muted/40 py-1 text-center font-medium"
                      data-oid="egoqew2"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded border p-1 text-right ${[4, 9, 16, 23, 29].includes(i) ? 'bg-primary/15 border-primary/30' : 'bg-background'}`}
                      data-oid="kv_ire5"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="anual" data-oid="aa8jxhz">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-oid="8he2ipa">
                  {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
                    <div key={quarter} className="rounded-md border p-3" data-oid="d_omcsh">
                      <p className="text-sm font-semibold" data-oid="o9u7901">
                        {quarter}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-oid="h:o.vga">
                        Planificación trimestral de campus
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1.5" data-oid="2eafyno">
                        {['M1', 'M2', 'M3'].map((m) => (
                          <div
                            key={`${quarter}-${m}`}
                            className="rounded bg-muted px-2 py-1 text-[11px] text-center"
                            data-oid="2ixcb-a"
                          >
                            {m}
                          </div>
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
