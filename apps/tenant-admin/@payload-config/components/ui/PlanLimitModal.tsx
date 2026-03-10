'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { Lock } from 'lucide-react'
import { RESOURCE_LABELS, PLAN_LABELS, type ResourceKey, type PlanKey } from '../../lib/planLimits'

interface PlanLimitModalProps {
  open: boolean
  onClose: () => void
  resource: ResourceKey
  current: number
  limit: number
  plan: string
}

export function PlanLimitModal({ open, onClose, resource, current, limit, plan }: PlanLimitModalProps) {
  const router = useRouter()
  const planLabel = PLAN_LABELS[(plan as PlanKey)] ?? plan
  const resourceLabel = RESOURCE_LABELS[resource]

  const description =
    limit === 0
      ? `Tu plan ${planLabel} no incluye ${resourceLabel}. Actualiza tu plan para acceder a esta funcionalidad.`
      : `Tu plan ${planLabel} permite hasta ${limit} ${resourceLabel} (tienes ${current}). Actualiza tu plan para crear más.`

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Límite de plan alcanzado</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onClose()
              router.push('/facturacion')
            }}
          >
            Ver planes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
