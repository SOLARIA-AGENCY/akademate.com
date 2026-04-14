'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Sparkles,
  Upload,
  Trash2,
  Image as ImageIcon,
  Film,
  Loader2,
  Check,
  GraduationCap,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConvocatoriaSlots {
  id: string
  cursoNombre: string
  campusNombre: string
  campaignCode: string
  slots: CreativeSlot[]
}

interface CreativeSlot {
  key: string
  label: string
  type: 'image' | 'video'
  dimensions: string
  aspect: string
  mediaId: number | null
  mediaUrl: string | null
  uploading: boolean
}

interface ConvocatoriasApiPayload {
  data?: Array<{
    id: string | number
    cursoNombre?: string
    campusNombre?: string
  }>
}

// ---------------------------------------------------------------------------
// Slot templates
// ---------------------------------------------------------------------------

function createSlots(): CreativeSlot[] {
  return [
    { key: 'img_square', label: 'Imagen Cuadrada', type: 'image', dimensions: '1080x1080', aspect: '1:1', mediaId: null, mediaUrl: null, uploading: false },
    { key: 'vid_square', label: 'Video Cuadrado', type: 'video', dimensions: '1080x1080', aspect: '1:1', mediaId: null, mediaUrl: null, uploading: false },
    { key: 'img_vertical', label: 'Imagen Vertical', type: 'image', dimensions: '1080x1920', aspect: '9:16', mediaId: null, mediaUrl: null, uploading: false },
    { key: 'vid_vertical', label: 'Video Vertical', type: 'video', dimensions: '1080x1920', aspect: '9:16', mediaId: null, mediaUrl: null, uploading: false },
  ]
}

// ---------------------------------------------------------------------------
// Slot upload component
// ---------------------------------------------------------------------------

function SlotCard({ slot, onUpload, onDelete }: {
  slot: CreativeSlot
  onUpload: (file: File) => void
  onDelete: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isImage = slot.type === 'image'
  const accept = isImage ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime'

  return (
    <div className="border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2 transition-colors hover:border-primary/30">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
          {isImage ? <ImageIcon className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
          {slot.label}
        </div>
        <p className="text-[10px] text-muted-foreground">{slot.dimensions} ({slot.aspect})</p>
      </div>

      {/* Preview or upload zone */}
      {slot.mediaUrl ? (
        <div className="relative w-full group">
          {isImage ? (
            <img src={slot.mediaUrl} alt={slot.label} className="w-full rounded object-cover" style={{ aspectRatio: slot.aspect === '1:1' ? '1/1' : '9/16', maxHeight: 160 }} />
          ) : (
            <video src={slot.mediaUrl} className="w-full rounded" style={{ aspectRatio: slot.aspect === '1:1' ? '1/1' : '9/16', maxHeight: 160 }} muted />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="absolute top-1 right-1">
            <Check className="h-4 w-4 text-green-500 bg-white rounded-full p-0.5" />
          </div>
        </div>
      ) : slot.uploading ? (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-[10px] text-muted-foreground mt-1">Subiendo...</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-6 flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Upload className="h-6 w-6" />
          <span className="text-[10px]">Click para subir</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CreatividadesPage() {
  const [campaigns, setCampaigns] = useState<ConvocatoriaSlots[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConvocatorias = async () => {
      try {
        const res = await fetch('/api/convocatorias', { cache: 'no-cache' })
        if (!res.ok) return
        const payload = (await res.json()) as ConvocatoriasApiPayload
        const data = Array.isArray(payload.data) ? payload.data : []

        setCampaigns(
          data.map((c) => ({
            id: String(c.id),
            cursoNombre: c.cursoNombre ?? 'Curso',
            campusNombre: c.campusNombre ?? 'Sin sede',
            campaignCode: '',
            slots: createSlots(),
          }))
        )
      } catch {
        setCampaigns([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchConvocatorias()
  }, [])

  const handleUpload = async (campaignIdx: number, slotIdx: number, file: File) => {
    // Mark as uploading
    setCampaigns((prev) => {
      const next = [...prev]
      const slots = [...next[campaignIdx].slots]
      slots[slotIdx] = { ...slots[slotIdx], uploading: true }
      next[campaignIdx] = { ...next[campaignIdx], slots }
      return next
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${campaigns[campaignIdx].cursoNombre} - ${campaigns[campaignIdx].slots[slotIdx].label}`)

      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (res.ok) {
        const uploaded = await res.json()
        if (uploaded.doc?.id) {
          const url = uploaded.doc.url || `/media/${uploaded.doc.filename}`
          setCampaigns((prev) => {
            const next = [...prev]
            const slots = [...next[campaignIdx].slots]
            slots[slotIdx] = { ...slots[slotIdx], mediaId: uploaded.doc.id, mediaUrl: url, uploading: false }
            next[campaignIdx] = { ...next[campaignIdx], slots }
            return next
          })
          return
        }
      }
    } catch { /* fall through */ }

    // Reset on failure
    setCampaigns((prev) => {
      const next = [...prev]
      const slots = [...next[campaignIdx].slots]
      slots[slotIdx] = { ...slots[slotIdx], uploading: false }
      next[campaignIdx] = { ...next[campaignIdx], slots }
      return next
    })
  }

  const handleDelete = (campaignIdx: number, slotIdx: number) => {
    setCampaigns((prev) => {
      const next = [...prev]
      const slots = [...next[campaignIdx].slots]
      slots[slotIdx] = { ...slots[slotIdx], mediaId: null, mediaUrl: null }
      next[campaignIdx] = { ...next[campaignIdx], slots }
      return next
    })
  }

  const totalSlots = campaigns.reduce((sum, c) => sum + c.slots.length, 0)
  const filledSlots = campaigns.reduce((sum, c) => sum + c.slots.filter((s) => s.mediaId).length, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creatividades"
        description="Gestión de assets creativos para campañas publicitarias"
        icon={Sparkles}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{campaigns.length} convocatorias</Badge>
            <Badge variant={filledSlots > 0 ? 'default' : 'outline'}>
              {filledSlots}/{totalSlots} assets
            </Badge>
          </div>
        }
      />

      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando convocatorias...
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No hay convocatorias</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crea convocatorias desde Programacion para subir creatividades.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns.map((campaign, cIdx) => {
        const filled = campaign.slots.filter((s) => s.mediaId).length

        return (
          <Card key={campaign.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{campaign.cursoNombre}</CardTitle>
                    <p className="text-xs text-muted-foreground">{campaign.campusNombre}</p>
                  </div>
                </div>
                <Badge variant={filled === 4 ? 'default' : 'outline'}>
                  {filled}/4 assets
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {campaign.slots.map((slot, sIdx) => (
                  <SlotCard
                    key={slot.key}
                    slot={slot}
                    onUpload={(file) => handleUpload(cIdx, sIdx, file)}
                    onDelete={() => handleDelete(cIdx, sIdx)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
