'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent } from '@payload-config/components/ui/card'
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  MapPin,
  Briefcase,
  Users,
  BookOpen,
  CheckCircle2,
  Star,
  Loader2,
  ClipboardCheck,
  Layers,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CycleMedia {
  url?: string
  filename?: string
}

interface CycleData {
  id: string
  name: string
  slug?: string
  code?: string
  level?: string
  family?: string
  officialTitle?: string
  description?: string
  image?: CycleMedia | string | number | null
  totalHours?: number
  modality?: string
  practiceHours?: number
  courses?: number
  modules?: Array<{ name: string; courseYear: string; hours: number; type: string }>
  careerPaths?: Array<{ title: string; sector: string }>
  requirements?: Array<{ text: string; type: string }>
  features?: Array<{ title: string; description: string }>
  competencies?: Array<{ title: string; description: string }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  basico: 'Formacion Profesional Basica',
  medio: 'Grado Medio',
  superior: 'Grado Superior',
  grado_medio: 'Grado Medio',
  grado_superior: 'Grado Superior',
  fp_basica: 'FP Basica',
  certificado_profesionalidad: 'Certificado de Profesionalidad',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  online: 'Online',
  dual: 'Dual',
}

function resolveImageUrl(image: CycleData['image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (image.url) return image.url
  if (image.filename) return `/media/${image.filename}`
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WebCicloSlugPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [cycle, setCycle] = React.useState<CycleData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchCycle = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/cycles?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&limit=1`,
        )
        if (!res.ok) {
          setError('No se pudo cargar el ciclo')
          return
        }
        const data = await res.json()
        const docs = data.docs ?? []
        if (docs.length === 0) {
          setError('Ciclo no encontrado')
          return
        }
        setCycle(docs[0])
      } catch (err) {
        console.error('Error fetching cycle by slug:', err)
        setError('Error al cargar el ciclo')
      } finally {
        setLoading(false)
      }
    }
    void fetchCycle()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !cycle) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">{error ?? 'Ciclo no encontrado'}</h2>
        <Button onClick={() => router.push('/web/ciclos')} className="mt-4">
          Volver a Ciclos Web
        </Button>
      </div>
    )
  }

  const heroUrl = resolveImageUrl(cycle.image)
  const levelLabel = LEVEL_LABELS[cycle.level ?? ''] ?? cycle.level ?? ''
  const modalityLabel = MODALITY_LABELS[cycle.modality ?? ''] ?? cycle.modality ?? ''

  return (
    <div className="space-y-0">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/web/ciclos')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Gestion Web
        </Button>
      </div>

      {/* Preview banner */}
      <div className="mb-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
        Vista previa de la pagina publica del ciclo. Esta es una simulacion del aspecto final.
      </div>

      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden bg-muted mb-8">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={cycle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <GraduationCap className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <Badge className="mb-3 bg-primary/90 text-primary-foreground">
            {levelLabel}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {cycle.name}
          </h1>
          {cycle.officialTitle && (
            <p className="text-white/80 text-sm md:text-base max-w-2xl">
              {cycle.officialTitle}
            </p>
          )}
        </div>
      </div>

      {/* ================================================================
          QUICK STATS BAR
      ================================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Nivel</p>
              <p className="text-sm font-semibold">{levelLabel || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Duracion</p>
              <p className="text-sm font-semibold">{cycle.totalHours ? `${cycle.totalHours}h` : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Modalidad</p>
              <p className="text-sm font-semibold">{modalityLabel || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Practicas</p>
              <p className="text-sm font-semibold">{cycle.practiceHours ? `${cycle.practiceHours}h` : '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================
          DESCRIPTION
      ================================================================ */}
      {cycle.description && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Sobre este ciclo
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {cycle.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          MODULES — 2 column grid
      ================================================================ */}
      {cycle.modules && cycle.modules.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Plan de Estudios ({cycle.modules.length} modulos)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cycle.modules.map((mod, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.courseYear}o curso - {mod.type}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                    {mod.hours}h
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-between text-sm font-semibold">
              <span>Total horas lectivas</span>
              <span>{cycle.modules.reduce((sum, m) => sum + (m.hours || 0), 0)}h</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          CAREER PATHS
      ================================================================ */}
      {cycle.careerPaths && cycle.careerPaths.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Salidas Profesionales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cycle.careerPaths.map((cp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{cp.title}</p>
                    {cp.sector && (
                      <p className="text-xs text-muted-foreground">{cp.sector}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          REQUIREMENTS
      ================================================================ */}
      {cycle.requirements && cycle.requirements.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Requisitos de Acceso
            </h2>
            <ul className="space-y-2">
              {cycle.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm">{req.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          FEATURES
      ================================================================ */}
      {cycle.features && cycle.features.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Caracteristicas Destacadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cycle.features.map((feat, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/40 border border-border">
                  <p className="font-medium text-sm mb-1">{feat.title}</p>
                  {feat.description && (
                    <p className="text-xs text-muted-foreground">{feat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          CTA
      ================================================================ */}
      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6 md:p-10 text-center space-y-4">
          <Users className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Empieza tu futuro profesional</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Solicita informacion sin compromiso sobre {cycle.name} y te asesoraremos sobre el proceso de matriculacion, becas disponibles y salidas profesionales.
          </p>
          <Button size="lg" className="mt-2">
            Solicitar Informacion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
