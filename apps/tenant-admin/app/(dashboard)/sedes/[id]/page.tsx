'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  DoorOpen,
  Users,
  BookOpen,
  ArrowLeft,
  Edit,
  Calendar,
  CheckCircle2,
  Wifi,
  Coffee,
  ParkingCircle,
  MonitorPlay,
} from 'lucide-react'

// Mock data extendido para las sedes
const sedesData = [
  {
    id: 'cep-norte',
    nombre: 'CEP Norte',
    direccion: 'Calle Principal 123, 38001 Santa Cruz de Tenerife',
    telefono: '+34 922 123 456',
    email: 'cep.norte@cepcomunicacion.com',
    horario: 'Lunes a Viernes 08:00 - 21:00',
    aulas: 8,
    capacidad: 180,
    cursosActivos: 15,
    profesores: 12,
    color: 'bg-[#ff2014]',
    borderColor: 'border-[#ff2014]',
    textColor: 'text-[#ff2014]',
    imagen: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop',
    descripcion:
      'Nuestro campus más grande ubicado en el norte de la ciudad, equipado con instalaciones de última generación para una experiencia educativa completa.',
    servicios: [
      { nombre: 'WiFi de alta velocidad', icono: 'wifi', disponible: true },
      { nombre: 'Cafetería', icono: 'coffee', disponible: true },
      { nombre: 'Parking gratuito', icono: 'parking', disponible: true },
      { nombre: 'Aulas equipadas con proyectores', icono: 'monitor', disponible: true },
    ],
    aulasDetalle: [
      { nombre: 'Aula A1', capacidad: 25, equipamiento: 'Proyector, Pizarra digital' },
      { nombre: 'Aula A2', capacidad: 20, equipamiento: 'Proyector, Ordenadores' },
      { nombre: 'Aula B1', capacidad: 30, equipamiento: 'Proyector' },
      { nombre: 'Aula B2', capacidad: 25, equipamiento: 'Proyector, Pizarra digital' },
      { nombre: 'Aula C1', capacidad: 20, equipamiento: 'Laboratorio de diseño' },
      { nombre: 'Aula C2', capacidad: 20, equipamiento: 'Laboratorio multimedia' },
      { nombre: 'Sala de conferencias', capacidad: 80, equipamiento: 'Proyector, Sistema de audio' },
      { nombre: 'Sala polivalente', capacidad: 40, equipamiento: 'Proyector, Mesas móviles' },
    ],
    cursosActivos: [
      {
        id: '1',
        nombre: 'Marketing Digital Avanzado',
        tipo: 'privados',
        modalidad: 'Presencial',
        horario: 'Lunes y Miércoles 18:00-21:00',
        alumnos: 18,
        maxAlumnos: 20,
      },
      {
        id: '2',
        nombre: 'Diseño Gráfico Profesional',
        tipo: 'desempleados',
        modalidad: 'Presencial',
        horario: 'Martes y Jueves 09:00-14:00',
        alumnos: 22,
        maxAlumnos: 25,
      },
      {
        id: '3',
        nombre: 'Community Manager Profesional',
        tipo: 'teleformacion',
        modalidad: 'Híbrido',
        horario: 'Viernes 16:00-20:00',
        alumnos: 15,
        maxAlumnos: 20,
      },
    ],
    profesores: [
      {
        id: '1',
        nombre: 'María García',
        especialidad: 'Marketing Digital',
        cursos: 2,
      },
      {
        id: '2',
        nombre: 'Carlos Rodríguez',
        especialidad: 'Diseño Gráfico',
        cursos: 3,
      },
      {
        id: '3',
        nombre: 'Ana Martínez',
        especialidad: 'Redes Sociales',
        cursos: 2,
      },
    ],
  },
  {
    id: 'cep-santa-cruz',
    nombre: 'CEP Santa Cruz',
    direccion: 'Avenida Central 456, 38003 Santa Cruz de Tenerife',
    telefono: '+34 922 234 567',
    email: 'cep.santacruz@cepcomunicacion.com',
    horario: 'Lunes a Viernes 08:30 - 20:30',
    aulas: 6,
    capacidad: 140,
    cursosActivos: 12,
    profesores: 10,
    color: 'bg-[#ff2014]',
    borderColor: 'border-[#ff2014]',
    textColor: 'text-[#ff2014]',
    imagen: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=600&fit=crop',
    descripcion:
      'Campus céntrico ideal para profesionales que buscan formación continua. Excelente conectividad con transporte público.',
    servicios: [
      { nombre: 'WiFi de alta velocidad', icono: 'wifi', disponible: true },
      { nombre: 'Cafetería', icono: 'coffee', disponible: false },
      { nombre: 'Parking gratuito', icono: 'parking', disponible: false },
      { nombre: 'Aulas equipadas con proyectores', icono: 'monitor', disponible: true },
    ],
    aulasDetalle: [
      { nombre: 'Aula 1', capacidad: 25, equipamiento: 'Proyector, Pizarra digital' },
      { nombre: 'Aula 2', capacidad: 20, equipamiento: 'Proyector' },
      { nombre: 'Aula 3', capacidad: 25, equipamiento: 'Proyector, Ordenadores' },
      { nombre: 'Aula 4', capacidad: 20, equipamiento: 'Proyector' },
      { nombre: 'Aula 5', capacidad: 25, equipamiento: 'Laboratorio multimedia' },
      { nombre: 'Sala de reuniones', capacidad: 25, equipamiento: 'Proyector, Sistema de videoconferencia' },
    ],
    cursosActivos: [
      {
        id: '4',
        nombre: 'Desarrollo Web Full Stack',
        tipo: 'ocupados',
        modalidad: 'Presencial',
        horario: 'Lunes y Miércoles 19:00-22:00',
        alumnos: 20,
        maxAlumnos: 20,
      },
      {
        id: '5',
        nombre: 'Excel Avanzado y Power BI',
        tipo: 'ocupados',
        modalidad: 'Presencial',
        horario: 'Martes y Jueves 18:00-21:00',
        alumnos: 16,
        maxAlumnos: 20,
      },
    ],
    profesores: [
      {
        id: '4',
        nombre: 'Pedro Sánchez',
        especialidad: 'Desarrollo Web',
        cursos: 2,
      },
      {
        id: '5',
        nombre: 'Laura Fernández',
        especialidad: 'Análisis de Datos',
        cursos: 3,
      },
    ],
  },
  {
    id: 'cep-sur',
    nombre: 'CEP Sur',
    direccion: 'Calle del Sur 789, 38007 Santa Cruz de Tenerife',
    telefono: '+34 922 345 678',
    email: 'cep.sur@cepcomunicacion.com',
    horario: 'Lunes a Viernes 09:00 - 21:00',
    aulas: 5,
    capacidad: 120,
    cursosActivos: 10,
    profesores: 8,
    color: 'bg-[#ff2014]',
    borderColor: 'border-[#ff2014]',
    textColor: 'text-[#ff2014]',
    imagen: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=600&fit=crop',
    descripcion:
      'Sede moderna en zona residencial del sur, perfecta para cursos creativos y de producción audiovisual.',
    servicios: [
      { nombre: 'WiFi de alta velocidad', icono: 'wifi', disponible: true },
      { nombre: 'Cafetería', icono: 'coffee', disponible: true },
      { nombre: 'Parking gratuito', icono: 'parking', disponible: true },
      { nombre: 'Aulas equipadas con proyectores', icono: 'monitor', disponible: true },
    ],
    aulasDetalle: [
      { nombre: 'Aula 1', capacidad: 25, equipamiento: 'Proyector, Pizarra digital' },
      { nombre: 'Aula 2', capacidad: 25, equipamiento: 'Proyector' },
      { nombre: 'Aula 3', capacidad: 20, equipamiento: 'Laboratorio de fotografía' },
      { nombre: 'Estudio de grabación', capacidad: 15, equipamiento: 'Equipos de audio/vídeo profesional' },
      { nombre: 'Sala de edición', capacidad: 20, equipamiento: 'Ordenadores de alta gama' },
    ],
    cursosActivos: [
      {
        id: '6',
        nombre: 'Producción Audiovisual',
        tipo: 'privados',
        modalidad: 'Presencial',
        horario: 'Martes y Jueves 10:00-14:00',
        alumnos: 12,
        maxAlumnos: 15,
      },
      {
        id: '7',
        nombre: 'Fotografía Digital Profesional',
        tipo: 'privados',
        modalidad: 'Presencial',
        horario: 'Lunes y Miércoles 16:00-20:00',
        alumnos: 10,
        maxAlumnos: 12,
      },
    ],
    profesores: [
      {
        id: '6',
        nombre: 'Miguel Torres',
        especialidad: 'Producción Audiovisual',
        cursos: 2,
      },
      {
        id: '7',
        nombre: 'Elena López',
        especialidad: 'Fotografía',
        cursos: 2,
      },
    ],
  },
]

