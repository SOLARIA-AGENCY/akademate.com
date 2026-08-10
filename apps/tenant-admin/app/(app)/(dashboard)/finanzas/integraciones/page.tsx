'use client'

import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

const providers = [
  { key: 'holded', name: 'Holded', detail: 'Connect a Holded organization for reviewed accounting reads.', evidence: 'API key connection path' },
  { key: 'xero', name: 'Xero', detail: 'Connect a Xero organization through a tenant-approved OAuth flow.', evidence: 'OAuth organization selection' },
  { key: 'quickbooks', name: 'QuickBooks Online', detail: 'Connect a QuickBooks company through an approved OAuth flow.', evidence: 'OAuth realm selection' },
]

export default function FinanceIntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Accounting integrations" description="Choose a provider and review the connection requirements for your academy." icon={Building2} />
      <div className="grid gap-4 lg:grid-cols-3">{providers.map((provider) => <Card key={provider.key} className="flex flex-col"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{provider.name}</CardTitle><Badge variant="neutral">Coming soon</Badge></div><CardDescription>{provider.detail}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col justify-between gap-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />{provider.evidence}</div><Button variant="outline" asChild><Link href={`/finanzas/integraciones/${provider.key}`}>Review path <ArrowRight /></Link></Button></CardContent></Card>)}</div>
      <Card className="border-dashed"><CardHeader><CardTitle>Need another finance provider?</CardTitle><CardDescription>Request a scoped integration review. We will confirm the provider API, security model and acceptance criteria before activation.</CardDescription></CardHeader><CardContent><Button variant="outline" asChild><Link href="/finanzas/integraciones/solicitar">Request an integration review</Link></Button></CardContent></Card>
    </div>
  )
}
