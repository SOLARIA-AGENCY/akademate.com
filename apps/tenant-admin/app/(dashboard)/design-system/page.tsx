'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@payload-config/components/ui/toggle-group'
import { Switch } from '@payload-config/components/ui/switch'
import { Progress } from '@payload-config/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@payload-config/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@payload-config/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@payload-config/components/ui/accordion'
import { Separator } from '@payload-config/components/ui/separator'
import {
  Sparkles,
  Rocket,
  ShieldAlert,
  CircleCheck,
  Palette,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  ArrowUpRight,
  LayoutDashboard,
  Building2,
  Clock3,
  CalendarClock,
  CalendarRange,
  CalendarCheck2,
  PanelsTopLeft,
  KanbanSquare,
  MessageSquare,
  Files,
} from 'lucide-react'

interface ColorToken {
  label: string
  varName: string
  usage: string
}

const coreColors: ColorToken[] = [
  { label: 'Background', varName: '--background', usage: 'Base de app' },
  { label: 'Foreground', varName: '--foreground', usage: 'Texto principal' },
  { label: 'Card', varName: '--card', usage: 'Superficies' },
  { label: 'Primary', varName: '--primary', usage: 'CTA y estados brand' },
  { label: 'Secondary', varName: '--secondary', usage: 'Acciones secundarias' },
  { label: 'Muted', varName: '--muted', usage: 'Bloques neutros' },
  { label: 'Accent', varName: '--accent', usage: 'Resaltado contextual' },
  { label: 'Destructive', varName: '--destructive', usage: 'Errores críticos' },
  { label: 'Border', varName: '--border', usage: 'Contornos y divisores' },
  { label: 'Ring', varName: '--ring', usage: 'Focus visible' },
]

const sidebarColors: ColorToken[] = [
  { label: 'Sidebar', varName: '--sidebar', usage: 'Fondo lateral' },
  { label: 'Sidebar FG', varName: '--sidebar-foreground', usage: 'Texto lateral' },
  { label: 'Sidebar Primary', varName: '--sidebar-primary', usage: 'Activos principales' },
  { label: 'Sidebar Accent', varName: '--sidebar-accent', usage: 'Hover y subitems' },
  { label: 'Sidebar Border', varName: '--sidebar-border', usage: 'Divisiones internas' },
]

const courseMetrics = [
  { label: 'Total cursos', value: '42', icon: BookOpen },
  { label: 'Convocatorias', value: '19', icon: Calendar },
  { label: 'Alumnos activos', value: '1.284', icon: Users },
  { label: 'Certificados', value: '367', icon: GraduationCap },
]

const courseRows = [
  { curso: 'Marketing Digital', modalidad: 'Presencial', sede: 'CEP Norte', estado: 'Abierta', progreso: 72 },
  { curso: 'UX/UI Intensivo', modalidad: 'Teleformación', sede: 'CEP Sur', estado: 'Activa', progreso: 61 },
  { curso: 'Comercio Internacional', modalidad: 'Mixta', sede: 'CEP Santa Cruz', estado: 'Planificada', progreso: 18 },
  { curso: 'Data Analytics', modalidad: 'Presencial', sede: 'CEP Norte', estado: 'Finalizada', progreso: 100 },
]

const spacingScale = [
  { token: 'space-y-2', px: '8px', usage: 'Controles compactos' },
  { token: 'space-y-4', px: '16px', usage: 'Bloques internos de card' },
  { token: 'space-y-6', px: '24px', usage: 'Secciones de página' },
  { token: 'gap-3', px: '12px', usage: 'Filas de acciones y filtros' },
  { token: 'p-4', px: '16px', usage: 'Padding card base' },
  { token: 'p-6', px: '24px', usage: 'Cards complejas / tablas' },
]

