'use client'

import { useMemo, useState } from 'react'
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
  {
    curso: 'Marketing Digital',
    modalidad: 'Presencial',
    sede: 'Sede Norte',
    estado: 'Abierta',
    progreso: 72,
  },
  {
    curso: 'UX/UI Intensivo',
    modalidad: 'Teleformación',
    sede: 'Sede Sur',
    estado: 'Activa',
    progreso: 61,
  },
  {
    curso: 'Comercio Internacional',
    modalidad: 'Mixta',
    sede: 'Sede Santa Cruz',
    estado: 'Planificada',
    progreso: 18,
  },
  {
    curso: 'Data Analytics',
    modalidad: 'Presencial',
    sede: 'Sede Norte',
    estado: 'Finalizada',
    progreso: 100,
  },
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
  {
    level: 'Elevation B2',
    alpha: '6%',
    value: '0 6px 6px -3px, 0 12px 12px -6px, 0 24px 24px -12px',
  },
]

const neutralScaleLight = [
  '#FFFFFF',
  '#FAFAFA',
  '#F5F5F5',
  '#E5E5E5',
  '#D4D4D4',
  '#A3A3A3',
  '#737373',
  '#525252',
  '#404040',
  '#262626',
  '#171717',
  '#0A0A0A',
]
const neutralScaleDark = [
  '#000000',
  '#0A0A0A',
  '#171717',
  '#262626',
  '#373737',
  '#525252',
  '#8A8A8A',
  '#A3A3A3',
  '#D4D4D4',
  '#E5E5E5',
  '#F5F5F5',
  '#FAFAFA',
]

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
  {
    name: 'Calendar Suite',
    icon: CalendarRange,
    description: 'Vistas diario, semanal, mensual y anual con panel lateral de eventos.',
  },
  {
    name: 'Leads Dashboard',
    icon: PanelsTopLeft,
    description: 'Filtros + tabla + charts de evolución comercial por estado.',
  },
  {
    name: 'Task Board',
    icon: KanbanSquare,
    description: 'Gestión por columnas para operaciones, onboarding y incidencias.',
  },
  {
    name: 'Chat Workspace',
    icon: MessageSquare,
    description: 'Canales internos de coordinación académica y soporte.',
  },
  {
    name: 'Files Hub',
    icon: Files,
    description: 'Repositorio de documentos, plantillas y materiales por curso.',
  },
]

function ColorSwatch({ token }: { token: ColorToken }) {
  return (
    <div className="rounded-lg border p-3" data-oid="qcium_i">
      <div
        className="h-12 w-full rounded-md border"
        style={{ backgroundColor: `hsl(var(${token.varName}))` }}
        data-oid="y9se4.3"
      />

      <div className="mt-2 space-y-0.5" data-oid="fwt40gm">
        <p className="text-sm font-semibold" data-oid="l5mzf-b">
          {token.label}
        </p>
        <p className="text-xs text-muted-foreground font-mono" data-oid="nwl2r0f">
          {token.varName}
        </p>
        <p className="text-xs text-muted-foreground" data-oid="jsa7cxx">
          {token.usage}
        </p>
      </div>
    </div>
  )
}

function CourseStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'Finalizada' ? 'default' : status === 'Planificada' ? 'outline' : 'secondary'
  return (
    <Badge variant={variant} data-oid="1n5-oha">
      {status}
    </Badge>
  )
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
    <div className={densityClass} data-oid="0uxreal">
      <PageHeader
        title="Design System Completo"
        description="Fundaciones visuales, tipografías, colores, cursos, listados y patrones reutilizables para todo el tenant dashboard"
        icon={Palette}
        badge={
          <Badge variant="secondary" data-oid="ew5citt">
            UI FOUNDATION
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2" data-oid="z6hjh3u">
            <Select
              value={density}
              onValueChange={(value: 'compacta' | 'regular' | 'amplia') => setDensity(value)}
              data-oid="ir395em"
            >
              <SelectTrigger className="w-[170px]" data-oid="ieesw:5">
                <SelectValue data-oid="5na:22x" />
              </SelectTrigger>
              <SelectContent data-oid="1lvx3rg">
                <SelectItem value="compacta" data-oid="i:5usko">
                  Densidad compacta
                </SelectItem>
                <SelectItem value="regular" data-oid="jnq-:yi">
                  Densidad regular
                </SelectItem>
                <SelectItem value="amplia" data-oid="iewsbr1">
                  Densidad amplia
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setProgress((v) => (v >= 100 ? 34 : v + 11))}
              data-oid="w6r8us_"
            >
              Simular progreso
            </Button>
          </div>
        }
        data-oid="_3q1a4r"
      />

      <Tabs defaultValue="foundations" className="space-y-4" data-oid="22zo9p3">
        <TabsList className="flex flex-wrap h-auto" data-oid="lyb.c4e">
          <TabsTrigger value="foundations" data-oid="cn1sdwi">
            Foundations
          </TabsTrigger>
          <TabsTrigger value="image-specs" data-oid="zvb06ui">
            Image Specs
          </TabsTrigger>
          <TabsTrigger value="typography" data-oid="ypu15c3">
            Tipografía
          </TabsTrigger>
          <TabsTrigger value="courses" data-oid="uulos4x">
            Cursos
          </TabsTrigger>
          <TabsTrigger value="scheduling" data-oid=":m9ly1v">
            Calendarios
          </TabsTrigger>
          <TabsTrigger value="components" data-oid="8r.et5e">
            Componentes
          </TabsTrigger>
          <TabsTrigger value="patterns" data-oid="ikhzgf4">
            Patrones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="foundations" className="space-y-4" data-oid=":drw3wo">
          <Card data-oid="pt2-oeu">
            <CardHeader data-oid="vwrt.gc">
              <CardTitle data-oid="1i4-nku">Paleta Core</CardTitle>
              <CardDescription data-oid="2brs-pc">Tokens oficiales para UI general</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-oid="o7_rv7s">
              {coreColors.map((token) => (
                <ColorSwatch key={token.varName} token={token} data-oid="mpe5214" />
              ))}
            </CardContent>
          </Card>

          <Card data-oid="94cdsi0">
            <CardHeader data-oid="gkvt4.d">
              <CardTitle data-oid="4t7cfu9">Paleta Sidebar</CardTitle>
              <CardDescription data-oid=":x8fcd6">
                Tokens específicos del shell lateral
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-oid="xvjhzqb">
              {sidebarColors.map((token) => (
                <ColorSwatch key={token.varName} token={token} data-oid="876v.eo" />
              ))}
            </CardContent>
          </Card>

          <Card data-oid="zwpx9s.">
            <CardHeader data-oid="dmxad-a">
              <CardTitle data-oid="6hilvg6">Escala de espaciado y radio</CardTitle>
              <CardDescription data-oid="lameo63">
                Ritmo visual recomendado para páginas y módulos
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="8atuad9">
              <Table data-oid="5-vcw8u">
                <TableHeader data-oid="r1a6bj8">
                  <TableRow data-oid="38oqbit">
                    <TableHead data-oid="h1p2sm.">Token</TableHead>
                    <TableHead data-oid="qww8ru.">Valor</TableHead>
                    <TableHead data-oid="fuqip:j">Uso recomendado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="yk99d:s">
                  {spacingScale.map((row) => (
                    <TableRow key={row.token} data-oid="e-r7yin">
                      <TableCell className="font-mono text-xs" data-oid="s:rcao8">
                        {row.token}
                      </TableCell>
                      <TableCell data-oid="ftoeykl">{row.px}</TableCell>
                      <TableCell data-oid="e_daxjk">{row.usage}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow data-oid="y6ai81e">
                    <TableCell className="font-mono text-xs" data-oid="we7r0ka">
                      --radius
                    </TableCell>
                    <TableCell data-oid="ck51l_n">8px</TableCell>
                    <TableCell data-oid="aw.qt:0">Radio estándar de card/botón/input</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image-specs" className="space-y-4" data-oid="7wz70uu">
          <Card data-oid="qp1eujj">
            <CardHeader data-oid="w-n2_am">
              <CardTitle data-oid="td8_q9e">Shadows / Elevation Stack</CardTitle>
              <CardDescription data-oid="xvb36x.">
                Recetas extraídas de referencias visuales para cards, popovers y overlays.
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="6ocngzf">
              <Table data-oid="axvdc.-">
                <TableHeader data-oid="svisx.m">
                  <TableRow data-oid="9itlmf-">
                    <TableHead data-oid="ttmyeke">Nivel</TableHead>
                    <TableHead data-oid="twhf2jk">Alpha</TableHead>
                    <TableHead data-oid="v57l3gj">Box-shadow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="ah.c7zv">
                  {shadowRecipes.map((item) => (
                    <TableRow key={item.level} data-oid="agqn0q1">
                      <TableCell className="font-medium" data-oid="jjgcv:4">
                        {item.level}
                      </TableCell>
                      <TableCell data-oid=".vvcvsy">{item.alpha}</TableCell>
                      <TableCell className="font-mono text-xs" data-oid="2jk7o4z">
                        {item.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card data-oid="f8bjapl">
            <CardHeader data-oid="g_igt3n">
              <CardTitle data-oid="z.ot0cn">Neutral Scale (AAA-ready)</CardTitle>
              <CardDescription data-oid="k6a-edv">
                Escala neutral light/dark para fondo, borde y tipografía.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2" data-oid="j723-ze">
              <div className="space-y-2" data-oid="q8cs49v">
                <p className="text-sm font-semibold" data-oid="mueuov3">
                  Light
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" data-oid="hzd3bvc">
                  {neutralScaleLight.map((hex) => (
                    <div key={`light-${hex}`} className="rounded-md border p-2" data-oid="-dn:fif">
                      <div
                        className="h-8 rounded border"
                        style={{ backgroundColor: hex }}
                        data-oid="9dz2:hs"
                      />
                      <p className="mt-1 text-[10px] font-mono" data-oid="fxr:79t">
                        {hex}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2" data-oid=":po3-vf">
                <p className="text-sm font-semibold" data-oid="dvkm73e">
                  Dark
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" data-oid="ntppefr">
                  {neutralScaleDark.map((hex) => (
                    <div key={`dark-${hex}`} className="rounded-md border p-2" data-oid="_sjgs76">
                      <div
                        className="h-8 rounded border"
                        style={{ backgroundColor: hex }}
                        data-oid="24.p86g"
                      />
                      <p className="mt-1 text-[10px] font-mono" data-oid="cq3t.ip">
                        {hex}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2" data-oid="n3e.r7f">
            <Card data-oid=".hj.i9n">
              <CardHeader data-oid="dbnvut6">
                <CardTitle data-oid="st1zxai">Desktop App Grid Spec</CardTitle>
                <CardDescription data-oid="t1y9ci0">
                  Regla base de layout para shell de dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2" data-oid="n6l5w8h">
                {appGridSpec.map((row) => (
                  <div
                    key={row.token}
                    className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                    data-oid="nc9dwy6"
                  >
                    <span className="text-muted-foreground" data-oid="mbiaxst">
                      {row.token}
                    </span>
                    <span className="font-medium" data-oid="j-4b90_">
                      {row.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card data-oid="2e:kqv9">
              <CardHeader data-oid="m91-fz_">
                <CardTitle data-oid="f4d6uz2">Sidebar Spacing Spec</CardTitle>
                <CardDescription data-oid=".:lp4jy">
                  Métricas para expanded/collapsed y ritmo de navegación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2" data-oid="43-mpq8">
                {sidebarSpacingSpec.map((row) => (
                  <div
                    key={row.area}
                    className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                    data-oid="ziynzzu"
                  >
                    <span className="text-muted-foreground" data-oid="bhm-pz3">
                      {row.area}
                    </span>
                    <span className="font-medium" data-oid="vip00o-">
                      {row.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2" data-oid="vz0-z.x">
            <Card data-oid="522nevl">
              <CardHeader data-oid="64:f..6">
                <CardTitle data-oid="1cs_vj4">Typography Hierarchy (Card Pattern)</CardTitle>
                <CardDescription data-oid="vk2ca_g">
                  Escala recomendada para legibilidad y escaneo visual.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3" data-oid="mxadb1n">
                <div className="rounded-lg border p-4 space-y-2" data-oid="3mk47o-">
                  <p className="text-2xl font-semibold" data-oid="c2k9dp-">
                    Headline 24px
                  </p>
                  <p className="text-base" data-oid="mbuyr6l">
                    Subheadline 16px
                  </p>
                  <p className="text-sm text-muted-foreground" data-oid="p0-v_g3">
                    Body 14px: texto de apoyo y contexto.
                  </p>
                  <div className="flex gap-2" data-oid=".z_a4:q">
                    <Button size="sm" data-oid="9tgwl00">
                      Label 16px
                    </Button>
                    <Button size="sm" variant="outline" data-oid=":atajrk">
                      Secundario
                    </Button>
                  </div>
                </div>
                <Alert data-oid="hiu92l8">
                  <CircleCheck className="h-4 w-4" data-oid="gkkhp7:" />
                  <AlertTitle data-oid="48twh0b">Regla</AlertTitle>
                  <AlertDescription data-oid="r_7.s-3">
                    Evitar mezclar escalas sin jerarquía (ej. botón mayor que subtítulo).
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card data-oid="nigg8v:">
              <CardHeader data-oid="x:g0iqp">
                <CardTitle data-oid="19aq216">Stepper Patterns</CardTitle>
                <CardDescription data-oid="sf0diie">
                  5 variantes para onboarding, checkout y asistentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2" data-oid=":6zhg81">
                {stepperPatterns.map((pattern, idx) => (
                  <div key={pattern.name} className="rounded border p-3" data-oid="-2z_x6q">
                    <div className="flex items-center gap-2" data-oid="hgoyr1q">
                      <Badge variant="outline" data-oid="54o0a.v">
                        {idx + 1}
                      </Badge>
                      <p className="font-medium" data-oid="4wyyezv">
                        {pattern.name}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1" data-oid=".25zwkh">
                      {pattern.desc}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card data-oid="wy0e:n9">
            <CardHeader data-oid="g4575so">
              <CardTitle data-oid="m0jfcw1">Pricing + Budget Component Patterns</CardTitle>
              <CardDescription data-oid="rx.jlxq">
                Patrones para monetización y KPIs financieros.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-2" data-oid="b0j.y4-">
              <article className="rounded-xl border p-4 space-y-4" data-oid="c6bra2o">
                <div className="flex items-center justify-between" data-oid="ahy13s:">
                  <div data-oid="bb47u41">
                    <p className="font-semibold text-lg" data-oid="sg0aju0">
                      Business
                    </p>
                    <p className="text-sm text-muted-foreground" data-oid="04f4r5m">
                      Billed yearly
                    </p>
                  </div>
                  <Badge data-oid="0rucq43">POPULAR</Badge>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground" data-oid="xi3uezt">
                  <li data-oid=":bvwliv">• Real-Time Market Data</li>
                  <li data-oid="_mfaa:h">• Advanced Charting Tools</li>
                  <li data-oid="oy_sbkt">• On-Chain Analysis</li>
                  <li data-oid="43noxz9">• API Access</li>
                </ul>
                <div data-oid="o5u5ht.">
                  <p className="text-2xl font-bold" data-oid="m4ayhpj">
                    $29
                  </p>
                  <p className="text-sm text-muted-foreground" data-oid="yr9isdy">
                    per user / month
                  </p>
                </div>
                <Button className="w-full" data-oid="4bu-w5s">
                  Upgrade to Business
                </Button>
              </article>

              <article className="rounded-xl border p-4 space-y-4" data-oid="aiuyzt3">
                <div className="flex items-start justify-between" data-oid="zgda3sa">
                  <div data-oid="kafnsle">
                    <p className="text-sm text-muted-foreground" data-oid="hhvtk0l">
                      Monthly Budget
                    </p>
                    <p className="text-4xl font-bold" data-oid="lo.c3my">
                      $12,000
                    </p>
                  </div>
                  <Button size="sm" variant="outline" data-oid="icqgchs">
                    More details
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm" data-oid="zpg354k">
                  <div data-oid="6-r22d.">
                    <p className="text-muted-foreground" data-oid="d3zgv55">
                      Spend
                    </p>
                    <p className="font-semibold" data-oid="3lsbzhy">
                      $1,200
                    </p>
                  </div>
                  <div className="text-right" data-oid="p0yzjw2">
                    <p className="text-muted-foreground" data-oid="1lsc.ww">
                      Remaining
                    </p>
                    <p className="font-semibold" data-oid="7icmfc2">
                      $1,200
                    </p>
                  </div>
                </div>
                <Progress value={72} data-oid="u8-f3qy" />
                <p className="text-sm font-medium" data-oid="832rzly">
                  Ongoing
                </p>
              </article>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4" data-oid="p4ixz5k">
          <Card data-oid="_92mjlr">
            <CardHeader data-oid="hgv1xt5">
              <CardTitle data-oid="uisfkgd">Familias tipográficas</CardTitle>
              <CardDescription data-oid="xcsuili">
                Definidas en configuración global del tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2" data-oid="txm3e-1">
              <div className="rounded-lg border p-4 space-y-2" data-oid="3v2:2hr">
                <p className="text-xs text-muted-foreground" data-oid="3q68w_5">
                  Sans principal
                </p>
                <p className="font-sans text-3xl font-bold tracking-tight" data-oid="rumrpqu">
                  Manrope / System
                </p>
                <p className="font-sans text-sm text-muted-foreground" data-oid="op:2.ic">
                  Usar en títulos, cuerpo y navegación.
                </p>
              </div>
              <div className="rounded-lg border p-4 space-y-2" data-oid="jz755bn">
                <p className="text-xs text-muted-foreground" data-oid="x4vkaf_">
                  Mono técnica
                </p>
                <p className="font-mono text-2xl" data-oid="nmnmqln">
                  JetBrains Mono
                </p>
                <p className="font-mono text-xs text-muted-foreground" data-oid="1.hz14e">
                  Ideal para IDs, métricas técnicas y tokens.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-oid="yua22pq">
            <CardHeader data-oid="rxwpod3">
              <CardTitle data-oid="kcr-s_4">Escala tipográfica</CardTitle>
              <CardDescription data-oid="p2uk8fm">
                Jerarquía estándar de textos en dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="vmjikqu">
              <h1 className="text-3xl font-bold tracking-tight" data-oid="-g_gs:q">
                Heading XL · text-3xl / font-bold
              </h1>
              <h2 className="text-2xl font-semibold tracking-tight" data-oid="j01si6w">
                Heading L · text-2xl / font-semibold
              </h2>
              <h3 className="text-xl font-semibold" data-oid="nn51--9">
                Heading M · text-xl / font-semibold
              </h3>
              <p className="text-base" data-oid="m2m-6-v">
                Body base · text-base para contenidos principales.
              </p>
              <p className="text-sm text-muted-foreground" data-oid="1qqclhx">
                Body secondary · text-sm muted para contexto.
              </p>
              <p
                className="text-xs text-muted-foreground uppercase tracking-wide"
                data-oid="njmvkl2"
              >
                Micro label · text-xs uppercase tracking-wide
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4" data-oid="c8_xkkf">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-oid="sh-wpwv">
            {courseMetrics.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label} data-oid="wf62_35">
                  <CardHeader
                    className="flex flex-row items-center justify-between space-y-0 pb-2"
                    data-oid="2ij8udh"
                  >
                    <CardTitle className="text-sm font-medium" data-oid="hucs6e6">
                      {item.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" data-oid="b4rg1g1" />
                  </CardHeader>
                  <CardContent data-oid="tz-.:hy">
                    <p className="text-2xl font-bold" data-oid="po_.6df">
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-4 xl:grid-cols-3" data-oid="akk8bhp">
            <Card className="xl:col-span-2" data-oid="tnx.v5.">
              <CardHeader data-oid="11e_hrg">
                <CardTitle data-oid="jvadhyc">Card de curso (patrón)</CardTitle>
                <CardDescription data-oid="k749hud">
                  Composición recomendada para catálogo y dashboard comercial
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="algmpl8">
                <div className="grid gap-4 md:grid-cols-2" data-oid="jgai5p5">
                  {[1, 2].map((item) => (
                    <article
                      key={item}
                      className="rounded-lg border overflow-hidden bg-card"
                      data-oid="3gt8_un"
                    >
                      <div className="h-36 bg-muted" data-oid="kob_4og" />
                      <div className="p-4 space-y-3" data-oid="cqxp9ga">
                        <div className="flex items-center justify-between" data-oid="is:e-g0">
                          <Badge variant="outline" data-oid="x8xkp4y">
                            Marketing
                          </Badge>
                          <Badge data-oid="hv_c31w">Privado</Badge>
                        </div>
                        <div data-oid="i-b0n:w">
                          <h3 className="font-bold text-lg leading-tight" data-oid="faq24x_">
                            Curso de Estrategia Digital {item}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1" data-oid="kl0rpgz">
                            Programa intensivo de 120h orientado a resultados.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm" data-oid="vy-qhjf">
                          <div
                            className="flex items-center gap-1.5 text-muted-foreground"
                            data-oid="4:yll9c"
                          >
                            <Clock3 className="h-4 w-4" data-oid="2xwucwk" />
                            120h
                          </div>
                          <div
                            className="flex items-center gap-1.5 text-muted-foreground"
                            data-oid="57xr7x9"
                          >
                            <Building2 className="h-4 w-4" data-oid="npjp3te" />
                            Sede Norte
                          </div>
                        </div>
                        <div className="flex items-center justify-between" data-oid="y6l65vf">
                          <span className="font-bold text-primary" data-oid="s:4ck1-">
                            1.290€
                          </span>
                          <Button size="sm" data-oid="okmo1t_">
                            Ver curso
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-oid="o8dse:l">
              <CardHeader data-oid="5.h0ado">
                <CardTitle data-oid="f6o0.vp">Filtros de cursos</CardTitle>
                <CardDescription data-oid="0ha41oc">
                  Bloque reusable para catálogo/listados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3" data-oid="rz8tbhj">
                <div className="space-y-1.5" data-oid="mc1afdv">
                  <Label data-oid="i7yd.sh">Buscar</Label>
                  <Input placeholder="Nombre, código, área..." data-oid="xtdzm9g" />
                </div>
                <div className="space-y-1.5" data-oid="tx9u.si">
                  <Label data-oid="_mls:om">Modalidad</Label>
                  <Select data-oid="ydut5e5">
                    <SelectTrigger data-oid="0ke6ll8">
                      <SelectValue placeholder="Todas" data-oid="l:42cyz" />
                    </SelectTrigger>
                    <SelectContent data-oid="4kdem-q">
                      <SelectItem value="all" data-oid="mse1b0a">
                        Todas
                      </SelectItem>
                      <SelectItem value="presencial" data-oid=".yd7vhj">
                        Presencial
                      </SelectItem>
                      <SelectItem value="tele" data-oid="0t5ddt-">
                        Teleformación
                      </SelectItem>
                      <SelectItem value="mixta" data-oid="mey:v0v">
                        Mixta
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5" data-oid="1p7_nsv">
                  <Label data-oid="j1p2qmj">Estado</Label>
                  <Select data-oid="-0wyw49">
                    <SelectTrigger data-oid="1vp43yw">
                      <SelectValue placeholder="Todos" data-oid="7328l05" />
                    </SelectTrigger>
                    <SelectContent data-oid=":1y6rc6">
                      <SelectItem value="open" data-oid=".7w8lnd">
                        Abierta
                      </SelectItem>
                      <SelectItem value="active" data-oid="0uim9qa">
                        Activa
                      </SelectItem>
                      <SelectItem value="done" data-oid="ma0rs4g">
                        Finalizada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-1" data-oid="7q-_v2n">
                  <Button className="flex-1" data-oid="nhd7x0c">
                    Aplicar
                  </Button>
                  <Button variant="outline" className="flex-1" data-oid="rg40na:">
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card data-oid="cdz_i4t">
            <CardHeader data-oid="jd9ow96">
              <CardTitle data-oid="38n3w67">Listado de cursos / inscripciones</CardTitle>
              <CardDescription data-oid=":y5yxo5">
                Tabla estándar para operación diaria
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="2t-wlyw">
              <Table data-oid="f9wq-5w">
                <TableHeader data-oid="wm_b_.u">
                  <TableRow data-oid="qwnizw_">
                    <TableHead data-oid="53od8dy">Curso</TableHead>
                    <TableHead data-oid="k_-jjv0">Modalidad</TableHead>
                    <TableHead data-oid="8d3s0b9">Sede</TableHead>
                    <TableHead data-oid="1vtefuq">Estado</TableHead>
                    <TableHead className="text-right" data-oid="uvod:e2">
                      Progreso
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="6:.i.:1">
                  {courseRows.map((row) => (
                    <TableRow key={`${row.curso}-${row.sede}`} data-oid="nwi84sd">
                      <TableCell className="font-medium" data-oid="8:dspmh">
                        {row.curso}
                      </TableCell>
                      <TableCell data-oid="3sa7bi:">{row.modalidad}</TableCell>
                      <TableCell data-oid="t1d_4ub">{row.sede}</TableCell>
                      <TableCell data-oid="f__mo4g">
                        <CourseStatusBadge status={row.estado} data-oid="u54fn6." />
                      </TableCell>
                      <TableCell className="text-right" data-oid="x2:3v3c">
                        {row.progreso}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4" data-oid="-njbwz8">
          <Card data-oid="f-ou350">
            <CardHeader data-oid="_zbc0hi">
              <CardTitle data-oid="88jl-v2">Suite de calendario académico</CardTitle>
              <CardDescription data-oid="e3ty2t5">
                Patrones reutilizables inspirados en Academate-ui para gestión diaria, semanal,
                mensual y anual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="2056xcn">
              <div className="flex flex-wrap items-center gap-2" data-oid="m726x5i">
                <Badge variant="outline" data-oid="1bf_kk2">
                  Daily
                </Badge>
                <Badge variant="outline" data-oid="vcxh1bk">
                  Weekly
                </Badge>
                <Badge variant="outline" data-oid="udzv.ok">
                  Monthly
                </Badge>
                <Badge variant="outline" data-oid="m-fl_8r">
                  Yearly
                </Badge>
                <ToggleGroup
                  type="single"
                  defaultValue="week"
                  className="ml-auto"
                  data-oid="sa.m-5j"
                >
                  <ToggleGroupItem value="day" data-oid="ww0ufk6">
                    Día
                  </ToggleGroupItem>
                  <ToggleGroupItem value="week" data-oid="3hfe_ef">
                    Semana
                  </ToggleGroupItem>
                  <ToggleGroupItem value="month" data-oid="cc5dtch">
                    Mes
                  </ToggleGroupItem>
                  <ToggleGroupItem value="year" data-oid="tyt39rx">
                    Año
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid gap-4 xl:grid-cols-2" data-oid="c151ckj">
                <Card className="border-dashed" data-oid="2835xv3">
                  <CardHeader className="pb-2" data-oid=":qguphb">
                    <CardTitle className="text-base flex items-center gap-2" data-oid="jgmj0tv">
                      <CalendarClock className="h-4 w-4" data-oid="9d8vnb_" />
                      Vista diaria
                    </CardTitle>
                    <CardDescription data-oid="b4755v5">
                      Timeline por hora para aulas y docentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2" data-oid="vlhd9dm">
                    {dailySlots.map((slot) => (
                      <div
                        key={`${slot.time}-${slot.subject}`}
                        className="flex items-center gap-3 rounded-md border p-2.5 text-sm"
                        data-oid="unrc94n"
                      >
                        <span
                          className="font-mono text-xs text-muted-foreground w-14"
                          data-oid="qatxk8y"
                        >
                          {slot.time}
                        </span>
                        <div className="h-8 w-1 rounded bg-primary/70" data-oid=".6e2.:8" />
                        <div className="min-w-0" data-oid="6_rc9b-">
                          <p className="font-medium truncate" data-oid="jcip7m9">
                            {slot.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" data-oid=".9:982u">
                            {slot.room} · {slot.teacher}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-dashed" data-oid="vqmlk2a">
                  <CardHeader className="pb-2" data-oid="5_-nzwg">
                    <CardTitle className="text-base flex items-center gap-2" data-oid="o9ffq79">
                      <CalendarRange className="h-4 w-4" data-oid="lln9r5o" />
                      Vista semanal
                    </CardTitle>
                    <CardDescription data-oid="mv5zf_h">
                      Carga por día y planificación docente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3" data-oid="p.8b4v:">
                    {weekLoad.map((day) => (
                      <div key={day.day} className="space-y-1.5" data-oid="_5ax5c5">
                        <div
                          className="flex items-center justify-between text-sm"
                          data-oid="me6gl0r"
                        >
                          <span data-oid="ik_pes4">{day.day}</span>
                          <span className="text-muted-foreground" data-oid="i6gtv8o">
                            {day.hours}h
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, Math.round((day.hours / 32) * 100))}
                          data-oid="0fkmlfu"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-dashed" data-oid=".gy0x.n">
                  <CardHeader className="pb-2" data-oid="pqd_:ir">
                    <CardTitle className="text-base flex items-center gap-2" data-oid="t82.aqd">
                      <CalendarCheck2 className="h-4 w-4" data-oid="kpe4cw1" />
                      Vista mensual
                    </CardTitle>
                    <CardDescription data-oid="o1uesh6">
                      Malla de 5 semanas con hitos y convocatorias
                    </CardDescription>
                  </CardHeader>
                  <CardContent data-oid="2233rxa">
                    <div className="grid grid-cols-7 gap-1.5 text-xs" data-oid="dp-ze4h">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => (
                        <div
                          key={label}
                          className="rounded border bg-muted/40 py-1 text-center font-medium"
                          data-oid=":crm-r5"
                        >
                          {label}
                        </div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const isEvent = [3, 8, 14, 21, 27, 32].includes(i)
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded border p-1 text-right ${
                              isEvent ? 'bg-primary/15 border-primary/30' : 'bg-background'
                            }`}
                            data-oid="9:v2:18"
                          >
                            {i + 1}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed" data-oid="nysd38n">
                  <CardHeader className="pb-2" data-oid="0s0gak6">
                    <CardTitle className="text-base" data-oid=":4hmjlh">
                      Vista anual
                    </CardTitle>
                    <CardDescription data-oid="9ev2xt9">
                      Heatmap de actividad por mes para dirección académica
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3" data-oid="pgqkfgg">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, idx) => (
                      <div key={quarter} className="space-y-1.5" data-oid="i.ooy1b">
                        <div
                          className="flex items-center justify-between text-sm"
                          data-oid="v8udha."
                        >
                          <span data-oid="4uwv8in">{quarter}</span>
                          <span className="text-muted-foreground" data-oid="_yfqvxu">
                            {idx + 2} campañas académicas
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2" data-oid=".y0i146">
                          {['Ene', 'Feb', 'Mar'].map((month, mIdx) => (
                            <div
                              key={`${quarter}-${month}`}
                              className={`rounded border px-2 py-1.5 text-xs ${mIdx === idx % 3 ? 'bg-primary/15 border-primary/30' : 'bg-muted/30'}`}
                              data-oid="n5y6dy8"
                            >
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

        <TabsContent value="components" className="space-y-4" data-oid="m_fs99w">
          <div className="grid gap-4 lg:grid-cols-2" data-oid="djkrqun">
            <Card data-oid="37lug4i">
              <CardHeader data-oid="nf9xt5k">
                <CardTitle data-oid="ig2rzdo">Inputs y toggles</CardTitle>
                <CardDescription data-oid="naxgyw4">
                  Elementos de configuración y CRUD
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="_mr392.">
                <div className="space-y-2" data-oid="_pijmbt">
                  <Label htmlFor="name" data-oid="gnc5yxw">
                    Nombre de módulo
                  </Label>
                  <Input id="name" placeholder="Campus Virtual" data-oid="ii21iyx" />
                </div>
                <div className="space-y-2" data-oid="67ceu4-">
                  <Label htmlFor="desc" data-oid="dyka_ae">
                    Descripción
                  </Label>
                  <Textarea
                    id="desc"
                    placeholder="Descripción funcional del módulo..."
                    data-oid="q5gffz6"
                  />
                </div>
                <div
                  className="flex items-center justify-between rounded-md border p-3"
                  data-oid="zo524.a"
                >
                  <div data-oid="nnyytm3">
                    <p className="text-sm font-medium" data-oid="a5fa7uv">
                      Feature flag activo
                    </p>
                    <p className="text-xs text-muted-foreground" data-oid="fpikj__">
                      Controla visibilidad del módulo.
                    </p>
                  </div>
                  <Switch defaultChecked data-oid="hzgk7uc" />
                </div>
              </CardContent>
            </Card>

            <Card data-oid="zy:eyqo">
              <CardHeader data-oid="y2lfh.x">
                <CardTitle data-oid="xeef8x1">Estados y feedback</CardTitle>
                <CardDescription data-oid="wr-5qvl">
                  Mensajes de éxito/aviso/error y progreso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3" data-oid="g354egc">
                <Alert data-oid="k34rkc9">
                  <CircleCheck className="h-4 w-4" data-oid="eud-7_r" />
                  <AlertTitle data-oid="f_t_xct">Sincronización correcta</AlertTitle>
                  <AlertDescription data-oid=":vno06w">
                    Datos LMS actualizados hace 2 minutos.
                  </AlertDescription>
                </Alert>
                <Alert variant="destructive" data-oid="fj06uec">
                  <ShieldAlert className="h-4 w-4" data-oid="yqgntdg" />
                  <AlertTitle data-oid="d7p53kp">Error de conexión</AlertTitle>
                  <AlertDescription data-oid="wkp7n5r">
                    El servicio de leads devolvió timeout.
                  </AlertDescription>
                </Alert>
                <Separator data-oid="a76uzs_" />
                <div className="space-y-2" data-oid="43k2g7:">
                  <div className="flex items-center justify-between text-sm" data-oid="ozi-45n">
                    <span className="text-muted-foreground" data-oid="lpa6:d_">
                      Implementación visual global
                    </span>
                    <span className="font-medium" data-oid="djdda86">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} data-oid="wo2bkuv" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2" data-oid="btui94g">
            <Card data-oid="._v_ruo">
              <CardHeader data-oid="x:z5_5w">
                <CardTitle data-oid="qgod7t8">Dialog (modal)</CardTitle>
                <CardDescription data-oid="px.14oz">
                  Confirmaciones críticas y acciones cortas
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="eay.jx2">
                <Dialog data-oid="byg7j3i">
                  <DialogTrigger asChild data-oid="mjgg40v">
                    <Button variant="outline" data-oid="agfmb5h">
                      Abrir dialog
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-oid="dvrclyg">
                    <DialogHeader data-oid="su338jy">
                      <DialogTitle data-oid="bvs4ned">Publicar cambios de diseño</DialogTitle>
                      <DialogDescription data-oid="gqx9x-j">
                        Se aplicarán cambios visuales en todo el dashboard tenant.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter data-oid="a:m_.gp">
                      <Button variant="outline" data-oid="3kp45sm">
                        Cancelar
                      </Button>
                      <Button data-oid=".s568.x">Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card data-oid="mwxf4yt">
              <CardHeader data-oid="5ymh-o7">
                <CardTitle data-oid="xyp050h">Sheet (panel lateral)</CardTitle>
                <CardDescription data-oid="o.qona.">
                  Edición rápida sin salir de la vista
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="5o86h92">
                <Sheet data-oid="3z6bxw2">
                  <SheetTrigger asChild data-oid="sl2a97g">
                    <Button data-oid="wiiikqt">
                      <Rocket className="mr-2 h-4 w-4" data-oid="wsl15uu" />
                      Abrir sheet
                    </Button>
                  </SheetTrigger>
                  <SheetContent data-oid="9:cliy8">
                    <SheetHeader data-oid="pn0_rf4">
                      <SheetTitle data-oid="bck-2:2">Editar componente</SheetTitle>
                      <SheetDescription data-oid="lvcf:4.">
                        Actualiza título, valor y estado del KPI.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-3 px-4 py-2" data-oid="y_m5.jc">
                      <Label htmlFor="quick-title" data-oid="p:6remo">
                        Título
                      </Label>
                      <Input id="quick-title" defaultValue="Alumnos activos" data-oid="mn5tcin" />
                      <Label htmlFor="quick-value" data-oid="a1r95fs">
                        Valor
                      </Label>
                      <Input id="quick-value" defaultValue="1.284" data-oid="rw7a4k_" />
                    </div>
                    <SheetFooter data-oid="g4qojer">
                      <Button variant="outline" data-oid="0jgckd4">
                        Descartar
                      </Button>
                      <Button data-oid="v3_1xvl">
                        <Sparkles className="mr-2 h-4 w-4" data-oid="i:73w66" />
                        Aplicar
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4" data-oid="l0u3aa-">
          <Card data-oid="ehjyxjc">
            <CardHeader data-oid="q9853s4">
              <CardTitle data-oid=".c3oqaj">Librería Akademate-ui integrada</CardTitle>
              <CardDescription data-oid="o0dso7-">
                Bloques disponibles para extender tenant dashboard sin crear UI desde cero
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-oid="a3i268d">
              {academateTemplates.map((template) => {
                const Icon = template.icon
                return (
                  <article
                    key={template.name}
                    className="rounded-lg border p-4 space-y-2"
                    data-oid="a2g_ale"
                  >
                    <div className="flex items-center justify-between" data-oid="192uq5s">
                      <div
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10"
                        data-oid="w52li0v"
                      >
                        <Icon className="h-4 w-4 text-primary" data-oid="vu95v-7" />
                      </div>
                      <Badge variant="secondary" data-oid="hpyne_z">
                        READY
                      </Badge>
                    </div>
                    <h3 className="font-semibold" data-oid="7-rlkod">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-oid="6e6_ofy">
                      {template.description}
                    </p>
                  </article>
                )
              })}
            </CardContent>
          </Card>

          <Card data-oid="1s6rwd9">
            <CardHeader data-oid="x2cifw9">
              <CardTitle data-oid="ej7v0rc">Plantillas de página</CardTitle>
              <CardDescription data-oid="dr070:d">
                Recetas de composición para acelerar implementación
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="wql.szm">
              <Accordion type="single" collapsible className="w-full" data-oid="5dt0awa">
                <AccordionItem value="item-1" data-oid="5h5_vtm">
                  <AccordionTrigger data-oid="t1ub8nm">
                    Plantilla A · Dashboard ejecutivo
                  </AccordionTrigger>
                  <AccordionContent data-oid="f8mls71">
                    <p className="text-sm text-muted-foreground" data-oid="pcwb8.6">
                      `PageHeader` + KPI row (4 cards) + grid 2/1 (chart + objetivos) + tabla
                      operativa + acciones rápidas.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" data-oid="hy-d6cz">
                  <AccordionTrigger data-oid="bs44srf">
                    Plantilla B · Gestión con filtros
                  </AccordionTrigger>
                  <AccordionContent data-oid="nsle9vy">
                    <p className="text-sm text-muted-foreground" data-oid="elqidf3">
                      `PageHeader` con acciones, card de filtros, tabla principal, paginación y
                      panel lateral (`Sheet`) para edición.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" data-oid="bk38rcm">
                  <AccordionTrigger data-oid="zwpmuh7">
                    Plantilla C · Configuración tenant
                  </AccordionTrigger>
                  <AccordionContent data-oid="nev7dl:">
                    <p className="text-sm text-muted-foreground" data-oid="ajxpt_5">
                      `PageHeader` + tabs de configuración + formularios por secciones + alertas de
                      estado y bloque de acciones persistente.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card data-oid="ehz2.ln">
            <CardHeader data-oid="kmd-z1k">
              <CardTitle data-oid="ww60ew8">Estandarización de títulos y encabezados</CardTitle>
              <CardDescription data-oid="2gp54ox">
                Norma única para eliminar inconsistencias visuales entre páginas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm" data-oid="4370s_:">
              <div className="flex items-start gap-2" data-oid="k-vlo3a">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="33kn5.y" />
                Usar `PageHeader` en todas las páginas de primer nivel.
              </div>
              <div className="flex items-start gap-2" data-oid="vsskr7r">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="xh:d3wk" />
                Mantener `withCard=true` por defecto para bloques de título encuadrados.
              </div>
              <div className="flex items-start gap-2" data-oid="assft1q">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="n.tljnk" />
                En detalle/edición usar `withCard=false` solo si hay hero contextual justificado.
              </div>
              <div className="flex items-start gap-2" data-oid="q-d:otd">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="olg6ano" />
                Espaciado fijo: `mb-4` en encabezado + `space-y-6` en páginas estándar.
              </div>
            </CardContent>
          </Card>

          <Card data-oid="txq:jg:">
            <CardHeader data-oid="vawr76s">
              <CardTitle data-oid="fl:nnyy">Checklist de consistencia visual</CardTitle>
              <CardDescription data-oid="6kwg4k:">
                Reglas mínimas para validar nuevas pantallas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm" data-oid="2ro3-5s">
              <div className="flex items-start gap-2" data-oid="82ce_fe">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="ybyxywp" />
                Usar tokens `hsl(var(--...))`, evitar hex hardcodeados.
              </div>
              <div className="flex items-start gap-2" data-oid="hj2gjfu">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="mfw23jz" />
                Mantener jerarquía: `PageHeader` → KPIs → bloque principal → secundarios.
              </div>
              <div className="flex items-start gap-2" data-oid="5x23prl">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="-p2mz-6" />
                Aplicar escala tipográfica oficial (`text-3xl`, `text-xl`, `text-base`, `text-sm`,
                `text-xs`).
              </div>
              <div className="flex items-start gap-2" data-oid="1tgznsp">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="oq.t8_n" />
                Para cursos: siempre incluir estado, modalidad, sede y CTA visible.
              </div>
              <div className="flex items-start gap-2" data-oid="v2dgv4z">
                <CircleCheck className="h-4 w-4 mt-0.5 text-primary" data-oid="-:u83-5" />
                Asegurar estados empty/loading/error con `Alert`, `Skeleton` o mensajes claros.
              </div>
              <Button className="mt-2" data-oid="eaf8muz">
                Exportar guía de implementación
                <ArrowUpRight className="ml-2 h-4 w-4" data-oid="oamugb." />
              </Button>
            </CardContent>
          </Card>

          <Card data-oid="9z1_q4b">
            <CardHeader data-oid="w0.t:zl">
              <CardTitle data-oid="3hs9zwu">Navegación rápida</CardTitle>
              <CardDescription data-oid="nczvedw">
                Accesos relacionados al sistema visual
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2" data-oid="odg:h20">
              <Button variant="outline" asChild data-oid="0eukfpo">
                <a href="/diseno/mockup-dashboard" data-oid="ja9yj_r">
                  Mockup Dashboard v2
                </a>
              </Button>
              <Button variant="outline" asChild data-oid="j0mna9u">
                <a href="/dashboard" data-oid="le.7d59">
                  Dashboard actual
                </a>
              </Button>
              <Button variant="outline" asChild data-oid="l:4csz7">
                <a href="/dashboard/cursos" data-oid="7jk.d7v">
                  Módulo Cursos
                </a>
              </Button>
              <Button variant="outline" asChild data-oid="l989v.n">
                <a href="/campus-virtual" data-oid="juclspn">
                  Campus Virtual
                </a>
              </Button>
              <Button asChild data-oid="wztrdcq">
                <a href="/configuracion/personalizacion" data-oid="7n2zgj2">
                  <LayoutDashboard className="mr-2 h-4 w-4" data-oid="mq61ilm" />
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
