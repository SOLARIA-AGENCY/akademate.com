'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
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
import { PageHeader } from '@payload-config/components/ui/PageHeader'
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
import {
  getCourseTypeConfig,
  type CourseTypeKey,
  type CourseTypeConfigValue,
} from '@/lib/courseTypeConfig'
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

interface AreasFormativasApiResponse {
  success: boolean
  data: AreaFormativa[]
  error?: string
}

interface CreateCourseApiResponse {
  success: boolean
  data: {
    id: number
    codigo: string
    nombre: string
  }
  error?: string
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
  const [_imagenPortada, setImagenPortada] = React.useState('')
  const [pdfFiles, setPdfFiles] = React.useState<PDFFile[]>([])

  // Áreas formativas desde API
  const [areasFormativas, setAreasFormativas] = React.useState<AreaFormativa[]>([])
  const [loadingAreas, setLoadingAreas] = React.useState(true)

  // Subvenciones y becas
  const [subvencionado, setSubvencionado] = React.useState(false)
  const [subvenciones, setSubvenciones] = React.useState<Subvencion[]>([])

  // Cargar áreas formativas al montar el componente con retry
  React.useEffect(() => {
    const fetchAreasWithRetry = async (retries = 2): Promise<void> => {
      try {
        // Timeout de 10 segundos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch('/api/areas-formativas', {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        const result: AreasFormativasApiResponse =
          (await response.json()) as AreasFormativasApiResponse
        if (result.success) {
          setAreasFormativas(result.data)
        } else {
          console.error('Error from API:', result.error)
          if (retries > 0) {
            console.log(`Reintentando cargar áreas... (${retries} intentos restantes)`)
            setTimeout(() => {
              void fetchAreasWithRetry(retries - 1)
            }, 1000)
            return
          }
        }
      } catch (error: unknown) {
        console.error('Error loading areas formativas:', error)

        // Retry en caso de timeout o error de red
        if (retries > 0) {
          console.log(`Reintentando cargar áreas... (${retries} intentos restantes)`)
          setTimeout(() => {
            void fetchAreasWithRetry(retries - 1)
          }, 1000)
          return
        }

        alert('⚠️ No se pudieron cargar las áreas formativas. Por favor, recarga la página.')
      } finally {
        setLoadingAreas(false)
      }
    }
    void fetchAreasWithRetry()
  }, [])

