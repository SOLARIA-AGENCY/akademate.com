'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  GraduationCap, Clock, Layers, Briefcase, Award, DollarSign, Heart,
  FileText, Star, Edit, ArrowLeft, Loader2, BookOpen, Calendar, Users,
  Download, CheckCircle2, ChevronRight,
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
  image?: number | string | { url?: string; filename?: string }
  capacity?: number
  totalHours?: number
  courses?: number
  modality?: string
  classFrequency?: string
  schedule?: string
  practiceHours?: number
  requirements?: Array<{ text: string; type: string }>
  modules?: Array<{ name: string; courseYear: string; hours: number; type: string }>
  careerPaths?: Array<{ title: string; sector: string }>
  competencies?: Array<{ title: string; description: string }>
  enrollmentFee?: number
  monthlyFee?: number
  totalPrice?: number
  paymentOptions?: Array<{ label: string; description: string }>
  priceNotes?: string
  scholarships?: Array<{ name: string; description: string; url: string; type: string }>
  fundaeEligible?: boolean
  furtherStudies?: Array<{ title: string; description: string }>
  documents?: Array<{ title: string; type?: string; url?: string }>
  features?: Array<{ title: string; description: string }>
  active?: boolean
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  basico: 'Formacion Profesional Basica',
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

const DOC_TYPE_COLORS: Record<string, string> = {
  catalogo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ficha: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  programa: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

const CYCLE_PDF_MAP: Record<string, { title: string; type: string; url: string }[]> = {
  '1': [{ title: 'CFGM Farmacia y Parafarmacia', type: 'catalogo', url: '/media/cfgm-farmacia-parafarmacia.pdf' }],
  '2': [{ title: 'CFGS Higiene Bucodental', type: 'catalogo', url: '/media/cfgs-higiene-bucodental.pdf' }],
}

function formatCurrency(value: number | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function resolveImageUrl(image: CycleDetail['image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (typeof image === 'object') {
    if (image.url) return image.url
    if (image.filename) return `/media/${image.filename}`
  }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props { params: Promise<{ id: string }> }

export default function CicloDetailPage({ params }: Props) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !cycle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ciclo" description="Detalle de ciclo" icon={GraduationCap}
          actions={<Button variant="ghost" onClick={() => router.push('/ciclos')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium">No se pudo cargar el ciclo</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  // Derived data
  const modules = Array.isArray(cycle.modules) ? cycle.modules : []
  const competencies = Array.isArray(cycle.competencies) ? cycle.competencies : []
  const careerPaths = Array.isArray(cycle.careerPaths) ? cycle.careerPaths : []
  const requirements = Array.isArray(cycle.requirements) ? cycle.requirements : []
  const scholarships = Array.isArray(cycle.scholarships) ? cycle.scholarships : []
  const furtherStudies = Array.isArray(cycle.furtherStudies) ? cycle.furtherStudies : []
  const features = Array.isArray(cycle.features) ? cycle.features : []
  const paymentOptions = Array.isArray(cycle.paymentOptions) ? cycle.paymentOptions : []
  const imageUrl = resolveImageUrl(cycle.image)

  // Documents: merge API docs + PDF map
  const apiDocs = (cycle.documents ?? []).map((doc) => ({
    title: doc.title, type: doc.type ?? 'ficha', url: doc.url ?? '#',
  }))
  const pdfDocs = CYCLE_PDF_MAP[id] ?? []
  const allDocs = [...apiDocs, ...pdfDocs]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={cycle.name}
        description={cycle.code ? `${cycle.code}` : ''}
        icon={GraduationCap}
        badge={
          <Badge variant="default">
            {LEVEL_LABELS[cycle.level] ?? cycle.level}
          </Badge>
        }
        actions={<>
          <Button variant="ghost" onClick={() => router.push('/ciclos')}><ArrowLeft className="mr-2 h-4 w-4" />Ciclos</Button>
          <Button onClick={() => router.push(`/ciclos/${id}/editar`)}><Edit className="mr-2 h-4 w-4" />Editar</Button>
        </>}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Modulos', value: modules.length, icon: Layers },
          { label: 'Horas totales', value: cycle.totalHours || 0, icon: Clock },
          { label: 'Convocatorias', value: 0, icon: Calendar },
          { label: 'Alumnos', value: 0, icon: Users },
          { label: 'Plazas', value: cycle.capacity || 0, icon: GraduationCap },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Main content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image + Description */}
          {(imageUrl || cycle.description) && (
            <Card>
              <CardContent className="p-0">
                {imageUrl && (
                  <img src={imageUrl} alt={cycle.name} className="w-full h-48 object-cover rounded-t-lg" />
                )}
                {cycle.description && (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{cycle.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Modulos del Ciclo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Modulos del Ciclo
              </CardTitle>
              <Badge variant="outline">{modules.length}</Badge>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay modulos definidos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Modulo</th>
                        <th className="text-center py-2 px-4 font-medium text-muted-foreground">Curso</th>
                        <th className="text-center py-2 px-4 font-medium text-muted-foreground">Horas</th>
                        <th className="text-center py-2 pl-4 font-medium text-muted-foreground">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((mod, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="py-2.5 pr-4">{mod.name}</td>
                          <td className="py-2.5 px-4 text-center">{mod.courseYear}o</td>
                          <td className="py-2.5 px-4 text-center">{mod.hours}h</td>
                          <td className="py-2.5 pl-4 text-center">
                            <Badge className={MODULE_TYPE_COLORS[mod.type] ?? ''} variant="secondary">
                              {mod.type}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold">
                        <td className="py-2 pr-4">Total</td>
                        <td className="py-2 px-4 text-center">-</td>
                        <td className="py-2 px-4 text-center">
                          {modules.reduce((sum, m) => sum + (m.hours || 0), 0)}h
                        </td>
                        <td className="py-2 pl-4 text-center">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competencias */}
          {competencies.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Competencias
                </CardTitle>
                <Badge variant="outline">{competencies.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competencies.map((comp, i) => (
                    <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                      <h4 className="font-medium text-sm">{comp.title}</h4>
                      {comp.description && (
                        <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Salidas Profesionales */}
          {careerPaths.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Salidas Profesionales
                </CardTitle>
                <Badge variant="outline">{careerPaths.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {careerPaths.map((cp, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                      <Briefcase className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{cp.title}</p>
                        {cp.sector && <p className="text-xs text-muted-foreground">{cp.sector}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Caracteristicas */}
          {features.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Caracteristicas
                </CardTitle>
                <Badge variant="outline">{features.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {features.map((feat, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="font-medium text-sm">{feat.title}</p>
                      {feat.description && (
                        <p className="text-xs text-muted-foreground mt-1">{feat.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Informacion del Ciclo */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Informacion del Ciclo</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nivel</span>
                <Badge variant="default">{LEVEL_LABELS[cycle.level] ?? cycle.level}</Badge>
              </div>
              {cycle.family && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Familia</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{cycle.family}</span>
                </div>
              )}
              {cycle.officialTitle && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Titulo oficial</span>
                  <span className="text-xs">{cycle.officialTitle}</span>
                </div>
              )}
              {cycle.modality && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modalidad</span>
                  <Badge variant="outline">{MODALITY_LABELS[cycle.modality] ?? cycle.modality}</Badge>
                </div>
              )}
              {cycle.schedule && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Horario</span>
                  <span>{cycle.schedule}</span>
                </div>
              )}
              {cycle.totalHours != null && cycle.totalHours > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Horas totales</span>
                  <span className="font-medium">{cycle.totalHours}h</span>
                </div>
              )}
              {cycle.courses != null && cycle.courses > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duracion</span>
                  <span>{cycle.courses} curso{cycle.courses > 1 ? 's' : ''}</span>
                </div>
              )}
              {cycle.practiceHours != null && cycle.practiceHours > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Horas FCT</span>
                  <span>{cycle.practiceHours}h</span>
                </div>
              )}
              {cycle.classFrequency && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frecuencia</span>
                  <span>{cycle.classFrequency}</span>
                </div>
              )}
              {cycle.fundaeEligible && (
                <div className="flex items-center gap-2 pt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-green-700 dark:text-green-400 font-medium text-xs">Bonificable FUNDAE</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Precios */}
          {(cycle.enrollmentFee != null || cycle.monthlyFee != null || cycle.totalPrice != null) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {cycle.enrollmentFee != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Matricula</span>
                    <span className="font-semibold">{formatCurrency(cycle.enrollmentFee)}</span>
                  </div>
                )}
                {cycle.monthlyFee != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cuota mensual</span>
                    <span className="font-semibold">{formatCurrency(cycle.monthlyFee)}</span>
                  </div>
                )}
                {cycle.totalPrice != null && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-medium">Precio total</span>
                    <span className="font-bold text-primary">{formatCurrency(cycle.totalPrice)}</span>
                  </div>
                )}
                {paymentOptions.length > 0 && (
                  <div className="pt-2 border-t space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Opciones de pago</span>
                    {paymentOptions.map((opt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 shrink-0" />
                        <div>
                          <span className="text-xs font-medium">{opt.label}</span>
                          {opt.description && <span className="text-xs text-muted-foreground"> - {opt.description}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cycle.priceNotes && (
                  <p className="text-xs text-muted-foreground pt-1 whitespace-pre-line">{cycle.priceNotes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Requisitos */}
          {requirements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Requisitos de Acceso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span>{req.text}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">{req.type}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Becas y Subvenciones */}
          {(cycle.fundaeEligible || scholarships.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Becas y Subvenciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cycle.fundaeEligible && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-xs font-medium text-green-800 dark:text-green-300">
                      Bonificable a traves de FUNDAE
                    </span>
                  </div>
                )}
                {scholarships.map((sch, i) => (
                  <div key={i} className="rounded-lg border p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{sch.name}</p>
                        {sch.type && <Badge variant="outline" className="mt-1 text-[10px]">{sch.type}</Badge>}
                      </div>
                      {sch.url && (
                        <a href={sch.url} target="_blank" rel="noopener noreferrer">
                          <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </div>
                    {sch.description && (
                      <p className="text-xs text-muted-foreground mt-1.5">{sch.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documentos */}
          {allDocs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{doc.title}</span>
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${DOC_TYPE_COLORS[doc.type] ?? ''}`}>
                      {doc.type}
                    </Badge>
                    <a href={doc.url} download>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Continuidad de Estudios */}
          {furtherStudies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Continuidad de Estudios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {furtherStudies.map((fs, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium">{fs.title}</p>
                        {fs.description && (
                          <p className="text-xs text-muted-foreground">{fs.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
