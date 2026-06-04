'use client'

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Factory,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Play,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'

type StepId =
  | 'dashboard'
  | 'curso'
  | 'convocatoria'
  | 'recursos'
  | 'planning'
  | 'web'
  | 'publicidad'
  | 'leads'
  | 'matriculas'
  | 'kpis'
  | 'campus'
  | 'certificados'
  | 'finanzas'

type Step = {
  id: StepId
  label: string
  title: string
  line: string
  nextAction: string
  href: string
  tag: string
  Icon: typeof LayoutDashboard
}

const steps: Step[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Asi funcionara Akademate para CEP Formacion',
    line: 'Un panel unico para coordinar cursos, convocatorias, leads y alumnos.',
    nextAction: 'Pulsa Curso para ver como nace la ficha base.',
    href: '/dashboard',
    tag: 'Acceso interno',
    Icon: LayoutDashboard,
  },
  {
    id: 'curso',
    label: 'Curso',
    title: 'Crear curso base',
    line: 'La ficha del curso concentra modalidad, duracion, precio y contenidos.',
    nextAction: 'Pulsa Convocatoria para abrir una edicion real del curso.',
    href: '/cursos/nuevo',
    tag: 'Acceso interno',
    Icon: BookOpen,
  },
  {
    id: 'convocatoria',
    label: 'Convocatoria',
    title: 'Abrir una convocatoria',
    line: 'La convocatoria activa sede, aula, docente, planning, web y leads.',
    nextAction: 'Pulsa Sedes para asignar espacios y docente.',
    href: '/convocatorias',
    tag: 'Acceso interno',
    Icon: ClipboardList,
  },
  {
    id: 'recursos',
    label: 'Sedes',
    title: 'Asignar sede, aula y docente',
    line: 'Cada clase queda vinculada a espacios fisicos y personal disponible.',
    nextAction: 'Pulsa Planning para comprobar horarios y conflictos.',
    href: '/sedes',
    tag: 'Acceso interno',
    Icon: MapPin,
  },
  {
    id: 'planning',
    label: 'Planning',
    title: 'Generar slots sin conflictos',
    line: 'El calendario muestra ocupacion, solapes y bloqueos antes de publicar.',
    nextAction: 'Pulsa Web publica para ver la landing generada.',
    href: '/programacion',
    tag: 'Acceso interno',
    Icon: CalendarDays,
  },
  {
    id: 'web',
    label: 'Web publica',
    title: 'Landing generada',
    line: 'La pagina publica queda lista con fechas, plazas, sede y formulario.',
    nextAction: 'Pulsa Publicidad para ver la campana conectada.',
    href: '/landing/farmacia-y-parafarmacia-demo',
    tag: 'Demo publica',
    Icon: FileText,
  },
  {
    id: 'publicidad',
    label: 'Publicidad',
    title: 'Campana Meta/Facebook',
    line: 'La convocatoria prepara copy, creatividad, enlace y tracking.',
    nextAction: 'Pulsa Leads para ver la entrada automatica del contacto.',
    href: '/campanas',
    tag: 'Acceso interno',
    Icon: Megaphone,
  },
  {
    id: 'leads',
    label: 'Leads',
    title: 'Lead entra al dashboard',
    line: 'El formulario crea el lead con curso, origen y proxima accion.',
    nextAction: 'Pulsa Matriculas para convertir el lead en alumno.',
    href: '/leads',
    tag: 'Acceso interno',
    Icon: Users,
  },
  {
    id: 'matriculas',
    label: 'Matriculas',
    title: 'Convertir lead en alumno',
    line: 'La matricula ocupa plaza y conecta alumno, sede, aula y convocatoria.',
    nextAction: 'Pulsa KPIs para medir conversion, plazas y sedes.',
    href: '/matriculas',
    tag: 'Acceso interno',
    Icon: GraduationCap,
  },
  {
    id: 'kpis',
    label: 'KPIs',
    title: 'Medir conversion y ocupacion',
    line: 'Graficas para leads, plazas, sedes, campanas y conversion.',
    nextAction: 'Pulsa Campus para ver el portal del alumno.',
    href: '/analiticas',
    tag: 'Acceso interno',
    Icon: BarChart3,
  },
  {
    id: 'campus',
    label: 'Campus',
    title: 'Campus alumno',
    line: 'Portal futuro para materiales, lecciones, asistencia y progreso.',
    nextAction: 'Pulsa Certificados para ver la emision documental.',
    href: '/campus-virtual',
    tag: 'Futuro',
    Icon: GraduationCap,
  },
  {
    id: 'certificados',
    label: 'Certificados',
    title: 'Certificados',
    line: 'Emision futura al finalizar cursos y validar progreso.',
    nextAction: 'Pulsa Finanzas para ver cobros, pagos y margen.',
    href: '/campus-virtual/certificados',
    tag: 'Futuro',
    Icon: FileText,
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    title: 'Facturacion y finanzas',
    line: 'Control futuro de cobros, pagos a profesores y rentabilidad.',
    nextAction: 'Fin del recorrido: vuelve al Dashboard para repasarlo.',
    href: '/finanzas',
    tag: 'Futuro',
    Icon: Factory,
  },
]

