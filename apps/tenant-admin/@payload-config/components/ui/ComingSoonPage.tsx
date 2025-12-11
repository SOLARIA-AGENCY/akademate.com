'use client'

import * as React from 'react'
import { LucideIcon, Construction } from 'lucide-react'
import { Card, CardContent } from './card'
import { PageHeader } from './PageHeader'

interface ComingSoonPageProps {
  /** Page title */
  title: string
  /** Page description */
  description?: string
  /** Icon for the page header */
  icon?: LucideIcon
  /** Expected implementation phase or date */
  expectedPhase?: string
  /** List of planned features */
  plannedFeatures?: string[]
  /** Additional note to display */
  note?: string
}

/**
 * Standardized "Coming Soon" page for modules not yet implemented.
 *
 * Shows a consistent layout with:
 * - Page header with icon
 * - Construction indicator
 * - Planned features list
 * - Expected timeline
 *
 * @example
 * ```tsx
 * <ComingSoonPage
 *   title="Creatividades"
 *   description="Gestión de creatividades para campañas de marketing"
 *   icon={Sparkles}
 *   expectedPhase="Fase F6"
 *   plannedFeatures={[
 *     "Generación automática con IA",
 *     "Templates predefinidos",
 *     "Preview en tiempo real",
 *   ]}
 * />
 * ```
 */
export function ComingSoonPage({
  title,
  description,
  icon,
  expectedPhase,
  plannedFeatures = [],
  note,
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        iconBgColor="bg-muted"
        iconColor="text-muted-foreground"
      />

      <Card className="border-dashed border-2">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Módulo en Desarrollo</h2>
              <p className="text-muted-foreground max-w-md">
                Este módulo está siendo desarrollado y estará disponible próximamente.
              </p>
            </div>

            {expectedPhase && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Esperado: {expectedPhase}
              </div>
            )}

            {plannedFeatures.length > 0 && (
              <div className="mt-6 w-full max-w-md">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Funcionalidades Planificadas
                </h3>
                <ul className="space-y-2 text-left">
                  {plannedFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {note && (
              <p className="text-xs text-muted-foreground/70 mt-4 max-w-md">
                {note}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
