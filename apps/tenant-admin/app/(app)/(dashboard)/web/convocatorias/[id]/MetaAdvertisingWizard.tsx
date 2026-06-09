'use client'

import * as React from 'react'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Badge } from '@payload-config/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@payload-config/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@payload-config/components/ui/select'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Megaphone, Play, Send } from 'lucide-react'

type Strategy = 'new_campaign' | 'new_ad_existing_adset' | 'refresh_existing_ad'
type Ratio = '1:1' | '9:16' | '16:9'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  convocatoria: {
    id: string | number
    codigo?: string
    start_date?: string
    courseName: string
  }
}

interface UploadedAsset {
  mediaId: number
  ratio: Ratio
  type: 'image' | 'video'
  url: string
  filename: string
}

interface PreviewPayload {
  course_name?: string
  campaign_name?: string
  landing_url?: string
  start_time?: string
  stop_time?: string
  duration_days?: number
  daily_budget?: number
  estimated_total_budget?: number
  status_after_publish?: string
  ad?: {
    primary_text?: string
    headline?: string
    description?: string
    cta?: string
  }
  tracking?: {
    utm_campaign?: string
    traffic_events?: string[]
    public_form_connected?: boolean
    crm_lead_connected?: boolean
    pixel_after_crm_success?: boolean
    capi_dedup_event_id?: boolean
    meta_campaign_id_url_tags?: boolean
  }
  lifecycle?: {
    review_required?: boolean
    created_in_meta_status?: string
    manual_activation_required?: boolean
    auto_stop_at?: string
    stop_source?: string
  }
  review_checklist?: string[]
}

interface PreflightPayload {
  ok?: boolean
  checks?: {
    meta_health?: string
    ads_management?: boolean
    ads_read?: boolean
    ad_account_access?: boolean
    workflow_tables?: boolean
    convocatoria_public?: boolean
    landing_url?: string
    auto_stop_at?: string
    duration_days?: number
  }
  diagnostics?: {
    ad_account_id?: string
    strategy?: string
  }
}

interface MetaAdResult {
  ratio?: string
  type?: string
  meta_creative_id?: string
  meta_ad_id?: string
  metaAdId?: string
  status?: string
}