const generatedItems = ['Landing publica', 'Campana Meta', 'Formulario', 'Lead Laura Garcia']
const publicBaseUrl = 'https://cepformacion.akademate.com'

const publicLinks = {
  courses: `${publicBaseUrl}/p/cursos`,
  courseDetail: `${publicBaseUrl}/p/cursos/farmacia-y-dermocosmetica-priv`,
  venue: `${publicBaseUrl}/p/sedes/sede-santa-cruz`,
  convocatorias: `${publicBaseUrl}/p/convocatorias`,
}

export function PresentationCepClient() {
  const [activeStep, setActiveStep] = useState<StepId>('dashboard')
  const [automationReady, setAutomationReady] = useState(false)
  const activeIndex = steps.findIndex((step) => step.id === activeStep)
  const active = steps[activeIndex] ?? steps[0]

  const progress = useMemo(() => ((activeIndex + 1) / steps.length) * 100, [activeIndex])

  function goToIndex(index: number) {
    const boundedIndex = Math.min(Math.max(index, 0), steps.length - 1)
    setActiveStep(steps[boundedIndex].id)
  }

  function showFullFlow() {
    setAutomationReady(true)
    setActiveStep('convocatoria')
  }

  const nextStep = steps[Math.min(activeIndex + 1, steps.length - 1)]

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f5f6f8] text-[#18181b]">
      <header className="shrink-0 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2 lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative h-9 w-36 shrink-0 overflow-hidden rounded bg-white">
              <Image
                src="/logos/cep-formacion-logo-rectangular.png"
                alt="CEP Formacion"
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-[#d71920]">
                Tutorial guiado
              </p>
              <h1 className="truncate text-base font-semibold md:text-xl">
                Asi funcionara Akademate para CEP Formacion
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => goToIndex(activeIndex - 1)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:border-[#d71920]"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => goToIndex(activeIndex + 1)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#d71920] px-3 text-sm font-semibold text-white hover:bg-[#b9141b]"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-zinc-200">
          <div className="h-full bg-[#d71920]" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 gap-3 px-3 py-3 lg:grid-cols-[330px_minmax(0,1fr)] lg:px-6">
        <aside className="flex min-h-0 flex-col rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Que clicar ahora
            </span>
            <button
              type="button"
              onClick={showFullFlow}
              className="inline-flex items-center gap-1 rounded-md border border-[#d71920]/30 px-2 py-1 text-xs font-semibold text-[#d71920] hover:bg-[#fff1f2]"
            >
              <Play className="h-3.5 w-3.5" />
              Ver flujo completo
            </button>
          </div>

          <div className="mb-3 rounded-lg border border-[#d71920] bg-[#fff1f2] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d71920]">
              Paso activo
            </p>
            <p className="mt-1 text-sm font-semibold">{active.title}</p>
            <p className="mt-1 text-sm text-zinc-700">{active.nextAction}</p>
          </div>

          <nav className="min-h-0 flex-1 overflow-auto pr-1">
            <div className="grid gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === active.id
              const isNext = step.id === nextStep.id && !isActive
              const Icon = step.Icon

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={[
                    'group grid scroll-mt-24 grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-md border p-2 text-left transition',
                    isActive
                      ? 'border-[#d71920] bg-[#fff1f2] shadow-sm'
                      : isNext
                        ? 'animate-pulse border-[#d71920] bg-[#fff1f2] shadow-[0_0_0_3px_rgba(215,25,32,0.16),0_10px_28px_rgba(215,25,32,0.18)]'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-md',
                      isActive || isNext ? 'bg-[#d71920] text-white' : 'bg-zinc-100 text-zinc-600',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {index + 1}. {step.label}
                    </span>
                    <span className={['block truncate text-xs', isNext ? 'font-semibold text-[#d71920]' : 'text-zinc-500'].join(' ')}>
                      {isActive ? 'Estas aqui' : isNext ? 'Pulsa aqui ahora' : step.tag}
                    </span>
                  </span>
                </button>
              )
            })}
            </div>
          </nav>
        </aside>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
          <section className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#d71920]">{active.label}</p>
                <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{active.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">{active.line}</p>
              </div>
              <Link
                href={active.href}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-semibold hover:border-[#d71920]"
              >
                {active.href}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="grid min-h-0 gap-3">
            <div className="min-h-0 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <DemoSessionFrame activeStep={activeStep} active={active} automationReady={automationReady} />
            </div>
          </section>

          <div className="flex items-center justify-between gap-3 md:hidden">
            <button
              type="button"
              onClick={() => goToIndex(activeIndex - 1)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => goToIndex(activeIndex + 1)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#d71920] px-3 text-sm font-semibold text-white"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function DemoSessionFrame({
  activeStep,
  active,
  automationReady,
}: {
  activeStep: StepId
  active: Step
  automationReady: boolean
}) {
  return (
    <div className="flex h-full min-h-[520px] flex-col bg-[#0f1115]">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-2 flex-1 truncate rounded bg-white/10 px-3 py-1 text-xs text-zinc-300">
          tenant-demo.cepformacion.akademate.com{active.href}
        </div>
        <span className="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-white">
          Sesion demo logueada
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto bg-[#f7f8fa] p-3">
        <div>
          {activeStep === 'dashboard' && <DashboardScreen />}
          {activeStep === 'curso' && <CourseScreen />}
          {activeStep === 'convocatoria' && <RunScreen automationReady={automationReady} />}
          {activeStep === 'recursos' && <ResourcesScreen />}
          {activeStep === 'planning' && <PlanningScreen />}
          {activeStep === 'web' && <LandingScreen />}
          {activeStep === 'publicidad' && <AdsScreen automationReady={automationReady} />}
          {activeStep === 'leads' && <LeadsScreen automationReady={automationReady} />}
          {activeStep === 'matriculas' && <EnrollmentScreen />}
          {activeStep === 'kpis' && <KpisScreen />}
          {activeStep === 'campus' && <CampusRoadmapScreen />}
          {activeStep === 'certificados' && <CertificatesRoadmapScreen />}
          {activeStep === 'finanzas' && <FinanceRoadmapScreen />}
        </div>
      </div>
    </div>
  )
}

function MockBrowser({
  activeStep,
  automationReady,
}: {
  activeStep: StepId
  automationReady: boolean
}) {
  return (
    <div className="h-full bg-[#0f1115]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 rounded bg-white/10 px-3 py-1 text-xs text-zinc-300">
          cepformacion.akademate.com/{activeStep}
        </div>
      </div>
      <div className="bg-[#f7f8fa] p-4 md:p-6">
        {activeStep === 'dashboard' && <DashboardScreen />}
        {activeStep === 'curso' && <CourseScreen />}
        {activeStep === 'convocatoria' && <RunScreen automationReady={automationReady} />}
        {activeStep === 'recursos' && <ResourcesScreen />}
        {activeStep === 'planning' && <PlanningScreen />}
        {activeStep === 'web' && <LandingScreen />}
        {activeStep === 'publicidad' && <AdsScreen automationReady={automationReady} />}
        {activeStep === 'leads' && <LeadsScreen automationReady={automationReady} />}
        {activeStep === 'matriculas' && <EnrollmentScreen />}
        {activeStep === 'kpis' && <KpisScreen />}
        {activeStep === 'campus' && <CampusRoadmapScreen />}
        {activeStep === 'certificados' && <CertificatesRoadmapScreen />}
        {activeStep === 'finanzas' && <FinanceRoadmapScreen />}
      </div>
    </div>
  )
}

function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d71920]">Akademate CEP</p>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            Demo
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
            Requiere acceso interno
          </span>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function PublicPageButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#d71920] px-3 text-sm font-semibold text-white hover:bg-[#b9141b]"
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  )
}

