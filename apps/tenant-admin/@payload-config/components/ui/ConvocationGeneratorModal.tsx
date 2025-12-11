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

// Mock data for dropdowns (in real app, this would come from API)
const mockProfesores = [
  { id: 'prof-1', nombre: 'María García López' },
  { id: 'prof-2', nombre: 'Juan Martínez Sánchez' },
  { id: 'prof-3', nombre: 'Ana Rodríguez Pérez' },
  { id: 'prof-4', nombre: 'Carlos López García' },
  { id: 'prof-5', nombre: 'Laura Fernández Ruiz' },
]

// REAL CAMPUS IDs from database (matching Payload campuses collection)
const mockSedes = [
  { id: '1', nombre: 'CEP Norte' },
  { id: '2', nombre: 'CEP Santa Cruz' },
  { id: '3', nombre: 'CEP Sur' },
]

const mockAulas = {
  '1': [
    { id: 'aula-1-1', nombre: 'Aula 101 - Diseño' },
    { id: 'aula-1-2', nombre: 'Aula 102 - Informática' },
    { id: 'aula-1-3', nombre: 'Aula 103 - Audiovisual' },
  ],
  '2': [
    { id: 'aula-2-1', nombre: 'Aula 201 - Marketing' },
    { id: 'aula-2-2', nombre: 'Aula 202 - Desarrollo' },
  ],
  '3': [
    { id: 'aula-3-1', nombre: 'Aula 301 - Multiusos' },
    { id: 'aula-3-2', nombre: 'Aula 302 - Lab Informática' },
  ],
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

  // Reset sede when classroom changes
  const handleSedeChange = (value: string) => {
    setSedeId(value)
    setAulaId('') // Reset classroom when sede changes
  }

  // Get available classrooms based on selected sede
  const availableAulas = sedeId ? mockAulas[sedeId as keyof typeof mockAulas] || [] : []

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
      aulaId,
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
    fechaInicio &&
    fechaFin &&
    horario.length > 0 &&
    profesorId &&
    sedeId &&
    aulaId &&
    plazasTotales &&
    precio

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Nueva Convocatoria</DialogTitle>
          <DialogDescription>
            Crea una nueva convocatoria para: <strong>{courseTemplate.nombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Fechas y Horario */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas y Horario
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha-inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha-fin">Fecha de Finalización</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horario del Curso
              </Label>
              <ScheduleBuilder value={horario} onChange={setHorario} />
            </div>
          </div>

          {/* Modalidad y Estado */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Configuración de la Convocatoria</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modalidad">Modalidad</Label>
                <Select value={modalidad} onValueChange={(value) => setModalidad(value as CourseModality)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="semipresencial">Semipresencial</SelectItem>
                    <SelectItem value="telematico">Telemático (Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado Inicial</Label>
                <Select value={estado} onValueChange={(value) => setEstado(value as ConvocationStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planificada">Planificada</SelectItem>
                    <SelectItem value="abierta">Abierta (Inscripción activa)</SelectItem>
                    <SelectItem value="lista_espera">Lista de Espera</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Asignaciones
            </h3>

            <div className="space-y-2">
              <Label htmlFor="profesor">Profesor</Label>
              <Select value={profesorId} onValueChange={setProfesorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona profesor" />
                </SelectTrigger>
                <SelectContent>
                  {mockProfesores.map((profesor) => (
                    <SelectItem key={profesor.id} value={profesor.id}>
                      {profesor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sede">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Sede
                </Label>
                <Select value={sedeId} onValueChange={handleSedeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aula">
                  <DoorOpen className="inline h-4 w-4 mr-1" />
                  Aula
                </Label>
                <Select value={aulaId} onValueChange={setAulaId} disabled={!sedeId}>
                  <SelectTrigger>
                    <SelectValue placeholder={sedeId ? "Selecciona aula" : "Primero selecciona sede"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAulas.map((aula) => (
                      <SelectItem key={aula.id} value={aula.id}>
                        {aula.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Plazas y Precio */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacidad y Precio
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plazas">Plazas Totales</Label>
                <Input
                  id="plazas"
                  type="number"
                  value={plazasTotales}
                  onChange={(e) => setPlazasTotales(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio">
                  <Euro className="inline h-4 w-4 mr-1" />
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
                />
                {courseTemplate.precioReferencia && courseTemplate.precioReferencia > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Precio de referencia: {courseTemplate.precioReferencia}€
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid}>
            Crear Convocatoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
