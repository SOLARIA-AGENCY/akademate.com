'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  UserCheck,
  DollarSign,
  Target
} from 'lucide-react'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'

export default function AnaliticasPage() {
  // Datos mockup de KPIs
  const kpis = [
    {
      title: 'Visitas Totales',
      value: '24,567',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'blue'
    },
    {
      title: 'Leads Generados',
      value: '1,234',
      change: '+8.3%',
      trend: 'up',
      icon: UserCheck,
      color: 'green'
    },
    {
      title: 'Tasa de Conversión',
      value: '5.02%',
      change: '-0.5%',
      trend: 'down',
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Matrículas',
      value: '487',
      change: '+15.2%',
      trend: 'up',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'CTR Medio',
      value: '3.45%',
      change: '+2.1%',
      trend: 'up',
      icon: MousePointerClick,
      color: 'cyan'
    },
    {
      title: 'Ingresos',
      value: '€156,789',
      change: '+22.4%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald'
    }
  ]

  // Datos mockup de fuentes de tráfico
  const trafficSources = [
    { source: 'Búsqueda Orgánica', visits: 12543, percentage: 51, color: 'bg-blue-500' },
    { source: 'Meta Ads', visits: 6234, percentage: 25, color: 'bg-pink-500' },
    { source: 'Directo', visits: 3456, percentage: 14, color: 'bg-green-500' },
    { source: 'Email Marketing', visits: 1534, percentage: 6, color: 'bg-purple-500' },
    { source: 'Otros', visits: 800, percentage: 4, color: 'bg-gray-400' }
  ]

  // Datos mockup de cursos más visitados
  const topCourses = [
    { name: 'Marketing Digital Avanzado', visits: 4532, conversions: 234, rate: '5.16%' },
    { name: 'Desarrollo Web Full Stack', visits: 3890, conversions: 198, rate: '5.09%' },
    { name: 'Data Science con Python', visits: 3456, conversions: 167, rate: '4.83%' },
    { name: 'UX/UI Design', visits: 2987, conversions: 143, rate: '4.79%' },
    { name: 'Community Manager', visits: 2654, conversions: 128, rate: '4.82%' }
  ]

  // Datos mockup de campañas activas
  const campaigns = [
    { name: 'Campaña Black Friday', clicks: 8543, conversions: 456, ctr: '5.34%', budget: '€2,500', status: 'Activa' },
    { name: 'Retargeting Q4', clicks: 5432, conversions: 287, ctr: '5.28%', budget: '€1,800', status: 'Activa' },
    { name: 'Prospecting FP Superior', clicks: 3210, conversions: 154, ctr: '4.80%', budget: '€1,200', status: 'Pausada' },
    { name: 'Email Nurturing', clicks: 2987, conversions: 189, ctr: '6.33%', budget: '€500', status: 'Activa' }
  ]

  return (
    <div className="space-y-6 p-8">
      {/* Mock Data Banner */}
      <MockDataIndicator
        variant="banner"
        label="Este módulo usa datos de demostración. Pendiente integración con GA4, Meta Pixel y APIs de analytics."
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analíticas y Métricas</h1>
          <p className="text-muted-foreground mt-1">
            Panel completo de métricas y rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 border border-border rounded-lg text-sm bg-card text-foreground">
            <option>Últimos 7 días</option>
            <option>Últimos 30 días</option>
            <option>Últimos 90 días</option>
            <option>Este año</option>
          </select>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
            Exportar Datos
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${kpi.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs flex items-center gap-1 mt-1 ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {kpi.change} vs mes anterior
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Fuentes de Tráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Fuentes de Tráfico</CardTitle>
          <CardDescription>Distribución de visitas por canal de adquisición</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficSources.map((source, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{source.source}</span>
                  <span className="text-sm text-muted-foreground">
                    {source.visits.toLocaleString()} visitas ({source.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`${source.color} h-2 rounded-full transition-all`}
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cursos Más Visitados */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos Más Visitados</CardTitle>
          <CardDescription>Top 5 cursos por tráfico y conversiones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Curso</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Visitas</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Conversiones</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Tasa Conv.</th>
                </tr>
              </thead>
              <tbody>
                {topCourses.map((course, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">{course.name}</td>
                    <td className="py-3 px-4 text-sm text-right">{course.visits.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right">{course.conversions}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                        {course.rate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campañas Activas */}
      <Card>
        <CardHeader>
          <CardTitle>Campañas de Marketing</CardTitle>
          <CardDescription>Rendimiento de campañas publicitarias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Campaña</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Clicks</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Conversiones</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">CTR</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Presupuesto</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm font-medium">{campaign.name}</td>
                    <td className="py-3 px-4 text-sm text-right">{campaign.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right">{campaign.conversions}</td>
                    <td className="py-3 px-4 text-sm text-right">{campaign.ctr}</td>
                    <td className="py-3 px-4 text-sm text-right">{campaign.budget}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'Activa'
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>Vista preliminar de Analytics • Datos de ejemplo para demostración</p>
      </div>
    </div>
  )
}
