'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Loader2, ArrowLeft, Save, Eye, UserPlus, Upload, Edit } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

interface CourseRunOption {
  id: string | number
  code?: string | null
  status?: string | null
  start_date?: string | null
  end_date?: string | null
  course_name?: string | null
  campus_name?: string | null
}

interface DetailDoc {
  id: string | number
  status?: string
  payment_status?: string
  total_amount?: number
  amount_paid?: number
  financial_aid_applied?: boolean
  financial_aid_amount?: number
  financial_aid_status?: string | null
  notes?: string | null
  cancellation_reason?: string | null
  lead?: {
    id?: string | number
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
    dni?: string | null
    address?: string | null
    city?: string | null
    postal_code?: string | null
    date_of_birth?: string | null
    photo_id?: string | number | null
    photo_url?: string | null
  }
  course_run?: {
    id?: string | number
  }
  available_course_runs?: CourseRunOption[]
}

const ENROLLMENT_STATUSES = [
  'pending',
  'confirmed',
  'waitlisted',
  'cancelled',
  'completed',
  'withdrawn',
]

const PAYMENT_STATUSES = ['pending', 'partial', 'paid', 'refunded', 'waived']
const FINANCIAL_AID_STATUSES = ['none', 'pending', 'approved', 'rejected']

export default function MatriculaEditPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doc, setDoc] = useState<DetailDoc | null>(null)

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dni: '',
    address: '',
    city: '',
    postal_code: '',
    date_of_birth: '',
    photo_id: '',
    status: 'pending',
    payment_status: 'pending',
    total_amount: '0',
    amount_paid: '0',
    financial_aid_applied: false,
    financial_aid_amount: '0',
    financial_aid_status: 'none',
    course_run_id: '',
    notes: '',
    cancellation_reason: '',
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setError(null)
        const res = await fetch(`/api/matriculas/${id}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(typeof data?.error === 'string' ? data.error : 'No se pudo cargar la matrícula')
        }

        if (cancelled) return

        const detail = data as DetailDoc
        setDoc(detail)
        setPhotoPreview(detail.lead?.photo_url ?? null)
        setForm({
          first_name: detail.lead?.first_name ?? '',
          last_name: detail.lead?.last_name ?? '',
          email: detail.lead?.email ?? '',
          phone: detail.lead?.phone ?? '',
          dni: detail.lead?.dni ?? '',
          address: detail.lead?.address ?? '',
          city: detail.lead?.city ?? '',
          postal_code: detail.lead?.postal_code ?? '',
          date_of_birth: detail.lead?.date_of_birth ? String(detail.lead.date_of_birth).slice(0, 10) : '',
          photo_id:
            detail.lead?.photo_id !== null && detail.lead?.photo_id !== undefined
              ? String(detail.lead.photo_id)
              : '',
          status: detail.status ?? 'pending',
          payment_status: detail.payment_status ?? 'pending',
          total_amount: String(detail.total_amount ?? 0),
          amount_paid: String(detail.amount_paid ?? 0),
          financial_aid_applied: Boolean(detail.financial_aid_applied),
          financial_aid_amount: String(detail.financial_aid_amount ?? 0),
          financial_aid_status: detail.financial_aid_status ?? 'none',
          course_run_id:
            detail.course_run?.id !== null && detail.course_run?.id !== undefined
              ? String(detail.course_run.id)
              : '',
          notes: detail.notes ?? '',
          cancellation_reason: detail.cancellation_reason ?? '',
        })
      } catch (e) {
        if (!cancelled) {
          setDoc(null)
          setError(e instanceof Error ? e.message : 'No se pudo cargar la matrícula')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      setPhotoPreview(URL.createObjectURL(file))
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${form.first_name || 'Alumno'} ${form.last_name || ''}`.trim() || 'Alumno')
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.doc?.id) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'No se pudo subir la foto')
      }
      setForm((current) => ({ ...current, photo_id: String(data.doc.id) }))
      if (data?.doc?.url) setPhotoPreview(String(data.doc.url))
      if (data?.doc?.filename) setPhotoPreview(`/media/${String(data.doc.filename)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la foto')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/matriculas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            dni: form.dni,
            address: form.address,
            city: form.city,
            postal_code: form.postal_code,
            date_of_birth: form.date_of_birth,
            photo_id: form.photo_id || null,
          },
          enrollment: {
            status: form.status,
            payment_status: form.payment_status,
            total_amount: Number(form.total_amount || 0),
            amount_paid: Number(form.amount_paid || 0),
            financial_aid_applied: form.financial_aid_applied,
            financial_aid_amount: Number(form.financial_aid_amount || 0),
            financial_aid_status: form.financial_aid_status,
            course_run_id: form.course_run_id,
            notes: form.notes,
            cancellation_reason: form.cancellation_reason,
          },
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'No se pudo guardar la ficha')
      }

      router.push(`/matriculas/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la ficha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar Matrícula #${id}`}
        description="Actualiza convocatoria, pago y ficha completa del alumno"
        icon={Edit}
        actions={
          <div className="flex gap-2">
            {doc?.lead?.id ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/matriculas?nueva=1&leadId=${String(doc.lead?.id)}`)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Matricular en otro curso
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => router.push(`/matriculas/${id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver ficha
            </Button>
            <Button variant="ghost" onClick={() => router.push('/matriculas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        }
      />

      {error ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Datos del Alumno</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center gap-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Foto alumno" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted" />
            )}
            <div>
              <Label htmlFor="photo-upload">Foto del alumno</Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                disabled={uploadingPhoto || saving}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handlePhotoUpload(file)
                }}
              />
              {uploadingPhoto ? (
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Subiendo foto...
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  JPG/PNG recomendado
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Nombre</Label>
            <Input value={form.first_name} onChange={(e) => setForm((c) => ({ ...c, first_name: e.target.value }))} />
          </div>
          <div>
            <Label>Apellidos</Label>
            <Input value={form.last_name} onChange={(e) => setForm((c) => ({ ...c, last_name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
          </div>
          <div>
            <Label>DNI / NIE</Label>
            <Input value={form.dni} onChange={(e) => setForm((c) => ({ ...c, dni: e.target.value }))} />
          </div>
          <div>
            <Label>Fecha de nacimiento</Label>
            <Input type="date" value={form.date_of_birth} onChange={(e) => setForm((c) => ({ ...c, date_of_birth: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Dirección</Label>
            <Input value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} />
          </div>
          <div>
            <Label>Ciudad</Label>
            <Input value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} />
          </div>
          <div>
            <Label>Código Postal</Label>
            <Input value={form.postal_code} onChange={(e) => setForm((c) => ({ ...c, postal_code: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos de Matrícula</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Convocatoria</Label>
            <Select value={form.course_run_id} onValueChange={(value) => setForm((c) => ({ ...c, course_run_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona convocatoria" />
              </SelectTrigger>
              <SelectContent>
                {(doc?.available_course_runs ?? []).map((run) => (
                  <SelectItem key={String(run.id)} value={String(run.id)}>
                    {(run.course_name || 'Curso')} · {(run.code || 'Sin código')} · {(run.campus_name || 'Sin sede')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado matrícula</Label>
            <Select value={form.status} onValueChange={(value) => setForm((c) => ({ ...c, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado pago</Label>
            <Select value={form.payment_status} onValueChange={(value) => setForm((c) => ({ ...c, payment_status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Importe total (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.total_amount}
              onChange={(e) => setForm((c) => ({ ...c, total_amount: e.target.value }))}
            />
          </div>

          <div>
            <Label>Importe pagado (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount_paid}
              onChange={(e) => setForm((c) => ({ ...c, amount_paid: e.target.value }))}
            />
          </div>

          <div>
            <Label>Ayuda financiera aplicada</Label>
            <Select
              value={form.financial_aid_applied ? 'true' : 'false'}
              onValueChange={(value) => setForm((c) => ({ ...c, financial_aid_applied: value === 'true' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Sí</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Importe ayuda (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.financial_aid_amount}
              onChange={(e) => setForm((c) => ({ ...c, financial_aid_amount: e.target.value }))}
            />
          </div>

          <div>
            <Label>Estado ayuda financiera</Label>
            <Select
              value={form.financial_aid_status}
              onValueChange={(value) => setForm((c) => ({ ...c, financial_aid_status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_AID_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Notas</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} rows={4} />
          </div>

          <div className="md:col-span-2">
            <Label>Motivo de cancelación (si aplica)</Label>
            <Textarea
              value={form.cancellation_reason}
              onChange={(e) => setForm((c) => ({ ...c, cancellation_reason: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(`/matriculas/${id}`)} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving || uploadingPhoto}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
