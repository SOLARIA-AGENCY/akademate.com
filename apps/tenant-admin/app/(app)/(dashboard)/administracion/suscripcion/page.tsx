'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Progress } from '@payload-config/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  CreditCard,
  Check,
  X,
  Download,
  Users,
  Building2,
  HardDrive,
  Zap,
  Crown,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'

// TODO: Fetch from API
const planActual = {
  nombre: '',
  precio: 0,
  ciclo: 'mensual',
  proximaFacturacion: '',
  estado: 'inactivo',
  fechaInicio: '',
}

// TODO: Fetch from API
const usoRecursos = {
  usuarios: { usado: 0, limite: 0, porcentaje: 0 },
  sedes: { usado: 0, limite: 0, porcentaje: 0 },
  almacenamiento: { usado: 0, limite: 0, unidad: 'GB', porcentaje: 0 },
  cursos: { usado: 0, limite: 0, porcentaje: 0 },
  leads: { usado: 0, limite: 0, porcentaje: 0 },
}

// TODO: Fetch from API
const planesDisponibles: {
  id: string
  nombre: string
  precio: number
  descripcion: string
  caracteristicas: {
    usuarios: number | string
    sedes: number | string
    almacenamiento: string
    cursos: number | string
    leads: number | string
    soporte: string
    analytics: boolean
    api: boolean
    whitelabel: boolean
  }
  popular: boolean
  actual?: boolean
}[] = []

// TODO: Fetch from API
const historialFacturacion: {
  id: string
  fecha: string
  concepto: string
  monto: number
  estado: string
}[] = []

