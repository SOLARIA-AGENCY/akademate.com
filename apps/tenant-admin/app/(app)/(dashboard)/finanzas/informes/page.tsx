'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export default function InformesFinancierosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Informes Financieros"
        description="Explore persisted finance evidence once a provider is connected"
        icon={ClipboardList}
      />
      <Card><CardHeader><CardTitle>Reports follow verified data</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Reports are generated from synchronized, redacted provider data and canonical Akademate payment evidence. No financial figures are invented while the workspace has no source data.</p><Button variant="outline" asChild><Link href="/finanzas/integraciones">Connect a provider</Link></Button></CardContent></Card>
    </div>
  )
}
