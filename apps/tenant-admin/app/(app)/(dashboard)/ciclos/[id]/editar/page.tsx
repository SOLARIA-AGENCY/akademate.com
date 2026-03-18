'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { GraduationCap, ArrowLeft, Save, Loader2 } from 'lucide-react'

export default function EditarCicloPage() {
  const params = useParams()
  const router = useRouter()
  const cycleId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    level: '',
    family: '',
    officialTitle: '',
    duration_total_hours: '',
    duration_courses: '',
    duration_modality: '',
    duration_class_frequency: '',
    duration_schedule: '',
    duration_practice_hours: '',
  })

  useEffect(() => {
    fetch(`/api/cycles/${cycleId}?depth=1`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            level: data.level || '',
            family: data.family || '',
            officialTitle: data.officialTitle || '',
            duration_total_hours: data.duration?.totalHours?.toString() || '',
            duration_courses: data.duration?.courses?.toString() || '',
            duration_modality: data.duration?.modality || '',
            duration_class_frequency: data.duration?.classFrequency || '',
            duration_schedule: data.duration?.schedule || '',
            duration_practice_hours: data.duration?.practiceHours?.toString() || '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [cycleId])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/cycles/${cycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          level: formData.level,
          family: formData.family,
          officialTitle: formData.officialTitle,
          duration: {
            totalHours: formData.duration_total_hours ? parseInt(formData.duration_total_hours, 10) : undefined,
            courses: formData.duration_courses ? parseInt(formData.duration_courses, 10) : undefined,
            modality: formData.duration_modality || undefined,
            classFrequency: formData.duration_class_frequency || undefined,
            schedule: formData.duration_schedule || undefined,
            practiceHours: formData.duration_practice_hours ? parseInt(formData.duration_practice_hours, 10) : undefined,
          },
        }),
      })
      if (res.ok) router.push(`/ciclos/${cycleId}`)
    } catch (err) {
      console.error('Error updating cycle:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar: ${formData.name}`}
        description="Modifica los datos del ciclo formativo"
        icon={GraduationCap}
      />
      <Button variant="ghost" size="sm" onClick={() => router.push(`/ciclos/${cycleId}`)}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al detalle
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Ciclo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={formData.level} onValueChange={(v) => handleChange('level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fp_basica">FP Basica</SelectItem>
                    <SelectItem value="grado_medio">Grado Medio</SelectItem>
                    <SelectItem value="grado_superior">Grado Superior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Familia Profesional</Label>
                <Input value={formData.family} onChange={(e) => handleChange('family', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Titulo Oficial</Label>
                <Input value={formData.officialTitle} onChange={(e) => handleChange('officialTitle', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripcion</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold pt-4">Duracion y Modalidad</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Horas Totales</Label>
                <Input type="number" value={formData.duration_total_hours} onChange={(e) => handleChange('duration_total_hours', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cursos</Label>
                <Input type="number" value={formData.duration_courses} onChange={(e) => handleChange('duration_courses', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Modalidad</Label>
                <Select value={formData.duration_modality} onValueChange={(v) => handleChange('duration_modality', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="semipresencial">Semipresencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frecuencia Clases</Label>
                <Input value={formData.duration_class_frequency} onChange={(e) => handleChange('duration_class_frequency', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Horario</Label>
                <Input value={formData.duration_schedule} onChange={(e) => handleChange('duration_schedule', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Horas Practicas</Label>
                <Input type="number" value={formData.duration_practice_hours} onChange={(e) => handleChange('duration_practice_hours', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push(`/ciclos/${cycleId}`)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
