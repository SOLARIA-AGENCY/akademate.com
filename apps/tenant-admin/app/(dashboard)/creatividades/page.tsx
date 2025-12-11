'use client'

import { Sparkles } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function CreatividadesPage() {
  return (
    <ComingSoonPage
      title="Creatividades"
      description="Generación y gestión de creatividades para campañas de marketing"
      icon={Sparkles}
      expectedPhase="Fase F6 - LLM Ingestion"
      plannedFeatures={[
        "Generación automática de copys con IA (GPT-4/Claude)",
        "Templates predefinidos para Meta Ads y Google Ads",
        "Variantes A/B para testing",
        "Preview en tiempo real",
        "Historial de creatividades por curso",
        "Exportación directa a plataformas publicitarias",
      ]}
      note="Este módulo forma parte del pipeline de ingesta LLM y generación de contenido automatizado."
    />
  )
}
