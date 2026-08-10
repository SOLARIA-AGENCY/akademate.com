'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { HandCoins } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export default function CobrosPagosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobros y Pagos"
        description="Review verified offer payments and provider connection status"
        icon={HandCoins}
      />
      <Card><CardHeader><CardTitle>Verified payment evidence</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Offer payment orders and provider events remain the canonical source for enrolment. Accounting projections appear after a configured provider connection.</p><Button variant="outline" asChild><Link href="/finanzas/integraciones">Review accounting integrations</Link></Button></CardContent></Card>
    </div>
  )
}
