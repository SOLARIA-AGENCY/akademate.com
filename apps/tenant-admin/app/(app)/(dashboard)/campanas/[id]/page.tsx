'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft,
  Megaphone,
  Loader2,
  ExternalLink,
  Send,
  DollarSign,
  MapPin,
  FileText,
  Image as ImageIcon,
  Check,
  AlertTriangle,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

interface CampaignDetail {
  id: string
  name: string
  status: string
  campaign_type?: string
  budget?: number
  total_leads?: number
  total_conversions?: number
  meta_campaign_id?: string
  meta_adset_id?: string
  meta_creative_id?: string
  meta_ad_id?: string
}

export default function CampaignDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [campaign, setCampaign] = React.useState<CampaignDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Meta Ad creation form
  const [dailyBudget, setDailyBudget] = React.useState('25')
  const [headline, setHeadline] = React.useState('')
  const [primaryText, setPrimaryText] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [metaResult, setMetaResult] = React.useState<Record<string, string> | null>(null)
  const [metaError, setMetaError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}?depth=1`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCampaign(data)
        } else {
          // Graceful fallback — show basic info
          setCampaign({ id, name: `Campaña #${id}`, status: 'draft' })
        }
      } catch {
        setCampaign({ id, name: `Campaña #${id}`, status: 'draft' })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const handleCreateInMeta = async () => {
    if (!headline.trim() || !primaryText.trim()) {
      setMetaError('Rellena al menos un título y texto principal')
      return
    }

    setCreating(true)
    setMetaError(null)
    setMetaResult(null)

    try {
      const res = await fetch('/api/meta/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convocatoriaId: 1, // TODO: link to actual convocatoria
          dailyBudget: parseFloat(dailyBudget) || 25,
          headlines: [headline],
          descriptions: [description || headline],
          primaryTexts: [primaryText],
        }),
      })

      const data = await res.json()
      if (data.success) {
        setMetaResult(data.data)
      } else {
        setMetaError(data.error || 'Error al crear campaña en Meta')
      }
    } catch (err) {
      setMetaError('Error de conexión con la API')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activa',
    paused: 'En pausa',
    completed: 'Completada',
    archived: 'Archivada',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign?.name || `Campaña #${id}`}
        description="Detalle y configuración de campaña publicitaria"
        icon={Megaphone}
        badge={
          <Badge variant={campaign?.status === 'active' ? 'default' : 'secondary'}>
            {statusLabel[campaign?.status || 'draft'] || campaign?.status}
          </Badge>
        }
        actions={
          <Button variant="ghost" onClick={() => router.push('/campanas')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Campañas
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN — Meta Ad Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Success result */}
          {metaResult && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-medium text-green-800">Campaña creada en Meta (PAUSED)</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                      <span>Campaign ID: {metaResult.metaCampaignId}</span>
                      <span>Ad Set ID: {metaResult.metaAdSetId}</span>
                      <span>Creative ID: {metaResult.metaCreativeId}</span>
                      <span>Ad ID: {metaResult.metaAdId}</span>
                    </div>
                    {metaResult.adsManagerUrl && (
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <a href={metaResult.adsManagerUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Abrir en Ads Manager
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ad texts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Textos del Anuncio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título (Headline)</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ej: Matricúlate en Farmacia y Parafarmacia"
                  maxLength={40}
                />
                <p className="text-[10px] text-muted-foreground">{headline.length}/40 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label>Texto Principal (Body)</Label>
                <Textarea
                  value={primaryText}
                  onChange={(e) => setPrimaryText(e.target.value)}
                  placeholder="Ej: Ciclo Formativo de Grado Medio. Modalidad semipresencial. Practicas en empresa."
                  rows={3}
                  maxLength={125}
                />
                <p className="text-[10px] text-muted-foreground">{primaryText.length}/125 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label>Descripción del enlace</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Plazas limitadas. Inscripción abierta."
                  maxLength={30}
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget + targeting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Presupuesto y Segmentación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Presupuesto diario (EUR)</Label>
                  <Input
                    type="number"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(e.target.value)}
                    min="5"
                    step="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region objetivo</Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Tenerife (Santa Cruz)
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Objetivo: Lead Generation. Pixel: CEP Formación. Plataforma: Feed + Stories (FB + IG).
              </p>
            </CardContent>
          </Card>

          {/* Error */}
          {metaError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-sm">{metaError}</p>
            </div>
          )}

          {/* Create button */}
          <Button
            size="lg"
            className="w-full"
            disabled={creating || !headline.trim() || !primaryText.trim()}
            onClick={handleCreateInMeta}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creando campaña en Meta...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Crear borrador en Meta (PAUSED)
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            La campaña se crea en estado PAUSED. Revísala en Ads Manager antes de publicar.
          </p>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Vista previa del anuncio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-white p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">CEP Formación</p>
                    <p className="text-[10px] text-muted-foreground">Patrocinado</p>
                  </div>
                </div>
                <p className="text-xs">{primaryText || 'Texto principal del anuncio...'}</p>
                <div className="rounded bg-muted h-40 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="border-t pt-2">
                  <p className="text-[10px] text-muted-foreground">cursos.cepcomunicacion.com</p>
                  <p className="text-xs font-semibold">{headline || 'Titulo del anuncio'}</p>
                  <p className="text-[10px] text-muted-foreground">{description || 'Descripcion...'}</p>
                </div>
                <div className="border-t pt-2">
                  <div className="text-center text-xs font-medium text-primary">Más información</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Plataforma</span>
                <Badge className="bg-blue-600 text-white border-0 text-[10px]">Meta Ads</Badge>
              </div>
              <div className="flex justify-between">
                <span>Objetivo</span>
                <span className="font-medium text-foreground">Lead Generation</span>
              </div>
              <div className="flex justify-between">
                <span>Pixel</span>
                <span className="font-medium text-foreground">CEP Formacion</span>
              </div>
              <div className="flex justify-between">
                <span>Prefijo</span>
                <span className="font-mono text-foreground">SOLARIA AGENCY</span>
              </div>
              <div className="flex justify-between">
                <span>Estado Meta</span>
                <span className="font-medium text-foreground">PAUSED (borrador)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
