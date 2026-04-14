'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Plus,
  TrendingUp,
  Users,
  MousePointer,
  DollarSign,
  Megaphone,
  X,
  Circle,
  Pause,
  Power,
  CheckCircle2,
  Archive,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; icon: typeof Circle; dotColor: string }
> = {
  active: { label: 'Activa', color: 'text-green-600', icon: Circle, dotColor: 'bg-green-500 animate-pulse' },
  paused: { label: 'En pausa', color: 'text-yellow-600', icon: Pause, dotColor: 'bg-yellow-500' },
  draft: { label: 'Borrador', color: 'text-muted-foreground', icon: Power, dotColor: 'bg-gray-400' },
  completed: { label: 'Completada', color: 'text-blue-600', icon: CheckCircle2, dotColor: 'bg-blue-500' },
  archived: { label: 'Archivada', color: 'text-muted-foreground', icon: Archive, dotColor: 'bg-gray-300' },
}

const SOLARIA_PREFIX = 'SOLARIA AGENCY'

interface Campaign {
  id: string
  meta_campaign_id: string
  name: string
  status: CampaignStatus
  campaign_type?: string
  total_leads?: number
  total_conversions?: number
  budget?: number
  cost_per_lead?: number | null
  ads_manager_url?: string
}

interface SourceHealth {
  status: 'ok' | 'degraded'
  token_status: 'valid' | 'missing' | 'expired' | 'invalid'
  permissions_status: 'ok' | 'missing_ads_read' | 'missing_ads_management' | 'unknown'
  ad_account_id: string
  checked_at: string
  token_expires_at?: string | null
}

interface SourceError {
  code: string
  message: string
  token_expires_at?: string | null
}

interface CampaignsApiResponse {
  docs?: Campaign[]
  totalDocs?: number
  source_health?: SourceHealth
  error?: SourceError
}

interface ConvocatoriaOption {
  id: string
  curso: string
  sede: string
  estado: string
  fechaInicio: string
}

interface ConvocatoriasApiPayload {
  data?: Array<{
    id: string | number
    cursoNombre?: string
    campusNombre?: string
    estado?: string
    fechaInicio?: string
  }>
}

interface MetaCreateResponse {
  success?: boolean
  data?: {
    metaCampaignId?: string
    adsManagerUrl?: string
  }
  error?: string
  code?: string
}

function formatMetaDate(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-ES')
}

