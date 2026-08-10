'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Landmark } from 'lucide-react'
import FinanceWorkspace from './FinanceWorkspace'

export default function FinanzasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumen Financiero"
        description="A view of your academy's finance connections and verified payment evidence"
        icon={Landmark}
      />
      <FinanceWorkspace />
    </div>
  )
}
