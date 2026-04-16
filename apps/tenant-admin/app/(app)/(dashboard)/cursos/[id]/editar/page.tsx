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
import { PageHeader } from '@payload-config/components/ui/PageHeader'
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
} from 'lucide-react'
// TODO: Fetch from Payload API
// import { plantillasCursosData } from '@payload-config/data/mockCourseTemplatesData'
import { getCourseTypeConfig } from '@payload-config/lib/courseTypeConfig'
import { SubvencionItem } from '@payload-config/components/ui/SubvencionItem'
import { EntidadSelector } from '@payload-config/components/ui/EntidadSelector'
import { Switch } from '@payload-config/components/ui/switch'
import { DangerZone } from '@payload-config/components/ui/DangerZone'
import { getPublicStudyTypeFallbackImage } from '@/app/lib/website/study-types'

// Local type definitions to avoid ESLint type resolution issues with @/types and @payload-config
type CourseType =
  | 'teleformacion'
  | 'ocupados'
  | 'desempleados'
  | 'privados'
  | 'ciclo-medio'
  | 'ciclo-superior'

interface CourseTypeConfig {
  label: string
  bgColor: string
  hoverColor: string
  textColor: string
  borderColor: string
  dotColor: string
}

// Typed wrapper for getCourseTypeConfig to satisfy ESLint
const getTypeConfig = (type: CourseType): CourseTypeConfig => {
  return getCourseTypeConfig(type) as CourseTypeConfig
}

type EntidadFinanciadoraKey =
  | 'fundae'
  | 'sepe'
  | 'ministerio_trabajo'
  | 'ministerio_educacion'
  | 'junta_andalucia'
  | 'junta_madrid'
  | 'junta_catalunya'
  | 'fse'
  | 'next_generation'
  | 'camara_comercio'
  | 'empresa_privada'
  | 'otro'

interface Subvencion {
  id: string
  entidad: EntidadFinanciadoraKey
  porcentaje: number
  requisitos?: string
  urlInfo?: string
  activa: boolean
}

interface CourseEditPageProps {
  params: Promise<{ id: string }>
}

