'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
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
  Calendar,
  Users,
  Building2,
  HardDrive,
  Zap,
  Crown,
  Sparkles,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'

// Mock data del plan actual
const planActual = {
  nombre: 'Profesional',
  precio: 149,
  ciclo: 'mensual',
  proximaFacturacion: '2025-01-07',
  estado: 'activo',
  fechaInicio: '2024-06-15',
}

// Uso actual de recursos
const usoRecursos = {
  usuarios: { usado: 8, limite: 15, porcentaje: 53 },
  sedes: { usado: 3, limite: 5, porcentaje: 60 },
  almacenamiento: { usado: 2.4, limite: 10, unidad: 'GB', porcentaje: 24 },
  cursos: { usado: 24, limite: 100, porcentaje: 24 },
  leads: { usado: 342, limite: 1000, porcentaje: 34 },
}

// Planes disponibles
const planesDisponibles = [
  {
    id: 'starter',
    nombre: 'Starter',
    precio: 49,
    descripcion: 'Ideal para academias pequeñas',
    caracteristicas: {
      usuarios: 3,
      sedes: 1,
      almacenamiento: '2 GB',
      cursos: 20,
      leads: 200,
      soporte: 'Email',
      analytics: false,
      api: false,
      whitelabel: false,
    },
    popular: false,
  },
  {
    id: 'profesional',
    nombre: 'Profesional',
    precio: 149,
    descripcion: 'Para academias en crecimiento',
    caracteristicas: {
      usuarios: 15,
      sedes: 5,
      almacenamiento: '10 GB',
      cursos: 100,
      leads: 1000,
      soporte: 'Prioritario',
      analytics: true,
      api: true,
      whitelabel: false,
    },
    popular: true,
    actual: true,
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 399,
    descripcion: 'Solución completa para grandes instituciones',
    caracteristicas: {
      usuarios: 'Ilimitados',
      sedes: 'Ilimitadas',
      almacenamiento: '100 GB',
      cursos: 'Ilimitados',
      leads: 'Ilimitados',
      soporte: '24/7 Dedicado',
      analytics: true,
      api: true,
      whitelabel: true,
    },
    popular: false,
  },
]

// Historial de facturación
const historialFacturacion = [
  {
    id: 'INV-2024-012',
    fecha: '2024-12-07',
    concepto: 'Plan Profesional - Diciembre 2024',
    monto: 149.0,
    estado: 'pagado',
  },
  {
    id: 'INV-2024-011',
    fecha: '2024-11-07',
    concepto: 'Plan Profesional - Noviembre 2024',
    monto: 149.0,
    estado: 'pagado',
  },
  {
    id: 'INV-2024-010',
    fecha: '2024-10-07',
    concepto: 'Plan Profesional - Octubre 2024',
    monto: 149.0,
    estado: 'pagado',
  },
  {
    id: 'INV-2024-009',
    fecha: '2024-09-07',
    concepto: 'Plan Profesional - Septiembre 2024',
    monto: 149.0,
    estado: 'pagado',
  },
  {
    id: 'INV-2024-008',
    fecha: '2024-08-07',
    concepto: 'Plan Profesional - Agosto 2024',
    monto: 149.0,
    estado: 'pagado',
  },
]

