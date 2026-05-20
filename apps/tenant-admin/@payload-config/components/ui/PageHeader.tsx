'use client'

import * as React from 'react'
import { LucideIcon, Plus } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Separator } from './separator'
import { cn } from '@payload-config/lib/utils'

interface PageHeaderProps {
  /** Page title */
  title: string
  /** Page description/subtitle */
  description?: string
  /** Icon component from lucide-react */
  icon?: LucideIcon
  /** Optional icon background class */
  iconBgColor?: string
  /** Optional icon color class */
  iconColor?: string
  /** Show "New" button */
  showAddButton?: boolean
  /** Text for add button (default: "Nuevo") */
  addButtonText?: string
  /** Callback when add button is clicked */
  onAdd?: () => void
  /** Additional actions (rendered in header row) */
  actions?: React.ReactNode
  /** Filter controls (rendered in second row) */
  filters?: React.ReactNode
  /** Badge or count to display next to title */
  badge?: React.ReactNode
  /** Whether to use card wrapper (default: true) */
  withCard?: boolean
  /** Additional className for outer wrapper */
  className?: string
}

function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join(' ')
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }
  return ''
}

function isDecorativeHeaderBadge(node: React.ReactNode): boolean {
  const text = getNodeText(node).trim().toLowerCase()
  if (!text) return false

  const hasSemanticState = /\b(activo|activa|inactivo|inactiva|publicado|sin publicar|borrador|inscripción|inscripcion|abierta|cerrada|conflicto|guardando|nuevo|nueva|prototipo)\b/.test(text)
  if (hasSemanticState) return false

  return /\b(visibles?|líneas?|lineas?|categorías?|categorias?|centros?|en vista|cursos?|convocatorias?)\b/.test(text)
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconBgColor,
  iconColor,
  showAddButton = false,
  addButtonText = 'Nuevo',
  onAdd,
  actions,
  filters,
  badge,
  withCard = true,
  className = '',
}: PageHeaderProps) {
  const shouldRenderBadge = !!badge && !isDecorativeHeaderBadge(badge)

  const content = (
    <div className="flex flex-col gap-4" data-oid="nq9arpo">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary',
                iconBgColor,
                iconColor
              )}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl" data-oid=".ik_qyi">
                {title}
              </h1>
              {shouldRenderBadge ? <div className="shrink-0">{badge}</div> : null}
            </div>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground" data-oid="eclyf72">
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end"
          data-oid="1n2t8tr"
        >
          {actions}
          {showAddButton && onAdd && (
            <Button onClick={onAdd} size="sm" data-oid=":ke29tb">
              <Plus className="mr-2 h-4 w-4" data-oid=":-fb6j5" />
              {addButtonText}
            </Button>
          )}
        </div>
      </div>

      {filters && (
        <>
          <Separator />
          <div className="flex flex-wrap items-center gap-3" data-oid="on_hyte">
            {filters}
          </div>
        </>
      )}
    </div>
  )

  if (withCard) {
    return (
      <Card className={cn('mb-2 border-border/80 shadow-sm', className)} data-oid="ecwgyxr">
        <CardContent className="p-5 sm:p-6">{content}</CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('mb-2 py-4', className)} data-oid="mtp78ig">
      {content}
    </div>
  )
}