  // Image upload preview
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)

  // Saving state
  const [isSaving, setIsSaving] = React.useState(false)

  const typeConfig: CourseTypeConfigValue = getCourseTypeConfig(
    (tipo ?? 'privados') as CourseTypeKey
  )

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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
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
    setSubvenciones(subvenciones.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)))
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
        landing_enabled: false,
        landing_objectives: objetivos.filter((o) => o.trim() !== ''),
        landing_program_blocks: contenidos
          .filter((c) => c.trim() !== '')
          .map((content, index) => ({
            title: `Bloque ${index + 1}`,
            body: content.trim(),
            items: [],
          })),
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

      const result: CreateCourseApiResponse = (await response.json()) as CreateCourseApiResponse

      if (response.ok && result.success) {
        alert(`✅ Curso creado exitosamente con código: ${result.data.codigo}`)
        // Invalidar cache de Next.js antes de navegar para forzar fresh fetch
        router.refresh()
        // Pequeño delay para asegurar que refresh se procese
        setTimeout(() => {
          router.push('/dashboard/cursos')
        }, 100)
      } else {
        alert(`❌ Error al crear curso: ${result.error ?? 'Error desconocido'}`)
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
        router.push('/dashboard/cursos')
      }
    } else {
      router.push('/dashboard/cursos')
    }
  }

  return (
    <div className="space-y-6" data-oid="ku4ywc_">
      <PageHeader
        title="Nuevo Curso"
        description="Crea un nuevo curso"
        icon={FileText}
        badge={
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white px-4 py-2 text-lg font-semibold uppercase`}
            data-oid="6hs2yem"
          >
            {typeConfig.label}
          </Badge>
        }
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/cursos')}
            className="h-10 w-10"
            data-oid="owrnlbz"
          >
            <ArrowLeft className="h-6 w-6" data-oid="hwl.383" />
          </Button>
        }
        data-oid="87bebr_"
      />

      {/* Información Básica */}
      <Card data-oid="uk68evk">
        <CardHeader data-oid="c1_t4gb">
          <CardTitle data-oid="62x6w_r">Información Básica</CardTitle>
          <CardDescription data-oid=":1j1nw8">Datos principales del curso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="8-o5jy4">
          <div className="space-y-2" data-oid="j-sf7e2">
            <Label htmlFor="nombre" data-oid="qdtrj9v">
              Nombre del Curso{' '}
              <span className="text-destructive" data-oid="ck2nw9l">
                *
              </span>
            </Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
              placeholder="ej. Máster en Marketing Digital"
              required
              data-oid="_zwbgoh"
            />
          </div>

          <div className="grid grid-cols-2 gap-4" data-oid="ixumcdk">
            <div className="space-y-2" data-oid="x3dk1ry">
              <Label htmlFor="area" data-oid="jsq4aj6">
                Área Formativa{' '}
                <span className="text-destructive" data-oid="9y4y5f7">
                  *
                </span>
              </Label>
              <Select
                value={area}
                onValueChange={setArea}
                disabled={loadingAreas}
                data-oid="cnwk_6a"
              >
                <SelectTrigger id="area" data-oid="pob-czz">
                  <SelectValue
                    placeholder={loadingAreas ? 'Cargando áreas...' : 'Seleccionar área'}
                    data-oid="ngj9m5o"
                  />
                </SelectTrigger>
                <SelectContent data-oid="e.e59h:">
                  {areasFormativas.map((areaItem) => (
                    <SelectItem key={areaItem.id} value={String(areaItem.id)} data-oid="p8fzd5s">
                      {areaItem.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid="e3zv14c">
              <Label htmlFor="tipo" data-oid="3cg7v7e">
                Tipo de Curso
              </Label>
              <Select
                value={tipo}
                onValueChange={(value: string) => setTipo(value as CourseType)}
                data-oid="3kh:u:u"
              >
                <SelectTrigger id="tipo" data-oid="0n_0dnt">
                  <SelectValue data-oid="4y-1f2x" />
                </SelectTrigger>
                <SelectContent data-oid="3vxf35a">
                  <SelectItem value="privados" data-oid="q21levt">
                    Privados
                  </SelectItem>
                  <SelectItem value="ocupados" data-oid="y.b6n8m">
                    Ocupados
                  </SelectItem>
                  <SelectItem value="desempleados" data-oid="wt4ud.1">
                    Desempleados
                  </SelectItem>
                  <SelectItem value="teleformacion" data-oid="l1ze5zu">
                    Teleformación
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2" data-oid="tbrb:.l">
            <Label htmlFor="descripcion" data-oid="wxl40-n">
              Descripción
            </Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescripcion(e.target.value)
              }
              placeholder="Describe brevemente el curso..."
              rows={4}
              data-oid="gijzpsh"
            />
          </div>

          <div className="grid grid-cols-2 gap-4" data-oid="g.yppbl">
            <div className="space-y-2" data-oid="cu.r41f">
              <Label htmlFor="duracion" data-oid="ajds-f6">
                Duración (horas)
              </Label>
              <Input
                id="duracion"
                type="number"
                value={duracionReferencia}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDuracionReferencia(e.target.value)
                }
                placeholder="ej. 300"
                min="0"
                data-oid="ujs5p37"
              />
            </div>

            <div className="space-y-2" data-oid="e.vzkh-">
              <Label htmlFor="precio" data-oid="reqz68a">
                Precio de Referencia (€)
              </Label>
              <Input
                id="precio"
                type="number"
                value={precioReferencia}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPrecioReferencia(e.target.value)
                }
                placeholder="ej. 2500"
                min="0"
                step="0.01"
                data-oid="d2m_vd5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imagen de Portada */}
      <Card data-oid="s04dy:5">
        <CardHeader data-oid="n_c2su1">
          <CardTitle data-oid=".x_rfre">Imagen de Portada</CardTitle>
          <CardDescription data-oid="a0gdzny">
            Imagen principal que se mostrará en las tarjetas de curso
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="f3blia-">
          <div className="space-y-4" data-oid="n.8a23z">
            {imagePreview ? (
              <div
                className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-dashed border-primary"
                data-oid="t5fb9l7"
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  data-oid="6hwb-re"
                />

                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                  data-oid="kbp5wp:"
                >
                  <X className="h-4 w-4" data-oid="vwaqdma" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer transition-colors"
                data-oid="yz9jl67"
              >
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center cursor-pointer"
                  data-oid="tq3:d4x"
                >
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" data-oid="hhdqclm" />
                  <span className="text-sm text-muted-foreground" data-oid="9nayitm">
                    Haz clic para subir una imagen
                  </span>
                  <span className="text-xs text-muted-foreground mt-1" data-oid="73jjnk5">
                    PNG, JPG hasta 5MB
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-oid="dz77ql5"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documentación Adjunta */}
      <Card data-oid="k.pgq:r">
        <CardHeader data-oid="a.rkbpb">
          <CardTitle data-oid="bfa5ca9">Documentación Adjunta</CardTitle>
          <CardDescription data-oid="6pcpwja">
            Adjunta PDFs con información adicional del curso (programas, temarios, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="gmkk1_i">
          {pdfFiles.length > 0 && (
            <div className="space-y-2" data-oid="k6me3kz">
              {pdfFiles.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border"
                  data-oid="y5dfk1-"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0" data-oid="lg11a1g">
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0" data-oid="7l:endw" />
                    <div className="flex-1 min-w-0" data-oid="drore95">
                      <p className="text-sm font-medium truncate" data-oid="7035ydb">
                        {pdf.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="3jp:fgn">
                        {formatFileSize(pdf.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePDF(pdf.id)}
                    className="flex-shrink-0"
                    data-oid="0j70kq6"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" data-oid="eu_0.xp" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary cursor-pointer transition-colors"
            data-oid="baw:57m"
          >
            <label
              htmlFor="pdf-upload"
              className="flex flex-col items-center cursor-pointer"
              data-oid="d_-y755"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" data-oid="43bbuwk" />
              <span className="text-sm text-muted-foreground" data-oid="h:qqarc">
                Haz clic para adjuntar PDFs
              </span>
              <span className="text-xs text-muted-foreground mt-1" data-oid="wer6_z7">
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
              data-oid="nfl:dap"
            />
          </div>
        </CardContent>
      </Card>

      {/* Objetivos de Aprendizaje */}
      <Card data-oid="0kdplkt">
        <CardHeader data-oid="aa2u07b">
          <CardTitle data-oid="e_33wzh">Objetivos de Aprendizaje</CardTitle>
          <CardDescription data-oid="jy3-087">
            Define los objetivos que los estudiantes alcanzarán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="h1piohl">
          {objetivos.map((objetivo, index) => (
            <div key={index} className="flex items-center gap-2" data-oid="l4kb8l6">
              <Textarea
                value={objetivo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateObjetivo(index, e.target.value)
                }
                placeholder={`Objetivo ${index + 1}`}
                rows={2}
                className="flex-1"
                data-oid="7kv.12c"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeObjetivo(index)}
                disabled={objetivos.length === 1}
                data-oid="l2nzncv"
              >
                <X className="h-4 w-4" data-oid="8g_gv-9" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addObjetivo} data-oid="y.28m.-">
            <Plus className="mr-2 h-4 w-4" data-oid="cyp-u4e" />
            Añadir Objetivo
          </Button>
        </CardContent>
      </Card>

      {/* Contenidos del Curso */}
      <Card data-oid="ka6uias">
        <CardHeader data-oid="jwzvhw2">
          <CardTitle data-oid="9fz9t9t">Contenidos del Curso</CardTitle>
          <CardDescription data-oid="y13yq8u">
            Lista de temas y módulos que se cubrirán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="4m-0_x9">
          {contenidos.map((contenido, index) => (
            <div key={index} className="flex items-center gap-2" data-oid="6vqd7lq">
              <Textarea
                value={contenido}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateContenido(index, e.target.value)
                }
                placeholder={`Módulo ${index + 1}`}
                rows={2}
                className="flex-1"
                data-oid="3k1j89d"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeContenido(index)}
                disabled={contenidos.length === 1}
                data-oid="nlzk6aq"
              >
                <X className="h-4 w-4" data-oid="wfxi48." />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addContenido} data-oid="286udek">
            <Plus className="mr-2 h-4 w-4" data-oid=".rras8." />
            Añadir Contenido
          </Button>
        </CardContent>
      </Card>

      {/* Subvenciones y Becas */}
      <Card data-oid="-f5diwq">
        <CardHeader data-oid="p_1j1el">
          <CardTitle className="flex items-center justify-between" data-oid="p:0t4tl">
            <div className="flex items-center gap-3" data-oid="c3x:08i">
              <span data-oid="5x4mt.m">Subvenciones y Becas</span>
              <Switch
                checked={subvencionado}
                onCheckedChange={setSubvencionado}
                aria-label="Activar/desactivar subvenciones"
                data-oid="l737i3-"
              />
            </div>
            {subvencionado && subvenciones.length > 0 && (
              <Badge
                variant={porcentajeTotalSubvencion === 100 ? 'default' : 'secondary'}
                className="text-sm"
                data-oid="gebyjec"
              >
                Total: {porcentajeTotalSubvencion}%
              </Badge>
            )}
          </CardTitle>
          <CardDescription data-oid="x5tzubl">
            Configura las entidades financiadoras y porcentajes de subvención
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="vqu0z2m">
          {subvencionado ? (
            <>
              {subvenciones.length > 0 && (
                <div className="space-y-3" data-oid="d7stdhi">
                  {subvenciones.map((subvencion) => (
                    <SubvencionItem
                      key={subvencion.id}
                      subvencion={subvencion}
                      onUpdate={(updates: Subvencion) => updateSubvencion(subvencion.id, updates)}
                      onRemove={() => removeSubvencion(subvencion.id)}
                      data-oid="cihey6_"
                    />
                  ))}
                </div>
              )}
              <EntidadSelector
                onSelect={addSubvencion}
                entidadesUsadas={subvenciones.map((s) => s.entidad)}
                data-oid="lvg_lp6"
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground" data-oid=".e:mni.">
              Activa el switch para agregar subvenciones
            </p>
          )}
        </CardContent>
      </Card>

      {/* Botonera inferior - botones a la derecha */}
      <div className="border-t pt-6 mt-12 mb-8" data-oid="rrv_mg0">
        <div className="flex justify-end gap-4" data-oid="8k.fnfr">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isSaving}
            data-oid="dlvsbrl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !nombre.trim() || !area}
            size="lg"
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white font-bold uppercase`}
            data-oid="wdxnbrr"
          >
            <Save className="mr-2 h-5 w-5" data-oid="1hn2qf0" />
            {isSaving ? 'Guardando...' : 'CREAR CURSO'}
          </Button>
        </div>
      </div>
    </div>
  )
}
