'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  ClipboardCheck,
  Layers,
  Briefcase,
  Award,
  DollarSign,
  Heart,
  FileText,
  Star,
  Edit,
  Loader2,
  BookOpen,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types — matches the creation form payload
// ---------------------------------------------------------------------------

interface CycleDetail {
  id: string
  name: string
  code?: string
  level: string
  family?: string
  officialTitle?: string
  description?: string
  image?: string
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
  documents?: Array<{ title: string }>
  features?: Array<{ title: string; description: string }>
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

function formatCurrency(value: number | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CicloDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string

  const [cycle, setCycle] = useState<CycleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCycle = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/cycles/${cycleId}`)
        if (!res.ok) {
          setError('No se pudo cargar el ciclo')
          return
        }
        const data = await res.json()
        setCycle(data.doc ?? data)
      } catch (err) {
        console.error('Error fetching cycle:', err)
        setError('Error al cargar el ciclo')
      } finally {
        setLoading(false)
      }
    }
    void fetchCycle()
  }, [cycleId])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cargando ciclo..." description="" icon={GraduationCap} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Error / not found
  if (error || !cycle) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">{error ?? 'Ciclo no encontrado'}</h2>
        <Button onClick={() => router.push('/ciclos')} className="mt-4">
          Volver a Ciclos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={cycle.name}
        description={`${cycle.code ? cycle.code + ' · ' : ''}${LEVEL_LABELS[cycle.level] ?? cycle.level}`}
        icon={GraduationCap}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/ciclos')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <Button onClick={() => router.push(`/ciclos/${cycleId}/editar`)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>
        }
      />

      {/* Hero Image */}
      {cycle.image && (
        <Card>
          <CardContent className="p-0">
            <div className="w-full h-56 overflow-hidden bg-muted rounded-lg">
              <img
                src={cycle.image}
                alt={cycle.name}
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Info Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">{LEVEL_LABELS[cycle.level] ?? cycle.level}</Badge>
        {cycle.family && <Badge variant="secondary">{cycle.family}</Badge>}
        {cycle.modality && <Badge variant="outline">{MODALITY_LABELS[cycle.modality] ?? cycle.modality}</Badge>}
        {cycle.totalHours && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {cycle.totalHours}h
          </Badge>
        )}
        {cycle.courses && (
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {cycle.courses} curso{cycle.courses > 1 ? 's' : ''}
          </Badge>
        )}
        {cycle.fundaeEligible && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            FUNDAE
          </Badge>
        )}
      </div>

      {/* ================================================================
          DATOS BASICOS
      ================================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Informacion General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cycle.officialTitle && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Titulo Oficial</h4>
              <p>{cycle.officialTitle}</p>
            </div>
          )}
          {cycle.description && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Descripcion</h4>
              <p className="text-sm leading-relaxed whitespace-pre-line">{cycle.description}</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {cycle.classFrequency && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Frecuencia</h4>
                <p className="text-sm mt-1">{cycle.classFrequency}</p>
              </div>
            )}
            {cycle.schedule && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Horario</h4>
                <p className="text-sm mt-1">{cycle.schedule}</p>
              </div>
            )}
            {cycle.practiceHours != null && cycle.practiceHours > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Horas FCT</h4>
                <p className="text-sm mt-1">{cycle.practiceHours}h</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ================================================================
          REQUISITOS DE ACCESO
      ================================================================ */}
      {cycle.requirements && cycle.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Requisitos de Acceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cycle.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm">{req.text}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {req.type}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          MODULOS
      ================================================================ */}
      {cycle.modules && cycle.modules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Modulos ({cycle.modules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                  {cycle.modules.map((mod, i) => (
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
                      {cycle.modules.reduce((sum, m) => sum + (m.hours || 0), 0)}h
                    </td>
                    <td className="py-2 pl-4 text-center">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          SALIDAS PROFESIONALES
      ================================================================ */}
      {cycle.careerPaths && cycle.careerPaths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Salidas Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {cycle.careerPaths.map((cp, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <Briefcase className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
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

      {/* ================================================================
          COMPETENCIAS
      ================================================================ */}
      {cycle.competencies && cycle.competencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Competencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cycle.competencies.map((comp, i) => (
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

      {/* ================================================================
          PRECIOS
      ================================================================ */}
      {(cycle.enrollmentFee != null || cycle.monthlyFee != null || cycle.totalPrice != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {cycle.enrollmentFee != null && (
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Matricula</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(cycle.enrollmentFee)}</p>
                </div>
              )}
              {cycle.monthlyFee != null && (
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Cuota Mensual</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(cycle.monthlyFee)}</p>
                </div>
              )}
              {cycle.totalPrice != null && (
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Precio Total</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(cycle.totalPrice)}</p>
                </div>
              )}
            </div>

            {cycle.paymentOptions && cycle.paymentOptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Opciones de Pago</h4>
                <div className="space-y-2">
                  {cycle.paymentOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="font-medium">{opt.label}</span>
                      {opt.description && <span className="text-muted-foreground">- {opt.description}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cycle.priceNotes && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Notas</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{cycle.priceNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          BECAS Y SUBVENCIONES
      ================================================================ */}
      {(cycle.fundaeEligible || (cycle.scholarships && cycle.scholarships.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Becas y Subvenciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cycle.fundaeEligible && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  Bonificable a traves de FUNDAE
                </span>
              </div>
            )}
            {cycle.scholarships && cycle.scholarships.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {cycle.scholarships.map((sch, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{sch.name}</p>
                        {sch.type && (
                          <Badge variant="outline" className="mt-1 text-xs">{sch.type}</Badge>
                        )}
                      </div>
                      {sch.url && (
                        <a href={sch.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </div>
                    {sch.description && (
                      <p className="text-xs text-muted-foreground mt-2">{sch.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          CONTINUIDAD
      ================================================================ */}
      {cycle.furtherStudies && cycle.furtherStudies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Estudios de Continuidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cycle.furtherStudies.map((fs, i) => (
                <div key={i} className="flex items-start gap-3">
                  <GraduationCap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{fs.title}</p>
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

      {/* ================================================================
          DOCUMENTOS
      ================================================================ */}
      {cycle.documents && cycle.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cycle.documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{doc.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          CARACTERISTICAS
      ================================================================ */}
      {cycle.features && cycle.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Caracteristicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {cycle.features.map((feat, i) => (
                <div key={i} className="p-3 rounded-lg border border-border">
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
  )
}
