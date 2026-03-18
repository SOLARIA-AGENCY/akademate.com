'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NuevoCicloPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: 'superior',
    duration_hours: '',
    family: '',
    description: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code || undefined,
          level: formData.level,
          duration_hours: formData.duration_hours ? parseInt(formData.duration_hours, 10) : undefined,
          family: formData.family || undefined,
          description: formData.description || undefined,
          tenant: parseInt(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '1', 10),
        }),
      })
      if (res.ok) {
        router.push('/ciclos')
      }
    } catch (err) {
      console.error('Error creating cycle:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Ciclo Formativo"
        description="Crea un nuevo ciclo de formacion profesional"
        icon={GraduationCap}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/ciclos')}>
          <ArrowLeft className="h-4 w-4" />
          Volver a Ciclos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Ciclo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Ciclo *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Desarrollo de Aplicaciones Web"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Codigo</Label>
                <Input
                  id="code"
                  placeholder="Ej: DAW-2026"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select value={formData.level} onValueChange={(v) => handleChange('level', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medio">Grado Medio</SelectItem>
                    <SelectItem value="superior">Grado Superior</SelectItem>
                    <SelectItem value="basico">Formacion Profesional Basica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duracion (horas)</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  placeholder="Ej: 2000"
                  value={formData.duration_hours}
                  onChange={(e) => handleChange('duration_hours', e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="family">Familia Profesional</Label>
                <Input
                  id="family"
                  placeholder="Ej: Informatica y Comunicaciones"
                  value={formData.family}
                  onChange={(e) => handleChange('family', e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripcion</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Descripcion del ciclo formativo..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.push('/ciclos')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando...' : 'Crear Ciclo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
