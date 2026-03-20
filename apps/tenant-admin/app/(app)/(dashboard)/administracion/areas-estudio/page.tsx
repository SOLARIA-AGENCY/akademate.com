'use client'
import { useState, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Plus, Trash2, Save, Loader2, BookOpen, Check, Palette, X, Pencil } from 'lucide-react'

interface Area {
  id: number
  nombre: string
  codigo: string
  color: string | null
  descripcion: string | null
  activo: boolean
}

export default function AreasEstudioPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)

  // Form state
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [descripcion, setDescripcion] = useState('')

  const fetchAreas = async () => {
    try {
      const res = await fetch('/api/areas-formativas?limit=100&sort=nombre')
      const data = await res.json()
      setAreas(data.docs ?? [])
    } catch {
      console.error('Error fetching areas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchAreas() }, [])

  const resetForm = () => {
    setNombre('')
    setCodigo('')
    setColor('#3B82F6')
    setDescripcion('')
    setEditingId(null)
    setShowNew(false)
  }

  const startEdit = (area: Area) => {
    setEditingId(area.id)
    setNombre(area.nombre)
    setCodigo(area.codigo)
    setColor(area.color ?? '#3B82F6')
    setDescripcion(area.descripcion ?? '')
    setShowNew(false)
  }

  const startNew = () => {
    resetForm()
    setShowNew(true)
  }

  const handleSave = async () => {
    if (!nombre.trim() || !codigo.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await fetch(`/api/areas-formativas/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, codigo: codigo.toUpperCase(), color, descripcion, activo: true }),
        })
      } else {
        await fetch('/api/areas-formativas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, codigo: codigo.toUpperCase(), color, descripcion, activo: true }),
        })
      }
      resetForm()
      await fetchAreas()
    } catch {
      console.error('Error saving area')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar esta area de estudio?')) return
    try {
      await fetch(`/api/areas-formativas/${id}`, { method: 'DELETE' })
      await fetchAreas()
    } catch {
      console.error('Error deleting area')
    }
  }

  const isFormValid = nombre.trim().length > 0 && /^[A-Z]{3,4}$/.test(codigo.toUpperCase()) && /^#[0-9A-Fa-f]{6}$/.test(color)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Areas de Estudio"
        description="Gestiona las areas de conocimiento para ciclos y cursos"
        icon={BookOpen}
        actions={
          <Button size="sm" onClick={startNew} disabled={showNew}>
            <Plus className="mr-1 h-4 w-4" /> Nueva Area
          </Button>
        }
      />

      {/* New area form */}
      {showNew && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva Area de Estudio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej: Marketing Digital"
                  value={nombre}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <Label>Codigo (3-4 letras)</Label>
                <Input
                  placeholder="Ej: MKT"
                  value={codigo}
                  maxLength={4}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value.toUpperCase())}
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
                  placeholder="Breve descripcion del area"
                  value={descripcion}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDescripcion(e.target.value)}
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

      {/* Areas list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No hay areas de estudio. Crea la primera.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <Card
              key={area.id}
              className={`transition-shadow hover:shadow-md ${editingId === area.id ? 'ring-2 ring-primary/40' : ''}`}
            >
              {editingId === area.id ? (
                /* Inline edit form */
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Label className="text-xs">Nombre</Label>
                    <Input
                      value={nombre}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Codigo</Label>
                    <Input
                      value={codigo}
                      maxLength={4}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value.toUpperCase())}
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
                      value={descripcion}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setDescripcion(e.target.value)}
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
                        style={{ backgroundColor: (area.color ?? '#3B82F6') + '20' }}
                      >
                        <BookOpen className="h-5 w-5" style={{ color: area.color ?? '#3B82F6' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{area.nombre}</p>
                        <p className="text-xs text-muted-foreground font-mono">{area.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(area)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => void handleDelete(area.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: area.color ?? '#3B82F6' }}
                      />
                      <span className="text-xs text-muted-foreground">{area.color ?? 'Sin color'}</span>
                      {area.activo ? (
                        <Badge variant="outline" className="ml-auto text-xs">Activa</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-auto text-xs">Inactiva</Badge>
                      )}
                    </div>
                    {area.descripcion && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{area.descripcion}</p>
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
