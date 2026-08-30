'use client'

import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@payload-config/components/ui/accordion'
import { Avatar, AvatarFallback } from '@payload-config/components/ui/avatar'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@payload-config/components/ui/command'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@payload-config/components/ui/radio-group'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@payload-config/components/ui/tooltip'
import {
  AlertCircle,
  Banknote,
  Building2,
  Camera,
  CreditCard,
  Landmark,
  Mail,
  Smartphone,
  UserPlus,
  Wallet,
} from 'lucide-react'
import {
  accessKindFromModality,
  accessKindLabel,
  payableAmount,
  type AccessKind,
  type EnrollmentCourseOption,
  type EnrollmentDraft,
  type EnrollmentPerson,
  type PaymentMethod,
  wizardStepTitle,
  type WizardStepId,
} from './types'

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; hint: string; icon: typeof CreditCard }> = [
  { value: 'sepa', label: 'SEPA', hint: 'Domiciliación bancaria', icon: Landmark },
  { value: 'card_online', label: 'Tarjeta online', hint: 'Visa / Mastercard', icon: CreditCard },
  { value: 'card_pos', label: 'Tarjeta en punto de cobro', hint: 'TPV presencial', icon: Wallet },
  { value: 'transfer', label: 'Transferencia', hint: 'Pago por banco', icon: Building2 },
  { value: 'cash', label: 'Efectivo', hint: 'Cobro en sede', icon: Banknote },
]

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function IdentifyStep({
  query,
  onQuery,
  loading,
  error,
  people,
  onRetry,
  onSelect,
  onCreate,
}: {
  query: string
  onQuery: (value: string) => void
  loading: boolean
  error: string | null
  people: EnrollmentPerson[]
  onRetry: () => void
  onSelect: (person: EnrollmentPerson) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Identificar persona</h2>
        <p className="text-sm text-muted-foreground">
          Busca por nombre, email, teléfono o documento. Si no existe, créala sin salir del flujo.
        </p>
      </div>
      <Command className="rounded-lg border">
        <CommandInput
          value={query}
          onValueChange={onQuery}
          placeholder="Buscar alumno por nombre, email, teléfono o DNI"
        />
        <CommandList>
          {loading ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-3">
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>No se pudo cargar</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>{error}</span>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              <CommandEmpty>No hay coincidencias. Crea una nueva persona para continuar.</CommandEmpty>
              <CommandGroup heading="Personas">
                {people.map((person) => {
                  const name = `${person.firstName} ${person.lastName}`.trim() || person.email || 'Sin nombre'
                  return (
                    <CommandItem key={person.id ?? name} value={name} onSelect={() => onSelect(person)}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.email || person.phone || person.dni || 'Sin contacto'}
                        </p>
                      </div>
                      <Badge variant={person.alreadyEnrolled ? 'secondary' : 'outline'}>
                        {person.alreadyEnrolled
                          ? 'Ya matriculado'
                          : person.hasActiveCourses
                            ? 'Con cursos activos'
                            : 'Sin cursos activos'}
                      </Badge>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
      <Button variant="outline" onClick={onCreate}>
        <UserPlus className="h-4 w-4" />
        Crear nueva persona
      </Button>
    </div>
  )
}

export function PersonalStep({
  draft,
  onChange,
  errors,
}: {
  draft: EnrollmentDraft
  onChange: (patch: Partial<EnrollmentPerson>) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Registrar alumno</h2>
        <p className="text-sm text-muted-foreground">Completa identidad, contacto y documentación.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidad</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={draft.person.firstName}
              onChange={(event) => onChange({ firstName: event.target.value })}
            />
            <FieldError message={errors.firstName} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Apellidos</Label>
            <Input
              id="lastName"
              value={draft.person.lastName}
              onChange={(event) => onChange({ lastName: event.target.value })}
            />
            <FieldError message={errors.lastName} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="dni">DNI / NIE</Label>
            <Input id="dni" value={draft.person.dni} onChange={(event) => onChange({ dni: event.target.value })} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={draft.person.email}
              onChange={(event) => onChange({ email: event.target.value })}
            />
            <FieldError message={errors.email} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={draft.person.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
            />
            <FieldError message={errors.phone} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            <Camera className="mb-2 h-6 w-6" />
            Arrastra una foto o DNI, o pulsa para seleccionar
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => onChange({ photoDataUrl: String(reader.result ?? '') })
                reader.readAsDataURL(file)
              }}
            />
          </label>
          {draft.person.photoDataUrl ? (
            <img src={draft.person.photoDataUrl} alt="Documento adjunto" className="h-32 rounded-md object-cover" />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function CourseStep({
  draft,
  courses,
  loading,
  error,
  onRetry,
  onFilterCampus,
  onSelect,
}: {
  draft: EnrollmentDraft
  courses: EnrollmentCourseOption[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onFilterCampus: (value: string) => void
  onSelect: (course: EnrollmentCourseOption) => void
}) {
  const campuses = Array.from(new Set(courses.map((course) => course.campusName))).sort()
  const filtered = courses.filter(
    (course) => draft.campusFilter === 'todas' || course.campusName === draft.campusFilter
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Curso y convocatoria</h2>
        <p className="text-sm text-muted-foreground">Elige la convocatoria. El tipo de sede define el acceso posterior.</p>
      </div>
      <div className="flex min-w-0 flex-wrap gap-2">
        <Button
          variant={draft.campusFilter === 'todas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterCampus('todas')}
        >
          Todas las sedes
        </Button>
        {campuses.map((campus) => (
          <Button
            key={campus}
            variant={draft.campusFilter === campus ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterCampus(campus)}
          >
            {campus}
          </Button>
        ))}
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudieron cargar las convocatorias</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin convocatorias abiertas"
          description="No hay convocatorias disponibles con los filtros actuales."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((course) => {
            const occupancy = course.seatsMax > 0 ? Math.round((course.seatsUsed / course.seatsMax) * 100) : 0
            const selected = draft.course?.id === course.id
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelect(course)}
                className={`rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/50 ${
                  selected ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{course.name}</p>
                  <Badge variant="outline">{accessKindLabel(course.accessKind)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{course.campusName}</p>
                <p className="text-xs text-muted-foreground">
                  {course.startDate || 'Sin fecha'} · {course.seatsUsed}/{course.seatsMax || '—'} plazas
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${occupancy >= 90 ? 'bg-destructive' : occupancy >= 70 ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(occupancy, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{course.price.toLocaleString('es-ES')} €</span>
                  {occupancy >= 90 ? <Badge variant="destructive">Últimas plazas</Badge> : null}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ConsentStep({
  draft,
  onAccept,
}: {
  draft: EnrollmentDraft
  onAccept: (accepted: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Consentimiento</h2>
        <p className="text-sm text-muted-foreground">
          El texto legal queda en este paso. No forma parte del nombre de la pantalla.
        </p>
      </div>
      <Accordion type="single" collapsible className="rounded-lg border bg-card px-4">
        <AccordionItem value="rgpd">
          <AccordionTrigger>Texto legal y RGPD</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            El centro tratará los datos identificativos y de contacto para gestionar la matrícula, la facturación y el
            acceso a la formación. La base jurídica es la ejecución del contrato y el consentimiento para comunicaciones.
            Puedes ejercer tus derechos de acceso, rectificación y supresión ante la secretaría del centro.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <label className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm">
        <Checkbox
          checked={draft.consentAccepted}
          onCheckedChange={(value) => onAccept(value === true)}
        />
        <span>
          Confirmo que la persona acepta el tratamiento de datos para esta matrícula.
          {draft.consentAt ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              Registrado el {new Date(draft.consentAt).toLocaleString('es-ES')} por {draft.consentBy || 'usuario actual'}
            </span>
          ) : null}
        </span>
      </label>
    </div>
  )
}

export function PaymentStep({
  draft,
  onDiscount,
  onMethod,
  onPlan,
}: {
  draft: EnrollmentDraft
  onDiscount: (value: number) => void
  onMethod: (value: PaymentMethod) => void
  onPlan: (value: 'unico' | 'fraccionado') => void
}) {
  const total = payableAmount(draft)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Matrícula y cobro</h2>
        <p className="text-sm text-muted-foreground">Desglose, descuento y método de pago.</p>
      </div>
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <div className="flex justify-between">
            <span>Precio curso</span>
            <span>{(draft.course?.price ?? 0).toLocaleString('es-ES')} €</span>
          </div>
          <div className="flex justify-between">
            <span>Matrícula</span>
            <span>{(draft.course?.enrollmentFee ?? 0).toLocaleString('es-ES')} €</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="discount">Descuento</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              className="h-9 w-32"
              value={draft.discount}
              onChange={(event) => onDiscount(Number(event.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{total.toLocaleString('es-ES')} €</span>
          </div>
        </CardContent>
      </Card>
      <RadioGroup value={draft.paymentPlan} onValueChange={(value) => onPlan(value as 'unico' | 'fraccionado')}>
        <RadioGroupItem value="unico">Pago único</RadioGroupItem>
        <RadioGroupItem value="fraccionado">Plan fraccionado (3 cuotas)</RadioGroupItem>
      </RadioGroup>
      {draft.paymentPlan === 'fraccionado' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuotas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex justify-between border-b py-2 last:border-0">
                <span>Cuota {n}</span>
                <span>{Math.round(total / 3).toLocaleString('es-ES')} €</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = draft.paymentMethod === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onMethod(option.value)}
              className={`flex items-start gap-3 rounded-lg border bg-card p-4 text-left ${
                selected ? 'border-primary ring-2 ring-primary/20' : ''
              }`}
            >
              <Icon className="mt-0.5 h-5 w-5 text-primary" />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AccessStep({
  draft,
  cameraError,
  onCapture,
  onPass,
  onChannel,
  onRetryCamera,
}: {
  draft: EnrollmentDraft
  cameraError: string | null
  onCapture: () => void
  onPass: (value: EnrollmentDraft['accessPass']) => void
  onChannel: (value: 'email' | 'sms') => void
  onRetryCamera: () => void
}) {
  const kind = draft.course?.accessKind ?? 'fisico'
  const showPhysical = kind === 'fisico' || kind === 'hibrido'
  const showVirtual = kind === 'virtual' || kind === 'hibrido'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Acceso y credencial</h2>
        <p className="text-sm text-muted-foreground">
          {kind === 'virtual'
            ? 'Sede virtual: se generan credenciales de Campus Virtual, sin foto ni puerta física.'
            : kind === 'hibrido'
              ? 'Sede híbrida: credencial física y acceso virtual para la misma persona.'
              : 'Sede física: captura de foto y generación de QR o pase temporal.'}
        </p>
      </div>
      {showPhysical ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acceso físico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cameraError ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>No se pudo conectar la webcam</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>Concede permiso de cámara o usa un pase temporal.</span>
                  <Button size="sm" variant="outline" onClick={onRetryCamera}>
                    Reintentar
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {draft.accessPhoto ? (
              <img src={draft.accessPhoto} alt="Foto de credencial" className="h-32 rounded-md object-cover" />
            ) : (
              <Button variant="outline" onClick={onCapture}>
                <Camera className="h-4 w-4" />
                Capturar foto
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant={draft.accessPass === 'credential' ? 'default' : 'outline'} onClick={() => onPass('credential')}>
                Credencial QR
              </Button>
              <Button variant={draft.accessPass === 'temporary' ? 'default' : 'outline'} onClick={() => onPass('temporary')}>
                Pase temporal
              </Button>
              <Button variant={draft.accessPass === 'visitor' ? 'default' : 'outline'} onClick={() => onPass('visitor')}>
                Visitante
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {showVirtual ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acceso virtual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Se generará un usuario temporal o magic link para el Campus Virtual.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant={draft.virtualSendChannel === 'email' ? 'default' : 'outline'} onClick={() => onChannel('email')}>
                <Mail className="h-4 w-4" />
                Enviar por email
              </Button>
              <Button variant={draft.virtualSendChannel === 'sms' ? 'default' : 'outline'} onClick={() => onChannel('sms')}>
                <Smartphone className="h-4 w-4" />
                Enviar por SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function ReviewStep({
  draft,
  onEdit,
}: {
  draft: EnrollmentDraft
  onEdit: (step: WizardStepId) => void
}) {
  const sections: Array<{ step: WizardStepId; value: string }> = [
    {
      step: 'personal',
      value: `${draft.person.firstName} ${draft.person.lastName} · ${draft.person.email} · ${draft.person.phone}`,
    },
    {
      step: 'course',
      value: draft.course
        ? `${draft.course.name} · ${draft.course.campusName} · ${accessKindLabel(draft.course.accessKind)}`
        : 'Sin convocatoria',
    },
    {
      step: 'consent',
      value: draft.consentAccepted ? `Aceptado ${draft.consentAt ? new Date(draft.consentAt).toLocaleString('es-ES') : ''}` : 'Pendiente',
    },
    {
      step: 'payment',
      value: `${payableAmount(draft).toLocaleString('es-ES')} € · ${draft.paymentMethod ?? 'sin método'}`,
    },
    {
      step: 'access',
      value:
        draft.course?.accessKind === 'virtual'
          ? `Credencial virtual por ${draft.virtualSendChannel ?? 'email'}`
          : draft.accessPass ?? 'Sin pase',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Resumen y confirmación</h2>
        <p className="text-sm text-muted-foreground">Revisa los datos. Puedes volver a cualquier paso sin perder información.</p>
      </div>
      {sections.map((section) => (
        <Card key={section.step}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{wizardStepTitle(section.step)}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(section.step)}>
              Editar
            </Button>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{section.value}</CardContent>
        </Card>
      ))}
    </div>
  )
}

export function mapCourseRun(row: Record<string, unknown>): EnrollmentCourseOption {
  const seatsMax = Number(row.plazasTotales ?? 0)
  const seatsUsed = Number(row.plazasOcupadas ?? 0)
  const modality = String(row.modalidad ?? 'presencial')
  return {
    id: String(row.id ?? ''),
    name: String(row.cursoNombre ?? 'Curso'),
    campusId: String(row.campusId ?? ''),
    campusName: String(row.campusNombre ?? 'Sin sede'),
    startDate: String(row.fechaInicio ?? '').slice(0, 10),
    endDate: String(row.fechaFin ?? '').slice(0, 10),
    seatsUsed,
    seatsMax,
    price: Number(row.precio ?? 0),
    enrollmentFee: Number(row.matricula ?? 0),
    modality,
    accessKind: accessKindFromModality(modality),
    status: String(row.estado ?? ''),
  }
}

export function mapLeadToPerson(lead: Record<string, unknown>): EnrollmentPerson {
  return {
    id: String(lead.id ?? ''),
    firstName: String(lead.first_name ?? ''),
    lastName: String(lead.last_name ?? ''),
    dni: String(lead.dni ?? ''),
    email: String(lead.email ?? ''),
    phone: String(lead.phone ?? ''),
    photoDataUrl: null,
    alreadyEnrolled: Boolean(lead.enrollment_id),
    hasActiveCourses: ['enrolling', 'enrolled'].includes(String(lead.status ?? '')),
  }
}

export function NextDisabledTooltip({
  disabled,
  reason,
  children,
}: {
  disabled: boolean
  reason: string
  children: ReactNode
}) {
  if (!disabled) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}

export function inferAccessKind(course: EnrollmentCourseOption | null): AccessKind {
  return course?.accessKind ?? 'fisico'
}