const serviceIcons = {
  wifi: Wifi,
  coffee: Coffee,
  parking: ParkingCircle,
  monitor: MonitorPlay,
}

interface SedeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function SedeDetailPage({ params }: SedeDetailPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  const sede = sedesData.find((s) => s.id === id)

  if (!sede) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardContent className="p-12">
            <p className="text-lg text-muted-foreground">Sede no encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/sedes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Sedes
        </Button>
        <Button onClick={() => router.push(`/sedes/${id}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Sede
        </Button>
      </div>

      {/* Hero Image */}
      <Card className={`overflow-hidden border-2 ${sede.borderColor}`}>
        <div className="relative h-64 overflow-hidden">
          <img src={sede.imagen} alt={sede.nombre} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <Badge className={`${sede.color} text-white text-sm font-bold uppercase mb-2`}>
              {sede.nombre}
            </Badge>
            <h1 className="text-4xl font-bold text-white">{sede.nombre}</h1>
          </div>
        </div>
      </Card>

      {/* Layout: 2/3 + 1/3 */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna izquierda - 2/3 */}
        <div className="space-y-6 md:col-span-2">
          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Acerca de esta Sede</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{sede.descripcion}</p>
            </CardContent>
          </Card>

          {/* Servicios e Instalaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios e Instalaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {sede.servicios.map((servicio, index) => {
                  const IconComponent = serviceIcons[servicio.icono as keyof typeof serviceIcons]
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        servicio.disponible ? 'bg-green-50 dark:bg-green-950/30' : 'bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      <IconComponent
                        className={`h-5 w-5 ${
                          servicio.disponible ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          servicio.disponible ? 'text-green-900 dark:text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {servicio.nombre}
                      </span>
                      {servicio.disponible && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Aulas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className={`h-5 w-5 ${sede.textColor}`} />
                Aulas Disponibles ({sede.aulasDetalle.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sede.aulasDetalle.map((aula, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <h4 className="font-semibold">{aula.nombre}</h4>
                      <p className="text-sm text-muted-foreground">{aula.equipamiento}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {aula.capacidad}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cursos Activos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className={`h-5 w-5 ${sede.textColor}`} />
                Cursos Activos ({sede.cursosActivos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sede.cursosActivos.map((curso) => (
                  <div key={curso.id} className="p-4 bg-secondary rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{curso.nombre}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {curso.modalidad}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {curso.tipo}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {curso.horario}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {curso.alumnos}/{curso.maxAlumnos}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profesores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className={`h-5 w-5 ${sede.textColor}`} />
                Profesores Asignados ({sede.profesores.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {sede.profesores.map((profesor) => (
                  <div key={profesor.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-sm font-bold">{profesor.nombre.split(' ').map((n) => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{profesor.nombre}</h4>
                      <p className="text-xs text-muted-foreground">{profesor.especialidad}</p>
                      <p className="text-xs text-muted-foreground">{profesor.cursos} cursos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - 1/3 */}
        <div className="space-y-6">
          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className={`h-5 w-5 ${sede.textColor} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground leading-snug">{sede.direccion}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className={`h-5 w-5 ${sede.textColor} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{sede.telefono}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className={`h-5 w-5 ${sede.textColor} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground break-all">{sede.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className={`h-5 w-5 ${sede.textColor} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium">Horario</p>
                  <p className="text-sm text-muted-foreground">{sede.horario}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Aulas</span>
                </div>
                <span className={`font-bold ${sede.textColor}`}>{sede.aulas}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Capacidad</span>
                </div>
                <span className={`font-bold ${sede.textColor}`}>{sede.capacidad}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Cursos Activos</span>
                </div>
                <span className={`font-bold ${sede.textColor}`}>{sede.cursosActivos.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Profesores</span>
                </div>
                <span className={`font-bold ${sede.textColor}`}>{sede.profesores.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Horarios
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Gestionar Cursos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Ver Profesores
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DoorOpen className="mr-2 h-4 w-4" />
                Reservar Aula
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
