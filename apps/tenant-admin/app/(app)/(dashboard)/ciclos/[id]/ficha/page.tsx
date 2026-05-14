'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { ArrowLeft, BookOpen, Calendar, Download, FileText, GraduationCap, Loader2, Printer } from 'lucide-react'

type MediaRef = number | string | { url?: string | null; filename?: string | null } | null | undefined

interface CycleDetail {
  id: string | number
  slug?: string
  name?: string
  description?: string | null
  level?: string
  family?: string | null
  officialTitle?: string | null
  image?: MediaRef
  duration?: {
    totalHours?: number | null
    courses?: number | null
    modality?: string | null
    classFrequency?: string | null
    schedule?: string | null
    practiceHours?: number | null
  }
  requirements?: Array<{ text?: string | null; type?: string | null }>
  modules?: Array<{ name?: string | null; courseYear?: string | null; hours?: number | null; type?: string | null }>
  careerPaths?: Array<{ title?: string | null; sector?: string | null }>
  competencies?: Array<{ title?: string | null; description?: string | null }>
  pricing?: {
    enrollmentFee?: number | null
    monthlyFee?: number | null
    totalPrice?: number | null
    priceNotes?: string | null
    paymentOptions?: Array<{ option?: string | null }>
  }
  scholarships?: Array<{ name?: string | null; description?: string | null; type?: string | null; url?: string | null }>
  fundaeEligible?: boolean | null
  documents?: Array<{ title?: string | null; type?: string | null; file?: MediaRef }>
  features?: Array<{ title?: string | null; description?: string | null }>
}

interface CourseRun {
  id: string | number
  codigo?: string
  status?: string
  start_date?: string
  end_date?: string
  campus?: { name?: string } | number | null
  classroom?: { name?: string; code?: string } | number | null
  max_students?: number
  current_enrollments?: number
  price_override?: number | null
  price_snapshot?: number | null
}

const LEVEL_LABELS: Record<string, string> = {
  grado_medio: 'GRADO MEDIO',
  grado_superior: 'GRADO SUPERIOR',
  fp_basica: 'FP BÁSICA',
  certificado_profesionalidad: 'CERTIFICADO DE PROFESIONALIDAD',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  online: 'Online',
  mixto: 'Mixto',
}

function resolveMediaUrl(media: MediaRef): string | null {
  if (!media) return null
  if (typeof media === 'number') return null
  if (typeof media === 'string') return media
  if (media.url) return media.url
  if (media.filename) return `/api/media/file/${media.filename}`
  return null
}

function levelLabel(value?: string): string {
  return value ? (LEVEL_LABELS[value] ?? value.replace(/_/g, ' ').toUpperCase()) : 'CICLO'
}

function formatCurrency(value?: number | null): string {
  if (value == null || value <= 0) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(value?: string): string {
  if (!value) return 'Por definir'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Por definir'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function relationName(value: unknown, fallback: string): string {
  return value && typeof value === 'object' && 'name' in value && typeof value.name === 'string' ? value.name : fallback
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-3"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">{children}</CardContent>
    </Card>
  )
}

function DataCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

interface Props { params: Promise<{ id: string }> }

