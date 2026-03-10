'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Sparkles } from 'lucide-react'

export default function CreatividadesPage() {
  return (
    <div className="space-y-4" data-oid=".h7qi:l">
      <PageHeader
        title="Creatividades"
        description="Generación y gestión de creatividades para campañas de marketing"
        icon={Sparkles}
        data-oid="5jvqnzo"
      />

      <Card data-oid="ka.b4pg">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="l44qg30"
        >
          <p className="text-muted-foreground text-sm" data-oid="o83a4yn">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
