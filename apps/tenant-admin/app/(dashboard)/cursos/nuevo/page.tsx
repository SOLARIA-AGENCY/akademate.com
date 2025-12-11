'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Label } from '@payload-config/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Badge } from '@payload-config/components/ui/badge'
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Plus,
  FileText,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { COURSE_TYPE_CONFIG, getCourseTypeConfig, type CourseTypeKey } from '@payload-config/lib/courseTypeConfig'
import { SubvencionItem } from '@payload-config/components/ui/SubvencionItem'
import { EntidadSelector } from '@payload-config/components/ui/EntidadSelector'
import { Switch } from '@payload-config/components/ui/switch'
import type { CourseType, Subvencion, EntidadFinanciadoraKey } from '@/types'

interface PDFFile {
  id: string
  name: string
  size: number
  url: string
}

interface AreaFormativa {
  id: number
  nombre: string
  codigo: string
  color?: string
}

export default function NuevoCursoPage() {
  const router = useRouter()

  // State for form fields
  const [nombre, setNombre] = React.useState('')
  const [descripcion, setDescripcion] = React.useState('')
  const [area, setArea] = React.useState('') // ID del área formativa
  const [tipo, setTipo] = React.useState<CourseType>('privados')
  const [duracionReferencia, setDuracionReferencia] = React.useState('')
  const [precioReferencia, setPrecioReferencia] = React.useState('0')
  const [objetivos, setObjetivos] = React.useState<string[]>([''])
  const [contenidos, setContenidos] = React.useState<string[]>([''])
  const [imagenPortada, setImagenPortada] = React.useState('')
  const [pdfFiles, setPdfFiles] = React.useState<PDFFile[]>([])

  // Áreas formativas desde API
  const [areasFormativas, setAreasFormativas] = React.useState<AreaFormativa[]>([])
  const [loadingAreas, setLoadingAreas] = React.useState(true)

  // Subvenciones y becas
  const [subvencionado, setSubvencionado] = React.useState(false)
  const [subvenciones, setSubvenciones] = React.useState<Subvencion[]>([])

  // Cargar áreas formativas al montar el componente con retry
  React.useEffect(() => {
    const fetchAreasWithRetry = async (retries = 2) => {
      try {
        // Timeout de 10 segundos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch('/api/areas-formativas', {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        const result = await response.json()
        if (result.success) {
          setAreasFormativas(result.data)
        } else {
          console.error('Error from API:', result.error)
          if (retries > 0) {
            console.log(`Reintentando cargar áreas... (${retries} intentos restantes)`)
            setTimeout(() => fetchAreasWithRetry(retries - 1), 1000)
            return
          }
        }
      } catch (error: any) {
        console.error('Error loading areas formativas:', error)

        // Retry en caso de timeout o error de red
        if (retries > 0) {
          console.log(`Reintentando cargar áreas... (${retries} intentos restantes)`)
          setTimeout(() => fetchAreasWithRetry(retries - 1), 1000)
          return
        }

        alert(
          '⚠️ No se pudieron cargar las áreas formativas. Por favor, recarga la página.'
        )
      } finally {
        setLoadingAreas(false)
      }
    }
    fetchAreasWithRetry()
  }, [])

  // Image upload preview
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)

  // Saving state
  const [isSaving, setIsSaving] = React.useState(false)

  const typeConfig = getCourseTypeConfig((tipo || 'privados') as CourseTypeKey)

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setImagenPortada(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    setImagenPortada('')
  }

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        alert(`El archivo ${file.name} no es un PDF`)
        return
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert(`El archivo ${file.name} supera el tamaño máximo de 10MB`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const newPDF: PDFFile = {
          id: `pdf-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          url: reader.result as string,
        }
        setPdfFiles((prev) => [...prev, newPDF])
      }
      reader.readAsDataURL(file)
    })

    // Limpiar input
    e.target.value = ''
  }

  const handleRemovePDF = (id: string) => {
    setPdfFiles(pdfFiles.filter((pdf) => pdf.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const addObjetivo = () => {
    setObjetivos([...objetivos, ''])
  }

  const removeObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index))
  }

  const updateObjetivo = (index: number, value: string) => {
    const updated = [...objetivos]
    updated[index] = value
    setObjetivos(updated)
  }

  const addContenido = () => {
    setContenidos([...contenidos, ''])
  }

  const removeContenido = (index: number) => {
    setContenidos(contenidos.filter((_, i) => i !== index))
  }

  const updateContenido = (index: number, value: string) => {
    const updated = [...contenidos]
    updated[index] = value
    setContenidos(updated)
  }

  const addSubvencion = (entidad: EntidadFinanciadoraKey) => {
    const nuevaSubvencion: Subvencion = {
      id: `sub-${Date.now()}`,
      entidad,
      porcentaje: 0,
      activa: true,
    }
    setSubvenciones([...subvenciones, nuevaSubvencion])
  }

  const updateSubvencion = (id: string, updates: Partial<Subvencion>) => {
    setSubvenciones(
      subvenciones.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub))
    )
  }

  const removeSubvencion = (id: string) => {
    setSubvenciones(subvenciones.filter((sub) => sub.id !== id))
  }

  const porcentajeTotalSubvencion = subvenciones
    .filter((sub) => sub.activa)
    .reduce((sum, sub) => sum + sub.porcentaje, 0)

  const handleSave = async () => {
    // Validaciones básicas
    if (!nombre.trim()) {
      alert('⚠️ El nombre del curso es obligatorio')
      return
    }
    if (!area) {
      alert('⚠️ Debes seleccionar un área formativa')
      return
    }

    setIsSaving(true)

    try {
      const courseData = {
        nombre,
        area_formativa_id: area, // ID del área formativa
        tipo,
        descripcion: descripcion || undefined,
        duracion_referencia: duracionReferencia ? duracionReferencia : undefined,
        precio_referencia: precioReferencia ? precioReferencia : undefined,
        // TODO Phase 2: Agregar objetivos, contenidos, PDFs cuando se implementen
        // objetivos: objetivos.filter((o) => o.trim() !== ''),
        // contenidos: contenidos.filter((c) => c.trim() !== ''),
        // imagenPortada,
        // pdfFiles,
        // subvencionado,
        // subvenciones,
      }

      console.log('Creating course:', courseData)

      const response = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(`✅ Curso creado exitosamente con código: ${result.data.codigo}`)
        // Invalidar cache de Next.js antes de navegar para forzar fresh fetch
        router.refresh()
        // Pequeño delay para asegurar que refresh se procese
        setTimeout(() => {
          router.push('/cursos')
        }, 100)
      } else {
        alert(`❌ Error al crear curso: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error creating course:', error)
      alert('❌ Error de conexión al crear el curso')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (nombre.trim() || descripcion.trim()) {
      if (confirm('¿Descartar cambios y volver a la lista de cursos?')) {
        router.push('/cursos')
      }
    } else {
      router.push('/cursos')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con badge tipo de curso a la derecha */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/cursos')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Curso</h1>
            <p className="text-muted-foreground mt-1">
              Crea un nuevo curso
            </p>
          </div>
        </div>

        {/* Badge: Tipo de curso */}
        <Badge
          className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white px-4 py-2 text-lg font-semibold uppercase`}
        >
          {typeConfig.label}
        </Badge>
      </div>

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>Datos principales del curso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre del Curso <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej. Máster en Marketing Digital"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">
                Área Formativa <span className="text-destructive">*</span>
              </Label>
              <Select value={area} onValueChange={setArea} disabled={loadingAreas}>
                <SelectTrigger id="area">
                  <SelectValue placeholder={loadingAreas ? "Cargando áreas..." : "Seleccionar área"} />
                </SelectTrigger>
                <SelectContent>
                  {areasFormativas.map((areaItem) => (
                    <SelectItem key={areaItem.id} value={String(areaItem.id)}>
                      {areaItem.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Curso</Label>
              <Select value={tipo} onValueChange={(value) => setTipo(value as CourseType)}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privados">Privados</SelectItem>
                  <SelectItem value="ocupados">Ocupados</SelectItem>
                  <SelectItem value="desempleados">Desempleados</SelectItem>
                  <SelectItem value="teleformacion">Teleformación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe brevemente el curso..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracion">Duración (horas)</Label>
              <Input
                id="duracion"
                type="number"
                value={duracionReferencia}
                onChange={(e) => setDuracionReferencia(e.target.value)}
                placeholder="ej. 300"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio de Referencia (€)</Label>
              <Input
                id="precio"
                type="number"
                value={precioReferencia}
                onChange={(e) => setPrecioReferencia(e.target.value)}
                placeholder="ej. 2500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imagen de Portada */}
      <Card>
        <CardHeader>
          <CardTitle>Imagen de Portada</CardTitle>
          <CardDescription>
            Imagen principal que se mostrará en las tarjetas de curso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-dashed border-primary">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer transition-colors">
                <label htmlFor="image-upload" className="flex flex-col items-center cursor-pointer">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Haz clic para subir una imagen
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    PNG, JPG hasta 5MB
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentación Adjunta */}
      <Card>
        <CardHeader>
          <CardTitle>Documentación Adjunta</CardTitle>
          <CardDescription>
            Adjunta PDFs con información adicional del curso (programas, temarios, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pdfFiles.length > 0 && (
            <div className="space-y-2">
              {pdfFiles.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pdf.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(pdf.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePDF(pdf.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer transition-colors">
            <label htmlFor="pdf-upload" className="flex flex-col items-center cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Haz clic para adjuntar PDFs
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Máximo 10MB por archivo
              </span>
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handlePDFUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Objetivos de Aprendizaje */}
      <Card>
        <CardHeader>
          <CardTitle>Objetivos de Aprendizaje</CardTitle>
          <CardDescription>
            Define los objetivos que los estudiantes alcanzarán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {objetivos.map((objetivo, index) => (
            <div key={index} className="flex items-center gap-2">
              <Textarea
                value={objetivo}
                onChange={(e) => updateObjetivo(index, e.target.value)}
                placeholder={`Objetivo ${index + 1}`}
                rows={2}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeObjetivo(index)}
                disabled={objetivos.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addObjetivo}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir Objetivo
          </Button>
        </CardContent>
      </Card>

      {/* Contenidos del Curso */}
      <Card>
        <CardHeader>
          <CardTitle>Contenidos del Curso</CardTitle>
          <CardDescription>
            Lista de temas y módulos que se cubrirán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contenidos.map((contenido, index) => (
            <div key={index} className="flex items-center gap-2">
              <Textarea
                value={contenido}
                onChange={(e) => updateContenido(index, e.target.value)}
                placeholder={`Módulo ${index + 1}`}
                rows={2}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeContenido(index)}
                disabled={contenidos.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addContenido}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir Contenido
          </Button>
        </CardContent>
      </Card>

      {/* Subvenciones y Becas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Subvenciones y Becas</span>
              <Switch
                checked={subvencionado}
                onCheckedChange={setSubvencionado}
                aria-label="Activar/desactivar subvenciones"
              />
            </div>
            {subvencionado && subvenciones.length > 0 && (
              <Badge
                variant={porcentajeTotalSubvencion === 100 ? 'default' : 'secondary'}
                className="text-sm"
              >
                Total: {porcentajeTotalSubvencion}%
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configura las entidades financiadoras y porcentajes de subvención
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subvencionado ? (
            <>
              {subvenciones.length > 0 && (
                <div className="space-y-3">
                  {subvenciones.map((subvencion) => (
                    <SubvencionItem
                      key={subvencion.id}
                      subvencion={subvencion}
                      onUpdate={(updates) => updateSubvencion(subvencion.id, updates)}
                      onRemove={() => removeSubvencion(subvencion.id)}
                    />
                  ))}
                </div>
              )}
              <EntidadSelector
                onSelect={addSubvencion}
                entidadesUsadas={subvenciones.map((s) => s.entidad)}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Activa el switch para agregar subvenciones
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botonera inferior - botones a la derecha */}
      <div className="border-t pt-6 mt-12 mb-8">
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !nombre.trim() || !area}
            size="lg"
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white font-bold uppercase`}
          >
            <Save className="mr-2 h-5 w-5" />
            {isSaving ? 'Guardando...' : 'CREAR CURSO'}
          </Button>
        </div>
      </div>
    </div>
  )
}
