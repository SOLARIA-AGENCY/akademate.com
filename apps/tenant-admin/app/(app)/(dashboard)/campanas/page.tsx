'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

const SOLARIA_PREFIX = 'SOLARIA AGENCY'

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: typeof Circle; dotColor: string }> = {
  active: { label: 'Activa', color: 'text-green-600', icon: Circle, dotColor: 'bg-green-500 animate-pulse' },
  paused: { label: 'En pausa', color: 'text-yellow-600', icon: Pause, dotColor: 'bg-yellow-500' },
  draft: { label: 'Borrador', color: 'text-muted-foreground', icon: Power, dotColor: 'bg-gray-400' },
  completed: { label: 'Completada', color: 'text-blue-600', icon: CheckCircle2, dotColor: 'bg-blue-500' },
  archived: { label: 'Archivada', color: 'text-muted-foreground', icon: Archive, dotColor: 'bg-gray-300' },
}

const PLATFORM_OPTIONS = [
  {
    value: 'meta_ads',
    label: 'Meta Ads',
    color: 'bg-blue-600',
    campaignType: 'paid_ads',
    utmSource: 'facebook',
    utmMedium: 'cpc',
  },
  {
    value: 'google_ads',
    label: 'Google Ads',
    color: 'bg-green-600',
    campaignType: 'paid_ads',
    utmSource: 'google',
    utmMedium: 'cpc',
  },
  {
    value: 'tiktok_ads',
    label: 'TikTok Ads',
    color: 'bg-black',
    campaignType: 'paid_ads',
    utmSource: 'tiktok',
    utmMedium: 'cpc',
  },
  {
    value: 'email',
    label: 'Email Marketing',
    color: 'bg-orange-500',
    campaignType: 'email',
    utmSource: 'email',
    utmMedium: 'email',
  },
]

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  campaign_type?: string
  total_leads?: number
  total_conversions?: number
  budget?: number
  cost_per_lead?: number
}

interface CampaignsApiResponse {
  docs?: Campaign[]
}

interface MetaCampaignsApiResponse {
  docs?: Campaign[]
}

interface ConvocatoriaOption {
  id: string
  courseId: string
  curso: string
  sede: string
  estado: string
  fechaInicio: string
}

interface ConvocatoriasApiPayload {
  data?: Array<{
    id: string | number
    cursoId?: string | number
    cursoNombre?: string
    campusNombre?: string
    estado?: string
    fechaInicio?: string
  }>
}

function slugifyForUtm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function getSafeStartDate(dateLike: string): string {
  const now = new Date()
  const todayIso = now.toISOString().slice(0, 10)
  if (!dateLike) return todayIso

  const candidate = new Date(dateLike)
  if (Number.isNaN(candidate.getTime())) return todayIso
  return candidate < now ? todayIso : candidate.toISOString().slice(0, 10)
}

function ensureSolariaPrefix(name: string): string {
  const trimmed = name.trim()
  if (trimmed.toUpperCase().startsWith(SOLARIA_PREFIX)) return trimmed
  return `${SOLARIA_PREFIX} - ${trimmed}`
}

