'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { ArrowLeft, BookOpen, CalendarDays, Edit, Globe2, Loader2, Mail, MapPin, Phone, Printer, Users } from 'lucide-react'
import { FieldCard, PdfManagerCard } from '@payload-config/components/akademate/dashboard'

interface CourseDetail {
  id: string | number
  codigo?: string
  slug?: string
  name?: string
  short_description?: string
  long_description?: unknown
  featured_image?: MediaRef
  dossier_pdf?: MediaRef
  modality?: string
  course_type?: string
  area?: string
  area_formativa?: { id?: number; name?: string; nombre?: string } | number | null
  duration_hours?: number | null
  base_price?: number | null
  enrollment_fee?: number | null
  price_notes?: string | null
  landing_target_audience?: string | null
  landing_access_requirements?: string | null
  landing_outcomes?: string | null
  landing_objectives?: Array<{ text?: string | null }>
  landing_program_blocks?: Array<{ title?: string | null; body?: string | null; items?: Array<{ text?: string | null }> | null }>
}

interface ConvocatoriaSummary {
  id: string | number
  codigo?: string
  campusNombre?: string
  aulaNombre?: string
  fechaInicio?: string
  fechaFin?: string
  horario?: string
  plazasTotales?: number
  plazasOcupadas?: number
  precio?: number | null
  estado?: string
}

type MediaRef = number | string | { url?: string | null; filename?: string | null; alt?: string | null } | null | undefined

const COURSE_TYPE_LABELS: Record<string, string> = {
  privado: 'Privado',
  privados: 'Privado',
  ocupados: 'Ocupados',
  desempleados: 'Desempleados',
  teleformacion: 'Teleformación',
  ciclo_medio: 'Ciclo medio',
  ciclo_superior: 'Ciclo superior',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Híbrido',
  teleformacion: 'Teleformación',
}

const NUTRICOSMETICA_DOSSIER_URL = '/uploads/cep-course-programs/NUTRICOSMÉTICA.pdf'
const PUBLIC_BASE_URL = 'https://cepformacion.akademate.com'
const CONTACT_PHONE = '+34 922 533 533'
const CONTACT_EMAIL = 'info@cepformacion.com'
const CEP_LOGO_URL = '/logos/cep-formacion-logo.png'
const PDF_FALLBACK_TEXT = 'PDF del programa no disponible todavía.'

const NUTRICOSMETICA_FALLBACK = {
  targetAudience:
    'Formación dirigida a profesionales del ámbito de la salud, la estética, el bienestar y el deporte que deseen ampliar sus conocimientos en nutricosmética y complementos alimenticios, aplicándolos de forma segura y responsable en su práctica profesional.',
  requirements: 'Podrás acceder con 2º de la ESO o EGB.',
  outcomes:
    'Al terminar puedes ampliar conocimientos con Auxiliar de Farmacia, Auxiliar de Enfermería, Auxiliar en Clínicas Estéticas, Quiromasaje Holístico, Entrenamiento Personal, Dietética y Nutrición o Dermocosmética.',
  objectives: [
    'Aplicar criterios profesionales para recomendar nutricosmética y complementos alimenticios con seguridad.',
    'Relacionar nutrición, estética, bienestar y deporte desde una visión práctica y basada en evidencia.',
    'Identificar contraindicaciones, interacciones y situaciones que requieren derivación profesional.',
    'Integrar recomendaciones responsables en contextos de salud, estética, bienestar y rendimiento físico.',
  ],
  programBlocks: [
    {
      title: 'Bloque 1 · Fundamentos de Nutricosmética',
      items: [
        { text: 'Nutrición, suplementación y salud cutánea' },
        { text: 'Marco legal, seguridad y responsabilidad profesional' },
      ],
    },
    {
      title: 'Bloque 2 · Complementos Alimenticios',
      items: [
        { text: 'Vitaminas y minerales aplicados a la estética' },
        { text: 'Proteínas, aminoácidos y colágeno' },
        { text: 'Lípidos y ácidos grasos esenciales' },
        { text: 'Microbiota, prebióticos y probióticos' },
      ],
    },
    {
      title: 'Bloque 3 · Nutricosmética Aplicada',
      items: [
        { text: 'Antioxidantes y envejecimiento saludable' },
        { text: 'Salud de la piel, cabello y uñas' },
        { text: 'Nutricosmética en la mujer' },
        { text: 'Sueño, estrés y adaptógenos' },
      ],
    },
    {
      title: 'Bloque 4 · Integración Profesional',
      items: [
        { text: 'Interacciones, contraindicaciones y derivación' },
        { text: 'Recomendación profesional aplicada' },
      ],
    },
  ],
}

