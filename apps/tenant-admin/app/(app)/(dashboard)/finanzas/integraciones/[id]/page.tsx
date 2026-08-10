'use client'

import Link from 'next/link'
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'

const names: Record<string, string> = { holded: 'Holded', xero: 'Xero', quickbooks: 'QuickBooks Online' }

export default function FinanceIntegrationDetailPage({ params }: { params: { id: string } }) {
  const name = names[params.id] ?? 'Accounting provider'
  return (
    <div className="space-y-6">
      <PageHeader title={`${name} connection`} description="Review the provider path before an administrator enables a tenant connection." icon={ShieldCheck} actions={<Button variant="ghost" asChild><Link href="/finanzas/integraciones"><ArrowLeft />All integrations</Link></Button>} />
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Connection status</CardTitle><Badge variant="neutral">Coming soon</Badge></div><CardDescription>This provider is represented as a reviewed pathway while transport, credentials and tenant acceptance are completed.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3 rounded-lg border p-4"><LockKeyhole className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-medium">Credentials remain server-side</p><p className="text-sm text-muted-foreground">API keys and OAuth tokens are encrypted and are never rendered in the dashboard or returned by these APIs.</p></div></div><ul className="space-y-2 text-sm text-muted-foreground"><li>• Organization or company selection is explicit.</li><li>• Initial sync is read-only and produces redacted evidence.</li><li>• Provider webhooks require signature verification and idempotency.</li><li>• Writeback requires a separate approval and runtime flag.</li></ul><Button variant="outline" asChild><Link href="/contacto?asunto=integracion-financiera">Request a review</Link></Button></CardContent></Card>
    </div>
  )
}