export default function CampanasPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaOption[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [selectedConv, setSelectedConv] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [campaignName, setCampaignName] = useState('')

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/campaigns?limit=50&sort=-createdAt', {
          cache: 'no-cache',
        })

        if (response.status === 401) {
          setCampaigns([])
          setErrorMessage('Sesión expirada. Inicia sesión de nuevo para ver campañas.')
          return
        }

        if (response.ok) {
          const payload = (await response.json()) as CampaignsApiResponse
          const localDocs = Array.isArray(payload.docs) ? payload.docs : []
          const solariaLocalDocs = localDocs.filter((doc) =>
            String(doc.name ?? '').toUpperCase().startsWith(SOLARIA_PREFIX),
          )

          // If local Campaigns collection is empty, fallback to Meta API listing
          if (solariaLocalDocs.length === 0) {
            try {
              const metaRes = await fetch('/api/meta/campaigns', { cache: 'no-cache' })
              if (metaRes.status === 401) {
                setCampaigns([])
                setErrorMessage('Sesión expirada. Inicia sesión de nuevo para ver campañas.')
                return
              }
              if (metaRes.ok) {
                const metaPayload = (await metaRes.json()) as MetaCampaignsApiResponse
                const metaDocs = Array.isArray(metaPayload.docs) ? metaPayload.docs : []
                setCampaigns(
                  metaDocs.filter((doc) =>
                    String(doc.name ?? '').toUpperCase().startsWith(SOLARIA_PREFIX),
                  ),
                )
              } else {
                setCampaigns([])
              }
            } catch {
              setCampaigns([])
            }
          } else {
            setCampaigns(solariaLocalDocs)
          }
        } else {
          // API not available yet or no campaigns — show empty state, not error
          setCampaigns([])
        }
      } catch {
        // Network error or API unavailable — graceful degradation
        setCampaigns([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCampaigns()
  }, [])

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
    setSelectedConv('')
    setSelectedPlatform('')
    setCampaignName('')

    // Fetch active convocatorias
    setLoadingConvs(true)
    try {
      const res = await fetch('/api/convocatorias', { cache: 'no-cache' })
      if (res.ok) {
        const data = (await res.json()) as ConvocatoriasApiPayload
        const items = Array.isArray(data.data) ? data.data : []
        setConvocatorias(
          items
            .filter((c) => c.estado === 'enrollment_open' || c.estado === 'in_progress' || c.estado === 'draft')
            .map((c) => ({
              id: String(c.id),
              courseId: String(c.cursoId ?? ''),
              curso: c.cursoNombre ?? 'Curso',
              sede: c.campusNombre ?? 'Sin sede',
              estado: c.estado ?? 'draft',
              fechaInicio: c.fechaInicio ?? '',
            }))
        )
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingConvs(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!selectedConv || !selectedPlatform || !campaignName.trim()) return

    const selectedConvData = convocatorias.find((conv) => conv.id === selectedConv)
    const selectedPlatformData = PLATFORM_OPTIONS.find((platform) => platform.value === selectedPlatform)
    if (!selectedConvData || !selectedPlatformData) return

    const normalizedName = ensureSolariaPrefix(campaignName)
    const utmCampaign = slugifyForUtm(normalizedName)
    const startDate = getSafeStartDate(selectedConvData.fechaInicio)

    const createPayload: Record<string, unknown> = {
      name: normalizedName,
      campaign_type: selectedPlatformData.campaignType,
      status: 'draft',
      start_date: startDate,
      utm_source: selectedPlatformData.utmSource,
      utm_medium: selectedPlatformData.utmMedium,
      utm_campaign: utmCampaign,
    }
    if (selectedConvData.courseId) {
      createPayload.course = /^\d+$/.test(selectedConvData.courseId)
        ? parseInt(selectedConvData.courseId, 10)
        : selectedConvData.courseId
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      })

      const result = await res.json().catch(() => null)
      if (!res.ok) {
        const message =
          result?.errors?.[0]?.message ||
          result?.error ||
          'No se pudo crear la campaña. Revisa la configuración e inténtalo de nuevo.'
        setErrorMessage(String(message))
        return
      }

      setErrorMessage(null)
      setShowCreateModal(false)

      // Refresh campaigns
      const refreshRes = await fetch('/api/campaigns?limit=50&sort=-createdAt', { cache: 'no-cache' })
      if (refreshRes.ok) {
        const payload = (await refreshRes.json()) as CampaignsApiResponse
        const docs = Array.isArray(payload.docs) ? payload.docs : []
        setCampaigns(
          docs.filter((doc) => String(doc.name ?? '').toUpperCase().startsWith(SOLARIA_PREFIX)),
        )
      }

      // Navigate to new campaign
      if (result?.doc?.id) {
        router.push(`/campanas/${result.doc.id}`)
      }
    } catch {
      setErrorMessage('No se pudo crear la campaña por un error de red.')
    }
  }

  const getPlatformBadge = (type?: string) => {
    if (type === 'paid_ads') {
      return <Badge className="bg-blue-600 text-white border-0">Paid Ads</Badge>
    }
    const platform = PLATFORM_OPTIONS.find((p) => p.value === type)
    if (!platform) return <Badge variant="outline">{type ?? 'Sin tipo'}</Badge>
    return (
      <Badge className={`${platform.color} text-white border-0`}>
        {platform.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando campañas...
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Campañas de Marketing"
        description="Gestión y seguimiento de campañas publicitarias multicanal"
        icon={TrendingUp}
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Button>
        }
      />

      {/* Stats Cards */}
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

      {/* Campaigns Grid */}
      {!isLoading && campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin campañas activas"
          description="Crea tu primera campaña para empezar a captar leads. Selecciona una convocatoria activa y elige la plataforma."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const statusConfig = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft
            return (
              <Card
                key={campaign.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/campanas/${campaign.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Status indicator dot */}
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusConfig.dotColor}`} />
                        <CardTitle className="text-lg truncate">{campaign.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={statusConfig.color}
                        >
                          {statusConfig.label}
                        </Badge>
                        {getPlatformBadge(campaign.campaign_type)}
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

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Campaña de Marketing</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1: Select convocatoria */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Convocatoria a promocionar
                </Label>
                {loadingConvs ? (
                  <div className="text-sm text-muted-foreground py-2">Cargando convocatorias activas...</div>
                ) : convocatorias.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 border rounded-lg p-3">
                    No hay convocatorias activas. Crea una convocatoria primero desde Programacion.
                  </div>
                ) : (
                  <Select value={selectedConv} onValueChange={(val) => {
                    setSelectedConv(val)
                    const conv = convocatorias.find((c) => c.id === val)
                    if (conv && !campaignName) {
                      setCampaignName(`${SOLARIA_PREFIX} - ${conv.curso}`)
                    }
                  }}>
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

              {/* Step 2: Select platform */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Plataforma publicitaria
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      className={`flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                        selectedPlatform === platform.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedPlatform(platform.value)}
                    >
                      <span className={`h-3 w-3 rounded-full ${platform.color}`} />
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Name */}
              <div className="space-y-2">
                <Label>Nombre de la campaña</Label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ej: Campaña Verano 2026 - Ciclo DAM"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedConv || !selectedPlatform || !campaignName.trim()}
                  onClick={handleCreateCampaign}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Campaña
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
