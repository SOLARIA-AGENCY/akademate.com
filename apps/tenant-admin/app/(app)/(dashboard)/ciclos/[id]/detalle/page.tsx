'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft, GraduationCap, Edit, Loader2, BookOpen, Layers,
  Briefcase, Award, DollarSign, Heart, FileText, Star, ClipboardCheck,
  ExternalLink, Download, Printer, Phone, Mail, Globe2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CycleDetail {
  id: string
  name: string
  code?: string
  level: string
  family?: string
  officialTitle?: string
  description?: string
  active?: boolean
  fundaeEligible?: boolean
  image?: number | string | { url?: string; filename?: string }
  duration?: {
    totalHours?: number
    courses?: number
    modality?: string
    classFrequency?: string
    schedule?: string
    practiceHours?: number
  }
  pricing?: {
    enrollmentFee?: number
    monthlyFee?: number
    totalPrice?: number
    priceNotes?: string
  }
  modules?: Array<{ name: string; courseYear: string; hours: number; type: string }>
  requirements?: Array<{ text: string; type: string }>
  careerPaths?: Array<{ title: string; sector: string }>
  competencies?: Array<{ title: string; description: string }>
  scholarships?: Array<{ name: string; description?: string; url?: string; type?: string }>
  furtherStudies?: Array<{ title: string; description?: string }>
  documents?: Array<{ title: string; type?: string; file?: { url?: string; filename?: string } | number }>
  features?: Array<{ title: string; description?: string }>
  slug?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  basico: 'FP Basica',
  medio: 'Grado Medio',
  superior: 'Grado Superior',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  online: 'Online',
  dual: 'Dual',
}

