'use client'
import { useState, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Plus, Trash2, Save, Loader2, Tag, Check, X, Pencil } from 'lucide-react'

interface CourseType {
  id: number
  name: string
  code: string
  color: string
  description: string | null
  active: boolean
}

const PRESETS = [
  { name: 'Desempleados', code: 'DES', color: '#3B82F6', description: 'Cursos para personas en situacion de desempleo' },
  { name: 'Ocupados', code: 'OCU', color: '#22C55E', description: 'Formacion para trabajadores en activo' },
  { name: 'Teleformacion', code: 'TEL', color: '#F97316', description: 'Cursos en modalidad online/distancia' },
]

export default function TiposEstudioPage() {
  const [types, setTypes] = useState<CourseType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [description, setDescription] = useState('')

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/course-types?limit=100&sort=name')
      const data = await res.json()
      setTypes(data.docs ?? [])
    } catch {
      console.error('Error fetching course types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchTypes() }, [])

  const resetForm = () => {
    setName('')
    setCode('')
    setColor('#3B82F6')
    setDescription('')
    setEditingId(null)
    setShowNew(false)
  }

  const startEdit = (type: CourseType) => {
    setEditingId(type.id)
    setName(type.name)
    setCode(type.code)
    setColor(type.color)
    setDescription(type.description ?? '')
    setShowNew(false)
  }

  const startNew = () => {
    resetForm()
    setShowNew(true)
  }

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setName(preset.name)
    setCode(preset.code)
    setColor(preset.color)
    setDescription(preset.description)
  }

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await fetch(`/api/course-types/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, code: code.toUpperCase(), color, description, active: true }),
        })
      } else {
        await fetch('/api/course-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, code: code.toUpperCase(), color, description, active: true }),
        })
      }
      resetForm()
      await fetchTypes()
    } catch {
      console.error('Error saving course type')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar este tipo de estudio?')) return
    try {
      await fetch(`/api/course-types/${id}`, { method: 'DELETE' })
      await fetchTypes()
    } catch {
      console.error('Error deleting course type')
    }
  }

  const isFormValid = name.trim().length > 0 && /^[A-Z]{3,4}$/.test(code.toUpperCase()) && /^#[0-9A-Fa-f]{6}$/.test(color)

  // Filter out presets that already exist
  const existingCodes = types.map((t) => t.code)
  const availablePresets = PRESETS.filter((p) => !existingCodes.includes(p.code))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Estudio"
        description="Define los tipos de curso por audiencia o modalidad"
        icon={Tag}
        actions={
          <Button size="sm" onClick={startNew} disabled={showNew}>
            <Plus className="mr-1 h-4 w-4" /> Nuevo Tipo
          </Button>
        }
      />

      {/* New type form */}
      {showNew && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo Tipo de Estudio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset suggestions */}
            {availablePresets.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Sugerencias rapidas:</p>
                <div className="flex flex-wrap gap-2">
                  {availablePresets.map((preset) => (
                    <Button
                      key={preset.code}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: preset.color, color: preset.color }}
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name} ({preset.code})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej: Desempleados"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>Codigo (3-4 letras)</Label>
                <Input
                  placeholder="Ej: DES"
                  value={code}
                  maxLength={4}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Color (hex)</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="h-9 w-9 rounded border border-border shrink-0"
                    style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#ccc' }}
                  />
                  <Input
                    placeholder="#3B82F6"
                    value={color}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Descripcion (opcional)</Label>
                <Input
                  placeholder="Breve descripcion del tipo"
                  value={description}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isFormValid}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm}>
                <X className="mr-1 h-4 w-4" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Types list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : types.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay tipos de estudio. Crea el primero.</p>
            {!showNew && (
              <Button size="sm" variant="outline" className="mt-3" onClick={startNew}>
                <Plus className="mr-1 h-4 w-4" /> Crear tipo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <Card
              key={type.id}
              className={`border-l-4 transition-shadow hover:shadow-md ${editingId === type.id ? 'ring-2 ring-primary/40' : ''}`}
              style={{ borderLeftColor: type.color }}
            >
              {editingId === type.id ? (
                /* Inline edit form */
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Codigo</Label>
                    <Input
                      value={code}
                      maxLength={4}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded border border-border shrink-0"
                        style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#ccc' }}
                      />
                      <Input
                        value={color}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Descripcion</Label>
                    <Input
                      value={description}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isFormValid}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* Display card */
                <>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: type.color + '20' }}
                      >
                        <Tag className="h-5 w-5" style={{ color: type.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{type.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{type.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(type)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => void handleDelete(type.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-xs text-muted-foreground">{type.color}</span>
                      {type.active ? (
                        <Badge variant="outline" className="ml-auto text-xs">Activo</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-auto text-xs">Inactivo</Badge>
                      )}
                    </div>
                    {type.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{type.description}</p>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
