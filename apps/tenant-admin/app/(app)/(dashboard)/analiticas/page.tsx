'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointerClick,
  UserCheck,
  DollarSign,
  Target,
} from 'lucide-react'

export default function AnaliticasPage() {
  // Datos mockup de KPIs
  const kpis = [
    {
      title: 'Visitas Totales',
      value: '24,567',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
      color: 'blue',
    },
    {
      title: 'Leads Generados',
      value: '1,234',
      change: '+8.3%',
      trend: 'up',
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'Tasa de Conversión',
      value: '5.02%',
      change: '-0.5%',
      trend: 'down',
      icon: Target,
      color: 'orange',
    },
    {
      title: 'Matrículas',
      value: '487',
      change: '+15.2%',
      trend: 'up',
      icon: Users,
      color: 'purple',
    },
    {
      title: 'CTR Medio',
      value: '3.45%',
      change: '+2.1%',
      trend: 'up',
      icon: MousePointerClick,
      color: 'cyan',
    },
    {
      title: 'Ingresos',
      value: '€156,789',
      change: '+22.4%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald',
    },
  ]

  // Datos mockup de fuentes de tráfico
  const trafficSources = [
    { source: 'Búsqueda Orgánica', visits: 12543, percentage: 51, color: 'bg-blue-500' },
    { source: 'Meta Ads', visits: 6234, percentage: 25, color: 'bg-pink-500' },
    { source: 'Directo', visits: 3456, percentage: 14, color: 'bg-green-500' },
    { source: 'Email Marketing', visits: 1534, percentage: 6, color: 'bg-purple-500' },
    { source: 'Otros', visits: 800, percentage: 4, color: 'bg-gray-400' },
  ]

  // Datos mockup de cursos más visitados
  const topCourses = [
    { name: 'Marketing Digital Avanzado', visits: 4532, conversions: 234, rate: '5.16%' },
    { name: 'Desarrollo Web Full Stack', visits: 3890, conversions: 198, rate: '5.09%' },
    { name: 'Data Science con Python', visits: 3456, conversions: 167, rate: '4.83%' },
    { name: 'UX/UI Design', visits: 2987, conversions: 143, rate: '4.79%' },
    { name: 'Community Manager', visits: 2654, conversions: 128, rate: '4.82%' },
  ]

  // Datos mockup de campañas activas
  const campaigns = [
    {
      name: 'Campaña Black Friday',
      clicks: 8543,
      conversions: 456,
      ctr: '5.34%',
      budget: '€2,500',
      status: 'Activa',
    },
    {
      name: 'Retargeting Q4',
      clicks: 5432,
      conversions: 287,
      ctr: '5.28%',
      budget: '€1,800',
      status: 'Activa',
    },
    {
      name: 'Prospecting FP Superior',
      clicks: 3210,
      conversions: 154,
      ctr: '4.80%',
      budget: '€1,200',
      status: 'Pausada',
    },
    {
      name: 'Email Nurturing',
      clicks: 2987,
      conversions: 189,
      ctr: '6.33%',
      budget: '€500',
      status: 'Activa',
    },
  ]

  return (
    <div className="space-y-6" data-oid="-iwx.7c">
      <PageHeader
        title="Analíticas y Métricas"
        description="Panel completo de métricas y rendimiento"
        icon={TrendingUp}
        actions={
          <>
            <select
              className="px-4 py-2 border border-border rounded-lg text-sm bg-card text-foreground"
              data-oid="gjov:mu"
            >
              <option data-oid="oduhxac">Últimos 7 días</option>
              <option data-oid="mkhdk9r">Últimos 30 días</option>
              <option data-oid="sl-82.i">Últimos 90 días</option>
              <option data-oid="2d0.735">Este año</option>
            </select>
            <Button data-oid="hovius-">Exportar Datos</Button>
          </>
        }
        data-oid="fe8zme9"
      />

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-oid="gztxgzd">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Card key={idx} data-oid="asxnvtb">
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid="w00adyi"
              >
                <CardTitle className="text-sm font-medium" data-oid="mpo.eji">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${kpi.color}-600`} data-oid="qeg0iqx" />
              </CardHeader>
              <CardContent data-oid="-38rm7e">
                <div className="text-2xl font-bold" data-oid="0ngzu9a">
                  {kpi.value}
                </div>
                <p
                  className={`text-xs flex items-center gap-1 mt-1 ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                  data-oid="hp2pikd"
                >
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" data-oid="gqfi12-" />
                  ) : (
                    <TrendingDown className="h-3 w-3" data-oid="n7zjkok" />
                  )}
                  {kpi.change} vs mes anterior
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Fuentes de Tráfico */}
      <Card data-oid="b8_l427">
        <CardHeader data-oid="ua579wf">
          <CardTitle data-oid="q2fnohr">Fuentes de Tráfico</CardTitle>
          <CardDescription data-oid="oz26281">
            Distribución de visitas por canal de adquisición
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="bm5q:5w">
          <div className="space-y-4" data-oid="59fxrs7">
            {trafficSources.map((source, idx) => (
              <div key={idx} data-oid=":st6idc">
                <div className="flex items-center justify-between mb-2" data-oid="7cc.6el">
                  <span className="text-sm font-medium" data-oid="udrmv5t">
                    {source.source}
                  </span>
                  <span className="text-sm text-muted-foreground" data-oid="lrmgr.s">
                    {source.visits.toLocaleString()} visitas ({source.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2" data-oid="sa_1vsm">
                  <div
                    className={`${source.color} h-2 rounded-full transition-all`}
                    style={{ width: `${source.percentage}%` }}
                    data-oid="s-2iyli"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cursos Más Visitados */}
      <Card data-oid="4onfvfi">
        <CardHeader data-oid="-2ytlrq">
          <CardTitle data-oid="6q7dxt2">Cursos Más Visitados</CardTitle>
          <CardDescription data-oid="7.x795g">
            Top 5 cursos por tráfico y conversiones
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="w8a2fa-">
          <div className="overflow-x-auto" data-oid="f1y_nln">
            <table className="w-full" data-oid=":-mihki">
              <thead className="border-b" data-oid="lv-4chy">
                <tr data-oid="ucepmpx">
                  <th className="text-left py-3 px-4 font-semibold text-sm" data-oid="_-ur5rk">
                    Curso
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="l1b18vn">
                    Visitas
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="_pfd8e3">
                    Conversiones
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="msqnoam">
                    Tasa Conv.
                  </th>
                </tr>
              </thead>
              <tbody data-oid="8aok1op">
                {topCourses.map((course, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                    data-oid="oggbmoq"
                  >
                    <td className="py-3 px-4 text-sm" data-oid="akhrg3q">
                      {course.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="02dhf5l">
                      {course.visits.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="rsxa8vj">
                      {course.conversions}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="ld.ucc6">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-600 dark:text-green-400"
                        data-oid="y4q.181"
                      >
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
      <Card data-oid="im1fsv9">
        <CardHeader data-oid="nsd:399">
          <CardTitle data-oid="st4x9s2">Campañas de Marketing</CardTitle>
          <CardDescription data-oid="-z7:okj">
            Rendimiento de campañas publicitarias
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="plv-kl9">
          <div className="overflow-x-auto" data-oid="v3dvn-:">
            <table className="w-full" data-oid="mydm7i0">
              <thead className="border-b" data-oid="m8eguua">
                <tr data-oid="wfcbk1q">
                  <th className="text-left py-3 px-4 font-semibold text-sm" data-oid="wl.ebqq">
                    Campaña
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="n3z081-">
                    Clicks
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="amseit.">
                    Conversiones
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="_lb2vd2">
                    CTR
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="at:e-:x">
                    Presupuesto
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-sm" data-oid="ww3tgu5">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody data-oid=".9-7z66">
                {campaigns.map((campaign, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                    data-oid="ys1vflc"
                  >
                    <td className="py-3 px-4 text-sm font-medium" data-oid="d76pth5">
                      {campaign.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="j71or:z">
                      {campaign.clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="ju4oa8j">
                      {campaign.conversions}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="iw_.r3g">
                      {campaign.ctr}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="11gb:il">
                      {campaign.budget}
                    </td>
                    <td className="py-3 px-4 text-sm text-right" data-oid="v_08xmb">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'Activa'
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        data-oid="j410o9-"
                      >
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
      <div className="text-center text-sm text-muted-foreground py-4" data-oid="dm1fyaq">
        <p data-oid=".c_829m">Vista preliminar de Analytics • Datos de ejemplo para demostración</p>
      </div>
    </div>
  )
}
