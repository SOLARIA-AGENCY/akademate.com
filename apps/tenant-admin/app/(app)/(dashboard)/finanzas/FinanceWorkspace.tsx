'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Link2, RefreshCw, ShieldCheck } from 'lucide-react'

import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

type FinanceConnection = {
  id: string
  provider: 'holded' | 'xero' | 'quickbooks'
  mode: 'scaffold' | 'read_only' | 'read_write'
  status: 'pending' | 'connected' | 'degraded' | 'revoked' | 'disconnected'
  externalOrganizationName: string | null
  hasCredential: boolean
  lastHealthCheckAt: string | null
  lastErrorCode: string | null
}

type FinanceSummary = {
  generatedAt: string
  connections: { total: number; connected: number; needsAttention: number }
  paymentProjection: { total: number; lastProjectedAt: string | null }
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'disabled' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; connections: FinanceConnection[]; summary: FinanceSummary }

const providerNames: Record<FinanceConnection['provider'], string> = {
  holded: 'Holded',
  xero: 'Xero',
  quickbooks: 'QuickBooks Online',
}

export function financeStatusLabel(status: FinanceConnection['status']): string {
  return {
    pending: 'Setup in progress',
    connected: 'Connected',
    degraded: 'Needs attention',
    revoked: 'Access revoked',
    disconnected: 'Disconnected',
  }[status]
}

function statusVariant(status: FinanceConnection['status']): 'success' | 'warning' | 'neutral' {
  if (status === 'connected') return 'success'
  if (status === 'degraded' || status === 'pending') return 'warning'
  return 'neutral'
}

export default function FinanceWorkspace() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  async function load() {
    setState({ kind: 'loading' })
    try {
      const [connectionsResponse, summaryResponse] = await Promise.all([
        fetch('/api/next/finance/connections', { cache: 'no-store' }),
        fetch('/api/next/finance/summary', { cache: 'no-store' }),
      ])
      if (connectionsResponse.status === 404 || summaryResponse.status === 404) {
        setState({ kind: 'disabled' })
        return
      }
      if (!connectionsResponse.ok || !summaryResponse.ok) {
        setState({ kind: 'error', message: 'Finance workspace is temporarily unavailable.' })
        return
      }
      const connections = await connectionsResponse.json() as { items: FinanceConnection[] }
      const summary = await summaryResponse.json() as FinanceSummary
      setState({ kind: 'ready', connections: connections.items, summary })
    } catch {
      setState({ kind: 'error', message: 'Finance workspace is temporarily unavailable.' })
    }
  }

  useEffect(() => { void load() }, [])

  if (state.kind === 'loading') {
    return <div className="grid gap-4 md:grid-cols-3" aria-busy="true"><Card className="h-32 animate-pulse" /><Card className="h-32 animate-pulse" /><Card className="h-32 animate-pulse" /></div>
  }

  if (state.kind === 'disabled') {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><CardTitle>Finance connectors are staged safely</CardTitle></div>
          <CardDescription>Connect accounting data when your tenant has completed the finance setup and provider review.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link href="/finanzas/integraciones">View integrations</Link></Button>
          <Button variant="outline" asChild><Link href="/dashboard">Return to dashboard</Link></Button>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === 'error') {
    return <Card role="alert" className="border-amber-300"><CardHeader><CardTitle>Finance workspace unavailable</CardTitle><CardDescription>{state.message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void load()}><RefreshCw />Try again</Button></CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-3"><CardDescription>Accounting connections</CardDescription><CardTitle className="text-3xl">{state.summary.connections.connected}<span className="text-base font-normal text-muted-foreground"> / {state.summary.connections.total}</span></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Connected providers for this tenant.</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Needs attention</CardDescription><CardTitle className="text-3xl">{state.summary.connections.needsAttention}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Connection states requiring review.</p></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardDescription>Payment evidence</CardDescription><CardTitle className="text-3xl">{state.summary.paymentProjection.total}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Canonical payment events projected for finance.</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Connected providers</CardTitle><CardDescription>Read-only status and sync evidence for this academy.</CardDescription></div><Button asChild><Link href="/finanzas/integraciones"><Link2 />Manage connections</Link></Button></CardHeader>
        <CardContent>
          {state.connections.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center"><Link2 className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="font-medium">No accounting provider connected yet.</p><p className="mt-1 text-sm text-muted-foreground">Choose a provider to review the connection path for your academy.</p><Button className="mt-4" variant="outline" asChild><Link href="/finanzas/integraciones">Explore integrations <ArrowRight /></Link></Button></div>
          ) : (
            <div className="space-y-3">{state.connections.map((connection) => <div key={connection.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-full bg-primary/10 p-2"><CheckCircle2 className="h-4 w-4 text-primary" /></div><div><p className="font-medium">{providerNames[connection.provider]}</p><p className="text-sm text-muted-foreground">{connection.externalOrganizationName ?? 'Organization selection pending'}</p></div></div><div className="flex items-center gap-3"><Badge variant={statusVariant(connection.status)}>{financeStatusLabel(connection.status)}</Badge><Button size="sm" variant="outline" asChild><Link href={`/finanzas/integraciones/${connection.id}`}>Details</Link></Button></div></div>)}</div>
          )}
        </CardContent>
      </Card>

      {state.summary.connections.needsAttention > 0 && <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p>Review the flagged provider connection before requesting another sync.</p></div>}
    </div>
  )
}
