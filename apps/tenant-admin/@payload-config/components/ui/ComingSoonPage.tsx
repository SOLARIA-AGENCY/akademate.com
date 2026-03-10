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
    <div className="space-y-6" data-oid="2kr4gll">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        iconBgColor="bg-muted"
        iconColor="text-muted-foreground"
        data-oid="sk1zryh"
      />

      <Card className="border-dashed border-2" data-oid="18vv_y5">
        <CardContent className="py-12" data-oid="xlps-wq">
          <div
            className="flex flex-col items-center justify-center text-center space-y-4"
            data-oid="25n305n"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-muted"
              data-oid="lqgiu2y"
            >
              <Construction className="h-8 w-8 text-muted-foreground" data-oid="fnfei-:" />
            </div>

            <div className="space-y-2" data-oid="6qtp_gl">
              <h2 className="text-2xl font-semibold" data-oid="33a4mpc">
                Módulo en Desarrollo
              </h2>
              <p className="text-muted-foreground max-w-md" data-oid="dbi7:g7">
                Este módulo está siendo desarrollado y estará disponible próximamente.
              </p>
            </div>

            {expectedPhase && (
              <div
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                data-oid="g405v_k"
              >
                Esperado: {expectedPhase}
              </div>
            )}

            {plannedFeatures.length > 0 && (
              <div className="mt-6 w-full max-w-md" data-oid="iojlplz">
                <h3
                  className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                  data-oid="am6_l6g"
                >
                  Funcionalidades Planificadas
                </h3>
                <ul className="space-y-2 text-left" data-oid="ht34dv9">
                  {plannedFeatures.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      data-oid="99nudyv"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" data-oid="5fe6a54" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {note && (
              <p className="text-xs text-muted-foreground/70 mt-4 max-w-md" data-oid="wjtr251">
                {note}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
