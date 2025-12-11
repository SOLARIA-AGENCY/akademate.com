'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { ArrowLeft, GraduationCap, Users, Calendar, TrendingUp, BookOpen } from 'lucide-react'
// TODO: Fetch from Payload API
// import { CICLOS_DETALLE_MOCK } from '@payload-config/data/mockCiclos'
import { CursoCicloCard } from '@payload-config/components/ui/CursoCicloCard'
import type { CursoCiclo, InstanciaGrado } from '@/types'

export default function CicloDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cicloId = params.id as string

  // TODO: Replace with API call - GET /api/ciclos/:id
  const CICLOS_DETALLE_MOCK: any[] = []
  const ciclo = CICLOS_DETALLE_MOCK.find((c) => c.id === cicloId)

  if (!ciclo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Ciclo no encontrado</h2>
        <Button onClick={() => router.push('/ciclos')} className="mt-4">
          Volver a Ciclos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/ciclos')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a Ciclos
      </Button>

      {/* Hero Section */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full h-72 overflow-hidden bg-gray-100 relative">
            <img src={ciclo.image} alt={ciclo.nombre} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <Badge className={`${ciclo.color} text-white mb-2`}>
                {ciclo.tipo === 'superior' ? 'Grado Superior' : 'Grado Medio'}
              </Badge>
              <h1 className="text-4xl font-bold">{ciclo.nombre}</h1>
              <p className="text-lg opacity-90 mt-1">{ciclo.codigo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ciclo.cursos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Convocatorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ciclo.total_instancias}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Alumnos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ciclo.alumnos_actuales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Empleabilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ciclo.tasa_empleabilidad}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Duración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ciclo.duracion_total_horas}H</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacion">
        <TabsList>
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="cursos">Cursos del Ciclo ({ciclo.cursos.length})</TabsTrigger>
          <TabsTrigger value="convocatorias">Convocatorias ({ciclo.instancias.length})</TabsTrigger>
          <TabsTrigger value="salidas">Salidas Profesionales</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion">
          <Card>
            <CardHeader>
              <CardTitle>Información del Ciclo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground">{ciclo.descripcion}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Perfil Profesional</h3>
                <p className="text-muted-foreground">{ciclo.perfil_profesional}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Objetivos</h3>
                <ul className="list-disc list-inside space-y-1">
                  {ciclo.objetivos.map((obj: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursos">
          <div className="grid gap-4 md:grid-cols-3">
            {ciclo.cursos.map((curso: CursoCiclo) => (
              <CursoCicloCard
                key={curso.id}
                curso={curso}
                cicloImagen={ciclo.image}
                cicloColor={ciclo.color}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="convocatorias">
          <Card>
            <CardHeader>
              <CardTitle>Convocatorias Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ciclo.instancias.map((instancia: InstanciaGrado) => (
                  <Card key={instancia.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{instancia.nombre_convocatoria}</h4>
                          <p className="text-sm text-muted-foreground">{instancia.codigo_convocatoria}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge>{instancia.campus.name}</Badge>
                            <Badge variant="outline">{instancia.turno}</Badge>
                            <Badge
                              className={
                                instancia.estado === 'abierta'
                                  ? 'bg-green-600'
                                  : instancia.estado === 'en_curso'
                                  ? 'bg-blue-600'
                                  : 'bg-gray-600'
                              }
                            >
                              {instancia.estado}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Plazas</p>
                          <p className="text-2xl font-bold">
                            {instancia.plazas_ocupadas}/{instancia.plazas_totales}
                          </p>
                          {instancia.lista_espera > 0 && (
                            <p className="text-xs text-orange-600">+{instancia.lista_espera} en espera</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salidas">
          <Card>
            <CardHeader>
              <CardTitle>Salidas Profesionales</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {ciclo.salidas_profesionales.map((salida: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>{salida}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
