'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { ArrowLeft, GraduationCap, Users, Calendar, TrendingUp, BookOpen } from 'lucide-react'
// TODO: Fetch from Payload API
// import { CICLOS_DETALLE_MOCK } from '@payload-config/data/mockCiclos'
import { CursoCicloCard } from '@payload-config/components/ui/CursoCicloCard'
import type { CicloDetalleView, CursoCiclo, InstanciaGrado } from '../../../../types'

export default function CicloDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cicloId = params.id as string

  // TODO: Replace with API call - GET /api/ciclos/:id
  const CICLOS_DETALLE_MOCK: CicloDetalleView[] = []
  const ciclo: CicloDetalleView | undefined = CICLOS_DETALLE_MOCK.find((c) => c.id === cicloId)

  if (!ciclo) {
    return (
      <div className="text-center py-12" data-oid="cv0xuv.">
        <h2 className="text-2xl font-bold" data-oid="fkq:krr">
          Ciclo no encontrado
        </h2>
        <Button onClick={() => router.push('/ciclos')} className="mt-4" data-oid="u3-6wxq">
          Volver a Ciclos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-oid=".5agarg">
      <PageHeader
        title={ciclo.nombre}
        description={`${ciclo.codigo} · ${ciclo.tipo === 'superior' ? 'Grado Superior' : 'Grado Medio'}`}
        icon={GraduationCap}
        actions={
          <Button
            variant="ghost"
            onClick={() => router.push('/ciclos')}
            className="gap-2"
            data-oid="6:ieh96"
          >
            <ArrowLeft className="h-4 w-4" data-oid="ridou.d" />
            Volver a Ciclos
          </Button>
        }
        data-oid="s4q9ub5"
      />

      {/* Hero Section */}
      <Card data-oid="2qzlveq">
        <CardContent className="p-0" data-oid="c1:7oib">
          <div className="w-full h-72 overflow-hidden bg-gray-100 relative" data-oid="82.ytbq">
            <img
              src={ciclo.image}
              alt={ciclo.nombre}
              className="w-full h-full object-cover"
              data-oid="w3s2i_-"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
              data-oid="jx8htbf"
            />
            <div className="absolute bottom-6 left-6 text-white" data-oid="t1r865u">
              <Badge className={`${ciclo.color} text-white mb-2`} data-oid="7-r2j7o">
                {ciclo.tipo === 'superior' ? 'Grado Superior' : 'Grado Medio'}
              </Badge>
              <h1 className="text-4xl font-bold" data-oid="a5o8t0q">
                {ciclo.nombre}
              </h1>
              <p className="text-lg opacity-90 mt-1" data-oid="lvzzri8">
                {ciclo.codigo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5" data-oid="oot6k_v">
        <Card data-oid="m67k1c2">
          <CardHeader className="pb-2" data-oid="_:s-zym">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="5kmltlj"
            >
              <BookOpen className="h-4 w-4" data-oid="kk2-ghz" />
              Cursos
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="5bgy_yq">
            <div className="text-3xl font-bold" data-oid="ktcg8rh">
              {ciclo.cursos.length}
            </div>
          </CardContent>
        </Card>
        <Card data-oid="44xstj0">
          <CardHeader className="pb-2" data-oid="ao-.i8t">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="-i3-unh"
            >
              <Calendar className="h-4 w-4" data-oid="acq24x." />
              Convocatorias
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="pip6sfg">
            <div className="text-3xl font-bold" data-oid="90bko-u">
              {ciclo.total_instancias}
            </div>
          </CardContent>
        </Card>
        <Card data-oid="7kqk6--">
          <CardHeader className="pb-2" data-oid="87uvvms">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="_hndols"
            >
              <Users className="h-4 w-4" data-oid="niyme6s" />
              Alumnos
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="89:iqek">
            <div className="text-3xl font-bold" data-oid="tfzoj:8">
              {ciclo.alumnos_actuales}
            </div>
          </CardContent>
        </Card>
        <Card data-oid="ivacqwl">
          <CardHeader className="pb-2" data-oid="gsg0wxi">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="ow8em7n"
            >
              <TrendingUp className="h-4 w-4" data-oid="0fgc4ni" />
              Empleabilidad
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="vsl-xpo">
            <div className="text-3xl font-bold" data-oid="5d:s:-2">
              {ciclo.tasa_empleabilidad}%
            </div>
          </CardContent>
        </Card>
        <Card data-oid="cllqaqh">
          <CardHeader className="pb-2" data-oid="ne3a0h7">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid=".in59nm"
            >
              <GraduationCap className="h-4 w-4" data-oid="7eipx-t" />
              Duración
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="-tge3um">
            <div className="text-2xl font-bold" data-oid="rz0e4qw">
              {ciclo.duracion_total_horas}H
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacion" data-oid="-al_wng">
        <TabsList data-oid="tn-gyfm">
          <TabsTrigger value="informacion" data-oid=":mw7.bv">
            Información
          </TabsTrigger>
          <TabsTrigger value="cursos" data-oid="k8sf-7t">
            Cursos del Ciclo ({ciclo.cursos.length})
          </TabsTrigger>
          <TabsTrigger value="convocatorias" data-oid="dtdv9ql">
            Convocatorias ({ciclo.instancias.length})
          </TabsTrigger>
          <TabsTrigger value="salidas" data-oid="qx638w8">
            Salidas Profesionales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" data-oid="beescxn">
          <Card data-oid="f:tdc8y">
            <CardHeader data-oid="s:qms_y">
              <CardTitle data-oid="rzxlwj9">Información del Ciclo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="zykb2:r">
              <div data-oid="pa_csyf">
                <h3 className="font-semibold mb-2" data-oid="zq65erc">
                  Descripción
                </h3>
                <p className="text-muted-foreground" data-oid="_tjlszc">
                  {ciclo.descripcion}
                </p>
              </div>
              <div data-oid="u3kf7p:">
                <h3 className="font-semibold mb-2" data-oid="dy400gu">
                  Perfil Profesional
                </h3>
                <p className="text-muted-foreground" data-oid="tc1anm2">
                  {ciclo.perfil_profesional}
                </p>
              </div>
              <div data-oid="4jxh2yc">
                <h3 className="font-semibold mb-2" data-oid="amkokbv">
                  Objetivos
                </h3>
                <ul className="list-disc list-inside space-y-1" data-oid="9yl1zk8">
                  {ciclo.objetivos.map((obj: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground" data-oid="jtdudr7">
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursos" data-oid="goxd5g3">
          <div className="grid gap-4 md:grid-cols-3" data-oid="chg26gx">
            {ciclo.cursos.map((curso: CursoCiclo) => (
              <CursoCicloCard
                key={curso.id}
                curso={curso}
                cicloImagen={ciclo.image}
                cicloColor={ciclo.color}
                data-oid="5q-5u6v"
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="convocatorias" data-oid="i_5h2tz">
          <Card data-oid="lcrd4t2">
            <CardHeader data-oid="r14o9su">
              <CardTitle data-oid="4ppt9zt">Convocatorias Activas</CardTitle>
            </CardHeader>
            <CardContent data-oid="gj.vrm4">
              <div className="space-y-4" data-oid="gkn8-:2">
                {ciclo.instancias.map((instancia: InstanciaGrado) => (
                  <Card key={instancia.id} data-oid="9:02cf5">
                    <CardContent className="p-4" data-oid="z00vgr6">
                      <div className="flex items-center justify-between" data-oid="q1k8is:">
                        <div data-oid="-llwqy2">
                          <h4 className="font-semibold" data-oid="dhm53m:">
                            {instancia.nombre_convocatoria}
                          </h4>
                          <p className="text-sm text-muted-foreground" data-oid="n-395qa">
                            {instancia.codigo_convocatoria}
                          </p>
                          <div className="flex gap-2 mt-2" data-oid="3kpxu4n">
                            <Badge data-oid="tkhw6:7">{instancia.campus.name}</Badge>
                            <Badge variant="outline" data-oid="1b0byz9">
                              {instancia.turno}
                            </Badge>
                            <Badge
                              className={
                                instancia.estado === 'abierta'
                                  ? 'bg-green-600'
                                  : instancia.estado === 'en_curso'
                                    ? 'bg-blue-600'
                                    : 'bg-gray-600'
                              }
                              data-oid="ayg2wi."
                            >
                              {instancia.estado}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right" data-oid="93wqmzd">
                          <p className="text-sm text-muted-foreground" data-oid="pveiqa5">
                            Plazas
                          </p>
                          <p className="text-2xl font-bold" data-oid="do2hvwn">
                            {instancia.plazas_ocupadas}/{instancia.plazas_totales}
                          </p>
                          {instancia.lista_espera > 0 && (
                            <p className="text-xs text-orange-600" data-oid="ut7or-.">
                              +{instancia.lista_espera} en espera
                            </p>
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

        <TabsContent value="salidas" data-oid="1w_v417">
          <Card data-oid="7hcxvcw">
            <CardHeader data-oid="gywtwzb">
              <CardTitle data-oid="ulkmcj9">Salidas Profesionales</CardTitle>
            </CardHeader>
            <CardContent data-oid="n7zv4uo">
              <ul className="space-y-2" data-oid="k2_7cof">
                {ciclo.salidas_profesionales.map((salida: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2" data-oid=":-edp3o">
                    <div className="h-2 w-2 rounded-full bg-primary" data-oid="6glealb" />
                    <span data-oid="hh6oyr7">{salida}</span>
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
