'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Calendar, Clock, MapPin, Users, DoorOpen, User, Euro } from 'lucide-react'
import type { PlantillaCurso, CourseModality, ConvocationStatus } from '@/types'
import { ScheduleBuilder, type ScheduleEntry } from '@payload-config/components/ui/ScheduleBuilder'

interface ConvocationGeneratorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseTemplate: PlantillaCurso
  onSubmit: (data: ConvocationFormData) => void
}

export interface ConvocationFormData {
  fechaInicio: string
  fechaFin: string
  horario: ScheduleEntry[]
  modalidad: CourseModality
  estado: ConvocationStatus
  plazasTotales: number
  precio: number
  profesorId: string
  sedeId: string
  aulaId: string
}

interface Profesor {
  id: string
  nombre: string
}

interface Sede {
  id: string
  nombre: string
}

interface Aula {
  id: number
  code: string
  nombre: string
  capacidad: number
}

export function ConvocationGeneratorModal({
  open,
  onOpenChange,
  courseTemplate,
  onSubmit,
}: ConvocationGeneratorModalProps) {
  // Form state
  const [fechaInicio, setFechaInicio] = React.useState('')
  const [fechaFin, setFechaFin] = React.useState('')
  const [horario, setHorario] = React.useState<ScheduleEntry[]>([])
  const [modalidad, setModalidad] = React.useState<CourseModality>('presencial')
  const [estado, setEstado] = React.useState<ConvocationStatus>('planificada')
  const [plazasTotales, setPlazasTotales] = React.useState('20')
  const [precio, setPrecio] = React.useState(courseTemplate.precioReferencia?.toString() || '0')
  const [profesorId, setProfesorId] = React.useState('')
  const [sedeId, setSedeId] = React.useState('')
  const [aulaId, setAulaId] = React.useState('')

  // Data from API
  const [profesores, setProfesores] = React.useState<Profesor[]>([])
  const [sedes, setSedes] = React.useState<Sede[]>([])
  const [aulas, setAulas] = React.useState<Aula[]>([])

  React.useEffect(() => {
    const fetchProfesores = async () => {
      try {
        const res = await fetch('/api/staff')
        const json = (await res.json()) as {
          success?: boolean
          docs?: Array<{
            id: number
            full_name?: string
            first_name?: string
            last_name?: string
            staff_type?: string
          }>
        }
        const staff = json.docs ?? []
        setProfesores(
          staff
            .filter((s) => !s.staff_type || s.staff_type === 'profesor')
            .map((s) => ({
              id: String(s.id),
              nombre: s.full_name ?? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim(),
            }))
        )
      } catch {
        // Silenciar error — la lista quedará vacía
      }
    }

    const fetchSedes = async () => {
      try {
        const res = await fetch('/api/campuses?limit=100&sort=name')
        const json = (await res.json()) as { docs?: Array<{ id: number; name: string }> }
        const campuses = json.docs ?? []
        setSedes(campuses.map((c) => ({ id: String(c.id), nombre: c.name })))
      } catch {
        // Silenciar error — la lista quedará vacía
      }
    }

    void fetchProfesores()
    void fetchSedes()
  }, [])

  // Fetch aulas when sede changes
  React.useEffect(() => {
    if (!sedeId) {
      setAulas([])
      return
    }
    const fetchAulas = async () => {
      try {
        const res = await fetch(`/api/aulas?campus_id=${sedeId}`)
        const json = (await res.json()) as {
          success: boolean
          data?: Array<{ id: number; code: string; nombre: string; capacidad: number }>
        }
        if (json.success && json.data) {
          setAulas(json.data)
        } else {
          setAulas([])
        }
      } catch {
        setAulas([])
      }
    }
    void fetchAulas()
  }, [sedeId])

  const handleSedeChange = (value: string) => {
    setSedeId(value)
    setAulaId('')
  }

  const handleSubmit = () => {
    const formData: ConvocationFormData = {
      fechaInicio,
      fechaFin,
      horario,
      modalidad,
      estado,
      plazasTotales: parseInt(plazasTotales),
      precio: parseFloat(precio),
      profesorId,
      sedeId,
      aulaId: aulaId === '_none' || aulaId === '_empty' ? '' : aulaId,
    }

    onSubmit(formData)
    onOpenChange(false)

    // Reset form
    setFechaInicio('')
    setFechaFin('')
    setHorario([])
    setModalidad('presencial')
    setEstado('planificada')
    setPlazasTotales('20')
    setPrecio(courseTemplate.precioReferencia?.toString() || '0')
    setProfesorId('')
    setSedeId('')
    setAulaId('')
  }

  const isFormValid =
    fechaInicio && fechaFin && horario.length > 0 && profesorId && sedeId && plazasTotales && precio

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="jy8n217">
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-oid="ha0-n7k">
        <DialogHeader data-oid="w34chkz">
          <DialogTitle data-oid="be.rt.l">Generar Nueva Convocatoria</DialogTitle>
          <DialogDescription data-oid="w.xisv4">
            Crea una nueva convocatoria para:{' '}
            <strong data-oid="n8d7y4_">{courseTemplate.nombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4" data-oid="7-yqk8q">
          {/* Fechas y Horario */}
          <div className="space-y-4" data-oid="ag40kvo">
            <h3 className="text-sm font-semibold flex items-center gap-2" data-oid="ei3fyje">
              <Calendar className="h-4 w-4" data-oid="_goiipr" />
              Fechas y Horario
            </h3>

            <div className="grid grid-cols-2 gap-4" data-oid="_1laan4">
              <div className="space-y-2" data-oid="ixou22i">
                <Label htmlFor="fecha-inicio" data-oid="rd96s3f">
                  Fecha de Inicio
                </Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  data-oid="baknbk8"
                />
              </div>

              <div className="space-y-2" data-oid="9hgq976">
                <Label htmlFor="fecha-fin" data-oid="mh3b_-4">
                  Fecha de Finalización
                </Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  data-oid="y8b2zuy"
                />
              </div>
            </div>

            <div className="space-y-2" data-oid="wlogmho">
              <Label className="flex items-center gap-2" data-oid="rqcwxbc">
                <Clock className="h-4 w-4" data-oid="dlzcac5" />
                Horario del Curso
              </Label>
              <ScheduleBuilder value={horario} onChange={setHorario} data-oid="0wfvu-2" />
            </div>
          </div>

          {/* Modalidad y Estado */}
          <div className="space-y-4" data-oid="_odxcy5">
            <h3 className="text-sm font-semibold" data-oid="aypkbhq">
              Configuración de la Convocatoria
            </h3>

            <div className="grid grid-cols-2 gap-4" data-oid=".t0g824">
              <div className="space-y-2" data-oid="e-8c2-y">
                <Label htmlFor="modalidad" data-oid="uurok37">
                  Modalidad
                </Label>
                <Select
                  value={modalidad}
                  onValueChange={(value) => setModalidad(value as CourseModality)}
                  data-oid="_w0jsl-"
                >
                  <SelectTrigger data-oid="0mdqi65">
                    <SelectValue placeholder="Selecciona modalidad" data-oid=":nuoh8u" />
                  </SelectTrigger>
                  <SelectContent data-oid="o2an3q3">
                    <SelectItem value="presencial" data-oid="fxk34ko">
                      Presencial
                    </SelectItem>
                    <SelectItem value="semipresencial" data-oid="714v9.r">
                      Semipresencial
                    </SelectItem>
                    <SelectItem value="telematico" data-oid=".f0m3bv">
                      Telemático (Online)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid=".cji:92">
                <Label htmlFor="estado" data-oid="zl6fke4">
                  Estado Inicial
                </Label>
                <Select
                  value={estado}
                  onValueChange={(value) => setEstado(value as ConvocationStatus)}
                  data-oid="gr_-o5t"
                >
                  <SelectTrigger data-oid="3-leu56">
                    <SelectValue placeholder="Selecciona estado" data-oid="3d9w7g_" />
                  </SelectTrigger>
                  <SelectContent data-oid="j7gyf37">
                    <SelectItem value="planificada" data-oid=".sq46v.">
                      Planificada
                    </SelectItem>
                    <SelectItem value="abierta" data-oid="mp7_l-t">
                      Abierta (Inscripción activa)
                    </SelectItem>
                    <SelectItem value="lista_espera" data-oid="s6wlgk6">
                      Lista de Espera
                    </SelectItem>
                    <SelectItem value="cerrada" data-oid="wvjvaoa">
                      Cerrada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="space-y-4" data-oid="h6qsk64">
            <h3 className="text-sm font-semibold flex items-center gap-2" data-oid="3a5o6z2">
              <User className="h-4 w-4" data-oid="iml9srg" />
              Asignaciones
            </h3>

            <div className="space-y-2" data-oid="6ecfv_g">
              <Label htmlFor="profesor" data-oid="7-zww5.">
                Profesor
              </Label>
              <Select value={profesorId} onValueChange={setProfesorId} data-oid="mk2x:_j">
                <SelectTrigger data-oid="wd_g96r">
                  <SelectValue placeholder="Selecciona profesor" data-oid=":93z9n." />
                </SelectTrigger>
                <SelectContent data-oid="ecrtlun">
                  {profesores.length === 0 && (
                    <SelectItem value="_none" disabled data-oid="i2-84uj">
                      Sin profesores registrados
                    </SelectItem>
                  )}
                  {profesores.map((profesor) => (
                    <SelectItem key={profesor.id} value={profesor.id} data-oid="ur79ti3">
                      {profesor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4" data-oid="wmepc1m">
              <div className="space-y-2" data-oid="f0x0rxy">
                <Label htmlFor="sede" data-oid="u1j:h6k">
                  <MapPin className="inline h-4 w-4 mr-1" data-oid="35tnap8" />
                  Sede
                </Label>
                <Select value={sedeId} onValueChange={handleSedeChange} data-oid="_hyj_:t">
                  <SelectTrigger data-oid="g5hzlys">
                    <SelectValue placeholder="Selecciona sede" data-oid="x06f6ve" />
                  </SelectTrigger>
                  <SelectContent data-oid="0.dfr:y">
                    {sedes.length === 0 && (
                      <SelectItem value="_none" disabled data-oid="f3613o_">
                        Sin sedes registradas
                      </SelectItem>
                    )}
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id} data-oid="z7vukj9">
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2" data-oid="7tz8r.o">
                <Label htmlFor="aula" data-oid="6smcyqs">
                  <DoorOpen className="inline h-4 w-4 mr-1" data-oid="s75t4xj" />
                  Aula (opcional)
                </Label>
                <Select
                  value={aulaId}
                  onValueChange={setAulaId}
                  disabled={!sedeId}
                  data-oid="mi6tas8"
                >
                  <SelectTrigger data-oid="ga26xc0">
                    <SelectValue
                      placeholder={sedeId ? 'Selecciona aula' : 'Elige sede primero'}
                      data-oid="9vw4p78"
                    />
                  </SelectTrigger>
                  <SelectContent data-oid="mq-i-v8">
                    <SelectItem value="_none" data-oid="ck30omr">
                      Sin aula asignada
                    </SelectItem>
                    {aulas.length === 0 && sedeId && (
                      <SelectItem value="_empty" disabled data-oid="6kza5na">
                        Sin aulas en esta sede
                      </SelectItem>
                    )}
                    {aulas.map((aula) => (
                      <SelectItem key={aula.id} value={String(aula.id)} data-oid="9j4t-d6">
                        {aula.code} — {aula.nombre} ({aula.capacidad} plazas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Plazas y Precio */}
          <div className="space-y-4" data-oid="v1u-2b.">
            <h3 className="text-sm font-semibold flex items-center gap-2" data-oid="lxp568t">
              <Users className="h-4 w-4" data-oid="yx4v8.x" />
              Capacidad y Precio
            </h3>

            <div className="grid grid-cols-2 gap-4" data-oid="b_tk8lz">
              <div className="space-y-2" data-oid="4b1ea8w">
                <Label htmlFor="plazas" data-oid="rcgrvtj">
                  Plazas Totales
                </Label>
                <Input
                  id="plazas"
                  type="number"
                  value={plazasTotales}
                  onChange={(e) => setPlazasTotales(e.target.value)}
                  min="1"
                  max="100"
                  data-oid="3-sz_dw"
                />
              </div>

              <div className="space-y-2" data-oid="o:r5:e3">
                <Label htmlFor="precio" data-oid="jby_0f:">
                  <Euro className="inline h-4 w-4 mr-1" data-oid="z97iflm" />
                  Precio (€)
                </Label>
                <Input
                  id="precio"
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder={courseTemplate.precioReferencia?.toString() || '0'}
                  data-oid="ujj904-"
                />

                {courseTemplate.precioReferencia && courseTemplate.precioReferencia > 0 && (
                  <p className="text-xs text-muted-foreground" data-oid="txx_-c4">
                    Precio de referencia: {courseTemplate.precioReferencia}€
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter data-oid="t2ilb.h">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-oid="4xs:-b1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid} data-oid="x_0cts-">
            Crear Convocatoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