export default function SuscripcionPage() {
  const [cicloFacturacion, setCicloFacturacion] = useState<'mensual' | 'anual'>('mensual')

  return (
    <div className="space-y-6" data-oid=".pkzf_z">
      <PageHeader
        title="Suscripción"
        description="Gestiona tu plan, facturación y recursos de la academia"
        icon={Crown}
        actions={
          <div className="flex gap-2" data-oid="981s76z">
            <Button variant="outline" data-oid="gdt_dmo">
              <CreditCard className="mr-2 h-4 w-4" data-oid="zoz0-8e" />
              Métodos de Pago
            </Button>
          </div>
        }
        data-oid="kgs3_qv"
      />

      {/* Plan actual y uso */}
      <div className="grid gap-6 md:grid-cols-3" data-oid="hj3t0m5">
        {/* Plan actual */}
        <Card className="md:col-span-1" data-oid="au46ed-">
          <CardHeader data-oid="wmqb3lb">
            <div className="flex items-center justify-between" data-oid="v28w:s2">
              <CardTitle className="text-lg" data-oid="1nh_di8">
                Plan Actual
              </CardTitle>
              <Badge
                className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                data-oid="p31v0ok"
              >
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="cp-kuem">
            <div className="flex items-baseline gap-2" data-oid="g1ofhov">
              <span className="text-4xl font-bold" data-oid="53ciu:9">
                {planActual.precio}€
              </span>
              <span className="text-muted-foreground" data-oid="lrdpb6-">
                /{planActual.ciclo}
              </span>
            </div>
            <div className="flex items-center gap-2" data-oid="u908o8e">
              <Crown className="h-5 w-5" style={{ color: '#F2014B' }} data-oid=".2c6vyi" />
              <span className="text-xl font-semibold" data-oid="gy_lt7g">
                {planActual.nombre}
              </span>
            </div>
            <div className="space-y-2 pt-4 border-t" data-oid="sr3li-:">
              <div className="flex justify-between text-sm" data-oid="mxfc-qo">
                <span className="text-muted-foreground" data-oid="fx3srj9">
                  Próxima facturación
                </span>
                <span className="font-medium" data-oid="hcq8fki">
                  {planActual.proximaFacturacion}
                </span>
              </div>
              <div className="flex justify-between text-sm" data-oid="6z86ihs">
                <span className="text-muted-foreground" data-oid=":twir1l">
                  Cliente desde
                </span>
                <span className="font-medium" data-oid="tkdn-4p">
                  {planActual.fechaInicio}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter data-oid="7e8.ew-">
            <Button className="w-full" variant="outline" data-oid="iw8zl0v">
              <RefreshCw className="mr-2 h-4 w-4" data-oid="0lxqc.h" />
              Cambiar Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Uso de recursos */}
        <Card className="md:col-span-2" data-oid="pg1_icf">
          <CardHeader data-oid="wfx:6qj">
            <CardTitle className="text-lg" data-oid="jw9u2pc">
              Uso de Recursos
            </CardTitle>
            <CardDescription data-oid="61_khf6">Consumo actual de tu plan</CardDescription>
          </CardHeader>
          <CardContent data-oid="3g:_keh">
            <div className="grid gap-6 md:grid-cols-2" data-oid="y:42uhh">
              <div className="space-y-4" data-oid="5jmuz4y">
                <div className="space-y-2" data-oid="9.iqsd2">
                  <div className="flex items-center justify-between text-sm" data-oid="j:9oeb4">
                    <div className="flex items-center gap-2" data-oid="v47glb.">
                      <Users className="h-4 w-4 text-muted-foreground" data-oid="q0yrtka" />
                      <span data-oid="fpch10f">Usuarios</span>
                    </div>
                    <span className="font-medium" data-oid="q9ahxn0">
                      {usoRecursos.usuarios.usado} / {usoRecursos.usuarios.limite}
                    </span>
                  </div>
                  <Progress
                    value={usoRecursos.usuarios.porcentaje}
                    className="h-2"
                    data-oid="j_rg21u"
                  />
                </div>

                <div className="space-y-2" data-oid="czjb682">
                  <div className="flex items-center justify-between text-sm" data-oid="s26np6:">
                    <div className="flex items-center gap-2" data-oid=".4qoe3-">
                      <Building2 className="h-4 w-4 text-muted-foreground" data-oid="0t.zfso" />
                      <span data-oid="1x90tyh">Sedes</span>
                    </div>
                    <span className="font-medium" data-oid="xny6rfh">
                      {usoRecursos.sedes.usado} / {usoRecursos.sedes.limite}
                    </span>
                  </div>
                  <Progress
                    value={usoRecursos.sedes.porcentaje}
                    className="h-2"
                    data-oid="d:fn.20"
                  />
                </div>

                <div className="space-y-2" data-oid="s87mf.5">
                  <div className="flex items-center justify-between text-sm" data-oid="9nn.3px">
                    <div className="flex items-center gap-2" data-oid="1u0sfgd">
                      <HardDrive className="h-4 w-4 text-muted-foreground" data-oid="eox.g9z" />
                      <span data-oid="-5euz-0">Almacenamiento</span>
                    </div>
                    <span className="font-medium" data-oid="vg:3j-g">
                      {usoRecursos.almacenamiento.usado} / {usoRecursos.almacenamiento.limite} GB
                    </span>
                  </div>
                  <Progress
                    value={usoRecursos.almacenamiento.porcentaje}
                    className="h-2"
                    data-oid="x_iezgl"
                  />
                </div>
              </div>

              <div className="space-y-4" data-oid="03qxvpf">
                <div className="space-y-2" data-oid="yv4f2ts">
                  <div className="flex items-center justify-between text-sm" data-oid="_df7i9-">
                    <div className="flex items-center gap-2" data-oid="26vn146">
                      <Zap className="h-4 w-4 text-muted-foreground" data-oid="n:gt1dq" />
                      <span data-oid="t:ra7bu">Cursos</span>
                    </div>
                    <span className="font-medium" data-oid="husq-8b">
                      {usoRecursos.cursos.usado} / {usoRecursos.cursos.limite}
                    </span>
                  </div>
                  <Progress
                    value={usoRecursos.cursos.porcentaje}
                    className="h-2"
                    data-oid="gbknl6o"
                  />
                </div>

                <div className="space-y-2" data-oid="l37.4ol">
                  <div className="flex items-center justify-between text-sm" data-oid="a--a.zb">
                    <div className="flex items-center gap-2" data-oid="f8t34v0">
                      <FileText className="h-4 w-4 text-muted-foreground" data-oid="6sypy:8" />
                      <span data-oid="_.._cik">Leads mensuales</span>
                    </div>
                    <span className="font-medium" data-oid="p004l-q">
                      {usoRecursos.leads.usado} / {usoRecursos.leads.limite}
                    </span>
                  </div>
                  <Progress
                    value={usoRecursos.leads.porcentaje}
                    className="h-2"
                    data-oid="l_8bom-"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planes disponibles */}
      <div data-oid="nnskuxy">
        <div className="flex items-center justify-between mb-4" data-oid="_14h3de">
          <h2 className="text-xl font-semibold" data-oid="f.8u-v9">
            Planes Disponibles
          </h2>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg" data-oid="ga4zh1s">
            <Button
              variant={cicloFacturacion === 'mensual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCicloFacturacion('mensual')}
              data-oid="jun4.1o"
            >
              Mensual
            </Button>
            <Button
              variant={cicloFacturacion === 'anual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCicloFacturacion('anual')}
              data-oid="3u530vs"
            >
              Anual
              <Badge
                className="ml-2 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                data-oid="bis..bx"
              >
                -20%
              </Badge>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3" data-oid="zpqtvx0">
          {planesDisponibles.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'border-2' : ''}`}
              style={plan.popular ? { borderColor: '#F2014B' } : undefined}
              data-oid="7ry3p.q"
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: '#F2014B' }}
                  data-oid="_riv6s2"
                >
                  Más Popular
                </div>
              )}
              <CardHeader data-oid=".ot63b_">
                <CardTitle className="flex items-center gap-2" data-oid="vr9oknj">
                  {plan.nombre}
                  {plan.actual && (
                    <Badge variant="outline" className="ml-2" data-oid="0_wool9">
                      Plan Actual
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription data-oid="uziy0et">{plan.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="1tt2-he">
                <div className="flex items-baseline gap-1" data-oid="ovudrln">
                  <span className="text-3xl font-bold" data-oid=":0ep671">
                    {cicloFacturacion === 'anual' ? Math.round(plan.precio * 0.8) : plan.precio}€
                  </span>
                  <span className="text-muted-foreground" data-oid="l4m9nq:">
                    /mes
                  </span>
                </div>

                <ul className="space-y-2" data-oid="xuoamqd">
                  <li className="flex items-center gap-2 text-sm" data-oid="96su3t6">
                    <Check className="h-4 w-4 text-green-500" data-oid="n-kralz" />
                    <span data-oid="1hi:o0p">{plan.caracteristicas.usuarios} usuarios</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="ag1xk2x">
                    <Check className="h-4 w-4 text-green-500" data-oid="cen2mlc" />
                    <span data-oid="ui8ms6o">{plan.caracteristicas.sedes} sedes</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="hg0r.gp">
                    <Check className="h-4 w-4 text-green-500" data-oid="3hlxc-2" />
                    <span data-oid="dlr63wm">
                      {plan.caracteristicas.almacenamiento} almacenamiento
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="jk8c1:i">
                    <Check className="h-4 w-4 text-green-500" data-oid="ia1hgki" />
                    <span data-oid="m_4nkxw">{plan.caracteristicas.cursos} cursos</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="581rh2h">
                    <Check className="h-4 w-4 text-green-500" data-oid="w8hd67v" />
                    <span data-oid="eclxtzs">{plan.caracteristicas.leads} leads/mes</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="lqr42q9">
                    <Check className="h-4 w-4 text-green-500" data-oid="8bfun_m" />
                    <span data-oid="6ex4cjc">Soporte {plan.caracteristicas.soporte}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="d_8p9b4">
                    {plan.caracteristicas.analytics ? (
                      <Check className="h-4 w-4 text-green-500" data-oid="3qe.7d6" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" data-oid="-frnzw5" />
                    )}
                    <span
                      className={!plan.caracteristicas.analytics ? 'text-muted-foreground' : ''}
                      data-oid="knd9h4n"
                    >
                      Analytics avanzados
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="4.cup6t">
                    {plan.caracteristicas.api ? (
                      <Check className="h-4 w-4 text-green-500" data-oid="to9xfkm" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" data-oid="s2zzl87" />
                    )}
                    <span
                      className={!plan.caracteristicas.api ? 'text-muted-foreground' : ''}
                      data-oid="d:68aix"
                    >
                      Acceso API
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm" data-oid="-2dbp.e">
                    {plan.caracteristicas.whitelabel ? (
                      <Check className="h-4 w-4 text-green-500" data-oid="ekyrph8" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" data-oid="18.e_ih" />
                    )}
                    <span
                      className={!plan.caracteristicas.whitelabel ? 'text-muted-foreground' : ''}
                      data-oid="i-rmo9_"
                    >
                      White Label
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter data-oid="tfs0:su">
                <Button
                  className="w-full"
                  variant={plan.actual ? 'outline' : 'default'}
                  disabled={plan.actual}
                  style={!plan.actual ? { backgroundColor: '#F2014B' } : undefined}
                  data-oid="1mld2ah"
                >
                  {plan.actual ? 'Plan Actual' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Historial de facturación */}
      <Card data-oid="vreh1f.">
        <CardHeader data-oid="xfg0w08">
          <div className="flex items-center justify-between" data-oid="y509mlr">
            <div data-oid="dkqre.k">
              <CardTitle data-oid="fg0jehn">Historial de Facturación</CardTitle>
              <CardDescription data-oid="f:mrddy">Últimas facturas y pagos</CardDescription>
            </div>
            <Button variant="outline" size="sm" data-oid="6suun17">
              <Download className="mr-2 h-4 w-4" data-oid=":91me9n" />
              Exportar Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent data-oid="9fh:qm-">
          <Table data-oid="n61128h">
            <TableHeader data-oid="f3a2oax">
              <TableRow data-oid="47olxs8">
                <TableHead data-oid="cto-uxe">Factura</TableHead>
                <TableHead data-oid="23_21xd">Fecha</TableHead>
                <TableHead data-oid="lb:f-1x">Concepto</TableHead>
                <TableHead data-oid="i3ygvn1">Monto</TableHead>
                <TableHead data-oid="nswr9-1">Estado</TableHead>
                <TableHead className="text-right" data-oid="4me-7:o">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="a7c.ep-">
              {historialFacturacion.map((factura) => (
                <TableRow key={factura.id} data-oid="swjkmb5">
                  <TableCell className="font-medium" data-oid="un3x-:x">
                    {factura.id}
                  </TableCell>
                  <TableCell data-oid="76a.8a-">{factura.fecha}</TableCell>
                  <TableCell data-oid="9:5s032">{factura.concepto}</TableCell>
                  <TableCell className="font-medium" data-oid="bcydscm">
                    {factura.monto.toFixed(2)}€
                  </TableCell>
                  <TableCell data-oid="9acy9rs">
                    <Badge
                      className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                      data-oid="gi94s10"
                    >
                      Pagado
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" data-oid=".n2r5gx">
                    <Button variant="ghost" size="sm" data-oid="a0gu2_o">
                      <Download className="h-4 w-4" data-oid="rfrd37u" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerta de límites */}
      <Card className="border-amber-200 bg-amber-50" data-oid="ke6.2ia">
        <CardContent className="pt-6" data-oid="x2.cd3z">
          <div className="flex items-start gap-4" data-oid="tpjyfid">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" data-oid="z3ec3_7" />
            <div className="space-y-1" data-oid="adlxplh">
              <h4 className="font-medium text-amber-900" data-oid="3g3aope">
                Consejo de optimización
              </h4>
              <p className="text-sm text-amber-800" data-oid="7546uxu">
                Estás utilizando el 60% de tus sedes disponibles. Si planeas expandirte, considera
                actualizar al plan Enterprise para sedes ilimitadas y soporte 24/7.
              </p>
              <Button variant="link" className="p-0 h-auto text-amber-900" data-oid=":owpki7">
                Ver planes Enterprise
                <ArrowUpRight className="ml-1 h-3 w-3" data-oid="6c:anu6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