const shadowRecipes = [
  { level: 'Elevation A1', alpha: '5%', value: '0 0 0 1px, 0 1px 1px 0, 0 2px 2px 0' },
  { level: 'Elevation A2', alpha: '5%', value: '0 4px 4px 0, 0 8px 8px 0, 0 16px 16px 0' },
  { level: 'Elevation B1', alpha: '6%', value: '0 0 0 1px, 0 1px 1px -0.5px, 0 3px 3px -1.5px' },
  { level: 'Elevation B2', alpha: '6%', value: '0 6px 6px -3px, 0 12px 12px -6px, 0 24px 24px -12px' },
]

const neutralScaleLight = ['#FFFFFF', '#FAFAFA', '#F5F5F5', '#E5E5E5', '#D4D4D4', '#A3A3A3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0A0A0A']
const neutralScaleDark = ['#000000', '#0A0A0A', '#171717', '#262626', '#373737', '#525252', '#8A8A8A', '#A3A3A3', '#D4D4D4', '#E5E5E5', '#F5F5F5', '#FAFAFA']

const sidebarSpacingSpec = [
  { area: 'Header brand', value: '44px' },
  { area: 'Header → search', value: '16px' },
  { area: 'Navigation row', value: '40px' },
  { area: 'Item gap', value: '4px' },
  { area: 'Sidebar expanded', value: '240px' },
  { area: 'Sidebar collapsed', value: '80px' },
  { area: 'User row footer', value: '48px' },
]

const appGridSpec = [
  { token: 'Desktop frame', value: '1440x1024' },
  { token: 'Top bar height', value: '80px' },
  { token: 'Nav width', value: '240px' },
  { token: 'Content columns', value: '8 columns' },
  { token: 'Column width', value: '130px' },
  { token: 'Gutter', value: '16px' },
  { token: 'Outer margin', value: '24px' },
]

const stepperPatterns = [
  { name: 'Segmented', desc: 'Pasos conectados tipo tabs para formularios largos.' },
  { name: 'Icon Progress', desc: 'Iconos por paso con línea de progreso activa.' },
  { name: 'Numbered Line', desc: 'Numeración explícita con subrayado por etapa.' },
  { name: 'Status Timeline', desc: 'Estado por paso: Completed, In Progress, Pending.' },
  { name: 'Minimal Dot', desc: 'Versión compacta para modales y flujos cortos.' },
]

const dailySlots = [
  { time: '08:00', room: 'Aula 2', subject: 'FP Comercio', teacher: 'M. Suárez' },
  { time: '10:00', room: 'Aula 4', subject: 'Marketing Digital', teacher: 'L. Martín' },
  { time: '12:00', room: 'Lab 1', subject: 'Data Analytics', teacher: 'R. Ortega' },
  { time: '16:00', room: 'Online', subject: 'Tutoría Campus', teacher: 'A. Pérez' },
]

const weekLoad = [
  { day: 'Lun', hours: 22 },
  { day: 'Mar', hours: 28 },
  { day: 'Mié', hours: 25 },
  { day: 'Jue', hours: 31 },
  { day: 'Vie', hours: 19 },
]

const academateTemplates = [
  { name: 'Calendar Suite', icon: CalendarRange, description: 'Vistas diario, semanal, mensual y anual con panel lateral de eventos.' },
  { name: 'Leads Dashboard', icon: PanelsTopLeft, description: 'Filtros + tabla + charts de evolución comercial por estado.' },
  { name: 'Task Board', icon: KanbanSquare, description: 'Gestión por columnas para operaciones, onboarding y incidencias.' },
  { name: 'Chat Workspace', icon: MessageSquare, description: 'Canales internos de coordinación académica y soporte.' },
  { name: 'Files Hub', icon: Files, description: 'Repositorio de documentos, plantillas y materiales por curso.' },
]

function ColorSwatch({ token }: { token: ColorToken }) {
  return (
    <div className="rounded-lg border p-3">
      <div
        className="h-12 w-full rounded-md border"
        style={{ backgroundColor: `hsl(var(${token.varName}))` }}
      />
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-semibold">{token.label}</p>
        <p className="text-xs text-muted-foreground font-mono">{token.varName}</p>
        <p className="text-xs text-muted-foreground">{token.usage}</p>
      </div>
    </div>
  )
}