function DashboardScreen() {
  return (
    <AppShell title="Dashboard operativo">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Convocatorias activas', '12', '4 publicadas'],
          ['Leads nuevos', '38', 'Meta y web'],
          ['Plazas ocupadas', '73%', 'Santa Cruz'],
          ['Alertas', '3', 'Resolver antes de publicar'],
        ].map(([label, value, help]) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{help}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="mb-3 font-semibold">Convocatorias de hoy</p>
          {['Farmacia y Parafarmacia', 'Higiene Bucodental', 'Atencion sociosanitaria'].map(
            (course, index) => (
              <div key={course} className="grid grid-cols-[1fr_auto] gap-3 border-t border-zinc-100 py-3">
                <span className="font-medium">{course}</span>
                <span className="rounded bg-zinc-100 px-2 py-1 text-xs">
                  {index === 0 ? '24 plazas' : 'Revision'}
                </span>
              </div>
            ),
          )}
        </div>
        <div className="rounded-lg border border-[#f1b5b8] bg-[#fff8f8] p-4">
          <p className="mb-3 font-semibold text-[#d71920]">Alertas operativas</p>
          {['Aula ocupada 18:00', 'Docente solapado', 'Capacidad insuficiente'].map((alert) => (
            <div key={alert} className="mb-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm">
              {alert}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {[
          ['Tareas admision', 'Contactar 8 leads nuevos'],
          ['Operacion academica', 'Confirmar aula 2 y docente'],
          ['Web y campanas', '2 landings pendientes de publicar'],
        ].map(([title, value]) => (
          <div key={title} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-zinc-600">{value}</p>
          </div>
        ))}
      </div>
    </AppShell>
  )
}

function CourseScreen() {
  return (
    <AppShell title="Crear curso">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-zinc-200 p-4">
          <Field label="Nombre" value="Farmacia y Parafarmacia" />
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Modalidad" value="Presencial" />
            <Field label="Duracion" value="2.000 horas" />
            <Field label="Area" value="Sanidad" />
            <Field label="Precio" value="Consultar" />
            <Field label="Estado" value="Publicado" />
            <Field label="Requisitos" value="Acceso FP" />
          </div>
          <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
            Contenidos: dispensacion, oficina de farmacia, primeros auxilios.
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <Badge label="Plantilla web" />
            <Badge label="Formulario base" />
            <Badge label="Area sanitaria" />
          </div>
          <div className="mt-4">
            <PublicPageButton href={publicLinks.courses} label="Ver catalogo publico" />
          </div>
        </div>
        <div className="relative min-h-[260px] overflow-hidden rounded-lg">
          <img
            src="/media/farmacia-hero.png"
            alt="Farmacia y Parafarmacia"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-4 text-white">
            <p className="text-xl font-semibold">Ficha lista para convocatorias</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function RunScreen({ automationReady }: { automationReady: boolean }) {
  return (
    <AppShell title="Crear convocatoria">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Curso" value="Farmacia y Parafarmacia" />
            <Field label="Convocatoria" value="Marzo 2026" />
            <Field label="Sede" value="CEP Santa Cruz" />
            <Field label="Aula" value="Aula 2" />
            <Field label="Docente" value="Docente asignado" />
            <Field label="Plazas" value="24 plazas" />
            <Field label="Horario" value="L y X, 17:00-20:00" />
            <Field label="Precio" value="Consultar" />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <Badge label="Borrador" />
            <Badge label="24 plazas" />
            <Badge label="Landing pendiente" />
            <Badge label="Campana pendiente" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-3 font-semibold">Al guardar</p>
          {generatedItems.map((item) => (
            <div key={item} className="mb-2 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm">
              <CheckCircle2 className={automationReady ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-zinc-300'} />
              <span className={automationReady ? 'text-zinc-800' : 'text-zinc-400'}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function ResourcesScreen() {
  return (
    <AppShell title="Sedes, aulas y docente">
      <div className="mb-4 flex justify-end">
        <PublicPageButton href={publicLinks.venue} label="Ver sede publica" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ['/images/sedes/sede-cep-norte.png', 'CEP Norte', 'Aula practica', '18 plazas'],
          ['/images/sedes/sede-cep-santa-cruz.png', 'CEP Santa Cruz', 'Aula 2', '24 plazas'],
        ].map(([src, sede, aula, capacity]) => (
          <div key={sede} className="overflow-hidden rounded-lg border border-zinc-200">
            <div className="relative h-40">
              <img src={src} alt={sede} className="h-full w-full object-cover" />
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 text-sm">
              <Badge label={sede} />
              <Badge label={aula} />
              <Badge label={capacity} />
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 p-4 text-sm">
              <span className="rounded bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">Disponible</span>
              <span className="rounded bg-zinc-100 px-3 py-2 font-semibold text-zinc-700">Proyector</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          Docente asignado: disponible lunes y miercoles, 17:00-20:00.
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          Regla: no solapar docente en dos sedes.
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          Regla: capacidad minima igual a plazas publicadas.
        </div>
      </div>
    </AppShell>
  )
}

function PlanningScreen() {
  const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie']
  const rows = ['09:00', '12:00', '17:00', '20:00']

  return (
    <AppShell title="Planning semanal">
      <div className="grid grid-cols-[70px_repeat(5,minmax(86px,1fr))] overflow-hidden rounded-lg border border-zinc-200 text-sm">
        <div className="bg-zinc-100 p-2 font-semibold">Hora</div>
        {days.map((day) => (
          <div key={day} className="bg-zinc-100 p-2 font-semibold">
            {day}
          </div>
        ))}
        {rows.map((row) => (
          <Fragment key={row}>
            <div key={`${row}-hour`} className="border-t border-zinc-200 p-2 text-zinc-500">
              {row}
            </div>
            {days.map((day, index) => {
              const state =
                row === '17:00' && (day === 'Lun' || day === 'Mie')
                  ? 'ok'
                  : row === '12:00' && index === 2
                    ? 'conflict'
                    : row === '20:00' && index === 4
                      ? 'pending'
                      : 'free'

              return <Slot key={`${row}-${day}`} state={state} />
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {['Aula ocupada', 'Docente solapado', 'Capacidad insuficiente'].map((alert) => (
          <div key={alert} className="rounded-md border border-[#f1b5b8] bg-[#fff8f8] px-3 py-2 text-sm text-[#9f1239]">
            {alert}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
        <p className="mb-3 font-semibold">Resultado de validacion</p>
        <div className="grid gap-2 md:grid-cols-3">
          <Badge label="32 slots generados" />
          <Badge label="2 conflictos bloqueantes" />
          <Badge label="1 sugerencia IA" />
        </div>
      </div>
    </AppShell>
  )
}

function LandingScreen() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3">
        <Image src="/logos/cep-formacion-logo-rectangular.png" alt="CEP Formacion" width={160} height={42} />
        <PublicPageButton href={publicLinks.courseDetail} label="Ver pagina publica real" />
      </div>
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[420px]">
          <img
            src="/media/cep-formacion-tenerife-hero.webp"
            alt="CEP Formacion Tenerife"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute bottom-0 max-w-xl p-8 text-white">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em]">Marzo 2026</p>
            <h3 className="text-4xl font-semibold">Farmacia y Parafarmacia</h3>
            <p className="mt-3 text-lg">CEP Santa Cruz · Aula 2 · 24 plazas</p>
          </div>
        </div>
        <div className="p-6">
          <p className="mb-4 text-xl font-semibold">Formulario conectado al dashboard</p>
          <Field label="Nombre" value="Laura Garcia" />
          <Field label="Telefono" value="600 000 000" />
          <Field label="Curso" value="Farmacia y Parafarmacia" />
          <button className="mt-3 w-full rounded-md bg-[#d71920] px-4 py-3 font-semibold text-white">
            Enviar solicitud
          </button>
          <div className="mt-4 grid gap-2 text-sm">
            <Badge label="Origen: landing" />
            <Badge label="Curso vinculado" />
            <Badge label="Convocatoria vinculada" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AdsScreen({ automationReady }: { automationReady: boolean }) {
  return (
    <AppShell title="Publicidad Meta/Facebook">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="mb-3 font-semibold">Creatividad generada</p>
          <div className="relative h-64 overflow-hidden rounded-lg">
            <img src="/media/higiene-hero.png" alt="Creatividad Meta" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 p-4 text-white">
              <p className="text-2xl font-semibold">Abre tu plaza en CEP</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <Field label="Copy" value="Nueva convocatoria de Farmacia y Parafarmacia." />
          <Field label="Enlace" value={publicLinks.courseDetail} />
          <Field label="Tracking" value="Meta · Marzo 2026 · Farmacia" />
          <Field label="Estado" value={automationReady ? 'Publicado' : 'Borrador'} />
          <div className="grid gap-2 md:grid-cols-3">
            <Badge label="UTM creada" />
            <Badge label="Formulario conectado" />
            <Badge label="Lead source Meta" />
          </div>
          <div className="mt-4">
            <PublicPageButton href={publicLinks.courseDetail} label="Abrir pagina del anuncio" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function LeadsScreen({ automationReady }: { automationReady: boolean }) {
  return (
    <AppShell title="Formulario y leads">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-semibold">Formulario publico</p>
            <PublicPageButton href={publicLinks.courseDetail} label="Ver formulario publico" />
          </div>
          <Field label="Nombre" value="Laura Garcia" />
          <Field label="Curso" value="Farmacia y Parafarmacia" />
          <Field label="Origen" value="Meta/Facebook" />
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-3 font-semibold text-emerald-800">Lead creado automaticamente</p>
          <Field label="Estado" value={automationReady ? 'Nuevo' : 'Pendiente de guardar'} />
          <Field label="Responsable" value="Equipo admisiones" />
          <Field label="Proxima accion" value="Llamar hoy" />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {['Nuevo', 'Contactado', 'Documentacion', 'Matriculado', 'Descartado'].map((column, index) => (
          <div key={column} className="rounded-lg border border-zinc-200 bg-white p-3">
            <p className="mb-3 text-sm font-semibold">{column}</p>
            {index < 3 && <div className="rounded-md bg-zinc-100 p-2 text-sm">Laura Garcia</div>}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
        <p className="mb-3 font-semibold">Ficha del lead</p>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Telefono" value="600 000 000" />
          <Field label="Campana" value="Meta Marzo 2026" />
          <Field label="Interes" value="Alta prioridad" />
          <Field label="Proxima accion" value="Llamar hoy" />
        </div>
      </div>
    </AppShell>
  )
}

function EnrollmentScreen() {
  return (
    <AppShell title="Matricula y alumno">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="mb-3 font-semibold">Lead convertido</p>
          <Field label="Alumno" value="Laura Garcia" />
          <Field label="Curso" value="Farmacia y Parafarmacia" />
          <Field label="Convocatoria" value="Marzo 2026" />
          <Field label="Estado" value="Matriculado" />
          <Field label="Documentacion" value="Pendiente DNI y justificante" />
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="mb-3 font-semibold">Plazas convocatoria</p>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full w-[73%] bg-[#d71920]" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <Badge label="17 ocupadas" />
            <Badge label="7 libres" />
            <Badge label="24 total" />
          </div>
          <p className="mt-3 text-sm text-zinc-600">La plaza queda bloqueada automaticamente.</p>
        </div>
      </div>
    </AppShell>
  )
}

function KpisScreen() {
  return (
    <AppShell title="KPIs y graficas">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Leads', 86],
          ['Conversion', 42],
          ['Ocupacion', 73],
          ['Santa Cruz', 91],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-200 p-4">
            <p className="text-sm font-semibold">{label}</p>
            <div className="mt-4 flex h-28 items-end gap-2">
              {[35, 58, Number(value), 49, 74].map((height, index) => (
                <span
                  key={`${label}-${index}`}
                  className="flex-1 rounded-t bg-[#d71920]"
                  style={{ height: `${height}%`, opacity: 0.45 + index * 0.1 }}
                />
              ))}
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}%</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Badge label="Leads por campana" />
        <Badge label="Ocupacion por sede" />
        <Badge label="Conversion lead a matricula" />
      </div>
    </AppShell>
  )
}

function UnderConstructionBadge() {
  return <span className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">En construccion</span>
}

function CampusRoadmapScreen() {
  return (
    <AppShell title="Campus alumno">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold">Portal del alumno</p>
            <UnderConstructionBadge />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold">Progreso</p>
              <p className="mt-2 text-3xl font-semibold">62%</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full w-[62%] bg-[#d71920]" />
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold">Asistencia</p>
              <p className="mt-2 text-3xl font-semibold">14/16</p>
              <p className="mt-2 text-sm text-zinc-500">Clases registradas</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold">Mensajes</p>
              <p className="mt-2 text-3xl font-semibold">3</p>
              <p className="mt-2 text-sm text-zinc-500">Centro y docente</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-zinc-200 p-4">
            <p className="mb-3 font-semibold">Lecciones de Farmacia y Parafarmacia</p>
            {['Dispensacion de productos', 'Oficina de farmacia', 'Primeros auxilios'].map((lesson, index) => (
              <div key={lesson} className="grid grid-cols-[1fr_auto] border-t border-zinc-100 py-3 text-sm">
                <span>{lesson}</span>
                <span className="rounded bg-zinc-100 px-2 py-1">{index === 0 ? 'Completada' : 'Pendiente'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-3 font-semibold">Acceso alumno</p>
          <Field label="Alumno" value="Laura Garcia" />
          <Field label="Convocatoria" value="Marzo 2026" />
          <Field label="Docente" value="Docente asignado" />
          <div className="grid gap-2">
            <Badge label="Materiales" />
            <Badge label="Lecciones" />
            <Badge label="Comunicacion" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function CertificatesRoadmapScreen() {
  return (
    <AppShell title="Certificados">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold">Emision documental</p>
            <UnderConstructionBadge />
          </div>
          <div className="rounded-lg border-2 border-[#d71920] bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">CEP Formacion</p>
            <p className="mt-5 text-3xl font-semibold">Certificado de finalizacion</p>
            <p className="mt-3 text-lg text-zinc-600">Laura Garcia</p>
            <p className="mt-2 text-sm text-zinc-500">Farmacia y Parafarmacia · Convocatoria Marzo 2026</p>
            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4 text-sm">
              <div className="rounded border border-zinc-200 bg-zinc-50 p-3">Progreso 100%</div>
              <div className="rounded border border-zinc-200 bg-zinc-50 p-3">Asistencia validada</div>
            </div>
            <div className="mx-auto mt-8 h-12 w-36 rounded border border-zinc-300 bg-zinc-100" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-3 font-semibold">Flujo previsto</p>
          {['Validar finalizacion', 'Generar certificado', 'Firmar o aprobar', 'Descargar desde campus'].map((item) => (
            <div key={item} className="mb-2 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Modulo previsto para fase posterior.
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function FinanceRoadmapScreen() {
  return (
    <AppShell title="Facturacion y finanzas">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold">Rentabilidad por convocatoria</p>
            <UnderConstructionBadge />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['Cobros alumnos', '18', 'Matriculas confirmadas'],
              ['Pagos profesores', '4', 'Pendientes de liquidar'],
              ['Margen estimado', '32%', 'Por convocatoria'],
            ].map(([label, value, help]) => (
              <div key={label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
                <p className="mt-2 text-sm text-zinc-500">{help}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-zinc-200 p-4">
            <p className="mb-3 font-semibold">Resumen financiero demo</p>
            {[
              ['Ingresos previstos', '18 matriculas'],
              ['Costes directos', 'Docente, aula y campana'],
              ['Analisis', 'Rentabilidad por sede y turno'],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[1fr_auto] border-t border-zinc-100 py-3 text-sm">
                <span>{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="mb-3 font-semibold">Pagos y cobros</p>
          <Field label="Alumno" value="Cobro pendiente o confirmado" />
          <Field label="Profesor" value="Pago por horas impartidas" />
          <Field label="Sede" value="Coste por aula o turno" />
          <div className="grid gap-2">
            <Badge label="Facturas" />
            <Badge label="Recibos" />
            <Badge label="Rentabilidad" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">{label}</span>
      <span className="block rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium">{value}</span>
    </label>
  )
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">{label}</span>
}

function Slot({ state }: { state: string }) {
  const styles =
    state === 'ok'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : state === 'conflict'
        ? 'border-[#f1b5b8] bg-[#fff8f8] text-[#9f1239]'
        : state === 'pending'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-zinc-100 bg-white text-zinc-400'

  const label = state === 'ok' ? 'Farmacia' : state === 'conflict' ? 'Conflicto' : state === 'pending' ? 'Pendiente' : 'Libre'

  return <div className={`border-t p-2 ${styles}`}>{label}</div>
}