interface CourseApiData {
  id: number | string
  nombre: string
  descripcion: string
  area: string
  tipo: CourseType
  duracionReferencia: number
  precioReferencia: number
  imagenPortada: string
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  // Data loading state
  const [loading, setLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [originalCourse, setOriginalCourse] = React.useState<CourseApiData | null>(null)

  // State for form fields
  const [nombre, setNombre] = React.useState('')
  const [descripcion, setDescripcion] = React.useState('')
  const [area, setArea] = React.useState('')
  const [tipo, setTipo] = React.useState<CourseType>('privados')
  const [duracionReferencia, setDuracionReferencia] = React.useState('')
  const [precioReferencia, setPrecioReferencia] = React.useState('0')
  const [objetivos, setObjetivos] = React.useState<string[]>([''])
  const [contenidos, setContenidos] = React.useState<string[]>([''])
  const [pdfFiles, setPdfFiles] = React.useState<string[]>([])

  // Subvenciones y becas
  const [subvencionado, setSubvencionado] = React.useState(false)
  const [subvenciones, setSubvenciones] = React.useState<Subvencion[]>([])

  // Fetch course data on mount
  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/cursos/${id}`, { cache: 'no-cache' })
        const result = (await response.json()) as {
          success: boolean
          data?: CourseApiData
          error?: string
        }

        if (result.success && result.data) {
          const course = result.data
          setOriginalCourse(course)
          setNombre(course.nombre)
          setDescripcion(course.descripcion)
          setArea(course.area)
          setTipo(course.tipo ?? 'privados')
          setDuracionReferencia(course.duracionReferencia?.toString() ?? '')
          setPrecioReferencia(course.precioReferencia?.toString() ?? '0')
        } else {
          setFetchError(result.error ?? 'Curso no encontrado')
        }
      } catch {
        setFetchError('Error de conexión al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    void fetchCourse()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="fy8v7b6">
        <p className="text-muted-foreground" data-oid="5qw4_uu">
          Cargando curso...
        </p>
      </div>
    )
  }

  if (fetchError || !originalCourse) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="53r1dqb">
        <Card className="w-full max-w-md" data-oid="j.snhss">
          <CardHeader data-oid="nyak10n">
            <CardTitle data-oid="52i84bc">Curso no encontrado</CardTitle>
            <CardDescription data-oid="p:_o8ht">
              {fetchError ?? `El curso con ID ${id} no existe`}
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="28mivnz">
            <Button onClick={() => router.push('/dashboard/cursos')} data-oid="um1plsl">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="vmoskkp" />
              Volver a Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const typeConfig = getTypeConfig(tipo ?? 'privados')
  const fallbackImage = getPublicStudyTypeFallbackImage(tipo)

  // Handlers
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
    const total = subvenciones.filter((s) => s.activa).reduce((acc, s) => acc + s.porcentaje, 0)
    return Math.min(total, 100)
  }

  const handleSave = async () => {
    const porcentajeSubvencion = calcularSubvencionTotal()
    try {
      await fetch(`/api/cursos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nombre,
          short_description: descripcion,
          course_type: tipo,
          duration_hours: parseInt(duracionReferencia) || undefined,
          base_price: parseFloat(precioReferencia) || undefined,
          subsidy_percentage: porcentajeSubvencion,
        }),
      })
    } catch {
      // Silently proceed to detail page even on error
    }
    router.push(`/dashboard/cursos/${id}`)
  }

  const handleCancel = () => {
    router.push(`/dashboard/cursos/${id}`)
  }

  return (
    <div className="space-y-6" data-oid="wepmu7_">
      <PageHeader
        title="Editar Curso"
        description={originalCourse.nombre}
        icon={FileText}
        actions={
          <div className="flex items-center gap-2" data-oid="kanhbny">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/cursos/${id}`)}
              data-oid="zyi2gvf"
            >
              <ArrowLeft className="h-4 w-4" data-oid="wckxy4w" />
            </Button>
            <Button variant="outline" onClick={handleCancel} data-oid="1wrttb2">
              Cancelar
            </Button>
            <Button onClick={handleSave} data-oid="iuypics">
              <Save className="mr-2 h-4 w-4" data-oid="lik0.w:" />
              Guardar Cambios
            </Button>
          </div>
        }
        data-oid="0zbocwk"
      />

      {/* Type Badge */}
      <Card data-oid=".ucy-f-">
        <CardContent className="pt-6" data-oid="1t33gbd">
          <Badge
            className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-sm font-bold uppercase`}
            data-oid="7zlhj04"
          >
            {typeConfig.label}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="5v:a92h">
        {/* LEFT SIDE: 2/3 - Form Fields */}
        <div className="lg:col-span-2 space-y-6" data-oid="jof62v-">
          {/* Basic Information */}
          <Card data-oid="2h_-c0e">
            <CardHeader data-oid="8rxwv2:">
              <CardTitle data-oid="bgilrxj">Información Básica</CardTitle>
              <CardDescription data-oid="lhajduz">Datos principales del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="50cfnya">
              {/* Nombre */}
              <div className="space-y-2" data-oid="qf6i5b.">
                <Label htmlFor="nombre" data-oid="5y1l3ul">
                  Nombre del Curso
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
                  placeholder="Ej: Marketing Digital Avanzado"
                  data-oid="t2ud083"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2" data-oid="sa28as:">
                <Label htmlFor="descripcion" data-oid="j:zz_.7">
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescripcion(e.target.value)
                  }
                  placeholder="Descripción breve del curso"
                  rows={4}
                  data-oid="c-14nsd"
                />
              </div>

              {/* Area and Type */}
              <div className="grid grid-cols-2 gap-4" data-oid="jz74of6">
                <div className="space-y-2" data-oid="rmotfke">
                  <Label htmlFor="area" data-oid="tyr7zbl">
                    Área
                  </Label>
                  <Select value={area} onValueChange={setArea} data-oid="2pt5z9x">
                    <SelectTrigger data-oid="x7-oji7">
                      <SelectValue placeholder="Selecciona área" data-oid="96hmfe-" />
                    </SelectTrigger>
                    <SelectContent data-oid="s4qnyyh">
                      <SelectItem value="Marketing Digital" data-oid="95dotse">
                        Marketing Digital
                      </SelectItem>
                      <SelectItem value="Desarrollo Web" data-oid="0nkmvv0">
                        Desarrollo Web
                      </SelectItem>
                      <SelectItem value="Diseño Gráfico" data-oid="q0k5.on">
                        Diseño Gráfico
                      </SelectItem>
                      <SelectItem value="Audiovisual" data-oid="5y6f9o0">
                        Audiovisual
                      </SelectItem>
                      <SelectItem value="Gestión Empresarial" data-oid="qr473vp">
                        Gestión Empresarial
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2" data-oid="yhhqlx_">
                  <Label htmlFor="tipo" data-oid="jal96se">
                    Tipo de Curso
                  </Label>
                  <Select
                    value={tipo}
                    onValueChange={(value: string) => setTipo(value as CourseType)}
                    data-oid="tjol2kl"
                  >
                    <SelectTrigger data-oid="tn5gqne">
                      <SelectValue placeholder="Selecciona tipo" data-oid="y5l8tgq" />
                    </SelectTrigger>
                    <SelectContent data-oid="qk3z.6e">
                      <SelectItem value="privados" data-oid="7skibyb">
                        Privados
                      </SelectItem>
                      <SelectItem value="ocupados" data-oid="n1z2yag">
                        Ocupados
                      </SelectItem>
                      <SelectItem value="desempleados" data-oid="nsvbs1_">
                        Desempleados
                      </SelectItem>
                      <SelectItem value="teleformacion" data-oid="hguot-5">
                        Teleformación
                      </SelectItem>
                      <SelectItem value="ciclo-medio" data-oid="a6nsm6j">
                        Ciclo Medio
                      </SelectItem>
                      <SelectItem value="ciclo-superior" data-oid="2nfw9l7">
                        Ciclo Superior
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration and Price */}
              <div className="grid grid-cols-2 gap-4" data-oid="9use1q0">
                <div className="space-y-2" data-oid="lpif:my">
                  <Label htmlFor="duracion" data-oid="gvv:_0e">
                    Duración (horas)
                  </Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracionReferencia}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDuracionReferencia(e.target.value)
                    }
                    placeholder="Ej: 40"
                    data-oid="vzis1_l"
                  />
                </div>

                <div className="space-y-2" data-oid="j-38w0e">
                  <Label htmlFor="precio" data-oid="wa-zz.b">
                    Precio de Referencia (€)
                  </Label>
                  <Input
                    id="precio"
                    type="number"
                    value={precioReferencia}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPrecioReferencia(e.target.value)
                    }
                    placeholder="Ej: 1200 (0 para subvencionado)"
                    data-oid="-o0wdu6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos */}
          <Card data-oid="z3ci_vk">
            <CardHeader data-oid="cf.ggd.">
              <CardTitle data-oid="6f:k..3">Objetivos del Curso</CardTitle>
              <CardDescription data-oid="fy:-o9v">
                Objetivos de aprendizaje y competencias a desarrollar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="5xv6etw">
              {objetivos.map((objetivo, index) => (
                <div key={index} className="flex gap-2" data-oid="a6ovd3t">
                  <div className="flex-1" data-oid="3i2.ku9">
                    <Textarea
                      value={objetivo}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateObjetivo(index, e.target.value)
                      }
                      placeholder={`Objetivo ${index + 1}`}
                      rows={2}
                      data-oid="zw5s1cu"
                    />
                  </div>
                  {objetivos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjetivo(index)}
                      className="flex-shrink-0"
                      data-oid="u4l59rw"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" data-oid="vcxaddk" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addObjetivo} data-oid="eymod4.">
                <Plus className="mr-2 h-4 w-4" data-oid="yyjep9f" />
                Agregar Objetivo
              </Button>
            </CardContent>
          </Card>

          {/* Contenidos */}
          <Card data-oid="iymasuj">
            <CardHeader data-oid="j4dxwv9">
              <CardTitle data-oid="bcb6i44">Contenidos del Programa</CardTitle>
              <CardDescription data-oid="38:z6f7">Temario y módulos del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="-6xp0cx">
              {contenidos.map((contenido, index) => (
                <div key={index} className="flex gap-2" data-oid="moyww4i">
                  <div className="flex-1" data-oid=".wvcq6p">
                    <Textarea
                      value={contenido}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateContenido(index, e.target.value)
                      }
                      placeholder={`Contenido ${index + 1}`}
                      rows={2}
                      data-oid="57c100i"
                    />
                  </div>
                  {contenidos.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContenido(index)}
                      className="flex-shrink-0"
                      data-oid="0sm2_vz"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" data-oid="ji98.vy" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addContenido} data-oid="gve0rlr">
                <Plus className="mr-2 h-4 w-4" data-oid="zsqv2uv" />
                Agregar Contenido
              </Button>
            </CardContent>
          </Card>

          {/* Subvenciones y Becas */}
          <Card data-oid="rk_uecj">
            <CardHeader data-oid="o-0gh9z">
              <div className="flex items-center justify-between" data-oid="qi__ykt">
                <div data-oid="39kqxs7">
                  <CardTitle data-oid="gwqykkw">Subvenciones y Becas</CardTitle>
                  <CardDescription data-oid="smc:ogi">
                    Gestiona las ayudas económicas disponibles para este curso
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2" data-oid="qzqkw6z">
                  <Switch
                    id="subvencionado"
                    checked={subvencionado}
                    onCheckedChange={handleToggleSubvencionado}
                    data-oid="2wt:3ew"
                  />

                  <Label htmlFor="subvencionado" className="cursor-pointer" data-oid="66jotzx">
                    Curso subvencionado
                  </Label>
                </div>
              </div>
            </CardHeader>

            {subvencionado && (
              <CardContent className="space-y-6" data-oid="vpmjo.m">
                {/* Resumen de subvención total */}
                <div
                  className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded"
                  data-oid="zi8ecal"
                >
                  <div className="flex items-center justify-between" data-oid="snoowg5">
                    <div data-oid="rx2rj7q">
                      <p
                        className="text-sm font-medium text-green-800 dark:text-green-200"
                        data-oid="dagmmx."
                      >
                        Subvención Total
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300" data-oid="ncri_9h">
                        Calculado automáticamente según entidades
                      </p>
                    </div>
                    <div
                      className="text-3xl font-bold text-green-700 dark:text-green-300"
                      data-oid="5wx.d-s"
                    >
                      {calcularSubvencionTotal()}%
                    </div>
                  </div>
                </div>

                {/* Lista de subvenciones activas */}
                {subvenciones.length > 0 && (
                  <div className="space-y-3" data-oid="085xy31">
                    <Label data-oid="t7oiud7">Entidades Financiadoras</Label>
                    {subvenciones.map((subvencion, index) => (
                      <SubvencionItem
                        key={subvencion.id}
                        subvencion={subvencion}
                        onUpdate={(updated: Subvencion) => handleUpdateSubvencion(index, updated)}
                        onRemove={() => handleRemoveSubvencion(index)}
                        data-oid="hey15tf"
                      />
                    ))}
                  </div>
                )}

                {/* Selector de nueva entidad */}
                <div className={subvenciones.length > 0 ? 'border-t pt-4' : ''} data-oid="rfpf-mf">
                  <EntidadSelector
                    onSelect={handleAddSubvencion}
                    excluidas={subvenciones.map((s) => s.entidad)}
                    data-oid="dqvhl8t"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Media Uploads */}
        <div className="lg:col-span-1 space-y-6" data-oid="g61.ujz">
          {/* Image Upload */}
          <Card data-oid="ws-u9wn">
            <CardHeader data-oid="p4971kw">
              <CardTitle className="text-base" data-oid="jkts5md">
                Imagen de Portada
              </CardTitle>
              <CardDescription data-oid="p_s54dz">
                Imagen fallback automática por tipo de curso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid=":m4_25e">
              <div className="relative aspect-video overflow-hidden rounded-lg border" data-oid="n8ku8e0">
                <img
                  src={fallbackImage}
                  alt="Imagen fallback por tipo"
                  className="w-full h-full object-cover"
                  data-oid="stawn0n"
                />
              </div>
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground" data-oid="je6.l2d">
                La portada se asigna automáticamente según el tipo del curso.
              </div>
            </CardContent>
          </Card>

          {/* PDF Upload */}
          <Card data-oid="2ljzqv.">
            <CardHeader data-oid="ygdle_k">
              <CardTitle className="text-base" data-oid="zx2p6nz">
                Documentos PDF
              </CardTitle>
              <CardDescription data-oid="4klg55-">Materiales y recursos del curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="2:85mx5">
              {pdfFiles.length > 0 && (
                <div className="space-y-2" data-oid="evw6-5w">
                  {pdfFiles.map((pdf, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md"
                      data-oid=":qcjahg"
                    >
                      <div className="flex items-center gap-2" data-oid="vzrl:00">
                        <FileText className="h-4 w-4 text-muted-foreground" data-oid="5nyc6hu" />
                        <span className="text-sm truncate" data-oid="8-loeqb">
                          {pdf}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePdf(index)}
                        className="flex-shrink-0 h-8 w-8"
                        data-oid="7_tmykp"
                      >
                        <X className="h-4 w-4" data-oid="-hsgv_-" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div data-oid="cpki_tb">
                <Label htmlFor="pdf-upload" className="cursor-pointer" data-oid="t01-3aw">
                  <div
                    className="flex items-center justify-center gap-2 rounded-md border border-dashed border-input p-4 hover:bg-accent transition-colors"
                    data-oid="xg8hix0"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" data-oid="7ud6tsi" />
                    <span className="text-sm font-medium" data-oid="it19qpp">
                      Subir PDF
                    </span>
                  </div>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handlePdfUpload}
                    data-oid="vg9-2d9"
                  />
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Danger Zone - Eliminar Curso */}
      <div className="border-t pt-8 mt-12" data-oid="n71.die">
        <DangerZone
          cursoId={id}
          nombreCurso={originalCourse.nombre}
          tieneConvocatorias={false}
          numeroConvocatorias={0}
          data-oid="imjv9i9"
        />
      </div>
    </div>
  )
}
