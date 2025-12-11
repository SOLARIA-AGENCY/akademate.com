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
  Trash2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
// TODO: Fetch from Payload API
// import { plantillasCursosData } from '@payload-config/data/mockCourseTemplatesData'
const plantillasCursosData: any[] = []
import { COURSE_TYPE_CONFIG, getCourseTypeConfig, type CourseTypeKey } from '@payload-config/lib/courseTypeConfig'
import { SubvencionItem } from '@payload-config/components/ui/SubvencionItem'
import { EntidadSelector } from '@payload-config/components/ui/EntidadSelector'
import { Switch } from '@payload-config/components/ui/switch'
import { DangerZone } from '@payload-config/components/ui/DangerZone'
import type { PlantillaCurso, CourseType, Subvencion, EntidadFinanciadoraKey } from '@/types'

interface CourseEditPageProps {
  params: Promise<{ id: string }>
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  // Find the course template
  const originalCourse = plantillasCursosData.find((c) => c.id === id)

  // State for form fields
  const [nombre, setNombre] = React.useState(originalCourse?.nombre || '')
  const [descripcion, setDescripcion] = React.useState(originalCourse?.descripcion || '')
  const [area, setArea] = React.useState(originalCourse?.area || '')
  const [tipo, setTipo] = React.useState<CourseType>(originalCourse?.tipo || 'privados')
  const [duracionReferencia, setDuracionReferencia] = React.useState(
    originalCourse?.duracionReferencia?.toString() || ''
  )
  const [precioReferencia, setPrecioReferencia] = React.useState(
    originalCourse?.precioReferencia?.toString() || '0'
  )
  const [objetivos, setObjetivos] = React.useState<string[]>(originalCourse?.objetivos || [''])
  const [contenidos, setContenidos] = React.useState<string[]>(originalCourse?.contenidos || [''])
  const [imagenPortada, setImagenPortada] = React.useState(originalCourse?.imagenPortada || '')
  const [pdfFiles, setPdfFiles] = React.useState<string[]>([])

  // Subvenciones y becas
  const [subvencionado, setSubvencionado] = React.useState(originalCourse?.subvencionado || false)
  const [subvenciones, setSubvenciones] = React.useState<Subvencion[]>(
    originalCourse?.subvenciones || []
  )

