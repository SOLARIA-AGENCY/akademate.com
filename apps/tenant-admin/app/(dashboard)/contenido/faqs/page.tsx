'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { HelpCircle } from 'lucide-react'

export default function FaqsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="FAQs"
        description="Gestión de preguntas frecuentes"
        icon={HelpCircle}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
