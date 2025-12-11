'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MockDataBanner } from '@/components/mock-data-banner'

const enterpriseGaps = [
  { name: 'Billing/Stripe + usage', status: 'missing', gap: 100, note: 'Planes, checkout, metering' },
  { name: 'SSO/SCIM', status: 'missing', gap: 100, note: 'SAML/OIDC + directory sync' },
  { name: 'Audit logs enterprise', status: 'partial', gap: 70, note: 'Export/search/retention' },
  { name: 'API keys + rate limits', status: 'partial', gap: 60, note: 'Scopes, quotas por plan' },
  { name: 'Onboarding wizard', status: 'missing', gap: 100, note: 'TTFV y checklist' },
  { name: 'Analytics avanzada', status: 'partial', gap: 50, note: 'MRR/NRR/churn funnels' },
  { name: 'White-label + dominios', status: 'missing', gap: 100, note: 'Custom domain + branding' },
  { name: 'Feature flags', status: 'missing', gap: 100, note: 'Rollouts tenant-aware' },
  { name: 'Webhooks/retries', status: 'missing', gap: 100, note: 'Eventos + colas + reintentos' },
  { name: 'Security/Compliance', status: 'missing', gap: 100, note: 'MFA, GDPR export/delete, status' },
]

const roadmap = [
  {
    phase: 'Fase 1',
    timeline: '4 semanas',
    target: '$100K ARR',
    status: 'current',
    items: [
      { name: 'Stripe Billing basico', done: false },
      { name: 'Pricing page', done: false },
      { name: 'Onboarding wizard', done: false },
      { name: 'Audit logs mejorados', done: false },
    ],
  },
  {
    phase: 'Fase 2',
    timeline: '6 semanas',
    target: '$500K ARR',
    status: 'pending',
    items: [
      { name: 'Usage-based billing', done: false },
      { name: 'API keys + rate limiting', done: false },
      { name: 'Webhooks', done: false },
      { name: 'Feature flags', done: false },
      { name: 'Analytics avanzada', done: false },
    ],
  },
  {
    phase: 'Fase 3',
    timeline: '8 semanas',
    target: '$1M+ ARR',
    status: 'pending',
    items: [
      { name: 'SSO/OIDC + SAML', done: false },
      { name: 'SCIM directory sync', done: false },
      { name: 'Custom domains/white-label', done: false },
      { name: 'Security & compliance center', done: false },
    ],
  },
]

export default function RoadmapPage() {
  const totalScore = 32
  const totalGaps = enterpriseGaps.length
  const missingCount = enterpriseGaps.filter(g => g.status === 'missing').length
  const partialCount = enterpriseGaps.filter(g => g.status === 'partial').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Readiness"
        description="Mapa de gaps para escalar a $1M+ ARR"
      >
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors mr-2"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <MockDataBanner />
      </PageHeader>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Score Total</p>
          <div className="flex items-end gap-2 mt-2">
            <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{totalScore}</p>
            <p className="text-lg text-muted-foreground mb-1">/100</p>
          </div>
        </div>
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Features Faltantes</p>
          <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">{missingCount}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Parcialmente Listos</p>
          <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2">{partialCount}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Features</p>
          <p className="text-4xl font-bold text-foreground mt-2">{totalGaps}</p>
        </div>
      </div>

      {/* Gap Analysis */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gap Analysis</h2>
            <p className="text-muted-foreground text-sm">Features necesarios para enterprise-readiness</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            Mock data
          </span>
        </div>

        <div className="space-y-3">
          {enterpriseGaps.map(feature => (
            <div
              key={feature.name}
              className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-foreground">{feature.name}</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        feature.status === 'missing'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {feature.status === 'missing' ? 'Faltante' : 'Parcial'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{feature.note}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        feature.gap === 100
                          ? 'bg-red-500'
                          : feature.gap >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${100 - feature.gap}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                    {feature.gap}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Roadmap de Implementacion</h2>
            <p className="text-muted-foreground text-sm">Prioriza billing, SSO/SCIM, API keys y webhooks</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            Plan propuesto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((phase, idx) => (
            <div
              key={phase.phase}
              className={`p-5 rounded-xl ${
                phase.status === 'current'
                  ? 'bg-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {phase.status === 'current' ? (
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-foreground">{phase.phase}</h3>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded bg-muted/50 text-xs text-muted-foreground">
                  {phase.timeline}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  idx === 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : idx === 1
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                }`}>
                  {phase.target}
                </span>
              </div>

              <ul className="space-y-2">
                {phase.items.map(item => (
                  <li key={item.name} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={item.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Acciones Rapidas</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Iniciar Fase 1
          </button>
          <button className="px-4 py-2 bg-muted/50 text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Exportar Reporte
          </button>
          <button className="px-4 py-2 bg-muted/50 text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Configurar Alertas
          </button>
        </div>
      </div>
    </div>
  )
}
