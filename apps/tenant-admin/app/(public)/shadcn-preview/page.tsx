'use client'

import type * as React from 'react'
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  PanelRightOpen,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@payload-config/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@payload-config/components/ui/dialog'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Progress } from '@payload-config/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Separator } from '@payload-config/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@payload-config/components/ui/sheet'
import { Switch } from '@payload-config/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { Textarea } from '@payload-config/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@payload-config/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@payload-config/components/ui/tooltip'
import { cn } from '@payload-config/lib/utils'

const cepThemeVars = {
  '--primary': '341 98% 48%',
  '--ring': '341 98% 48%',
  '--brand-accent': '341 98% 48%',
  '--sidebar-primary': '341 98% 48%',
} as React.CSSProperties

const akademateThemeVars = {
  '--primary': '224 71% 48%',
  '--ring': '224 71% 48%',
  '--brand-accent': '224 71% 48%',
  '--sidebar-primary': '224 71% 48%',
} as React.CSSProperties

const statusBadges = [
  { label: 'Publicado', variant: 'success' as const },
  { label: 'Sin publicar', variant: 'neutral' as const },
  { label: 'Inscripción abierta', variant: 'default' as const },
  { label: 'Pendiente', variant: 'warning' as const },
  { label: 'Completo', variant: 'secondary' as const },
]

const checklistItems = [
  'Tokens de color, espaciado, radios, sombras y superficies',
  'Cards de cursos, ciclos, convocatorias, docentes, sedes y documentos',
  'Listas operativas con thumbnail, datos clave y CTA',
  'Fichas internas de curso, ciclo y convocatoria',
  'Modales, confirmaciones, sheet lateral y formularios',
  'Estados, empty states, skeleton y feedback de validación',
  'Calendario de citas y panel de día',
  'Patrones de web pública y dashboard',
]

const spacingTokens = [
  { name: 'Page gutter', token: 'px-5 sm:px-6 lg:px-8', value: '20 / 24 / 32px' },
  { name: 'Section gap', token: 'gap-8 lg:gap-10', value: '32 / 40px' },
  { name: 'Card padding', token: 'p-5 lg:p-6', value: '20 / 24px' },
  { name: 'Field gap', token: 'gap-3', value: '12px' },
]

const colorTokens = [
  { name: 'Primary CEP', value: '#f2014b', className: 'bg-primary' },
  { name: 'Foreground', value: 'hsl(var(--foreground))', className: 'bg-foreground' },
  { name: 'Muted', value: 'hsl(var(--muted))', className: 'bg-muted' },
  { name: 'Border', value: 'hsl(var(--border))', className: 'bg-border' },
  { name: 'Success', value: 'hsl(var(--success))', className: 'bg-success' },
  { name: 'Warning', value: 'hsl(var(--warning))', className: 'bg-warning' },
]

const elevationTokens = [
  { name: 'Flat', token: 'border bg-card', className: 'shadow-none' },
  { name: 'Surface', token: 'shadow-sm', className: 'shadow-sm' },
  { name: 'Floating', token: 'shadow-md', className: 'shadow-md' },
]

const atmosphereTokens = [
  { name: 'Base', token: 'bg-background', className: 'bg-background' },
  { name: 'Suave', token: 'bg-muted/35', className: 'bg-muted/35' },
  { name: 'Operativa', token: 'bg-card', className: 'bg-card' },
  { name: 'Seleccionada', token: 'bg-primary/8 border-primary/25', className: 'border-primary/25 bg-primary/10' },
]

const programBlocks = [
  {
    title: 'Fundamentos de nutricosmética',
    description: 'Nutrición, suplementación, salud cutánea y responsabilidad profesional.',
    items: ['Marco legal y seguridad', 'Conceptos base de suplementación', 'Aplicación en estética y bienestar'],
  },
  {
    title: 'Complementos alimenticios',
    description: 'Vitaminas, minerales, proteínas, colágeno, microbiota y ácidos grasos esenciales.',
    items: ['Vitaminas y minerales', 'Colágeno y aminoácidos', 'Prebióticos y probióticos'],
  },
  {
    title: 'Integración profesional',
    description: 'Criterios de recomendación, contraindicaciones y derivación responsable.',
    items: ['Protocolos de recomendación', 'Interacciones y alertas', 'Casos prácticos'],
  },
]