  // Image upload preview
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    originalCourse?.imagenPortada || null
  )

  if (!originalCourse) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Curso no encontrado</CardTitle>
            <CardDescription>El curso con ID {id} no existe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/cursos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const typeConfig = getCourseTypeConfig((tipo || 'privados') as CourseTypeKey)

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setImagenPortada(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newPdfs = Array.from(files).map((file) => file.name)
      setPdfFiles([...pdfFiles, ...newPdfs])
    }
  }

  const removePdf = (index: number) => {
    setPdfFiles(pdfFiles.filter((_, i) => i !== index))
  }

  const addObjetivo = () => {
    setObjetivos([...objetivos, ''])
  }

  const updateObjetivo = (index: number, value: string) => {
    const newObjetivos = [...objetivos]
    newObjetivos[index] = value
    setObjetivos(newObjetivos)
  }

  const removeObjetivo = (index: number) => {
    setObjetivos(objetivos.filter((_, i) => i !== index))
  }

  const addContenido = () => {
    setContenidos([...contenidos, ''])
  }

  const updateContenido = (index: number, value: string) => {
    const newContenidos = [...contenidos]
    newContenidos[index] = value
    setContenidos(newContenidos)
  }

  const removeContenido = (index: number) => {
    setContenidos(contenidos.filter((_, i) => i !== index))
  }

  // Subvenciones handlers
  const handleToggleSubvencionado = (checked: boolean) => {
    setSubvencionado(checked)
    if (!checked) {
      setSubvenciones([])
    }
  }

  const handleAddSubvencion = (entidad: EntidadFinanciadoraKey) => {
    const nuevaSubvencion: Subvencion = {
      id: `subv-${Date.now()}`,
      entidad,
      porcentaje: 100,
      activa: true,
      requisitos: '',
      urlInfo: '',
    }
    setSubvenciones([...subvenciones, nuevaSubvencion])
  }

  const handleUpdateSubvencion = (index: number, updated: Subvencion) => {
    const newSubvenciones = [...subvenciones]
    newSubvenciones[index] = updated
    setSubvenciones(newSubvenciones)
  }

  const handleRemoveSubvencion = (index: number) => {
    setSubvenciones(subvenciones.filter((_, i) => i !== index))
  }

  const calcularSubvencionTotal = (): number => {
    const total = subvenciones
      .filter((s) => s.activa)
      .reduce((acc, s) => acc + s.porcentaje, 0)
    return Math.min(total, 100)
  }

  const handleSave = () => {
    // In real implementation, this would call API to update course
    const porcentajeSubvencion = calcularSubvencionTotal()
    console.log('Saving course:', {
      id,
      nombre,
      descripcion,
      area,
      tipo,
      duracionReferencia: parseInt(duracionReferencia),
      precioReferencia: parseFloat(precioReferencia),
      objetivos: objetivos.filter((o) => o.trim() !== ''),
      contenidos: contenidos.filter((c) => c.trim() !== ''),
      imagenPortada,
      pdfFiles,
      subvencionado,
      porcentajeSubvencion,
      subvenciones: subvenciones.filter((s) => s.activa),
    })
    router.push(`/cursos/${id}`)
  }

  const handleCancel = () => {
    router.push(`/cursos/${id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/cursos/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Curso</h1>
            <p className="text-muted-foreground">{originalCourse.nombre}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Type Badge */}
      <Card>
        <CardContent className="pt-6">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-sm font-bold uppercase`}
          >
            {typeConfig.label}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE: 2/3 - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Curso</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Marketing Digital Avanzado"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción breve del curso"
                  rows={4}
                />
              </div>

              {/* Area and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Área</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona área" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing Digital">Marketing Digital</SelectItem>
                      <SelectItem value="Desarrollo Web">Desarrollo Web</SelectItem>
                      <SelectItem value="Diseño Gráfico">Diseño Gráfico</SelectItem>
                      <SelectItem value="Audiovisual">Audiovisual</SelectItem>
                      <SelectItem value="Gestión Empresarial">Gestión Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Curso</Label>
                  <Select value={tipo} onValueChange={(value) => setTipo(value as CourseType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="privados">Privados</SelectItem>
                      <SelectItem value="ocupados">Ocupados</SelectItem>
                      <SelectItem value="desempleados">Desempleados</SelectItem>
                      <SelectItem value="teleformacion">Teleformación</SelectItem>
                      <SelectItem value="ciclo-medio">Ciclo Medio</SelectItem>
                      <SelectItem value="ciclo-superior">Ciclo Superior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (horas)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracionReferencia}
                    onChange={(e) => setDuracionReferencia(e.target.value)}
                    placeholder="Ej: 40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio">Precio de Referencia (€)</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={precioReferencia}
                    onChange={(e) => setPrecioReferencia(e.target.value)}
                    placeholder="Ej: 1200 (0 para subvencionado)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos del Curso</CardTitle>
              <CardDescription>Objetivos de aprendizaje y competencias a desarrollar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {objetivos.map((objetivo, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      value={objetivo}
                      onChange={(e) => updateObjetivo(index, e.target.value)}
                      placeholder={`Objetivo ${index + 1}`}
                      rows={2}
                    />
                  </div>
                  {objetivos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjetivo(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addObjetivo}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Objetivo
              </Button>
            </CardContent>
          </Card>

          {/* Contenidos */}
          <Card>
            <CardHeader>
              <CardTitle>Contenidos del Programa</CardTitle>
              <CardDescription>Temario y módulos del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contenidos.map((contenido, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      value={contenido}
                      onChange={(e) => updateContenido(index, e.target.value)}
                      placeholder={`Contenido ${index + 1}`}
                      rows={2}
                    />
                  </div>
                  {contenidos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContenido(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addContenido}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Contenido
              </Button>
            </CardContent>
          </Card>

          {/* Subvenciones y Becas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subvenciones y Becas</CardTitle>
                  <CardDescription>Gestiona las ayudas económicas disponibles para este curso</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="subvencionado"
                    checked={subvencionado}
                    onCheckedChange={handleToggleSubvencionado}
                  />
                  <Label htmlFor="subvencionado" className="cursor-pointer">
                    Curso subvencionado
                  </Label>
                </div>
              </div>
            </CardHeader>

            {subvencionado && (
              <CardContent className="space-y-6">
                {/* Resumen de subvención total */}
                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Subvención Total
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Calculado automáticamente según entidades
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {calcularSubvencionTotal()}%
                    </div>
                  </div>
                </div>

                {/* Lista de subvenciones activas */}
                {subvenciones.length > 0 && (
                  <div className="space-y-3">
                    <Label>Entidades Financiadoras</Label>
                    {subvenciones.map((subvencion, index) => (
                      <SubvencionItem
                        key={subvencion.id}
                        subvencion={subvencion}
                        onUpdate={(updated) => handleUpdateSubvencion(index, updated)}
                        onRemove={() => handleRemoveSubvencion(index)}
                      />
                    ))}
                  </div>
                )}

                {/* Selector de nueva entidad */}
                <div className={subvenciones.length > 0 ? 'border-t pt-4' : ''}>
                  <EntidadSelector
                    onSelect={handleAddSubvencion}
                    excluidas={subvenciones.map((s) => s.entidad)}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Media Uploads */}
        <div className="lg:col-span-1 space-y-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imagen de Portada</CardTitle>
              <CardDescription>Foto principal del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {imagePreview && (
                <div className="relative aspect-video overflow-hidden rounded-lg border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-input p-4 hover:bg-accent transition-colors">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </span>
                  </div>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* PDF Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos PDF</CardTitle>
              <CardDescription>Materiales y recursos del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pdfFiles.length > 0 && (
                <div className="space-y-2">
                  {pdfFiles.map((pdf, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{pdf}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePdf(index)}
                        className="flex-shrink-0 h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <Label htmlFor="pdf-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-input p-4 hover:bg-accent transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Subir PDF</span>
                  </div>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Danger Zone - Eliminar Curso */}
      <div className="border-t pt-8 mt-12">
        <DangerZone
          cursoId={id}
          nombreCurso={originalCourse.nombre}
          tieneConvocatorias={originalCourse.totalConvocatorias > 0}
          numeroConvocatorias={originalCourse.totalConvocatorias}
        />
      </div>
    </div>
  )
}