export default function SuscripcionPage() {
  const [cicloFacturacion, setCicloFacturacion] = useState<'mensual' | 'anual'>('mensual')

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suscripción</h1>
          <p className="text-muted-foreground">
            Gestiona tu plan, facturación y recursos de la academia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <CreditCard className="mr-2 h-4 w-4" />
            Métodos de Pago
          </Button>
        </div>
      </div>

      {/* Plan actual y uso */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan actual */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Plan Actual</CardTitle>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{planActual.precio}€</span>
              <span className="text-muted-foreground">/{planActual.ciclo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" style={{ color: '#F2014B' }} />
              <span className="text-xl font-semibold">{planActual.nombre}</span>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Próxima facturación</span>
                <span className="font-medium">{planActual.proximaFacturacion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente desde</span>
                <span className="font-medium">{planActual.fechaInicio}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Cambiar Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Uso de recursos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Uso de Recursos</CardTitle>
            <CardDescription>Consumo actual de tu plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Usuarios</span>
                    </div>
                    <span className="font-medium">
                      {usoRecursos.usuarios.usado} / {usoRecursos.usuarios.limite}
                    </span>
                  </div>
                  <Progress value={usoRecursos.usuarios.porcentaje} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Sedes</span>
                    </div>
                    <span className="font-medium">
                      {usoRecursos.sedes.usado} / {usoRecursos.sedes.limite}
                    </span>
                  </div>
                  <Progress value={usoRecursos.sedes.porcentaje} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span>Almacenamiento</span>
                    </div>
                    <span className="font-medium">
                      {usoRecursos.almacenamiento.usado} / {usoRecursos.almacenamiento.limite} GB
                    </span>
                  </div>
                  <Progress value={usoRecursos.almacenamiento.porcentaje} className="h-2" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>Cursos</span>
                    </div>
                    <span className="font-medium">
                      {usoRecursos.cursos.usado} / {usoRecursos.cursos.limite}
                    </span>
                  </div>
                  <Progress value={usoRecursos.cursos.porcentaje} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Leads mensuales</span>
                    </div>
                    <span className="font-medium">
                      {usoRecursos.leads.usado} / {usoRecursos.leads.limite}
                    </span>
                  </div>
                  <Progress value={usoRecursos.leads.porcentaje} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planes disponibles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Planes Disponibles</h2>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={cicloFacturacion === 'mensual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCicloFacturacion('mensual')}
            >
              Mensual
            </Button>
            <Button
              variant={cicloFacturacion === 'anual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCicloFacturacion('anual')}
            >
              Anual
              <Badge className="ml-2 bg-green-100 text-green-800">-20%</Badge>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {planesDisponibles.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? 'border-2' : ''}`}
              style={plan.popular ? { borderColor: '#F2014B' } : undefined}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: '#F2014B' }}
                >
                  Más Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.nombre}
                  {plan.actual && (
                    <Badge variant="outline" className="ml-2">
                      Plan Actual
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {cicloFacturacion === 'anual'
                      ? Math.round(plan.precio * 0.8)
                      : plan.precio}
                    €
                  </span>
                  <span className="text-muted-foreground">/mes</span>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.caracteristicas.usuarios} usuarios
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.caracteristicas.sedes} sedes
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.caracteristicas.almacenamiento} almacenamiento</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.caracteristicas.cursos} cursos
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {plan.caracteristicas.leads} leads/mes
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Soporte {plan.caracteristicas.soporte}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.caracteristicas.analytics ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={!plan.caracteristicas.analytics ? 'text-muted-foreground' : ''}>
                      Analytics avanzados
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.caracteristicas.api ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={!plan.caracteristicas.api ? 'text-muted-foreground' : ''}>
                      Acceso API
                    </span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    {plan.caracteristicas.whitelabel ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={!plan.caracteristicas.whitelabel ? 'text-muted-foreground' : ''}>
                      White Label
                    </span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.actual ? 'outline' : 'default'}
                  disabled={plan.actual}
                  style={!plan.actual ? { backgroundColor: '#F2014B' } : undefined}
                >
                  {plan.actual ? 'Plan Actual' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Historial de facturación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Facturación</CardTitle>
              <CardDescription>Últimas facturas y pagos</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historialFacturacion.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell className="font-medium">{factura.id}</TableCell>
                  <TableCell>{factura.fecha}</TableCell>
                  <TableCell>{factura.concepto}</TableCell>
                  <TableCell className="font-medium">{factura.monto.toFixed(2)}€</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      Pagado
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alerta de límites */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-900">Consejo de optimización</h4>
              <p className="text-sm text-amber-800">
                Estás utilizando el 60% de tus sedes disponibles. Si planeas expandirte,
                considera actualizar al plan Enterprise para sedes ilimitadas y soporte 24/7.
              </p>
              <Button variant="link" className="p-0 h-auto text-amber-900">
                Ver planes Enterprise
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
