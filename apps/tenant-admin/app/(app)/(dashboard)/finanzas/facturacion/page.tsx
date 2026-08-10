'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Receipt } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export default function FacturacionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturacion"
        description="Prepare the accounting connection needed for invoice workflows"
        icon={Receipt}
      />
      <Card><CardHeader><CardTitle>Invoice workflows are provider-led</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Akademate records offer and enrolment evidence. Fiscal invoice issuance, numbering and local tax reporting require an approved accounting provider and tenant configuration.</p><Button variant="outline" asChild><Link href="/finanzas/integraciones">Review accounting integrations</Link></Button></CardContent></Card>
    </div>
  )
}