const courseItems = [
  {
    type: 'Privado',
    title: 'Experto en Nutricosmética y Complementos Alimenticios',
    area: 'Área Salud, Bienestar y Deporte',
    modality: 'Presencial',
    start: 'Próximamente',
    campus: 'Sede Norte',
    image: '/website/cep/courses/nutricosmetica-priv.webp',
  },
  {
    type: 'Teleformación',
    title: 'Curso de Tatuador: Tatuaje Profesional Online',
    area: 'Área Salud, Bienestar y Deporte',
    modality: 'Online a tu ritmo',
    start: 'Inicio inmediato',
    campus: '100% online',
    image: '/media/tatuaje-profesional-online.webp',
  },
  {
    type: 'Ocupados',
    title: 'Vigilancia en urbanizaciones, polígonos y espacios públicos',
    area: 'Área Seguridad, Vigilancia y Protección',
    modality: 'Presencial',
    start: 'Avisarme de próximas fechas',
    campus: 'Sede por confirmar',
    image: '/media/area-seguridad-vigilancia-proteccion.webp',
  },
]

const cycleItems = [
  {
    level: 'GRADO MEDIO',
    title: 'Farmacia y Parafarmacia',
    official: 'Técnico en Farmacia y Parafarmacia',
    duration: '2000h / 2 cursos escolares',
    practice: '500h de prácticas',
    image: '/media/farmacia-hero.png',
  },
  {
    level: 'GRADO SUPERIOR',
    title: 'Higiene Bucodental',
    official: 'Técnico Superior en Higiene Bucodental',
    duration: '2000h / 2 cursos escolares',
    practice: '500h de prácticas',
    image: '/media/higiene-hero.png',
  },
]

const appointmentItems = [
  {
    time: '09:30',
    title: 'Llamada de seguimiento',
    lead: 'Laura Méndez',
    owner: 'Carlos Pérez',
    status: 'Pendiente',
  },
  {
    time: '12:00',
    title: 'Reunión de matrícula',
    lead: 'Daniel Hernández',
    owner: 'Equipo admisiones',
    status: 'Confirmada',
  },
]

const tenantTabTriggerClass =
  '!h-auto !flex-none rounded-full border bg-background px-4 py-2 text-foreground shadow-sm hover:bg-muted hover:text-foreground data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-md'

function FieldCard({
  label,
  value,
  helper,
  editable,
}: {
  label: string
  value: string
  helper?: string
  editable?: boolean
}) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex min-h-28 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
            <span className="text-lg font-semibold text-foreground">{value}</span>
          </div>
          {editable ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" aria-label={`Editar ${label}`}>
                    <Edit3 data-icon="inline-start" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Campo editable</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  )
}

function InfoRow({
  label,
  value,
  icon: Icon,
  alignValue = 'right',
}: {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  alignValue?: 'right' | 'left'
}) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          'min-w-0 text-muted-foreground',
          alignValue === 'right' ? 'sm:text-right' : 'sm:text-left'
        )}
      >
        {value}
      </div>
    </div>
  )
}

function InfoGrid({
  items,
  columns = 1,
  className,
}: {
  items: Array<{
    label: string
    value: React.ReactNode
    icon?: React.ComponentType<{ className?: string }>
  }>
  columns?: 1 | 2
  className?: string
}) {
  return (
    <div className={cn('grid gap-3 rounded-xl bg-muted/35 p-4', columns === 2 && 'lg:grid-cols-2', className)}>
      {items.map((item) => (
        <InfoRow key={item.label} {...item} />
      ))}
    </div>
  )
}

function StackedBulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 leading-relaxed">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function MediaBadge({
  label,
  tone = 'primary',
}: {
  label: string
  tone?: 'primary' | 'success' | 'warning' | 'neutral'
}) {
  const toneClass = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    warning: 'bg-orange-500 text-white hover:bg-orange-600',
    neutral: 'bg-slate-900 text-white hover:bg-slate-950',
  }[tone]

  return <Badge className={cn('shadow-sm', toneClass)}>{label}</Badge>
}

function CardActionFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-auto flex items-end justify-end gap-2 pt-4', className)}>
      {children}
    </div>
  )
}

function PreviewSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border bg-card p-5 shadow-sm lg:p-7">
      <div className="max-w-3xl">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function TokenCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
    </div>
  )
}

