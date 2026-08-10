'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { PiggyBank } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export default function NominasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nominas y Costes"
        description="Keep payroll and staff-cost decisions grounded in configured provider data"
        icon={PiggyBank}
      />
      <Card><CardHeader><CardTitle>Payroll requires a configured finance source</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Akademate can show approved provider data after connection. Payroll calculation, contracts and tax filing remain provider-specific workflows with their own authorization.</p><Button variant="outline" asChild><Link href="/finanzas/integraciones">Review provider paths</Link></Button></CardContent></Card>
    </div>
  )
}