function buildCampaignsErrorMessage(error?: SourceError, health?: SourceHealth | null): string | null {
  if (!error) return null

  if (error.code === 'UNAUTHORIZED') {
    return 'Sesión expirada. Inicia sesión de nuevo para cargar campañas de Meta.'
  }

  if (error.code === 'TOKEN_EXPIRED') {
    const expiresAt = error.token_expires_at || health?.token_expires_at
    return expiresAt
      ? `Token de Meta caducado (${expiresAt}). Actualízalo en Configuración > Integraciones.`
      : 'Token de Meta caducado. Actualízalo en Configuración > Integraciones.'
  }

  if (error.code === 'MISSING_PERMISSIONS') {
    return 'Permisos insuficientes en Meta API (requerido: ads_read / ads_management).'
  }

  if (error.code === 'AD_ACCOUNT_ACCESS_DENIED') {
    return 'Sin acceso a la cuenta publicitaria configurada para este tenant.'
  }

  if (error.code === 'MISCONFIGURED') {
    return 'Integración Meta incompleta: revisa token y Ad Account ID en Configuración.'
  }

  return error.message || 'No se pudieron recuperar campañas de Meta.'
}

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sourceHealth, setSourceHealth] = useState<SourceHealth | null>(null)
  const [lastCreatedCampaign, setLastCreatedCampaign] = useState<{
    id: string
    adsManagerUrl?: string
  } | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaOption[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [selectedConv, setSelectedConv] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [dailyBudget, setDailyBudget] = useState('20')
  const [headline, setHeadline] = useState('')
  const [primaryText, setPrimaryText] = useState('')
  const [description, setDescription] = useState('')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      setSourceHealth(null)

      const response = await fetch('/api/meta/campaigns', {
        cache: 'no-cache',
        credentials: 'include',
      })

      const payload = (await response.json()) as CampaignsApiResponse

      if (response.status === 401) {
        setCampaigns([])
        setErrorMessage('Sesión expirada. Inicia sesión para visualizar campañas.')
        return
      }

      setCampaigns(Array.isArray(payload.docs) ? payload.docs : [])
      setSourceHealth(payload.source_health ?? null)

      if (!response.ok) {
        setErrorMessage('No se pudo conectar con Meta API en este momento.')
        return
      }

      const operationalMessage = buildCampaignsErrorMessage(payload.error, payload.source_health ?? null)
      if (operationalMessage) {
        setErrorMessage(operationalMessage)
      }
    } catch {
      setCampaigns([])
      setErrorMessage('Error de red cargando campañas de Meta.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCampaigns()
  }, [fetchCampaigns])

  const stats = useMemo(() => {
    const totalLeads = campaigns.reduce((sum, campaign) => sum + (campaign.total_leads ?? 0), 0)
    const totalConversions = campaigns.reduce(
      (sum, campaign) => sum + (campaign.total_conversions ?? 0),
      0
    )
    const totalBudget = campaigns.reduce((sum, campaign) => sum + (campaign.budget ?? 0), 0)
    const activeCount = campaigns.filter((campaign) => campaign.status === 'active').length

    return { totalLeads, totalConversions, totalBudget, activeCount }
  }, [campaigns])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)

  const openCreateModal = async () => {
    setShowCreateModal(true)
    setCreateError(null)
    setSelectedConv('')
    setCampaignName('')
    setDailyBudget('20')
    setHeadline('')
    setPrimaryText('')
    setDescription('')

    setLoadingConvs(true)
    try {
      const res = await fetch('/api/convocatorias', { cache: 'no-cache' })
      if (res.ok) {
        const data = (await res.json()) as ConvocatoriasApiPayload
        const items = Array.isArray(data.data) ? data.data : []
        setConvocatorias(
          items
            .filter((item) =>
              item.estado === 'enrollment_open' || item.estado === 'in_progress' || item.estado === 'draft'
            )
            .map((item) => ({
              id: String(item.id),
              curso: item.cursoNombre ?? 'Curso',
              sede: item.campusNombre ?? 'Sin sede',
              estado: item.estado ?? 'draft',
              fechaInicio: item.fechaInicio ?? '',
            }))
        )
      } else {
        setConvocatorias([])
      }
    } catch {
      setConvocatorias([])
    } finally {
      setLoadingConvs(false)
    }
  }

  const handleCreateCampaign = async () => {
    const parsedBudget = Number(dailyBudget)
    if (!selectedConv || !campaignName.trim() || !headline.trim() || !primaryText.trim()) {
      setCreateError('Completa todos los campos obligatorios para crear la campaña.')
      return
    }
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setCreateError('El presupuesto diario debe ser mayor que 0.')
      return
    }

    setCreateError(null)
    setIsCreatingCampaign(true)

    try {
      const response = await fetch('/api/meta/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convocatoriaId: Number(selectedConv),
          campaignName: campaignName.trim(),
          dailyBudget: parsedBudget,
          headlines: [headline.trim()],
          primaryTexts: [primaryText.trim()],
          descriptions: description.trim() ? [description.trim()] : [],
        }),
      })

      const payload = (await response.json()) as MetaCreateResponse
      if (!response.ok) {
        setCreateError(payload.error || 'No se pudo crear la campaña en Meta.')
        return
      }

      setShowCreateModal(false)
      setLastCreatedCampaign({
        id: payload.data?.metaCampaignId || 'N/D',
        adsManagerUrl: payload.data?.adsManagerUrl,
      })
      await fetchCampaigns()
    } catch {
      setCreateError('Error de red creando la campaña en Meta.')
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando campañas...
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {sourceHealth && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Fuente:</span>
            <Badge variant={sourceHealth.status === 'ok' ? 'default' : 'outline'}>
              Meta API {sourceHealth.status === 'ok' ? 'operativa' : 'degradada'}
            </Badge>
            <span className="text-muted-foreground">Ad Account: {sourceHealth.ad_account_id || 'N/D'}</span>
          </div>
          <div className="text-muted-foreground">
            Última verificación: {formatMetaDate(sourceHealth.checked_at)}
          </div>
        </div>
      )}

      {lastCreatedCampaign && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-800">
          Campaña creada en Meta correctamente (ID: {lastCreatedCampaign.id}).
          {lastCreatedCampaign.adsManagerUrl && (
            <a
              href={lastCreatedCampaign.adsManagerUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1 underline"
            >
              Abrir en Ads Manager <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      <PageHeader
        title="Campañas de Marketing"
        description={`Campañas live de Meta filtradas por "${SOLARIA_PREFIX}"`}
        icon={TrendingUp}
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campañas Activas</CardTitle>
            <MousePointer className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">En curso actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Captados desde campañas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
            <Users className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
            <p className="text-xs text-muted-foreground">Leads convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Total asignado</p>
          </CardContent>
        </Card>
      </div>

      {!isLoading && campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={`Sin campañas ${SOLARIA_PREFIX}`}
          description="No hay campañas de SOLARIA para la Ad Account actual. Crea una nueva campaña en Meta."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
            const canOpenManager = Boolean(campaign.ads_manager_url)
            return (
              <Card
                key={campaign.id}
                className={`hover:shadow-md transition-shadow ${canOpenManager ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (!campaign.ads_manager_url) return
                  window.open(campaign.ads_manager_url, '_blank', 'noopener,noreferrer')
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusConfig.dotColor}`} />
                        <CardTitle className="text-lg truncate">{campaign.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                        <Badge className="bg-blue-600 text-white border-0">Meta Ads</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Leads</p>
                      <p className="text-2xl font-bold">{campaign.total_leads ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversiones</p>
                      <p className="text-2xl font-bold">{campaign.total_conversions ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Presupuesto</p>
                      <p className="text-lg font-semibold">{formatCurrency(campaign.budget ?? 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Coste por lead</p>
                      <p className="text-lg font-semibold">
                        {campaign.cost_per_lead ? formatCurrency(campaign.cost_per_lead) : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Campaña en Meta</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Convocatoria a promocionar
                </Label>
                {loadingConvs ? (
                  <div className="text-sm text-muted-foreground py-2">Cargando convocatorias activas...</div>
                ) : convocatorias.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 border rounded-lg p-3">
                    No hay convocatorias activas. Crea una convocatoria primero desde Programación.
                  </div>
                ) : (
                  <Select
                    value={selectedConv}
                    onValueChange={(value) => {
                      setSelectedConv(value)
                      const conv = convocatorias.find((item) => item.id === value)
                      if (conv && !campaignName) {
                        setCampaignName(`${SOLARIA_PREFIX} - ${conv.curso}`)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona convocatoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {convocatorias.map((conv) => (
                        <SelectItem key={conv.id} value={conv.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{conv.curso}</span>
                            <span className="text-xs text-muted-foreground">— {conv.sede}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nombre de campaña</Label>
                <Input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder={`${SOLARIA_PREFIX} - CFGM Farmacia`}
                />
              </div>

              <div className="space-y-2">
                <Label>Presupuesto diario (EUR)</Label>
                <Input
                  type="number"
                  min={1}
                  value={dailyBudget}
                  onChange={(event) => setDailyBudget(event.target.value)}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="Título del anuncio"
                />
              </div>

              <div className="space-y-2">
                <Label>Texto principal</Label>
                <Input
                  value={primaryText}
                  onChange={(event) => setPrimaryText(event.target.value)}
                  placeholder="Mensaje principal del anuncio"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Descripción opcional"
                />
              </div>

              {createError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" disabled={isCreatingCampaign} onClick={handleCreateCampaign}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreatingCampaign ? 'Creando...' : 'Crear Campaña'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