const NUTRICOSMETICA_RELATED_COURSES = [
  { name: 'Auxiliar de Farmacia', href: '/p/cursos/auxiliar-de-farmacia' },
  { name: 'Auxiliar de Enfermería', href: '/p/cursos/auxiliar-de-enfermeria' },
  { name: 'Auxiliar en Clínicas Estéticas', href: '/p/cursos/auxiliar-en-clinicas-esteticas' },
  { name: 'Quiromasaje Holístico', href: '/p/cursos/quiromasaje-holistico' },
  { name: 'Entrenamiento Personal', href: '/p/cursos/entrenamiento-personal' },
  { name: 'Dietética y Nutrición', href: '/p/cursos/dietetica-y-nutricion' },
  { name: 'Dermocosmética', href: '/p/cursos/dermocosmetica' },
]

function isNutricosmeticaCourse(course: CourseDetail): boolean {
  const value = `${course.slug || ''} ${course.name || ''}`.toLowerCase()
  return value.includes('nutricosmetica') || value.includes('nutricosmética')
}

function resolveMediaUrl(media: MediaRef): string | null {
  if (!media) return null
  if (typeof media === 'number') return null
  if (typeof media === 'string') return media
  if (media.url) return media.url
  if (media.filename) return `/api/media/file/${media.filename}`
  return null
}

function resolveMediaName(media: MediaRef): string {
  if (!media) return 'Dossier del curso'
  if (typeof media === 'string') return media.split('/').pop() || 'Dossier del curso'
  if (typeof media === 'object' && media.filename) return media.filename
  return 'Dossier del curso'
}

function resolveDownloadName(media: MediaRef, fallback: string): string {
  const mediaName = resolveMediaName(media)
  if (mediaName !== 'Dossier del curso') return mediaName
  return `${fallback.replace(/[^\w\d-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'curso'}-dossier.pdf`
}

function textList(items?: Array<{ text?: string | null }>): string[] {
  return (items ?? []).map((item) => item.text?.trim()).filter((value): value is string => Boolean(value))
}

function richTextToPlain(value: unknown): string {
  const out: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const record = node as Record<string, unknown>
    if (typeof record.text === 'string') out.push(record.text)
    if (Array.isArray(record.children)) record.children.forEach(walk)
    if (Array.isArray(record.root ? (record.root as Record<string, unknown>).children : null)) {
      ((record.root as Record<string, unknown>).children as unknown[]).forEach(walk)
    }
  }
  walk(value)
  return out.join(' ').replace(/\s+/g, ' ').trim()
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

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return 'Fechas por definir'
  if (!end || start === end) return formatDate(start)
  return `${formatDate(start)} - ${formatDate(end)}`
}

function areaName(course: CourseDetail): string {
  if (course.area_formativa && typeof course.area_formativa === 'object') {
    return course.area_formativa.name || course.area_formativa.nombre || 'Por definir'
  }
  return course.area || 'Por definir'
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">{children}</CardContent>
    </Card>
  )
}