function CourseStatusBadge({ status }: { status: string }) {
  const variant = status === 'Finalizada' ? 'default' : status === 'Planificada' ? 'outline' : 'secondary'
  return <Badge variant={variant}>{status}</Badge>
}

export default function DesignSystemPage() {
  const [progress, setProgress] = useState(68)
  const [density, setDensity] = useState<'compacta' | 'regular' | 'amplia'>('regular')

  const densityClass = useMemo(() => {
    if (density === 'compacta') return 'space-y-3'
    if (density === 'amplia') return 'space-y-8'
    return 'space-y-6'
  }, [density])

  return (
    <div className={densityClass}>
      <PageHeader
        title="Design System Completo"
        description="Fundaciones visuales, tipografías, colores, cursos, listados y patrones reutilizables para todo el tenant dashboard"
        icon={Palette}
        badge={<Badge variant="secondary">UI FOUNDATION</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Select value={density} onValueChange={(value: 'compacta' | 'regular' | 'amplia') => setDensity(value)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compacta">Densidad compacta</SelectItem>
                <SelectItem value="regular">Densidad regular</SelectItem>
                <SelectItem value="amplia">Densidad amplia</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setProgress((v) => (v >= 100 ? 34 : v + 11))}>
              Simular progreso
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="foundations" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="foundations">Foundations</TabsTrigger>
          <TabsTrigger value="image-specs">Image Specs</TabsTrigger>
          <TabsTrigger value="typography">Tipografía</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="scheduling">Calendarios</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="patterns">Patrones</TabsTrigger>
        </TabsList>

        <TabsContent value="foundations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paleta Core</CardTitle>
              <CardDescription>Tokens oficiales para UI general</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {coreColors.map((token) => (
                <ColorSwatch key={token.varName} token={token} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paleta Sidebar</CardTitle>
              <CardDescription>Tokens específicos del shell lateral</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {sidebarColors.map((token) => (
                <ColorSwatch key={token.varName} token={token} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escala de espaciado y radio</CardTitle>
              <CardDescription>Ritmo visual recomendado para páginas y módulos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Uso recomendado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spacingScale.map((row) => (
                    <TableRow key={row.token}>
                      <TableCell className="font-mono text-xs">{row.token}</TableCell>
                      <TableCell>{row.px}</TableCell>
                      <TableCell>{row.usage}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-mono text-xs">--radius</TableCell>
                    <TableCell>8px</TableCell>
                    <TableCell>Radio estándar de card/botón/input</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image-specs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shadows / Elevation Stack</CardTitle>
              <CardDescription>Recetas extraídas de referencias visuales para cards, popovers y overlays.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Alpha</TableHead>
                    <TableHead>Box-shadow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shadowRecipes.map((item) => (
                    <TableRow key={item.level}>
                      <TableCell className="font-medium">{item.level}</TableCell>
                      <TableCell>{item.alpha}</TableCell>
                      <TableCell className="font-mono text-xs">{item.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Neutral Scale (AAA-ready)</CardTitle>
              <CardDescription>Escala neutral light/dark para fondo, borde y tipografía.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Light</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {neutralScaleLight.map((hex) => (
                    <div key={`light-${hex}`} className="rounded-md border p-2">
                      <div className="h-8 rounded border" style={{ backgroundColor: hex }} />
                      <p className="mt-1 text-[10px] font-mono">{hex}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Dark</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {neutralScaleDark.map((hex) => (
                    <div key={`dark-${hex}`} className="rounded-md border p-2">
                      <div className="h-8 rounded border" style={{ backgroundColor: hex }} />
                      <p className="mt-1 text-[10px] font-mono">{hex}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Desktop App Grid Spec</CardTitle>
                <CardDescription>Regla base de layout para shell de dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {appGridSpec.map((row) => (
                  <div key={row.token} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{row.token}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sidebar Spacing Spec</CardTitle>
                <CardDescription>Métricas para expanded/collapsed y ritmo de navegación.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sidebarSpacingSpec.map((row) => (
                  <div key={row.area} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{row.area}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Typography Hierarchy (Card Pattern)</CardTitle>
                <CardDescription>Escala recomendada para legibilidad y escaneo visual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="text-2xl font-semibold">Headline 24px</p>
                  <p className="text-base">Subheadline 16px</p>
                  <p className="text-sm text-muted-foreground">Body 14px: texto de apoyo y contexto.</p>
                  <div className="flex gap-2">
                    <Button size="sm">Label 16px</Button>
                    <Button size="sm" variant="outline">Secundario</Button>
                  </div>
                </div>
                <Alert>
                  <CircleCheck className="h-4 w-4" />
                  <AlertTitle>Regla</AlertTitle>
                  <AlertDescription>Evitar mezclar escalas sin jerarquía (ej. botón mayor que subtítulo).</AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stepper Patterns</CardTitle>
                <CardDescription>5 variantes para onboarding, checkout y asistentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stepperPatterns.map((pattern, idx) => (
                  <div key={pattern.name} className="rounded border p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <p className="font-medium">{pattern.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{pattern.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pricing + Budget Component Patterns</CardTitle>
              <CardDescription>Patrones para monetización y KPIs financieros.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-xl border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">Business</p>
                    <p className="text-sm text-muted-foreground">Billed yearly</p>
                  </div>
                  <Badge>POPULAR</Badge>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>• Real-Time Market Data</li>
                  <li>• Advanced Charting Tools</li>
                  <li>• On-Chain Analysis</li>
                  <li>• API Access</li>
                </ul>
                <div>
                  <p className="text-2xl font-bold">$29</p>
                  <p className="text-sm text-muted-foreground">per user / month</p>
                </div>
                <Button className="w-full">Upgrade to Business</Button>
              </article>

              <article className="rounded-xl border p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Budget</p>
                    <p className="text-4xl font-bold">$12,000</p>
                  </div>
                  <Button size="sm" variant="outline">More details</Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Spend</p>
                    <p className="font-semibold">$1,200</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-semibold">$1,200</p>
                  </div>
                </div>
                <Progress value={72} />
                <p className="text-sm font-medium">Ongoing</p>
              </article>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Familias tipográficas</CardTitle>
              <CardDescription>Definidas en configuración global del tenant</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Sans principal</p>
                <p className="font-sans text-3xl font-bold tracking-tight">Manrope / System</p>
                <p className="font-sans text-sm text-muted-foreground">Usar en títulos, cuerpo y navegación.</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs text-muted-foreground">Mono técnica</p>
                <p className="font-mono text-2xl">JetBrains Mono</p>
                <p className="font-mono text-xs text-muted-foreground">Ideal para IDs, métricas técnicas y tokens.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escala tipográfica</CardTitle>
              <CardDescription>Jerarquía estándar de textos en dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Heading XL · text-3xl / font-bold</h1>
              <h2 className="text-2xl font-semibold tracking-tight">Heading L · text-2xl / font-semibold</h2>
              <h3 className="text-xl font-semibold">Heading M · text-xl / font-semibold</h3>
              <p className="text-base">Body base · text-base para contenidos principales.</p>
              <p className="text-sm text-muted-foreground">Body secondary · text-sm muted para contexto.</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Micro label · text-xs uppercase tracking-wide</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {courseMetrics.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{item.value}</p>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Card de curso (patrón)</CardTitle>
                <CardDescription>Composición recomendada para catálogo y dashboard comercial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2].map((item) => (
                    <article key={item} className="rounded-lg border overflow-hidden bg-card">
                      <div className="h-36 bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Marketing</Badge>
                          <Badge>Privado</Badge>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">Curso de Estrategia Digital {item}</h3>
                          <p className="text-sm text-muted-foreground mt-1">Programa intensivo de 120h orientado a resultados.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock3 className="h-4 w-4" />120h</div>
                          <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-4 w-4" />CEP Norte</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">1.290€</span>
                          <Button size="sm">Ver curso</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filtros de cursos</CardTitle>
                <CardDescription>Bloque reusable para catálogo/listados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Buscar</Label>
                  <Input placeholder="Nombre, código, área..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Modalidad</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="tele">Teleformación</SelectItem>
                      <SelectItem value="mixta">Mixta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierta</SelectItem>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="done">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1">Aplicar</Button>
                  <Button variant="outline" className="flex-1">Limpiar</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Listado de cursos / inscripciones</CardTitle>
              <CardDescription>Tabla estándar para operación diaria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Sede</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Progreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseRows.map((row) => (
                    <TableRow key={`${row.curso}-${row.sede}`}>
                      <TableCell className="font-medium">{row.curso}</TableCell>
                      <TableCell>{row.modalidad}</TableCell>
                      <TableCell>{row.sede}</TableCell>
                      <TableCell><CourseStatusBadge status={row.estado} /></TableCell>
                      <TableCell className="text-right">{row.progreso}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suite de calendario académico</CardTitle>
              <CardDescription>
                Patrones reutilizables inspirados en Academate-ui para gestión diaria, semanal, mensual y anual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Daily</Badge>
                <Badge variant="outline">Weekly</Badge>
                <Badge variant="outline">Monthly</Badge>
                <Badge variant="outline">Yearly</Badge>
                <ToggleGroup type="single" defaultValue="week" className="ml-auto">
                  <ToggleGroupItem value="day">Día</ToggleGroupItem>
                  <ToggleGroupItem value="week">Semana</ToggleGroupItem>
                  <ToggleGroupItem value="month">Mes</ToggleGroupItem>
                  <ToggleGroupItem value="year">Año</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Vista diaria
                    </CardTitle>
                    <CardDescription>Timeline por hora para aulas y docentes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dailySlots.map((slot) => (
                      <div key={`${slot.time}-${slot.subject}`} className="flex items-center gap-3 rounded-md border p-2.5 text-sm">
                        <span className="font-mono text-xs text-muted-foreground w-14">{slot.time}</span>
                        <div className="h-8 w-1 rounded bg-primary/70" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{slot.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{slot.room} · {slot.teacher}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarRange className="h-4 w-4" />
                      Vista semanal
                    </CardTitle>
                    <CardDescription>Carga por día y planificación docente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {weekLoad.map((day) => (
                      <div key={day.day} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>{day.day}</span>
                          <span className="text-muted-foreground">{day.hours}h</span>
                        </div>
                        <Progress value={Math.min(100, Math.round((day.hours / 32) * 100))} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarCheck2 className="h-4 w-4" />
                      Vista mensual
                    </CardTitle>
                    <CardDescription>Malla de 5 semanas con hitos y convocatorias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1.5 text-xs">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => (
                        <div key={label} className="rounded border bg-muted/40 py-1 text-center font-medium">{label}</div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const isEvent = [3, 8, 14, 21, 27, 32].includes(i)
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded border p-1 text-right ${
                              isEvent ? 'bg-primary/15 border-primary/30' : 'bg-background'
                            }`}
                          >
                            {i + 1}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Vista anual</CardTitle>
                    <CardDescription>Heatmap de actividad por mes para dirección académica</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, idx) => (
                      <div key={quarter} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span>{quarter}</span>
                          <span className="text-muted-foreground">{idx + 2} campañas académicas</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['Ene', 'Feb', 'Mar'].map((month, mIdx) => (
                            <div key={`${quarter}-${month}`} className={`rounded border px-2 py-1.5 text-xs ${mIdx === idx % 3 ? 'bg-primary/15 border-primary/30' : 'bg-muted/30'}`}>
                              {month}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inputs y toggles</CardTitle>
                <CardDescription>Elementos de configuración y CRUD</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de módulo</Label>
                  <Input id="name" placeholder="Campus Virtual" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Descripción</Label>
                  <Textarea id="desc" placeholder="Descripción funcional del módulo..." />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Feature flag activo</p>
                    <p className="text-xs text-muted-foreground">Controla visibilidad del módulo.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estados y feedback</CardTitle>
                <CardDescription>Mensajes de éxito/aviso/error y progreso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <CircleCheck className="h-4 w-4" />
                  <AlertTitle>Sincronización correcta</AlertTitle>
                  <AlertDescription>Datos LMS actualizados hace 2 minutos.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Error de conexión</AlertTitle>
                  <AlertDescription>El servicio de leads devolvió timeout.</AlertDescription>
                </Alert>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Implementación visual global</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dialog (modal)</CardTitle>
                <CardDescription>Confirmaciones críticas y acciones cortas</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Abrir dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Publicar cambios de diseño</DialogTitle>
                      <DialogDescription>
                        Se aplicarán cambios visuales en todo el dashboard tenant.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancelar</Button>
                      <Button>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sheet (panel lateral)</CardTitle>
                <CardDescription>Edición rápida sin salir de la vista</CardDescription>
              </CardHeader>
              <CardContent>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button>
                      <Rocket className="mr-2 h-4 w-4" />
                      Abrir sheet
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Editar componente</SheetTitle>
                      <SheetDescription>Actualiza título, valor y estado del KPI.</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 px-4 py-2">
                      <Label htmlFor="quick-title">Título</Label>
                      <Input id="quick-title" defaultValue="Alumnos activos" />
                      <Label htmlFor="quick-value">Valor</Label>
                      <Input id="quick-value" defaultValue="1.284" />
                    </div>
                    <SheetFooter>
                      <Button variant="outline">Descartar</Button>
                      <Button>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Aplicar
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Librería Akademate-ui integrada</CardTitle>
              <CardDescription>Bloques disponibles para extender tenant dashboard sin crear UI desde cero</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {academateTemplates.map((template) => {
                const Icon = template.icon
                return (
                  <article key={template.name} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <Badge variant="secondary">READY</Badge>
                    </div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </article>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plantillas de página</CardTitle>
              <CardDescription>Recetas de composición para acelerar implementación</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Plantilla A · Dashboard ejecutivo</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      `PageHeader` + KPI row (4 cards) + grid 2/1 (chart + objetivos) + tabla operativa + acciones rápidas.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Plantilla B · Gestión con filtros</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      `PageHeader` con acciones, card de filtros, tabla principal, paginación y panel lateral (`Sheet`) para edición.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Plantilla C · Configuración tenant</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      `PageHeader` + tabs de configuración + formularios por secciones + alertas de estado y bloque de acciones persistente.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estandarización de títulos y encabezados</CardTitle>
              <CardDescription>Norma única para eliminar inconsistencias visuales entre páginas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Usar `PageHeader` en todas las páginas de primer nivel.</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Mantener `withCard=true` por defecto para bloques de título encuadrados.</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />En detalle/edición usar `withCard=false` solo si hay hero contextual justificado.</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Espaciado fijo: `mb-4` en encabezado + `space-y-6` en páginas estándar.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist de consistencia visual</CardTitle>
              <CardDescription>Reglas mínimas para validar nuevas pantallas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Usar tokens `hsl(var(--...))`, evitar hex hardcodeados.</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Mantener jerarquía: `PageHeader` → KPIs → bloque principal → secundarios.</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Aplicar escala tipográfica oficial (`text-3xl`, `text-xl`, `text-base`, `text-sm`, `text-xs`).</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Para cursos: siempre incluir estado, modalidad, sede y CTA visible.</div>
              <div className="flex items-start gap-2"><CircleCheck className="h-4 w-4 mt-0.5 text-primary" />Asegurar estados empty/loading/error con `Alert`, `Skeleton` o mensajes claros.</div>
              <Button className="mt-2">
                Exportar guía de implementación
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navegación rápida</CardTitle>
              <CardDescription>Accesos relacionados al sistema visual</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href="/diseno/mockup-dashboard">Mockup Dashboard v2</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">Dashboard actual</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/cursos">Módulo Cursos</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/campus-virtual">Campus Virtual</a>
              </Button>
              <Button asChild>
                <a href="/configuracion/personalizacion">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ajustar branding
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