const MODULE_TYPE_COLORS: Record<string, string> = {
  troncal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  optativo: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  transversal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  fct: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

const ENROLLMENT_REQUIREMENTS = [
  'Titulación Adecuada',
  'Pago de Matrícula',
  'DNI',
  'Foto Tipo Carnet',
] as const

function formatCurrency(v: number | undefined): string {
  if (v == null || v <= 0) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}

function resolveImageUrl(image: CycleDetail['image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (typeof image === 'object') {
    if (image.url) return image.url
    if (image.filename) return `/api/media/file/${image.filename}`
  }
  return null
}

function formatSchoolYears(courses?: number, modality?: string): string | null {
  if (!courses || courses <= 0) return null
  if (courses === 2 && modality === 'dual') return '2 Cursos Escolares (Dual)'
  if (courses === 3) return '3 Cursos Escolares'
  if (courses === 1) return '1 Curso Escolar'
  return `${courses} Cursos Escolares`
}

function formatAccessRequirementText(text: string, level: string): string {
  const normalized = text.toLowerCase()
  if (level === 'superior' && normalized.includes('prueba de acceso')) {
    return 'Requisitos Prueba de Acceso a Grado Superior "Tipo C".'
  }
  return text
}

function prioritizeScholarships(
  scholarships: Array<{ name: string; description?: string; url?: string; type?: string }>,
) {
  return [...scholarships].sort((a, b) => {
    const aIsMec = a.name.toLowerCase().includes('mec')
    const bIsMec = b.name.toLowerCase().includes('mec')
    if (aIsMec && !bIsMec) return -1
    if (!aIsMec && bIsMec) return 1
    return 0
  })
}

const PUBLIC_BASE_URL = 'https://cepformacion.akademate.com'
const CONTACT_PHONE = '+34 922 533 533'
const CONTACT_EMAIL = 'info@cepformacion.com'
const CEP_LOGO_URL = '/logos/cep-formacion-logo.png'

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  icon: Icon,
  children,
  empty,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  empty?: boolean
}) {
  if (empty) return null
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Info row
// ---------------------------------------------------------------------------

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="text-sm font-medium text-right">{children}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props { params: Promise<{ id: string }> }

export default function CicloDetallePage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [cycle, setCycle] = React.useState<CycleDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`/api/cycles/${id}?depth=1`, { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar el ciclo')
        const data = await res.json()
        if (mounted) setCycle(data.doc ?? data)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [id])

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error
  if (error || !cycle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ciclo" description="Detalle de ciclo" icon={GraduationCap}
          actions={<Button variant="ghost" onClick={() => router.push('/dashboard/ciclos')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium">No se pudo cargar el ciclo</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  // Derived
  const modules = Array.isArray(cycle.modules) ? cycle.modules : []
  const requirements = Array.isArray(cycle.requirements) ? cycle.requirements : []
  const competencies = Array.isArray(cycle.competencies) ? cycle.competencies : []
  const careerPaths = Array.isArray(cycle.careerPaths) ? cycle.careerPaths : []
  const scholarships = Array.isArray(cycle.scholarships) ? cycle.scholarships : []
  const prioritizedScholarships = prioritizeScholarships(scholarships)
  const furtherStudies = Array.isArray(cycle.furtherStudies) ? cycle.furtherStudies : []
  const documents = Array.isArray(cycle.documents) ? cycle.documents : []
  const features = Array.isArray(cycle.features) ? cycle.features : []
  const imageUrl = resolveImageUrl(cycle.image)
  const schoolYearsLabel = formatSchoolYears(cycle.duration?.courses, cycle.duration?.modality)

  const totalModuleHours = modules.reduce((s, m) => s + (m.hours || 0), 0)
  const publicCycleUrl = `${PUBLIC_BASE_URL}/p/ciclos/${cycle.slug ?? cycle.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicCycleUrl)}`

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* Print styles */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #cycle-print-sheet,
          #cycle-print-sheet * {
            visibility: visible;
          }

          #cycle-print-sheet {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            background: white;
            color: #111827;
          }

          .cycle-screen-only {
            display: none !important;
          }

          .cycle-print-page {
            min-height: 277mm;
            page-break-after: always;
          }

          .cycle-print-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>

      {/* ================================================================
          HEADER
      ================================================================ */}
      <div className="cycle-screen-only">
        <PageHeader
          title={cycle.name}
          description={cycle.code ? `Codigo: ${cycle.code}` : ''}
          icon={GraduationCap}
          badge={
            <div className="flex items-center gap-2">
              <Badge variant="default">{LEVEL_LABELS[cycle.level] ?? cycle.level}</Badge>
              {cycle.active === false && <Badge variant="secondary">Inactivo</Badge>}
            </div>
          }
          actions={<>
            <Button variant="ghost" onClick={() => router.push('/dashboard/ciclos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Volver
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Imprimir ficha
            </Button>
            <Button onClick={() => router.push(`/dashboard/ciclos/${id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />Editar Ciclo
            </Button>
          </>}
        />
      </div>

      {/* ================================================================
          IMAGE + DESCRIPTION
      ================================================================ */}
      <div className="cycle-screen-only">
      {(imageUrl || cycle.description) && (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            {imageUrl && (
              <div className="w-full h-56 sm:h-72 xl:h-80 bg-muted">
                <img
                  src={imageUrl}
                  alt={cycle.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {cycle.description && (
              <div className="p-6">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {cycle.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>

      {/* ================================================================
          INFORMACION GENERAL
      ================================================================ */}
      <Section title="Informacion General" icon={BookOpen}>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <InfoRow label="Nivel">
            <Badge variant="outline">{LEVEL_LABELS[cycle.level] ?? cycle.level}</Badge>
          </InfoRow>
          {cycle.family && <InfoRow label="Familia profesional">{cycle.family}</InfoRow>}
          {cycle.officialTitle && <InfoRow label="Titulo oficial">{cycle.officialTitle}</InfoRow>}
          {cycle.code && <InfoRow label="Codigo">{cycle.code}</InfoRow>}
          {cycle.duration?.modality && (
            <InfoRow label="Modalidad">
              {MODALITY_LABELS[cycle.duration.modality] ?? cycle.duration.modality}
            </InfoRow>
          )}
          {cycle.duration?.totalHours && (
            <InfoRow label="Horas totales">{cycle.duration.totalHours}h</InfoRow>
          )}
          {schoolYearsLabel && <InfoRow label="Cursos">{schoolYearsLabel}</InfoRow>}
          {cycle.duration?.classFrequency && (
            <InfoRow label="Frecuencia de clases">{cycle.duration.classFrequency}</InfoRow>
          )}
          {cycle.duration?.schedule && (
            <InfoRow label="Horario">{cycle.duration.schedule}</InfoRow>
          )}
          {cycle.duration?.practiceHours && (
            <InfoRow label="Horas de practicas">{cycle.duration.practiceHours}h</InfoRow>
          )}
        </div>
      </Section>

      {/* ================================================================
          MODULOS
      ================================================================ */}
      <Section title={`Modulos (${modules.length})`} icon={Layers} empty={modules.length === 0}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Modulo</th>
                <th className="pb-2 pr-4 font-medium w-24">Curso</th>
                <th className="pb-2 pr-4 font-medium w-20 text-right">Horas</th>
                <th className="pb-2 font-medium w-28">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{m.courseYear || '-'}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{m.hours || '-'}</td>
                  <td className="py-2.5">
                    {m.type && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${MODULE_TYPE_COLORS[m.type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {m.type}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {totalModuleHours > 0 && (
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="pt-2" colSpan={2}>Total</td>
                  <td className="pt-2 text-right tabular-nums">{totalModuleHours}h</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Section>

      {/* ================================================================
          COMPETENCIAS
      ================================================================ */}
      <Section title={`Competencias (${competencies.length})`} icon={Award} empty={competencies.length === 0}>
        <ul className="space-y-3">
          {competencies.map((c, i) => (
            <li key={i} className="border-b last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-medium">{c.title}</p>
              {c.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{c.description}</p>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ================================================================
          SALIDAS PROFESIONALES
      ================================================================ */}
      <Section title={`Salidas Profesionales (${careerPaths.length})`} icon={Briefcase} empty={careerPaths.length === 0}>
        <div className="grid gap-2 sm:grid-cols-2">
          {careerPaths.map((cp, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{cp.title}</p>
              {cp.sector && (
                <p className="text-xs text-muted-foreground mt-0.5">Sector: {cp.sector}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ================================================================
          REQUISITOS
      ================================================================ */}
      <Section title="Requisito de acceso" icon={ClipboardCheck} empty={requirements.length === 0}>
        <ul className="space-y-2">
          {requirements.map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <Badge
                variant={r.type === 'obligatorio' ? 'default' : 'secondary'}
                className="mt-0.5 shrink-0 text-[10px]"
              >
                {r.type || 'obligatorio'}
              </Badge>
              <span className="text-sm">{formatAccessRequirementText(r.text, cycle.level)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border p-3">
          <p className="text-sm font-semibold mb-2">Requisitos de Matriculación</p>
          <ul className="space-y-1">
            {ENROLLMENT_REQUIREMENTS.map((item) => (
              <li key={item} className="text-sm text-muted-foreground">
                - {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ================================================================
          PRECIOS
      ================================================================ */}
      {cycle.pricing && (
        <Section title="Precios" icon={DollarSign}>
          <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {cycle.pricing.enrollmentFee != null && (
              <InfoRow label="Matricula">{formatCurrency(cycle.pricing.enrollmentFee)}</InfoRow>
            )}
            {cycle.pricing.monthlyFee != null && (
              <InfoRow label="Cuota mensual">{formatCurrency(cycle.pricing.monthlyFee)}</InfoRow>
            )}
            {cycle.pricing.totalPrice != null && (
              <InfoRow label="Precio total">
                <span className="text-primary font-semibold">{formatCurrency(cycle.pricing.totalPrice)}</span>
              </InfoRow>
            )}
          </div>
          {cycle.pricing.priceNotes && (
            <p className="text-sm text-muted-foreground mt-3 border-t pt-3">
              {cycle.pricing.priceNotes}
            </p>
          )}
        </Section>
      )}

      {/* ================================================================
          BECAS Y SUBVENCIONES
      ================================================================ */}
      <Section
        title="Becas y Subvenciones"
        icon={Heart}
        empty={prioritizedScholarships.length === 0 && !cycle.fundaeEligible}
      >
        {cycle.fundaeEligible && (
          <div className="mb-4">
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              FUNDAE - Bonificable
            </Badge>
          </div>
        )}
        {prioritizedScholarships.length > 0 && (
          <ul className="space-y-3">
            {prioritizedScholarships.map((s, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                    )}
                    {s.type && (
                      <Badge variant="outline" className="mt-1 text-[10px]">{s.type}</Badge>
                    )}
                  </div>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ================================================================
          DOCUMENTOS
      ================================================================ */}
      <Section title={`Documentos (${documents.length})`} icon={FileText} empty={documents.length === 0}>
        <ul className="space-y-2">
          {documents.map((d, i) => {
            const fileUrl = typeof d.file === 'object' && d.file !== null ? d.file.url : null
            return (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  {d.type && (
                    <Badge variant="outline" className="mt-1 text-[10px]">{d.type}</Badge>
                  )}
                </div>
                {fileUrl && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-primary hover:text-primary/80"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </Section>

      {/* ================================================================
          CONTINUIDAD DE ESTUDIOS
      ================================================================ */}
      <Section title={`Continuidad de Estudios (${furtherStudies.length})`} icon={GraduationCap} empty={furtherStudies.length === 0}>
        <ul className="space-y-3">
          {furtherStudies.map((fs, i) => (
            <li key={i} className="border-b last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-medium">{fs.title}</p>
              {fs.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{fs.description}</p>
              )}
            </li>
          ))}
        </ul>
      </Section>

      {/* ================================================================
          CARACTERISTICAS
      ================================================================ */}
      <Section title={`Caracteristicas (${features.length})`} icon={Star} empty={features.length === 0}>
        <div className="grid gap-2 sm:grid-cols-2">
          {features.map((f, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{f.title}</p>
              {f.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{f.description}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      <section id="cycle-print-sheet" className="hidden p-6 text-[12px]">
        <div className="cycle-print-page">
          <div className="flex items-center justify-between border-b-4 border-red-600 pb-4">
            <img src={CEP_LOGO_URL} alt="CEP Formacion" className="h-14 w-auto object-contain" />
            <div className="text-right">
              <p className="text-xl font-bold uppercase tracking-wide">Ficha informativa de ciclo</p>
              <p className="text-sm text-gray-600">{cycle.code ?? `Ciclo ${cycle.id}`}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1.45fr_0.95fr] gap-5">
            <div>
              <p className="text-xs font-semibold uppercase text-red-700">{LEVEL_LABELS[cycle.level] ?? cycle.level}</p>
              <h1 className="mt-1 text-3xl font-bold leading-tight">{cycle.name}</h1>
              {cycle.officialTitle && (
                <p className="mt-2 text-sm font-semibold text-gray-700">{cycle.officialTitle}</p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                {cycle.description || 'Informacion detallada pendiente de validacion por CEP Formacion.'}
              </p>
            </div>
            {imageUrl ? (
              <img src={imageUrl} alt={cycle.name} className="h-48 w-full rounded-lg object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                Imagen de portada pendiente
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-gray-500">Nivel</p>
              <p className="mt-1 font-semibold">{LEVEL_LABELS[cycle.level] ?? cycle.level}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-gray-500">Duracion</p>
              <p className="mt-1 font-semibold">{schoolYearsLabel ?? 'Por definir'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-gray-500">Horas</p>
              <p className="mt-1 font-semibold">{cycle.duration?.totalHours ? `${cycle.duration.totalHours} horas` : 'Por definir'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-gray-500">Modalidad</p>
              <p className="mt-1 font-semibold">
                {cycle.duration?.modality ? (MODALITY_LABELS[cycle.duration.modality] ?? cycle.duration.modality) : 'Por definir'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_0.9fr] gap-5">
            <div>
              <h2 className="text-lg font-bold">Modulos profesionales</h2>
              {modules.length === 0 ? (
                <div className="mt-2 rounded-lg border p-4 text-gray-600">Modulos pendientes de validacion.</div>
              ) : (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-gray-100 text-[10px] uppercase text-gray-600">
                      <tr>
                        <th className="p-2">Modulo</th>
                        <th className="p-2">Curso</th>
                        <th className="p-2 text-right">Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.slice(0, 9).map((module, index) => (
                        <tr key={`${module.name}-${index}`} className="border-t">
                          <td className="p-2 font-semibold">{module.name}</td>
                          <td className="p-2">{module.courseYear || '-'}</td>
                          <td className="p-2 text-right">{module.hours || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold">Condiciones</h2>
              <div className="mt-2 space-y-2">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-gray-500">Matricula</p>
                  <p className="mt-1 font-semibold">{formatCurrency(cycle.pricing?.enrollmentFee)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-gray-500">Cuota mensual</p>
                  <p className="mt-1 font-semibold">{formatCurrency(cycle.pricing?.monthlyFee)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-gray-500">Precio total</p>
                  <p className="mt-1 font-semibold">{formatCurrency(cycle.pricing?.totalPrice)}</p>
                </div>
                {cycle.duration?.schedule && (
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] uppercase text-gray-500">Horario</p>
                    <p className="mt-1 font-semibold">{cycle.duration.schedule}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="cycle-print-page pt-2">
          <div className="flex items-center justify-between border-b-4 border-red-600 pb-4">
            <img src={CEP_LOGO_URL} alt="CEP Formacion" className="h-12 w-auto object-contain" />
            <div className="text-right">
              <p className="text-lg font-bold uppercase tracking-wide">Informacion complementaria</p>
              <p className="text-sm text-gray-600">{cycle.name}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <h2 className="text-lg font-bold">Requisitos de acceso</h2>
              {requirements.length === 0 ? (
                <div className="mt-2 rounded-lg border p-4 text-gray-600">Requisitos pendientes de validacion.</div>
              ) : (
                <ul className="mt-2 space-y-2">
                  {requirements.slice(0, 8).map((requirement, index) => (
                    <li key={`${requirement.text}-${index}`} className="rounded-lg border p-3">
                      <p className="font-semibold">{formatAccessRequirementText(requirement.text, cycle.level)}</p>
                      <p className="mt-1 text-[10px] uppercase text-gray-500">{requirement.type || 'obligatorio'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold">Salidas profesionales</h2>
              {careerPaths.length === 0 ? (
                <div className="mt-2 rounded-lg border p-4 text-gray-600">Salidas profesionales pendientes de validacion.</div>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {careerPaths.slice(0, 10).map((path, index) => (
                    <li key={`${path.title}-${index}`} className="rounded-lg border p-3">
                      <p className="font-semibold">{path.title}</p>
                      {path.sector && <p className="mt-1 text-gray-600">Sector: {path.sector}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <h2 className="text-lg font-bold">Becas y continuidad</h2>
              <div className="mt-2 rounded-lg border p-3">
                {cycle.fundaeEligible && <p className="font-semibold text-emerald-700">Formacion bonificable FUNDAE</p>}
                {prioritizedScholarships.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {prioritizedScholarships.slice(0, 4).map((scholarship, index) => (
                      <li key={`${scholarship.name}-${index}`}>- {scholarship.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Consultar becas y ayudas disponibles.</p>
                )}
                {furtherStudies.length > 0 && (
                  <p className="mt-3 text-gray-700">Continuidad: {furtherStudies.slice(0, 3).map((study) => study.title).join(', ')}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold">Contacto</h2>
              <div className="mt-2 rounded-lg border p-3">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-red-700" />{CONTACT_PHONE}</p>
                <p className="mt-2 flex items-center gap-2"><Mail className="h-4 w-4 text-red-700" />{CONTACT_EMAIL}</p>
                <p className="mt-2 flex items-center gap-2"><Globe2 className="h-4 w-4 text-red-700" />cepformacion.akademate.com</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-5 border-t pt-4">
            <p className="text-[10px] leading-relaxed text-gray-500">
              Documento informativo. Las fechas, precios, plazas, requisitos y condiciones pueden estar sujetos a cambios hasta la formalizacion de la matricula. Consulte siempre la informacion actualizada con CEP Formacion.
            </p>
            <div className="text-center">
              <img src={qrUrl} alt="QR web del ciclo" className="h-28 w-28" />
              <p className="mt-1 text-[10px] text-gray-500">Ver ciclo en la web</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