function RelatedCoursesList({ plainText }: { plainText: string }) {
  if (!plainText) return <>Salidas profesionales disponibles próximamente.</>

  const isNutri = NUTRICOSMETICA_RELATED_COURSES.some((course) => plainText.includes(course.name))
  if (!isNutri) return <p>{plainText}</p>

  return (
    <div className="space-y-3">
      <p>{plainText.split('Al terminar puedes ampliar conocimientos con')[0].trim() || 'Itinerarios relacionados:'}</p>
      <div className="grid gap-2">
        {NUTRICOSMETICA_RELATED_COURSES.map((course) => (
          <a
            key={course.name}
            href={course.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
          >
            {course.name}
            <Globe2 className="size-4 text-primary" />
          </a>
        ))}
      </div>
    </div>
  )
}

interface Props { params: Promise<{ id: string }> }

export default function CourseFichaPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [course, setCourse] = React.useState<CourseDetail | null>(null)
  const [convocatorias, setConvocatorias] = React.useState<ConvocatoriaSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const courseRes = await fetch(`/api/courses/${id}?depth=1`, { cache: 'no-store' })
        if (!courseRes.ok) throw new Error('No se pudo cargar el curso')
        const courseData = await courseRes.json()
        if (mounted) setCourse(courseData.doc ?? courseData)

        const runsRes = await fetch(`/api/convocatorias?courseId=${id}`, { cache: 'no-store' })
        if (runsRes.ok) {
          const runsData = await runsRes.json()
          if (mounted) setConvocatorias(Array.isArray(runsData.data) ? runsData.data : [])
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
  if (error || !course) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/cursos/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" />Volver al curso</Button>
        <Card><CardContent className="p-8 text-center text-muted-foreground">{error || 'No encontrada'}</CardContent></Card>
      </div>
    )
  }

  const imageUrl = resolveMediaUrl(course.featured_image)
  const hasNutricosmeticaFallback = isNutricosmeticaCourse(course)
  const dossierUrl = resolveMediaUrl(course.dossier_pdf) || (hasNutricosmeticaFallback ? NUTRICOSMETICA_DOSSIER_URL : null)
  const objectives = textList(course.landing_objectives)
  const displayObjectives = objectives.length > 0 ? objectives : (hasNutricosmeticaFallback ? NUTRICOSMETICA_FALLBACK.objectives : [])
  const programBlocks =
    course.landing_program_blocks?.length ? course.landing_program_blocks : (hasNutricosmeticaFallback ? NUTRICOSMETICA_FALLBACK.programBlocks : [])
  const longDescription = richTextToPlain(course.long_description)
  const presentation = course.short_description || longDescription
  const targetAudience = course.landing_target_audience || (hasNutricosmeticaFallback ? NUTRICOSMETICA_FALLBACK.targetAudience : '')
  const accessRequirements = course.landing_access_requirements || (hasNutricosmeticaFallback ? NUTRICOSMETICA_FALLBACK.requirements : '')
  const outcomes = course.landing_outcomes || (hasNutricosmeticaFallback ? NUTRICOSMETICA_FALLBACK.outcomes : '')
  const courseType = course.course_type ? (COURSE_TYPE_LABELS[course.course_type] ?? course.course_type) : 'Sin tipo'
  const modality = course.modality ? (MODALITY_LABELS[course.modality] ?? course.modality) : 'Por definir'
  const publicCourseUrl = `${PUBLIC_BASE_URL}/p/cursos/${course.slug ?? course.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicCourseUrl)}`
  const activeRuns = convocatorias.filter((conv) => !['cancelled', 'archived', 'completed'].includes(conv.estado ?? ''))
  const dossierFileName = resolveDownloadName(course.dossier_pdf, course.name || `curso-${course.id}`)

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @page { size: A4; margin: 10mm; }
        #course-print-sheet { display: none; }
        @media print {
          body * { visibility: hidden !important; }
          #course-print-sheet, #course-print-sheet * { visibility: visible !important; }
          #course-print-sheet {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: #111827 !important;
          }
          .course-screen-only { display: none !important; }
        }
      `}</style>

      <div className="course-screen-only course-ficha-actions flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/cursos/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver al curso
        </Button>
          <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/cursos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />Editar curso
          </Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir curso</Button>
        </div>
      </div>

      <article className="course-screen-only course-ficha-page space-y-6 rounded-2xl bg-background">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Ficha interna de curso</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">{course.name || 'Curso sin nombre'}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{course.codigo || `Curso ${course.id}`}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="bg-[#f2014b] text-white hover:bg-[#d80143]">{courseType}</Badge>
                <Badge variant="outline">{modality}</Badge>
                <Badge variant="outline">{areaName(course)}</Badge>
              </div>
            </div>
            {imageUrl ? (
              <img src={imageUrl} alt={course.name || 'Curso'} className="h-72 w-full object-cover lg:h-full" />
            ) : (
              <div className="flex h-72 items-center justify-center bg-muted text-muted-foreground">
                <BookOpen className="mr-2 h-5 w-5" />Sin imagen de portada
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FieldCard label="Duración" value={course.duration_hours ? `${course.duration_hours} horas` : 'Por definir'} />
          <FieldCard label="Precio" value={formatCurrency(course.base_price)} />
          <FieldCard label="Matrícula" value={formatCurrency(course.enrollment_fee)} />
          <FieldCard label="Área" value={areaName(course)} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <div className="space-y-6">
            <Section title="Presentación">
              {presentation || 'Información del curso disponible próximamente.'}
            </Section>

            {targetAudience && (
              <Section title="Público objetivo">
                {targetAudience}
              </Section>
            )}

            <Section title="Objetivos">
              {displayObjectives.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5">
                  {displayObjectives.map((objective) => <li key={objective}>{objective}</li>)}
                </ul>
              ) : 'Objetivos disponibles próximamente.'}
            </Section>

            <Section title="Contenidos / programa">
              {programBlocks.length > 0 ? (
                <div className="space-y-4">
                  {programBlocks.map((block, index) => (
                    <div key={`${block.title || 'bloque'}-${index}`} className="rounded-xl bg-muted/45 p-4">
                      <p className="font-semibold text-foreground">{block.title || `Bloque ${index + 1}`}</p>
                      {block.body && <p className="mt-2">{block.body}</p>}
                      {block.items?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {block.items.map((item, itemIndex) => item.text ? <li key={`${item.text}-${itemIndex}`}>{item.text}</li> : null)}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : 'Programa disponible próximamente.'}
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section title="Requisitos">
                {accessRequirements || 'Requisitos no especificados todavía.'}
              </Section>
              <Section title="Salidas profesionales">
                <RelatedCoursesList plainText={outcomes} />
              </Section>
            </div>
          </div>

          <aside className="space-y-6">
            <PdfManagerCard
              pdfName={dossierFileName}
              pdfUrl={dossierUrl}
              description={dossierUrl ? 'Documento operativo del curso para impresión, descarga y actualización.' : PDF_FALLBACK_TEXT}
              onUpload={() => router.push(`/dashboard/cursos/${id}/editar`)}
              onReplace={() => router.push(`/dashboard/cursos/${id}/editar`)}
            />

            <Section title="Convocatorias asociadas">
              {convocatorias.length > 0 ? (
                <div className="space-y-3">
                  {convocatorias.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      className="w-full rounded-xl border bg-background p-4 text-left transition hover:border-primary/35 hover:bg-primary/5"
                      onClick={() => router.push(`/dashboard/programacion/${conv.id}`)}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground">{conv.codigo || `Convocatoria ${conv.id}`}</span>
                          <span className="mt-1 line-clamp-2 block text-xs">{course.name}</span>
                        </span>
                        <Badge variant="outline">{conv.estado || 'Sin estado'}</Badge>
                      </span>
                      <span className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{formatDateRange(conv.fechaInicio, conv.fechaFin)}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{conv.campusNombre || 'Sede por definir'} · {conv.aulaNombre || 'Aula por definir'}</span>
                        <span className="flex items-center gap-1.5"><Users className="size-3.5" />{conv.plazasOcupadas ?? 0}/{conv.plazasTotales ?? 0} plazas</span>
                        <span className="font-semibold text-foreground">Precio: {formatCurrency(conv.precio)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : 'No hay convocatorias asociadas en este momento.'}
            </Section>

            <Section title="Precio">
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/35 px-3 py-2">
                  <span className="font-semibold text-foreground">Precio base</span>
                  <span className="text-right font-bold text-foreground">{formatCurrency(course.base_price)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/35 px-3 py-2">
                  <span className="font-semibold text-foreground">Matrícula</span>
                  <span className="text-right font-bold text-foreground">{formatCurrency(course.enrollment_fee)}</span>
                </div>
                <p>{course.price_notes || 'Sin notas adicionales de precio.'}</p>
              </div>
            </Section>
          </aside>
        </div>
      </article>

      <section id="course-print-sheet" className="p-6 text-[12px] leading-relaxed">
        <div className="flex items-start justify-between gap-6 border-b-4 border-[#f2014b] pb-5">
          <div>
            <img src={CEP_LOGO_URL} alt="CEP Formación" className="h-12 w-auto object-contain" />
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#f2014b]">
              Ficha informativa de curso
            </p>
            <h1 className="mt-2 max-w-[560px] text-3xl font-black leading-tight text-slate-950">
              {course.name || 'Curso sin nombre'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{course.codigo || `Curso ${course.id}`}</p>
          </div>
          <div className="w-36 shrink-0 text-center">
            <img src={qrUrl} alt="QR página pública del curso" className="mx-auto h-32 w-32 rounded-lg border p-1" />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Ver curso online</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1.35fr_0.65fr] gap-5">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-base font-black text-slate-950">Presentación</h2>
              <p className="mt-2 text-slate-700">{presentation || 'Información del curso disponible próximamente.'}</p>
            </div>

            {displayObjectives.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-base font-black text-slate-950">Objetivos</h2>
                <ul className="mt-2 space-y-1.5 pl-4 text-slate-700">
                  {displayObjectives.slice(0, 6).map((objective) => (
                    <li key={objective} className="list-disc">{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {programBlocks.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-base font-black text-slate-950">Programa</h2>
                <div className="mt-2 grid gap-3">
                  {programBlocks.slice(0, 5).map((block, index) => (
                    <div key={`${block.title || 'bloque'}-print-${index}`} className="rounded-lg bg-slate-50 p-3">
                      <p className="font-bold text-slate-900">{block.title || `Bloque ${index + 1}`}</p>
                      {block.body && <p className="mt-1 text-slate-700">{block.body}</p>}
                      {block.items?.length ? (
                        <ul className="mt-1 grid gap-1 pl-4 text-slate-700">
                          {block.items.slice(0, 6).map((item, itemIndex) =>
                            item.text ? <li key={`${item.text}-print-${itemIndex}`} className="list-disc">{item.text}</li> : null
                          )}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {imageUrl && (
              <img src={imageUrl} alt={course.name || 'Curso'} className="h-40 w-full rounded-xl object-cover" />
            )}

            <div className="grid gap-2 rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Tipo</span>
                <span className="text-right font-bold text-slate-950">{courseType}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Modalidad</span>
                <span className="text-right font-bold text-slate-950">{modality}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Duración</span>
                <span className="text-right font-bold text-slate-950">{course.duration_hours ? `${course.duration_hours} horas` : 'Por definir'}</span>
              </div>
              <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Área</span>
                <span className="text-right font-bold text-slate-950">{areaName(course)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-500">Precio</span>
                <span className="text-right font-bold text-slate-950">{formatCurrency(course.base_price)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="font-black text-slate-950">Próximas convocatorias</h2>
              <div className="mt-2 space-y-2">
                {(activeRuns.length > 0 ? activeRuns : convocatorias).slice(0, 4).map((conv) => (
                  <div key={conv.id} className="rounded-lg bg-slate-50 p-3">
                    <p className="font-bold text-slate-950">{conv.codigo || `Convocatoria ${conv.id}`}</p>
                    <p className="mt-1 text-slate-600">{formatDateRange(conv.fechaInicio, conv.fechaFin)}</p>
                    <p className="text-slate-600">{conv.campusNombre || 'Sede por definir'} · {conv.aulaNombre || 'Aula por definir'}</p>
                  </div>
                ))}
                {convocatorias.length === 0 && <p className="text-slate-600">Consulta próximas fechas con CEP Formación.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-[#f2014b]/25 bg-[#f2014b]/5 p-4">
              <h2 className="font-black text-slate-950">Solicita información</h2>
              <div className="mt-3 space-y-2 text-slate-700">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#f2014b]" />{CONTACT_PHONE}</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#f2014b]" />{CONTACT_EMAIL}</p>
                <p className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-[#f2014b]" />{publicCourseUrl}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
