import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Euro,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'
import type React from 'react'
import { PreinscripcionForm } from './PreinscripcionForm'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

type SummaryCardData = {
  icon: React.ReactNode
  label: string
  value: string
  description?: string
}

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return String(image.url).replace(/^\/media\/file\//, '/api/media/file/')
  if (typeof image === 'object' && image.filename) return `/api/media/file/${image.filename}`
  return null
}

function resolveInstructorName(instructor: any): string {
  if (!instructor || typeof instructor !== 'object') return ''
  const fullName = typeof instructor.full_name === 'string' ? instructor.full_name.trim() : ''
  if (fullName) return fullName
  return [instructor.first_name, instructor.last_name].filter(Boolean).join(' ').trim()
}

function resolvePrimaryInstructor(conv: any): any {
  if (typeof conv.instructor === 'object' && conv.instructor !== null) return conv.instructor
  const instructors = Array.isArray(conv.instructors) ? conv.instructors : []
  return instructors.find((item: unknown) => typeof item === 'object' && item !== null) ?? null
}

function resolveCampusHref(campus: any): string | null {
  if (!campus || typeof campus !== 'object') return null
  return `/p/sedes/${campus.slug || campus.id}`
}

function resolveInstructorHref(instructor: any): string | null {
  if (!instructor || typeof instructor !== 'object' || !instructor.id) return null
  return `/p/profesores/${instructor.slug || instructor.id}`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Proximamente'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Proximamente'
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatMonth(value: string | null | undefined): string {
  if (!value) return 'Proximamente'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Proximamente'
  const month = date.toLocaleDateString('es-ES', { month: 'long' })
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`
}

function modalityLabel(modality: string | undefined): string {
  const map: Record<string, string> = {
    presencial: 'Presencial',
    semipresencial: 'Semipresencial',
    online: 'Online',
    mixto: 'Modalidad mixta',
  }
  return modality ? map[modality] || modality : 'A consultar'
}

function levelLabel(level: string | undefined): string {
  const map: Record<string, string> = {
    fp_basica: 'FP BASICA',
    grado_medio: 'GRADO MEDIO',
    grado_superior: 'GRADO SUPERIOR',
    certificado_profesionalidad: 'CERTIFICADO DE PROFESIONALIDAD',
  }
  return level ? map[level] || level.replace(/_/g, ' ').toUpperCase() : 'FORMACION CEP'
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'A consultar'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function textFromRichValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!value || typeof value !== 'object') return ''
  return ''
}

async function findConvocation(slug: string, tenantId: string) {
  const payload = await getPayload({ config: configPromise })
  let result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ codigo: { equals: slug } }, tenantId) as any,
    limit: 1,
    depth: 2,
  })

  if (result.docs.length === 0) {
    result = await payload.find({
      collection: 'course-runs',
      where: withTenantScope({ id: { equals: slug } }, tenantId) as any,
      limit: 1,
      depth: 2,
    })
  }

  return { payload, conv: result.docs[0] as any | undefined }
}

function SummaryCard({ icon, label, value, description }: SummaryCardData) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-lg">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#f2014b]">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-base font-black leading-snug text-gray-950">{value}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p> : null}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CEP'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const { conv } = await findConvocation(slug, tenant.tenantId)
  if (!conv) return { title: 'Convocatoria no encontrada' }

  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const course = typeof conv.course === 'object' ? conv.course : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  const displayName = cycle?.name || course?.title || course?.name || 'Convocatoria CEP'
  const sedeName = campus?.name || ''
  const mode = modalityLabel(cycle?.duration?.modality || course?.modality || conv.modality)
  const start = conv.start_date ? ` Inicio: ${formatDate(conv.start_date)}.` : ''

  return {
    title: `${displayName} - Convocatoria abierta${sedeName ? ` en ${sedeName}` : ''}`,
    description: `Inscripcion abierta para ${displayName}${sedeName ? ` en ${sedeName}` : ''}. Modalidad ${mode}.${start} Solicita informacion sin compromiso con CEP Formacion.`,
    openGraph: {
      title: `${displayName} - Inscripcion abierta`,
      description: `Reserva tu plaza en ${displayName}. Te orientamos sobre fechas, sede, acceso y matricula.`,
    },
  }
}

export default async function ConvocatoriaLandingPage({ params }: Props) {
  const { slug } = await params
  const tenant = await getTenantHostBranding()
  const { conv } = await findConvocation(slug, tenant.tenantId)
  if (!conv) notFound()

  const course = typeof conv.course === 'object' ? conv.course : null
  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  const instructor = resolvePrimaryInstructor(conv)
  const instructorName = resolveInstructorName(instructor)
  const instructorPhoto = resolveImageUrl(instructor?.photo)
  const instructorHref = resolveInstructorHref(instructor)
  const campusHref = resolveCampusHref(campus)

  const cycleImage = cycle ? resolveImageUrl(cycle.image || cycle.featured_image) : null
  const courseImage = course ? resolveImageUrl(course.image || course.featured_image) : null
  const imageUrl = cycleImage || courseImage || '/website/cep/hero/cepformacion-hero-01.png'
  const displayName = cycle?.name || course?.title || course?.name || 'Convocatoria CEP'
  const areaName =
    (typeof course?.area_formativa === 'object' && course.area_formativa?.nombre) ||
    course?.area_formativa ||
    course?.area ||
    cycle?.area ||
    'Formacion profesional'
  const isOnline = [cycle?.duration?.modality, course?.modality, conv.modality].some((value) => value === 'online')
  const modality = isOnline ? 'online' : cycle?.duration?.modality || course?.modality || conv.modality
  const modalityText = modalityLabel(modality)
  const sedeName = isOnline ? 'Online' : campus?.name || 'Sede a confirmar'
  const startMonth = isOnline && !conv.start_date ? 'Empieza cuando quieras' : formatMonth(conv.start_date)
  const startDate = isOnline && !conv.start_date ? 'Empieza cuando quieras' : formatDate(conv.start_date)
  const endDate = conv.end_date ? formatDate(conv.end_date) : ''
  const totalHours = cycle?.duration?.totalHours || course?.duration || course?.duration_hours || course?.duracion
  const practiceHours = cycle?.duration?.practiceHours
  const scheduleText = isOnline
    ? 'Estudia online a tu ritmo'
    : cycle?.duration?.schedule || conv.schedule || course?.schedule || 'Horario a consultar'
  const classFrequency = cycle?.duration?.classFrequency || conv.class_frequency
  const cycleLevel = cycle?.level
  const officialTitle = cycle?.officialTitle
  const competencies = Array.isArray(cycle?.competencies) ? cycle.competencies : []
  const careerPaths = Array.isArray(cycle?.careerPaths) ? cycle.careerPaths : []
  const cycleRequirements = Array.isArray(cycle?.requirements) ? cycle.requirements : []
  const courseObjectives = Array.isArray(course?.landing_objectives)
    ? course.landing_objectives
    : Array.isArray(course?.landingObjectives)
      ? course.landingObjectives
      : []
  const courseProgramBlocks = Array.isArray(course?.landing_program_blocks)
    ? course.landing_program_blocks
    : Array.isArray(course?.landingProgramBlocks)
      ? course.landingProgramBlocks
      : []
  const courseOutcomes = textFromRichValue(course?.landing_outcomes || course?.landingOutcomes || course?.outcomes)
  const courseRequirements = textFromRichValue(course?.landing_access_requirements || course?.landingAccessRequirements)
  const pricing = cycle?.pricing ?? {}
  const effectivePrice =
    (typeof conv.price_override === 'number' ? conv.price_override : null) ??
    (typeof pricing.totalPrice === 'number' ? pricing.totalPrice : null) ??
    (typeof pricing.monthlyFee === 'number' ? pricing.monthlyFee : null) ??
    (typeof course?.base_price === 'number' ? course.base_price : null)
  const enrollmentFee = typeof pricing.enrollmentFee === 'number' ? pricing.enrollmentFee : null
  const monthlyFee = typeof pricing.monthlyFee === 'number' ? pricing.monthlyFee : null
  const paymentOptions = Array.isArray(pricing.paymentOptions)
    ? pricing.paymentOptions.map((item: any) => (typeof item?.option === 'string' ? item.option.trim() : '')).filter(Boolean)
    : []
  const scholarships = Array.isArray(cycle?.scholarships) ? cycle.scholarships : []
  const financingTypes = new Set<string>()
  if (conv.financial_aid_available) financingTypes.add('Financiacion interna CEP')
  if (cycle?.fundaeEligible) financingTypes.add('Bonificacion FUNDAE')
  scholarships.forEach((sch: any) => {
    if (sch?.type === 'beca') financingTypes.add('Becas')
    if (sch?.type === 'subvencion') financingTypes.add('Subvenciones')
    if (sch?.type === 'financiacion') financingTypes.add('Pago financiado')
  })
  const financingTypesList = Array.from(financingTypes)
  const statusLabel = conv.status === 'enrollment_open' ? 'Matricula abierta' : 'Inscripcion abierta'

  const summaryCards: SummaryCardData[] = [
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Inicio',
      value: startDate,
      description: isOnline ? 'Acceso flexible tras formalizar la matricula.' : 'Te confirmamos horario y grupo al reservar plaza.',
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: 'Sede',
      value: sedeName,
      description: isOnline ? 'Sin desplazamientos.' : 'Formacion en instalaciones CEP.',
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: 'Modalidad',
      value: modalityText,
      description: totalHours ? `${totalHours} horas de formacion.` : 'Duracion a confirmar por el equipo academico.',
    },
    {
      icon: <Euro className="h-5 w-5" />,
      label: 'Precio',
      value: formatCurrency(effectivePrice),
      description: conv.financial_aid_available ? 'Opciones de financiacion disponibles.' : 'Consulta condiciones de matricula.',
    },
  ]

  if (officialTitle || cycleLevel) {
    summaryCards.splice(2, 0, {
      icon: <GraduationCap className="h-5 w-5" />,
      label: 'Titulacion',
      value: officialTitle || levelLabel(cycleLevel),
      description: 'Formacion orientada a salida profesional.',
    })
  }

  if (practiceHours) {
    summaryCards.push({
      icon: <Briefcase className="h-5 w-5" />,
      label: 'Practicas',
      value: `${practiceHours} h en empresa`,
      description: 'Practicalidad y contacto con entorno profesional.',
    })
  }

  const trustBadges = [
    { icon: <ShieldCheck className="h-5 w-5" />, title: '+25 anos de experiencia', desc: 'Formando profesionales en Tenerife.' },
    { icon: <Award className="h-5 w-5" />, title: 'Equipo academico CEP', desc: 'Orientacion desde la primera consulta.' },
    { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Reserva sin compromiso', desc: 'Te contactamos para validar disponibilidad.' },
  ]

  return (
    <div className="min-h-screen bg-white selection:bg-red-100 selection:text-red-950">
      <section className="relative overflow-hidden bg-gray-950">
        <div className="absolute inset-0">
          <img src={imageUrl} alt={displayName} className="h-full w-full scale-105 object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/15" />
          <div className="absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-[#f2014b]/35 via-[#f2014b]/12 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full bg-[#f2014b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/20">
                  {statusLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white ring-1 ring-white/20 backdrop-blur">
                  Plazas limitadas
                </span>
              </div>
              <p className="mb-5 text-sm font-black uppercase tracking-[0.22em] text-white/65">
                Convocatoria CEP Formacion
              </p>
              <h1 className="max-w-4xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {displayName}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl">
                Reserva tu plaza y recibe orientacion sobre fechas, modalidad, requisitos y proceso de matricula.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a href="#registro" className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#f2014b] px-8 text-base font-black text-white shadow-xl shadow-red-950/30 transition hover:-translate-y-0.5 hover:bg-[#c9003f]">
                  Solicitar informacion
                </a>
                <a href="#detalles" className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/35 px-8 text-base font-black text-white transition hover:bg-white/10">
                  Ver detalles
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative rounded-[2rem] border border-white/35 bg-white/82 p-7 shadow-2xl shadow-black/25 backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Proxima convocatoria</p>
                    <p className="mt-2 text-2xl font-black text-gray-950">{startMonth}</p>
                  </div>
                  <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-green-700 ring-1 ring-green-100">
                    Activa
                  </div>
                </div>
                <div className="grid gap-4">
                  {summaryCards.slice(0, 4).map((card) => (
                    <div key={card.label} className="flex items-start gap-4 rounded-2xl bg-white/76 p-4 ring-1 ring-gray-900/5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#f2014b]">
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{card.label}</p>
                        <p className="mt-1 text-sm font-black text-gray-950">{card.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  Te contactamos para confirmar plaza y condiciones.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="hidden border-b border-gray-100 bg-white shadow-sm lg:block lg:sticky lg:top-0 lg:z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-950">{displayName}</p>
            <p className="text-xs font-semibold text-gray-500">{modalityText} · {sedeName}</p>
          </div>
          <nav className="flex items-center gap-6 text-sm font-bold text-gray-500">
            <a href="#presentacion" className="hover:text-[#f2014b]">Presentacion</a>
            <a href="#detalles" className="hover:text-[#f2014b]">Detalles</a>
            <a href="#sede" className="hover:text-[#f2014b]">Sede</a>
            {instructorName ? <a href="#docente" className="hover:text-[#f2014b]">Docente</a> : null}
            <a href="#pagos" className="hover:text-[#f2014b]">Pagos</a>
            <a href="#registro" className="rounded-full bg-[#f2014b] px-5 py-2.5 text-white hover:bg-[#c9003f]">Reservar plaza</a>
          </nav>
        </div>
      </div>

      <section className="relative z-10 -mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-xl shadow-gray-950/5 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.slice(0, 4).map((card) => <SummaryCard key={card.label} {...card} />)}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="space-y-20 lg:col-span-8">
            <section id="presentacion" className="scroll-mt-32">
              <div className="mb-6 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-[#f2014b]">
                <span className="h-0.5 w-12 rounded-full bg-[#f2014b]" />
                Presentacion
              </div>
              <h2 className="text-balance text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                Tu proxima oportunidad formativa en CEP
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Esta convocatoria esta pensada para que puedas avanzar con informacion clara sobre modalidad, calendario, sede y proceso de reserva. El equipo de CEP te orientara antes de formalizar la matricula.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {trustBadges.map((badge) => (
                  <div key={badge.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#f2014b]">{badge.icon}</div>
                    <h3 className="font-black text-gray-950">{badge.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="detalles" className="scroll-mt-32 rounded-[2rem] bg-gray-50 p-6 ring-1 ring-gray-100 sm:p-8 lg:p-10">
              <h2 className="text-3xl font-black tracking-tight text-gray-950">Detalles de la convocatoria</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {summaryCards.map((card) => <SummaryCard key={`${card.label}-${card.value}`} {...card} />)}
              </div>
              <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-black text-gray-950">Horario y formato</h3>
                <dl className="mt-5 grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
                  <div><dt className="font-bold text-gray-950">Modalidad</dt><dd className="mt-1">{modalityText}</dd></div>
                  <div><dt className="font-bold text-gray-950">Inicio</dt><dd className="mt-1">{startDate}</dd></div>
                  {endDate ? <div><dt className="font-bold text-gray-950">Fin</dt><dd className="mt-1">{endDate}</dd></div> : null}
                  <div><dt className="font-bold text-gray-950">Horario</dt><dd className="mt-1">{scheduleText}</dd></div>
                  {classFrequency ? <div><dt className="font-bold text-gray-950">Frecuencia</dt><dd className="mt-1">{classFrequency}</dd></div> : null}
                  {totalHours ? <div><dt className="font-bold text-gray-950">Duracion</dt><dd className="mt-1">{totalHours} horas</dd></div> : null}
                  {conv.codigo ? <div><dt className="font-bold text-gray-950">Referencia</dt><dd className="mt-1">{conv.codigo}</dd></div> : null}
                </dl>
              </div>
            </section>

            {(competencies.length > 0 || courseObjectives.length > 0 || courseProgramBlocks.length > 0 || courseOutcomes) && (
              <section className="scroll-mt-32">
                <div className="mb-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f2014b]">Programa</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950">Que vas a trabajar</h2>
                </div>
                {competencies.length > 0 || courseObjectives.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[...competencies.slice(0, 6), ...courseObjectives.slice(0, 6)].slice(0, 8).map((item: any, index: number) => {
                      const title = typeof item === 'string' ? item : item?.title || item?.objective || item?.text
                      const description = typeof item === 'object' ? item?.description : ''
                      return title ? (
                        <div key={`${title}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5">
                          <CheckCircle2 className="mb-4 h-5 w-5 text-[#f2014b]" />
                          <h3 className="font-black text-gray-950">{title}</h3>
                          {description ? <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p> : null}
                        </div>
                      ) : null
                    })}
                  </div>
                ) : null}
                {courseProgramBlocks.length > 0 ? (
                  <div className="mt-8 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
                    {courseProgramBlocks.slice(0, 6).map((block: any, index: number) => (
                      <div key={`${block?.title || 'bloque'}-${index}`} className="grid gap-4 p-6 sm:grid-cols-[56px_1fr]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-sm font-black text-[#f2014b]">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-950">{block?.title || `Bloque ${index + 1}`}</h3>
                          {block?.body ? <p className="mt-2 text-sm leading-6 text-gray-600">{block.body}</p> : null}
                          {Array.isArray(block?.items) && block.items.length > 0 ? (
                            <ul className="mt-4 space-y-2 text-sm text-gray-700">
                              {block.items.map((item: string) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#f2014b]" />{item}</li>)}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {courseOutcomes ? <p className="mt-6 rounded-2xl bg-gray-50 p-6 text-base leading-8 text-gray-700">{courseOutcomes}</p> : null}
              </section>
            )}

            {(careerPaths.length > 0 || practiceHours) && (
              <section className="scroll-mt-32">
                <h2 className="text-3xl font-black tracking-tight text-gray-950">Salidas y practica profesional</h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {careerPaths.slice(0, 8).map((path: any, index: number) => (
                    <div key={`${path?.title || 'salida'}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5">
                      <Briefcase className="mb-4 h-5 w-5 text-[#f2014b]" />
                      <h3 className="font-black text-gray-950">{path?.title || 'Salida profesional'}</h3>
                      {path?.sector ? <p className="mt-2 text-sm text-gray-600">{path.sector}</p> : null}
                    </div>
                  ))}
                  {practiceHours ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                      <Users className="mb-4 h-5 w-5 text-[#f2014b]" />
                      <h3 className="font-black text-gray-950">{practiceHours} h de practicas</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">Practicas orientadas a consolidar competencias profesionales.</p>
                    </div>
                  ) : null}
                </div>
              </section>
            )}

            <section id="sede" className="scroll-mt-32">
              <h2 className="text-3xl font-black tracking-tight text-gray-950">Sede y modalidad</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <MapPin className="mb-4 h-6 w-6 text-[#f2014b]" />
                  <h3 className="text-lg font-black text-gray-950">{sedeName}</h3>
                  {campus && !isOnline ? (
                    <>
                      {campus.address ? <p className="mt-3 text-sm leading-6 text-gray-600">{campus.address}</p> : null}
                      {campus.city ? <p className="text-sm leading-6 text-gray-600">{campus.city}</p> : null}
                      {campus.phone ? <p className="mt-2 text-sm font-bold text-gray-800">Tel. {campus.phone}</p> : null}
                      {campusHref ? <Link href={campusHref} className="mt-5 inline-flex text-sm font-black text-[#f2014b]">Ver ficha de la sede</Link> : null}
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-gray-600">Formacion online sin sede fisica obligatoria para cursar esta convocatoria.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <Clock className="mb-4 h-6 w-6 text-[#f2014b]" />
                  <h3 className="text-lg font-black text-gray-950">Modalidad {modalityText}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{scheduleText}</p>
                  <p className="mt-3 text-sm font-bold text-gray-800">Inicio: {startDate}</p>
                </div>
              </div>
            </section>

            <section id="docente" className="scroll-mt-32">
              <h2 className="text-3xl font-black tracking-tight text-gray-950">Equipo docente</h2>
              {instructorName ? (
                <Link href={instructorHref ?? '#'} className="mt-8 flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-red-100 hover:shadow-lg sm:flex-row sm:items-center">
                  {instructorPhoto ? (
                    <img src={instructorPhoto} alt={instructorName} className="h-28 w-28 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gray-50 text-2xl font-black text-gray-500 ring-1 ring-gray-100">
                      {initials(instructorName)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f2014b]">Docente</p>
                    <h3 className="mt-2 text-2xl font-black text-gray-950">{instructorName}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">Profesional asignado a esta convocatoria.</p>
                    <span className="mt-4 inline-flex text-sm font-black text-[#f2014b]">Ver perfil docente</span>
                  </div>
                </Link>
              ) : (
                <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <p className="text-base font-bold text-gray-950">Equipo academico CEP</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">El docente se confirma con el grupo antes del inicio de la convocatoria.</p>
                </div>
              )}
            </section>

            <section id="pagos" className="scroll-mt-32">
              <h2 className="text-3xl font-black tracking-tight text-gray-950">Precio, financiacion y pagos</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <Euro className="mb-4 h-6 w-6 text-[#f2014b]" />
                  <h3 className="font-black text-gray-950">Precio</h3>
                  <p className="mt-3 text-2xl font-black text-gray-950">{formatCurrency(effectivePrice)}</p>
                  {enrollmentFee !== null ? <p className="mt-2 text-sm text-gray-600">Matricula: {formatCurrency(enrollmentFee)}</p> : null}
                  {monthlyFee !== null ? <p className="text-sm text-gray-600">Mensualidad: {formatCurrency(monthlyFee)}</p> : null}
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <CreditCard className="mb-4 h-6 w-6 text-[#f2014b]" />
                  <h3 className="font-black text-gray-950">Financiacion</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    {(financingTypesList.length ? financingTypesList : ['Opciones a consultar con asesor academico']).map((item) => <li key={item}>· {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <CheckCircle2 className="mb-4 h-6 w-6 text-[#f2014b]" />
                  <h3 className="font-black text-gray-950">Formas de pago</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    {(paymentOptions.length ? paymentOptions : ['Transferencia bancaria', 'Tarjeta', 'Pago fraccionado segun estudio']).map((item) => <li key={item}>· {item}</li>)}
                  </ul>
                </div>
              </div>
            </section>

            {(cycleRequirements.length > 0 || courseRequirements) && (
              <section id="requisitos" className="scroll-mt-32">
                <h2 className="text-3xl font-black tracking-tight text-gray-950">Requisitos de acceso</h2>
                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  {cycleRequirements.length > 0 ? (
                    <ul className="space-y-3">
                      {cycleRequirements.map((req: any, index: number) => (
                        <li key={`${req?.text || 'requisito'}-${index}`} className="flex gap-3 text-sm leading-6 text-gray-700">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f2014b]" />
                          <span>{req?.text || req}{req?.type === 'obligatorio' ? ' (obligatorio)' : ''}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-7 text-gray-700">{courseRequirements}</p>
                  )}
                </div>
              </section>
            )}

            <section className="scroll-mt-32">
              <h2 className="text-3xl font-black tracking-tight text-gray-950">Preguntas frecuentes</h2>
              <div className="mt-8 space-y-4">
                {[
                  ['Que necesito para reservar plaza?', 'Rellena el formulario y el equipo de CEP te contactara para validar disponibilidad, documentacion y condiciones de matricula.'],
                  ['Puedo consultar antes de matricularme?', 'Si. La solicitud es informativa y sin compromiso hasta que confirmes la matricula con el equipo academico.'],
                  ['Hay financiacion?', conv.financial_aid_available ? 'Si, esta convocatoria dispone de opciones de financiacion que se explican durante el contacto.' : 'Te orientamos sobre opciones de pago y condiciones disponibles para esta formacion.'],
                  ['Cuando empieza?', isOnline ? 'En modalidad online puedes empezar cuando quieras segun las condiciones de acceso.' : `La fecha prevista es ${startDate}.`],
                ].map(([q, a]) => (
                  <details key={q} className="group rounded-2xl border border-gray-200 bg-white p-6 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-black text-gray-950">
                      {q}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 transition group-open:rotate-180">
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-7 text-gray-600">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div id="registro" className="sticky top-28 scroll-mt-32">
              <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-950/10">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#f2014b] ring-1 ring-red-100">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-950">Reserva tu plaza</h2>
                  <p className="mt-3 text-sm leading-6 text-gray-600">Te llamamos para confirmar fechas, requisitos, precio y disponibilidad.</p>
                </div>
                <PreinscripcionForm
                  convocatoriaId={String(conv.id)}
                  convocatoriaCodigo={conv.codigo || ''}
                  displayName={displayName}
                  courseName={displayName}
                />
                <div className="mt-7 space-y-3 border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800">
                    <Calendar className="h-5 w-5 text-[#f2014b]" />
                    <span>{startDate}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-800">
                    <MapPin className="h-5 w-5 text-[#f2014b]" />
                    <span>{sedeName}</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Tambien por telefono</p>
                  <a href="tel:922219257" className="mt-2 inline-flex text-2xl font-black text-[#f2014b]">922 219 257</a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 lg:hidden">
        <a href="#registro" className="mx-auto flex max-w-md items-center justify-between rounded-full bg-gray-950 p-2 pl-6 text-white shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-black">Reserva tu plaza</span>
          <span className="rounded-full bg-[#f2014b] px-5 py-3 text-xs font-black uppercase tracking-wide">Solicitar</span>
        </a>
      </div>
    </div>
  )
}