function SeparatorPreview() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Separadores y ritmo</CardTitle>
        <CardDescription>Patrón para distinguir título, dato fijo, dato editable y acciones.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-background p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Campo fijo</p>
            <p className="mt-2 text-lg font-semibold">Presencial</p>
            <p className="mt-1 text-sm text-muted-foreground">Solo lectura</p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-primary">Campo editable</p>
            <p className="mt-2 text-lg font-semibold">Consultar</p>
            <p className="mt-1 text-sm text-muted-foreground">Permite acción</p>
          </div>
          <div className="rounded-xl border bg-muted/35 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Estado</p>
            <div className="mt-2">
              <Badge variant="success">Publicado</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Semántico</p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Guardar cambios</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="ghost">Ver detalle</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TokenSystemPreview() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tokens de color</CardTitle>
          <CardDescription>Paleta semántica shadcn con override de tenant para CEP Formación.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {colorTokens.map((token) => (
            <div key={token.name} className="rounded-xl border bg-background p-3">
              <div className={cn('h-16 rounded-lg border', token.className)} />
              <p className="mt-3 font-semibold">{token.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{token.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Espaciado</CardTitle>
            <CardDescription>Escala base para evitar pantallas pegadas al viewport.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {spacingTokens.map((token) => (
              <TokenCard key={token.name} label={token.name} value={`${token.token} · ${token.value}`} />
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Radios y elevación</CardTitle>
            <CardDescription>Sombras suaves y radios consistentes para superficies operativas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {elevationTokens.map((token) => (
              <div key={token.name} className={cn('rounded-xl border bg-background p-4', token.className)}>
                <Circle className="size-5 text-primary" />
                <p className="mt-4 font-semibold">{token.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{token.token}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Atmósferas</CardTitle>
            <CardDescription>Superficies para alternar lectura, edición y selección.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {atmosphereTokens.map((token) => (
              <div key={token.name} className={cn('rounded-xl border p-4', token.className)}>
                <p className="font-semibold">{token.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{token.token}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-2">
        <SeparatorPreview />
      </div>
    </div>
  )
}

function DocumentCard({ hasFile }: { hasFile: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-primary" />
          PDF del programa
        </CardTitle>
        <CardDescription>Documento operativo del curso para impresión, descarga y actualización.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="font-semibold text-foreground">
            {hasFile ? 'NUTRICOSMÉTICA.pdf' : 'PDF del programa no disponible todavía'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFile ? 'Última versión cargada en la ficha del curso.' : 'Sube el dossier antes de publicar o imprimir.'}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {hasFile ? (
          <>
            <Button className="flex-1">
              <Download data-icon="inline-start" />
              Descargar PDF
            </Button>
            <Button className="flex-1" variant="outline">
              <Upload data-icon="inline-start" />
              Sustituir PDF
            </Button>
          </>
        ) : (
          <Button className="w-full">
            <Upload data-icon="inline-start" />
            Subir PDF
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function RunCard() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">NOR-2026-043</CardTitle>
            <CardDescription>Experto en Nutricosmética y Complementos Alimenticios</CardDescription>
          </div>
          <Badge>Inscripción abierta</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span>01/09/2026 - 17/11/2026</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground" />
            <span>Sin sede · Sin aula</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span>0/17 plazas</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-muted-foreground" />
            <span>Precio: Consultar</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ocupación</span>
            <span>0%</span>
          </div>
          <Progress value={0} />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">
          <Eye data-icon="inline-start" />
          Gestionar convocatoria
        </Button>
        <Button variant="outline">
          <FileText data-icon="inline-start" />
          Ficha
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProgramPreview() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Contenidos / programa</CardTitle>
        <CardDescription>Módulos preparados para lectura interna y reutilización en la web pública.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {programBlocks.map((block, index) => (
          <div key={block.title} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{block.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{block.description}</p>
                <div className="mt-3">
                  <StackedBulletList items={block.items} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ChecklistPreview() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Checklist de migración UI</CardTitle>
        <CardDescription>Bloques que deben quedar cubiertos antes de aplicar shadcn al dashboard real.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {checklistItems.map((item, index) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border bg-background p-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </div>
            <div>
              <p className="font-semibold text-foreground">{item}</p>
              <p className="mt-1 text-xs text-muted-foreground">Incluido en la preview local.</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function EntityStatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase()
  if (normalized.includes('tele')) return <MediaBadge label="Teleformación" tone="warning" />
  if (normalized.includes('ocup')) return <MediaBadge label="Ocupados" tone="success" />
  if (normalized.includes('desemple')) return <MediaBadge label="Desempleados" tone="primary" />
  if (normalized.includes('grado')) return <MediaBadge label={label} tone="primary" />
  return <MediaBadge label={label} tone="primary" />
}

function CourseCardPreview({ item }: { item: (typeof courseItems)[number] }) {
  return (
    <Card className="group overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-48 overflow-hidden">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
        <div className="absolute left-4 top-4">
          <EntityStatusBadge label={item.type} />
        </div>
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2 min-h-[3rem] text-xl">{item.title}</CardTitle>
        <CardDescription>{item.area}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <InfoGrid
          items={[
            { label: 'Modalidad', value: item.modality },
            { label: 'Inicio', value: item.start },
            { label: 'Sede', value: item.campus },
          ]}
        />
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Ver curso
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function CycleCardPreview({ item }: { item: (typeof cycleItems)[number] }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-48 overflow-hidden">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
        <div className="absolute left-4 top-4">
          <EntityStatusBadge label={item.level} />
        </div>
      </div>
      <CardHeader>
        <CardTitle className="text-2xl">{item.title}</CardTitle>
        <CardDescription>{item.official}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {[item.duration, 'Semipresencial', item.practice].map((text) => (
          <Badge key={text} variant="outline" className="w-fit">
            {text}
          </Badge>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Ver ciclo
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function ListItemPreview({ item }: { item: (typeof courseItems)[number] }) {
  const isTeletraining = item.type.toLowerCase().includes('tele')
  return (
    <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="grid md:grid-cols-[220px_1fr]">
        <div className="relative h-40 md:h-full">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3">
            <EntityStatusBadge label={item.type} />
          </div>
          {isTeletraining ? (
            <div className="absolute bottom-3 left-3">
              <MediaBadge label="Empieza cuando quieras" tone="success" />
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-4 p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.45fr]">
            <div className="min-w-0">
            <h3 className="line-clamp-2 text-xl font-bold tracking-tight">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Curso de formación profesional</p>
          </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['Área', item.area],
                ['Modalidad', item.modality],
                ['Inicio', item.start],
                ['Sede', item.campus],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-muted/25 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <CardActionFooter>
            <Button>
              Ver curso
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardActionFooter>
        </div>
      </div>
    </Card>
  )
}

function TeacherCardPreview() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5">
        <Avatar className="size-20">
          <AvatarImage src="/media/lucia-corominas.webp" alt="Lucía Corominas" />
          <AvatarFallback>LC</AvatarFallback>
        </Avatar>
        <div>
          <Badge variant="outline">Docente</Badge>
          <h3 className="mt-3 text-lg font-bold">Lucía Corominas Pérez</h3>
          <p className="text-sm text-muted-foreground">Auxiliar de Farmacia · Nutricosmética · Entrenamiento Personal</p>
        </div>
        <Button variant="outline" className="w-full">
          Ver ficha
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  )
}

function CampusCardPreview() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="h-44 overflow-hidden bg-muted">
        <img src="/media/cep-formacion-tenerife-hero.webp" alt="Sede Santa Cruz" className="h-full w-full object-cover" />
      </div>
      <CardHeader>
        <CardTitle>Sede Santa Cruz</CardTitle>
        <CardDescription>Santa Cruz de Tenerife</CardDescription>
      </CardHeader>
      <CardContent>
        <InfoGrid
          items={[
            { label: 'Dirección', value: 'Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro' },
            { label: 'Teléfono', value: '922 219 257' },
            { label: 'Horario', value: 'L-V 10:00-14:00 y 16:00-20:00' },
          ]}
        />
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Visitar sede
          <ArrowRight data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function CardsPreview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {courseItems.map((item) => (
          <CourseCardPreview key={item.title} item={item} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {cycleItems.map((item) => (
          <CycleCardPreview key={item.title} item={item} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <TeacherCardPreview />
        <CampusCardPreview />
        <DocumentCard hasFile />
      </div>
    </div>
  )
}

function ListsPreview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Vista lista de cursos</h3>
          <p className="text-sm text-muted-foreground">Cards alargadas para páginas con muchos cursos.</p>
        </div>
        <ToggleGroup type="single" defaultValue="list">
          <ToggleGroupItem value="cards" aria-label="Vista cards">
            <LayoutDashboard />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Vista lista">
            <PanelRightOpen />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {courseItems.map((item) => (
        <ListItemPreview key={item.title} item={item} />
      ))}
    </div>
  )
}

function CourseSheetPreview() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <PanelRightOpen data-icon="inline-start" />
          Abrir sheet de edición
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Editar datos clave</SheetTitle>
          <SheetDescription>Patrón lateral para cambios rápidos sin abandonar la ficha.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-6">
          <div className="grid gap-2">
            <Label htmlFor="sheet-price">Precio público</Label>
            <Input id="sheet-price" placeholder="Consultar" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sheet-notes">Notas internas</Label>
            <Textarea id="sheet-notes" placeholder="Añade contexto operativo para el equipo" />
          </div>
        </div>
        <SheetFooter>
          <Button>Guardar cambios</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ModalPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Dialog de convocatoria</CardTitle>
          <CardDescription>Formulario compacto para crear o editar convocatoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus data-icon="inline-start" />
                Nueva convocatoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva convocatoria</DialogTitle>
                <DialogDescription>Define sede, aula, fechas y plazas antes de publicar.</DialogDescription>
              </DialogHeader>
              <FormPreview compact />
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button>Guardar convocatoria</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Confirmación destructiva</CardTitle>
          <CardDescription>Usar para cancelaciones y eliminaciones lógicas.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Trash2 data-icon="inline-start" />
                Cancelar cita
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar esta cita?</AlertDialogTitle>
                <AlertDialogDescription>
                  La cita quedará en el historial del lead y podrá consultarse después.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction>Confirmar cancelación</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Sheet operativo</CardTitle>
          <CardDescription>Edición rápida de campos laterales.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[120px] items-center justify-center">
          <CourseSheetPreview />
        </CardContent>
      </Card>
    </div>
  )
}

function FormPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('grid gap-4', compact ? 'py-2' : 'rounded-xl border bg-background p-5')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={compact ? 'compact-start' : 'start'}>Fecha inicio</Label>
          <Input id={compact ? 'compact-start' : 'start'} type="date" defaultValue="2026-09-01" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={compact ? 'compact-end' : 'end'}>Fecha fin</Label>
          <Input id={compact ? 'compact-end' : 'end'} type="date" defaultValue="2026-11-17" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Sede</Label>
          <Select defaultValue="santa-cruz">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="santa-cruz">Sede Santa Cruz</SelectItem>
                <SelectItem value="norte">Sede Norte</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Aula</Label>
          <Select defaultValue="aula-1">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar aula" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="aula-1">Aula 1</SelectItem>
                <SelectItem value="aula-2">Aula 2</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={compact ? 'compact-price' : 'price'}>Precio</Label>
          <Input id={compact ? 'compact-price' : 'price'} placeholder="Consultar" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox defaultChecked />
          Mostrar públicamente
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch defaultChecked />
          Matrícula abierta
        </label>
      </div>
      {!compact ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancelar</Button>
          <Button>Guardar cambios</Button>
        </div>
      ) : null}
    </div>
  )
}

function StatesPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Alert className="shadow-sm">
        <ShieldCheck />
        <AlertTitle>Guardado correctamente</AlertTitle>
        <AlertDescription>Los cambios de la convocatoria se han guardado.</AlertDescription>
      </Alert>
      <Alert variant="destructive" className="shadow-sm">
        <AlertCircle />
        <AlertTitle>Conflicto de aula</AlertTitle>
        <AlertDescription>El aula está ocupada en ese horario por otra convocatoria.</AlertDescription>
      </Alert>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Empty state</CardTitle>
          <CardDescription>No hay citas para el día seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <Plus data-icon="inline-start" />
            Crear primera cita
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function CalendarPreview() {
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00']
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Vista semanal</CardTitle>
              <CardDescription>Días con horas en vertical para agenda comercial.</CardDescription>
            </div>
            <ToggleGroup type="single" defaultValue="week">
              <ToggleGroupItem value="month">Mes</ToggleGroupItem>
              <ToggleGroupItem value="week">Semana</ToggleGroupItem>
              <ToggleGroupItem value="day">Día</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[72px_repeat(5,minmax(0,1fr))] rounded-xl border">
            <div className="border-b bg-muted/35 p-3 text-xs font-semibold text-muted-foreground">Hora</div>
            {['lun 11', 'mar 12', 'mié 13', 'jue 14', 'vie 15'].map((day) => (
              <div key={day} className="border-b border-l bg-muted/35 p-3 text-sm font-semibold">
                {day}
              </div>
            ))}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="border-b p-3 text-xs text-muted-foreground">{hour}</div>
                {['lun', 'mar', 'mie', 'jue', 'vie'].map((day, index) => (
                  <div key={`${hour}-${day}`} className="min-h-16 border-b border-l p-2">
                    {hour === '09:00' && index === 1 ? (
                      <div className="rounded-lg bg-primary/10 p-2 text-xs">
                        <p className="font-semibold text-primary">Llamada Laura</p>
                        <p className="text-muted-foreground">09:30 · Carlos</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>miércoles 13 de mayo</CardTitle>
          <CardDescription>{appointmentItems.length} citas programadas</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {appointmentItems.map((appointment) => (
            <div key={appointment.title} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{appointment.title}</p>
                  <p className="text-sm text-muted-foreground">{appointment.lead}</p>
                </div>
                <Badge variant="outline">{appointment.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock /> {appointment.time}</span>
                <span>{appointment.owner}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Menú interno</CardTitle>
          <CardDescription>Navegación agrupada por operación.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {['Dashboard', 'Cursos', 'Ciclos', 'Programación', 'Calendario citas'].map((item, index) => (
            <Button key={item} variant={index === 4 ? 'secondary' : 'ghost'} className="justify-start">
              {item}
            </Button>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Cursos', '186'],
            ['Convocatorias', '3'],
            ['Leads este mes', '6'],
            ['Citas hoy', '2'],
          ].map(([label, value]) => (
            <FieldCard key={label} label={label} value={value} />
          ))}
        </div>
        <RunCard />
      </div>
    </div>
  )
}

function PublicWebPreview() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden shadow-sm">
          <div className="grid min-h-[430px] md:grid-cols-[1fr_0.9fr]">
            <div className="flex min-w-0 flex-col justify-center gap-5 p-7">
              <div className="flex flex-wrap gap-2">
                <MediaBadge label="Teleformación" tone="warning" />
                <Badge variant="outline">Online</Badge>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight">Curso de Tatuador: Tatuaje Profesional Online</h3>
                <p className="mt-4 text-muted-foreground">
                  Formación online para estudiar a tu ritmo, con matrícula abierta permanente y contenidos orientados a la práctica profesional.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FieldCard label="Duración" value="240 horas" helper="Teleformación" />
                <FieldCard label="Inicio" value="Inmediato" helper="Empieza cuando quieras" />
              </div>
              <Button className="w-fit">Ver curso</Button>
            </div>
            <div className="relative min-h-72 overflow-hidden bg-muted md:min-h-full">
              <img src="/media/tatuaje-profesional-online.webp" alt="Curso online de tatuaje" className="absolute inset-0 size-full object-cover" />
              <div className="absolute left-4 top-4">
                <MediaBadge label="Empieza cuando quieras" tone="success" />
              </div>
            </div>
          </div>
        </Card>
        <CampusCardPreview />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Convocatoria pública</CardTitle>
                <CardDescription>Patrón para fechas, plazas y precio visible sin texto técnico.</CardDescription>
              </div>
              <MediaBadge label="Inscripción abierta" tone="primary" />
            </div>
          </CardHeader>
          <CardContent>
            <InfoGrid
              items={[
                { label: 'Fecha', value: '15 sept 2026', icon: CalendarDays },
                { label: 'Sede', value: 'Sede Santa Cruz', icon: MapPin },
                { label: 'Plazas', value: '25 disponibles', icon: Users },
                { label: 'Precio', value: 'Consultar' },
              ]}
            />
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              Ver convocatoria
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ciclo público</CardTitle>
            <CardDescription>Ficha compacta para ciclos oficiales con datos clave.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <MediaBadge label="GRADO SUPERIOR" tone="primary" />
            <InfoGrid
              items={[
                { label: 'Duración', value: '2000h / 2 cursos' },
                { label: 'Modalidad', value: 'Semipresencial' },
                { label: 'Prácticas', value: '500h en empresa' },
              ]}
            />
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              Ver ciclo
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Artículo SEO</CardTitle>
            <CardDescription>Cabecera de blog legible con metadatos y CTA.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InfoGrid
              items={[
                { label: 'Categoría', value: 'Orientación profesional' },
                { label: 'Lectura', value: '6 min' },
                { label: 'Fuente', value: 'CEP Formación · cursostenerife.es' },
              ]}
            />
            <StackedBulletList
              items={[
                'Título H1 único y metadata preparada para indexación',
                'Párrafos cortos con subtítulos claros',
                'Enlaces internos hacia cursos y convocatorias',
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BrandPanel({
  name,
  description,
  theme,
}: {
  name: string
  description: string
  theme: React.CSSProperties
}) {
  return (
    <div style={theme} className="rounded-2xl border bg-background p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Tenant theme</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="size-11 rounded-full bg-primary shadow-sm" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FieldCard label="Primario" value="Acción principal" helper="Usa bg-primary y text-primary-foreground." />
          <FieldCard label="Estado" value="Publicado" helper="Badge semántico para publicación." />
          <FieldCard label="Documento" value="PDF editable" helper="Descarga, subida y sustitución." editable />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button>
            <Plus data-icon="inline-start" />
            Acción principal
          </Button>
          <Button variant="outline">
            <Eye data-icon="inline-start" />
            Acción secundaria
          </Button>
          <Button variant="ghost">
            Ver detalle
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ShadcnPreviewPage() {
  return (
    <div style={cepThemeVars} className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-2xl border bg-card p-5 shadow-sm lg:p-7">
          <PageHeader
            title="Biblioteca shadcn Akademate / CEP"
            description="Preview local de componentes internos antes de migrar cursos, ciclos y convocatorias."
            icon={LayoutDashboard}
            badge={<Badge variant="outline">Preview local</Badge>}
          />
        </div>

        <Alert className="shadow-sm">
          <BookOpen className="size-4" />
          <AlertTitle>Objetivo de esta versión</AlertTitle>
          <AlertDescription>
            Esta página no cambia la operativa actual. Sirve para aprobar el lenguaje visual de campos, cards,
            documentos, estados y fichas internas antes de aplicarlo a producción.
          </AlertDescription>
        </Alert>

        <ChecklistPreview />

        <PreviewSection
          title="Sistema de diseño"
          description="Tokens base para márgenes, separación, color, radios, sombras y superficies del dashboard."
        >
          <TokenSystemPreview />
        </PreviewSection>

        <PreviewSection
          title="Temas por tenant"
          description="La biblioteca es única. El tenant modifica tokens de color sin duplicar componentes. Cada tab representa una familia que después se podrá extraer a componentes reales."
        >
          <Tabs defaultValue="cep" className="flex flex-col gap-7">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0 shadow-none">
              <TabsTrigger value="cep" className={tenantTabTriggerClass}>
                CEP Formación
              </TabsTrigger>
              <TabsTrigger value="akademate" className={tenantTabTriggerClass}>
                Akademate base
              </TabsTrigger>
              <TabsTrigger value="cards" className={tenantTabTriggerClass}>
                Cards
              </TabsTrigger>
              <TabsTrigger value="lists" className={tenantTabTriggerClass}>
                Listas
              </TabsTrigger>
              <TabsTrigger value="records" className={tenantTabTriggerClass}>
                Fichas
              </TabsTrigger>
              <TabsTrigger value="components" className={tenantTabTriggerClass}>
                Componentes
              </TabsTrigger>
              <TabsTrigger value="modals" className={tenantTabTriggerClass}>
                Modales
              </TabsTrigger>
              <TabsTrigger value="forms" className={tenantTabTriggerClass}>
                Formularios
              </TabsTrigger>
              <TabsTrigger value="states" className={tenantTabTriggerClass}>
                Estados
              </TabsTrigger>
              <TabsTrigger value="calendar" className={tenantTabTriggerClass}>
                Calendario
              </TabsTrigger>
              <TabsTrigger value="public" className={tenantTabTriggerClass}>
                Web pública
              </TabsTrigger>
              <TabsTrigger value="dashboard" className={tenantTabTriggerClass}>
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="course" className={tenantTabTriggerClass}>
                Ficha curso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cep" className="mt-0 rounded-2xl outline-none">
              <BrandPanel
                name="CEP Formación"
                description="Misma biblioteca shadcn, tokens de tenant aplicados con rojo CEP."
                theme={cepThemeVars}
              />
            </TabsContent>

            <TabsContent value="akademate" className="mt-0 rounded-2xl outline-none">
              <BrandPanel
                name="Akademate"
                description="Biblioteca base multitenant con azul Akademate como primario."
                theme={akademateThemeVars}
              />
            </TabsContent>

            <TabsContent value="cards" className="mt-0 rounded-2xl outline-none">
              <CardsPreview />
            </TabsContent>

            <TabsContent value="lists" className="mt-0 rounded-2xl outline-none">
              <ListsPreview />
            </TabsContent>

            <TabsContent value="records" className="mt-0 rounded-2xl outline-none">
              <div style={cepThemeVars} className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
                <div className="flex flex-col gap-6">
                  <Card className="overflow-hidden shadow-sm">
                    <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="flex flex-col gap-5 p-7">
                        <div className="flex flex-wrap gap-2">
                          <Badge>Privado</Badge>
                          <Badge variant="outline">Presencial</Badge>
                          <Badge variant="outline">Área Salud, Bienestar y Deporte</Badge>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Ficha interna de curso</p>
                          <h2 className="mt-3 text-3xl font-black tracking-tight">
                            Experto en Nutricosmética y Complementos Alimenticios
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground">SBD-PRIV-0007</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FieldCard label="Duración" value="48 horas" />
                          <FieldCard label="Precio" value="Consultar" editable />
                        </div>
                      </div>
                      <img
                        src="/website/cep/courses/nutricosmetica-priv.webp"
                        alt="Nutricosmética"
                        className="h-72 w-full object-cover lg:h-full"
                      />
                    </div>
                  </Card>
                  <ProgramPreview />
                </div>
                <aside className="flex flex-col gap-6">
                  <DocumentCard hasFile />
                  <RunCard />
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="components" className="mt-0 rounded-2xl outline-none">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Estados y acciones</CardTitle>
                    <CardDescription>Badges públicos y botones consistentes para todo el dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="flex flex-wrap gap-2">
                      {statusBadges.map((badge) => (
                        <Badge key={badge.label} variant={badge.variant}>
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button>
                        <Edit3 data-icon="inline-start" />
                        Editar curso
                      </Button>
                      <Button variant="outline">
                        <Download data-icon="inline-start" />
                        Descargar PDF
                      </Button>
                      <Button variant="secondary">
                        <Eye data-icon="inline-start" />
                        Ver público
                      </Button>
                      <Button variant="ghost">
                        Acción neutra
                        <ArrowRight data-icon="inline-end" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <DocumentCard hasFile />
              </div>
            </TabsContent>

            <TabsContent value="modals" className="mt-0 rounded-2xl outline-none">
              <ModalPreview />
            </TabsContent>

            <TabsContent value="forms" className="mt-0 rounded-2xl outline-none">
              <FormPreview />
            </TabsContent>

            <TabsContent value="states" className="mt-0 rounded-2xl outline-none">
              <StatesPreview />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0 rounded-2xl outline-none">
              <CalendarPreview />
            </TabsContent>

            <TabsContent value="public" className="mt-0 rounded-2xl outline-none">
              <PublicWebPreview />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0 rounded-2xl outline-none">
              <DashboardPreview />
            </TabsContent>

            <TabsContent value="course" className="mt-0 rounded-2xl outline-none">
              <div style={cepThemeVars} className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
            <div className="flex flex-col gap-6">
              <Card className="overflow-hidden">
                <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="flex flex-col gap-5 p-7">
                    <div className="flex flex-wrap gap-2">
                      <Badge>Privado</Badge>
                      <Badge variant="outline">Presencial</Badge>
                      <Badge variant="outline">Área Salud, Bienestar y Deporte</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">Ficha interna de curso</p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight">
                        Experto en Nutricosmética y Complementos Alimenticios
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">SBD-PRIV-0007</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldCard label="Duración" value="48 horas" />
                      <FieldCard label="Precio" value="Consultar" editable />
                    </div>
                  </div>
                  <img
                    src="/website/cep/courses/nutricosmetica-priv.webp"
                    alt="Nutricosmética"
                    className="h-72 w-full object-cover lg:h-full"
                  />
                </div>
              </Card>

              <ProgramPreview />
            </div>

            <aside className="flex flex-col gap-6">
              <DocumentCard hasFile />
              <RunCard />
              <Card>
                <CardHeader>
                  <CardTitle>Salidas relacionadas</CardTitle>
                  <CardDescription>Listado enlazable a cursos públicos cuando exista slug.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-2/3 text-left">Curso</TableHead>
                        <TableHead className="text-center">Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ['Auxiliar de Farmacia', 'Ciclo / Curso'],
                        ['Auxiliar en Clínicas Estéticas', 'Privado'],
                        ['Dietética y Nutrición', 'Privado'],
                      ].map(([course, type]) => (
                        <TableRow key={course}>
                          <TableCell className="align-middle font-medium">{course}</TableCell>
                          <TableCell className="text-center align-middle">{type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </aside>
          </div>
            </TabsContent>
          </Tabs>
        </PreviewSection>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Inventario de migración</CardTitle>
            <CardDescription>Componentes shadcn instalados y patrón objetivo para páginas internas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {[
              ['Cursos', 'Ficha, PDF, objetivos, programa, convocatorias'],
              ['Ciclos', 'Módulos, prácticas, documentos, convocatorias'],
              ['Convocatorias', 'Sede, aula, horario, precios, plazas'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className={cn('size-4 text-primary', title === 'Convocatorias' && 'hidden')} />
                  <CalendarDays className={cn('size-4 text-primary', title !== 'Convocatorias' && 'hidden')} />
                  <p className="font-semibold">{title}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