export default function CycleFichaPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [cycle, setCycle] = React.useState<CycleDetail | null>(null)
  const [runs, setRuns] = React.useState<CourseRun[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const cycleRes = await fetch(`/api/cycles/${id}?depth=1`, { cache: 'no-store' })
        if (!cycleRes.ok) throw new Error('No se pudo cargar el ciclo')
        const cycleData = await cycleRes.json()
        if (mounted) setCycle(cycleData.doc ?? cycleData)

        const runsRes = await fetch('/api/course-runs?depth=1&limit=100', { cache: 'no-store' })
        if (runsRes.ok) {
          const runsData = await runsRes.json()
          const allRuns = Array.isArray(runsData.docs) ? runsData.docs : []
          if (mounted) {
            setRuns(allRuns.filter((run: any) => {
              const ref = run.cycle
              const runCycleId = typeof ref === 'object' && ref ? ref.id : ref
              return String(runCycleId) === String(id)
            }))
          }
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error al cargar la ficha')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (error || !cycle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/ciclos/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" />Volver al ciclo</Button>
        <Card><CardContent className="p-8 text-center text-muted-foreground">{error || 'No encontrada'}</CardContent></Card>
      </div>
    )
  }

  const imageUrl = resolveMediaUrl(cycle.image)
  const documents = (cycle.documents ?? []).map((doc) => ({ ...doc, url: resolveMediaUrl(doc.file) })).filter((doc) => Boolean(doc.url))
  const firstDoc = documents[0]
  const modality = cycle.duration?.modality ? (MODALITY_LABELS[cycle.duration.modality] ?? cycle.duration.modality) : 'Por definir'

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .dashboard-sidebar, header, nav, .cycle-ficha-actions, .dashboard-footer { display: none !important; }
          main { overflow: visible !important; }
        }
      `}</style>

      <div className="cycle-ficha-actions flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/ciclos/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver al ciclo
        </Button>
        <div className="flex flex-wrap gap-2">
          {firstDoc?.url && (
            <Button asChild variant="outline">
              <a href={firstDoc.url} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />Descargar PDF
              </a>
            </Button>
          )}
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir ciclo</Button>
        </div>
      </div>

      <article className="space-y-6">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Ficha interna de ciclo</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">{cycle.name || 'Ciclo sin nombre'}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-[#f2014b] text-white hover:bg-[#d80143]">{levelLabel(cycle.level)}</Badge>
                {cycle.family && <Badge variant="outline">{cycle.family}</Badge>}
                <Badge variant="outline">{modality}</Badge>
              </div>
              {cycle.description && <p className="mt-5 max-w-3xl leading-relaxed text-muted-foreground">{cycle.description}</p>}
            </div>
            {imageUrl ? (
              <img src={imageUrl} alt={cycle.name || 'Ciclo'} className="h-72 w-full object-cover lg:h-full" />
            ) : (
              <div className="flex h-72 items-center justify-center bg-muted text-muted-foreground">
                <GraduationCap className="mr-2 h-5 w-5" />Sin imagen de ciclo
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataCard label="Titulación" value={cycle.officialTitle || 'Por definir'} />
          <DataCard label="Duración" value={cycle.duration?.totalHours ? `${cycle.duration.totalHours} horas` : 'Por definir'} />
          <DataCard label="Prácticas" value={cycle.duration?.practiceHours ? `${cycle.duration.practiceHours} horas` : 'Por definir'} />
          <DataCard label="Precio" value={formatCurrency(cycle.pricing?.totalPrice)} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <div className="space-y-6">
            <Section title="Descripción">{cycle.description || 'Información del ciclo disponible próximamente.'}</Section>
            <Section title="Requisitos de acceso">
              {cycle.requirements?.length ? (
                <ul className="list-disc space-y-2 pl-5">
                  {cycle.requirements.map((item, index) => item.text ? <li key={`${item.text}-${index}`}>{item.text}</li> : null)}
                </ul>
              ) : 'Requisitos no especificados todavía.'}
            </Section>
            <Section title="Módulos profesionales">
              {cycle.modules?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {cycle.modules.map((module, index) => (
                    <div key={`${module.name}-${index}`} className="rounded-xl bg-muted/45 p-4">
                      <p className="font-semibold text-foreground">{module.name}</p>
                      <p className="mt-1 text-xs">{[module.courseYear ? `${module.courseYear}.º curso` : null, module.hours ? `${module.hours} h` : null, module.type].filter(Boolean).join(' · ')}</p>
                    </div>
                  ))}
                </div>
              ) : 'Módulos disponibles próximamente.'}
            </Section>
            <div className="grid gap-6 md:grid-cols-2">
              <Section title="Competencias">
                {cycle.competencies?.length ? (
                  <ul className="space-y-3">
                    {cycle.competencies.map((item, index) => item.title ? <li key={`${item.title}-${index}`}><strong className="text-foreground">{item.title}</strong>{item.description ? `: ${item.description}` : ''}</li> : null)}
                  </ul>
                ) : 'Competencias disponibles próximamente.'}
              </Section>
              <Section title="Salidas profesionales">
                {cycle.careerPaths?.length ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {cycle.careerPaths.map((item, index) => item.title ? <li key={`${item.title}-${index}`}>{item.title}{item.sector ? ` · ${item.sector}` : ''}</li> : null)}
                  </ul>
                ) : 'Salidas profesionales disponibles próximamente.'}
              </Section>
            </div>
          </div>

          <aside className="space-y-6">
            <Section title="Horario y modalidad">
              <div className="space-y-2">
                <p><strong className="text-foreground">Modalidad:</strong> {modality}</p>
                <p><strong className="text-foreground">Frecuencia:</strong> {cycle.duration?.classFrequency || 'Por definir'}</p>
                <p><strong className="text-foreground">Horario:</strong> {cycle.duration?.schedule || 'Por definir'}</p>
              </div>
            </Section>
            <Section title="Financiación y becas">
              <div className="space-y-3">
                <p><strong className="text-foreground">Matrícula:</strong> {formatCurrency(cycle.pricing?.enrollmentFee)}</p>
                <p><strong className="text-foreground">Cuota mensual:</strong> {formatCurrency(cycle.pricing?.monthlyFee)}</p>
                <p><strong className="text-foreground">FUNDAE:</strong> {cycle.fundaeEligible ? 'Disponible' : 'Consultar'}</p>
                {cycle.pricing?.priceNotes && <p>{cycle.pricing.priceNotes}</p>}
              </div>
            </Section>
            <Section title="Documentos">
              {documents.length ? (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <a key={`${doc.title}-${index}`} href={doc.url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 font-semibold text-red-700 transition hover:bg-red-100">
                      <FileText className="h-5 w-5" />
                      <span className="min-w-0 flex-1 truncate">{doc.title || 'Documento del ciclo'}</span>
                      <Download className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              ) : 'PDF del programa no disponible todavía.'}
            </Section>
            <Section title="Convocatorias asociadas">
              {runs.length ? (
                <div className="space-y-3">
                  {runs.map((run) => (
                    <button key={run.id} type="button" className="w-full rounded-xl border p-3 text-left transition hover:bg-muted" onClick={() => router.push(`/dashboard/programacion/${run.id}`)}>
                      <span className="block font-semibold text-foreground">{run.codigo || `Convocatoria ${run.id}`}</span>
                      <span className="mt-1 block text-xs">{formatDate(run.start_date)} - {formatDate(run.end_date)}</span>
                      <span className="mt-1 block text-xs">{relationName(run.campus, 'Sede por definir')} · {relationName(run.classroom, 'Aula por definir')}</span>
                      <span className="mt-1 block text-xs">{run.current_enrollments ?? 0}/{run.max_students ?? 0} plazas · {formatCurrency(run.price_override ?? run.price_snapshot)}</span>
                    </button>
                  ))}
                </div>
              ) : 'No hay convocatorias asociadas en este momento.'}
            </Section>
          </aside>
        </div>
      </article>
    </div>
  )
}