function formatBudget(cents?: number): string {
  if (!cents || !Number.isFinite(cents)) return '--'
  return `${(cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function defaultText(courseName: string): string {
  return `Estudia ${courseName} en Tenerife. Formación oficial, plazas limitadas e inicio próximo. Solicita información sin compromiso.`
}

function ratioLabel(ratio: Ratio): string {
  if (ratio === '1:1') return 'Cuadrado 1:1'
  if (ratio === '9:16') return 'Vertical 9:16'
  return 'Horizontal 16:9'
}

function ratioClass(ratio: Ratio): string {
  if (ratio === '9:16') return 'aspect-[9/16]'
  if (ratio === '16:9') return 'aspect-video'
  return 'aspect-square'
}

export function MetaAdvertisingWizard({ open, onOpenChange, convocatoria }: Props) {
  const [strategy, setStrategy] = React.useState<Strategy>('new_campaign')
  const [campaignId, setCampaignId] = React.useState('')
  const [adsetId, setAdsetId] = React.useState('')
  const [dailyBudgetEuros, setDailyBudgetEuros] = React.useState('20')
  const [primaryTexts, setPrimaryTexts] = React.useState(defaultText(convocatoria.courseName))
  const [headlines, setHeadlines] = React.useState(`${convocatoria.courseName} 2026`)
  const [descriptions, setDescriptions] = React.useState('Titulación oficial. Plazas limitadas.')
  const [cta, setCta] = React.useState('SIGN_UP')
  const [assets, setAssets] = React.useState<Partial<Record<Ratio, UploadedAsset>>>({})
  const [draftId, setDraftId] = React.useState<number | null>(null)
  const [preflight, setPreflight] = React.useState<PreflightPayload | null>(null)
  const [preview, setPreview] = React.useState<PreviewPayload | null>(null)
  const [result, setResult] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<string | null>(null)
  const [reviewConfirmed, setReviewConfirmed] = React.useState(false)
  const [launchConfirmed, setLaunchConfirmed] = React.useState(false)

  async function uploadAsset(ratio: Ratio, file: File | null) {
    if (!file) return
    setError(null)
    setLoading(`upload-${ratio}`)
    try {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('ratio', ratio)
      formData.set('convocatoriaId', String(convocatoria.id))
      formData.set('courseName', convocatoria.courseName)
      const res = await fetch('/api/meta/assets/upload', { method: 'POST', body: formData })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || payload.success === false) throw new Error(payload.error || 'No se pudo subir creatividad.')
      setAssets((prev) => ({
        ...prev,
        [ratio]: {
          mediaId: Number(payload.doc.id),
          ratio,
          type: String(payload.doc.mimeType || '').startsWith('video/') ? 'video' : 'image',
          url: String(payload.doc.url || ''),
          filename: String(payload.doc.filename || file.name),
        },
      }))
      setPreview(null)
      setResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subiendo creatividad')
    } finally {
      setLoading(null)
    }
  }

  const buildBody = React.useCallback(() => {
    const dailyBudget = Math.round(Number(dailyBudgetEuros.replace(',', '.')) * 100)
    const workflowAssets = (['1:1', '9:16', '16:9'] as Ratio[])
      .map((ratio) => assets[ratio])
      .filter((asset): asset is UploadedAsset => Boolean(asset))
      .map((asset) => ({ media_id: asset.mediaId, ratio: asset.ratio, type: asset.type }))

    return {
      ...(draftId ? { draft_id: draftId } : {}),
      convocatoria_id: Number(convocatoria.id),
      strategy,
      ...(campaignId.trim() ? { campaign_id: campaignId.trim() } : {}),
      ...(adsetId.trim() ? { adset_id: adsetId.trim() } : {}),
      review_confirmed: reviewConfirmed,
      daily_budget: dailyBudget,
      stop_time: convocatoria.start_date,
      copy: {
        primary_texts: primaryTexts.split('\n---\n').map((item) => item.trim()).filter(Boolean),
        headlines: headlines.split('\n').map((item) => item.trim()).filter(Boolean),
        descriptions: descriptions.split('\n').map((item) => item.trim()).filter(Boolean),
        cta,
      },
      assets: workflowAssets,
    }
  }, [adsetId, assets, campaignId, convocatoria.id, convocatoria.start_date, cta, dailyBudgetEuros, descriptions, draftId, headlines, primaryTexts, reviewConfirmed, strategy])

  async function callWorkflow(endpoint: string, label: string) {
    setError(null)
    setLoading(label)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || payload.success === false) {
        throw new Error(payload.error?.message || 'No se pudo completar la operación Meta.')
      }
      if (payload.draft_id) setDraftId(Number(payload.draft_id))
      if (payload.preflight) setPreflight(payload.preflight)
      if (payload.preview) setPreview(payload.preview)
      if (payload.data) setResult(payload.data)
      return payload
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(null)
    }
  }

  async function activateCampaign() {
    if (!draftId) return
    setError(null)
    setLoading('activate')
    try {
      const res = await fetch('/api/meta/ads/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: draftId, confirmed: launchConfirmed }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || payload.success === false) {
        throw new Error(payload.error?.message || 'No se pudo activar la campaña Meta.')
      }
      if (payload.data) setResult(payload.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(null)
    }
  }

  const hasRequiredAssets = Boolean(assets['1:1']?.mediaId && assets['9:16']?.mediaId)
  const canPreflight = !loading
  const canPreview = hasRequiredAssets && !loading
  const canPublish = Boolean(preview) && reviewConfirmed && !loading
  const hasPublishedAds = Boolean(result?.metaAdId || (Array.isArray(result?.metaAds) && result.metaAds.length > 0))
  const canActivate = hasPublishedAds && Boolean(draftId) && launchConfirmed && !loading
  const heroAsset = assets['1:1'] || assets['9:16'] || assets['16:9']

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Generar publicidad en Meta</SheetTitle>
          <SheetDescription>
            Crea una campaña revisable para {convocatoria.courseName}. Primero se muestra preview completo; despues el operario crea el borrador en Meta y lo pone en marcha manualmente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2"><AlertCircle className="h-4 w-4" />{error}</div> : null}

          <section className="grid gap-4 rounded-xl border p-4">
            <div className="flex items-center justify-between"><h3 className="font-bold">1. Estrategia y presupuesto</h3><Badge variant="outline">Review first</Badge></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Estrategia</Label>
                <Select value={strategy} onValueChange={(value) => setStrategy(value as Strategy)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refresh_existing_ad">Refresh anuncio existente</SelectItem>
                    <SelectItem value="new_ad_existing_adset">Nuevo anuncio en adset existente</SelectItem>
                    <SelectItem value="new_campaign">Campaña nueva completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Inversión diaria (€)</Label>
                <Input value={dailyBudgetEuros} onChange={(event) => setDailyBudgetEuros(event.target.value)} inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label>Campaign ID existente</Label>
                <Input value={campaignId} onChange={(event) => setCampaignId(event.target.value)} placeholder="Opcional si campaña nueva" />
              </div>
              <div className="space-y-2">
                <Label>Adset ID existente</Label>
                <Input value={adsetId} onChange={(event) => setAdsetId(event.target.value)} placeholder="Opcional si campaña nueva" />
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border p-4">
            <h3 className="font-bold">2. Textos del anuncio</h3>
            <div className="space-y-2">
              <Label>Textos principales, separa variantes con una línea ---</Label>
              <Textarea rows={5} value={primaryTexts} onChange={(event) => setPrimaryTexts(event.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titulares, uno por línea</Label>
                <Textarea rows={3} value={headlines} onChange={(event) => setHeadlines(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripciones, una por línea</Label>
                <Textarea rows={3} value={descriptions} onChange={(event) => setDescriptions(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CTA</Label>
              <Select value={cta} onValueChange={setCta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIGN_UP">Registrarte</SelectItem>
                  <SelectItem value="LEARN_MORE">Más información</SelectItem>
                  <SelectItem value="APPLY_NOW">Solicitar ahora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border p-4">
            <div className="flex items-center justify-between"><h3 className="font-bold">3. Creatividades</h3><Badge variant={hasRequiredAssets ? 'success' : 'warning'}>{hasRequiredAssets ? 'Listo' : 'Faltan assets'}</Badge></div>
            <p className="text-sm text-muted-foreground">Sube al menos 1:1 y 9:16. 16:9 es recomendado para cobertura completa.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {(['1:1', '9:16', '16:9'] as Ratio[]).map((ratio) => {
                const asset = assets[ratio]
                return (
                  <div key={ratio} className="space-y-2 rounded-xl border bg-muted/20 p-3">
                    <Label>{ratioLabel(ratio)}</Label>
                    <div className={`overflow-hidden rounded-lg border bg-white ${ratioClass(ratio)}`}>
                      {asset?.url ? <img src={asset.url} alt={asset.filename} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground"><ImagePlus className="mr-2 h-4 w-4" />Sin asset</div>}
                    </div>
                    <Input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={(event) => void uploadAsset(ratio, event.target.files?.[0] || null)} disabled={Boolean(loading)} />
                    {asset ? <p className="text-xs text-muted-foreground">Media ID {asset.mediaId} · {asset.filename}</p> : null}
                    {loading === `upload-${ratio}` ? <p className="flex items-center gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin" />Subiendo...</p> : null}
                  </div>
                )
              })}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void callWorkflow('/api/meta/ads/preflight', 'preflight')} disabled={!canPreflight}>
              {loading === 'preflight' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Verificar configuración
            </Button>
            <Button variant="outline" onClick={() => void callWorkflow('/api/meta/ads/preview', 'preview')} disabled={!canPreview}>
              {loading === 'preview' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Generar preview
            </Button>
            <Button onClick={() => void callWorkflow('/api/meta/ads/publish', 'publish')} disabled={!canPublish}>
              {loading === 'publish' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Crear borrador en Meta
            </Button>
            <Button variant="destructive" onClick={() => void activateCampaign()} disabled={!canActivate}>
              {loading === 'activate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Poner en marcha campaña
            </Button>
          </div>

          {preflight ? (
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">Preflight operativo Meta</p>
                <Badge variant={preflight.ok ? 'success' : 'warning'}>{preflight.ok ? 'Listo para preview' : 'Revisar configuración'}</Badge>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <p>Meta health: {preflight.checks?.meta_health || '--'}</p>
                <p>Ad account: {preflight.diagnostics?.ad_account_id || '--'}</p>
                <p>Permiso ads_read: {preflight.checks?.ads_read ? 'OK' : 'No confirmado'}</p>
                <p>Permiso ads_management: {preflight.checks?.ads_management ? 'OK' : 'No confirmado'}</p>
                <p>Tablas workflow: {preflight.checks?.workflow_tables ? 'OK' : 'No confirmado'}</p>
                <p>Convocatoria publica: {preflight.checks?.convocatoria_public ? 'OK' : 'No confirmado'}</p>
                <p>Duración estimada: {preflight.checks?.duration_days || '--'} días</p>
                <p>Auto-stop: {preflight.checks?.auto_stop_at ? new Date(preflight.checks.auto_stop_at).toLocaleString('es-ES') : '--'}</p>
              </div>
              <p className="mt-2 break-all"><strong>Landing:</strong> {preflight.checks?.landing_url || '--'}</p>
            </section>
          ) : null}

          {preview ? (
            <section className="rounded-2xl border bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black">Preview operativo</h3><Badge>{preview.status_after_publish}</Badge></div>
              <div className="grid gap-4 md:grid-cols-[1fr_240px]">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">{preview.ad?.primary_text}</p>
                  <div className="my-4 overflow-hidden rounded-xl bg-gradient-to-br from-rose-100 to-slate-100">
                    {heroAsset?.url ? <img src={heroAsset.url} alt={heroAsset.filename} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-center text-sm font-bold text-slate-500">Preview creatividad</div>}
                  </div>
                  <p className="font-black">{preview.ad?.headline}</p>
                  <p className="text-sm text-slate-500">{preview.ad?.description}</p>
                  <Button className="mt-3 w-full" size="sm">{preview.ad?.cta}</Button>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Duración:</strong> {preview.duration_days} días</p>
                  <p><strong>Diario:</strong> {formatBudget(preview.daily_budget)}</p>
                  <p><strong>Total estimado:</strong> {formatBudget(preview.estimated_total_budget)}</p>
                  <p><strong>Inicio:</strong> {preview.start_time ? new Date(preview.start_time).toLocaleString('es-ES') : '--'}</p>
                  <p><strong>Fin:</strong> {preview.stop_time ? new Date(preview.stop_time).toLocaleString('es-ES') : '--'}</p>
                  <p><strong>Auto-stop:</strong> {preview.lifecycle?.auto_stop_at ? new Date(preview.lifecycle.auto_stop_at).toLocaleString('es-ES') : '--'} ({preview.lifecycle?.stop_source || 'convocatoria'})</p>
                  <p className="break-all"><strong>Landing:</strong> {preview.landing_url}</p>
                  <p><strong>UTM:</strong> {preview.tracking?.utm_campaign}</p>
                  <p><strong>Eventos:</strong> {preview.tracking?.traffic_events?.join(', ')}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
                <div>
                  <h4 className="font-black">Checklist antes de crear</h4>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {(preview.review_checklist || []).map((item) => <li key={item}>✓ {item}</li>)}
                  </ul>
                </div>
                <div className="space-y-2 text-sm">
                  <h4 className="font-black">Medicion y atribucion</h4>
                  <p>Formulario publico: {preview.tracking?.public_form_connected ? 'Conectado' : 'No confirmado'}</p>
                  <p>CRM lead: {preview.tracking?.crm_lead_connected ? 'Conectado' : 'No confirmado'}</p>
                  <p>Pixel despues de CRM: {preview.tracking?.pixel_after_crm_success ? 'Activo' : 'No confirmado'}</p>
                  <p>CAPI dedupe event_id: {preview.tracking?.capi_dedup_event_id ? 'Activo' : 'No confirmado'}</p>
                  <p>meta_campaign_id en URL tags: {preview.tracking?.meta_campaign_id_url_tags ? 'Activo' : 'No confirmado'}</p>
                </div>
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-xl border bg-white p-4 text-sm">
                <Checkbox checked={reviewConfirmed} onCheckedChange={(checked) => setReviewConfirmed(checked === true)} />
                <span>Confirmo que he revisado creatividad, textos, presupuesto, fechas, landing publica, formulario, Pixel/CAPI y atribucion CRM. Crear en Meta dejara los anuncios sin activar hasta la puesta en marcha manual.</span>
              </label>
            </section>
          ) : null}

          {result ? (
            <section className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <p className="font-black">{result.status === 'ACTIVE' ? 'Campaña puesta en marcha en Meta.' : 'Borrador creado en Meta. Los anuncios estan sin activar hasta confirmacion manual.'}</p>
              {Array.isArray(result.metaAds) && result.metaAds.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {result.metaAds.map((ad: MetaAdResult, index: number) => (
                    <p key={`${ad.meta_ad_id || ad.metaAdId || index}`}>
                      {ad.ratio ? `${ad.ratio} · ` : ''}Ad ID: {ad.meta_ad_id || ad.metaAdId} {ad.meta_creative_id ? `· Creative ID: ${ad.meta_creative_id}` : ''}
                    </p>
                  ))}
                </div>
              ) : (
                <>
                  <p>Ad ID: {result.metaAdId}</p>
                  <p>Creative ID: {result.metaCreativeId}</p>
                </>
              )}
              {result.adsManagerUrl ? <a className="underline" href={result.adsManagerUrl} target="_blank">Abrir en Ads Manager</a> : null}
              {result.status !== 'ACTIVE' ? (
                <label className="mt-3 flex items-start gap-3 rounded-lg border border-green-300 bg-white/70 p-3">
                  <Checkbox checked={launchConfirmed} onCheckedChange={(checked) => setLaunchConfirmed(checked === true)} />
                  <span>Confirmo que el borrador creado en Meta esta revisado y autorizo poner en marcha la campaña ahora.</span>
                </label>
              ) : null}
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
