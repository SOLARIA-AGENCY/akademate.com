'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@payload-config/components/ui/alert-dialog'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'

interface CancelSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason?: string, immediately?: boolean) => Promise<void>
  currentPeriodEnd?: Date
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  currentPeriodEnd,
}: CancelSubscriptionDialogProps) {
  const [reason, setReason] = useState('')
  const [cancelImmediately, setCancelImmediately] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm(reason || undefined, cancelImmediately)
      onOpenChange(false)
      setReason('')
      setCancelImmediately(false)
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Cancelar Suscripción
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción cancelará tu suscripción.
            {!cancelImmediately && currentPeriodEnd && (
              <span className="block mt-2 font-medium text-foreground">
                Podrás seguir usando el servicio hasta el {formatDate(currentPeriodEnd)}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Razón de cancelación (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ayúdanos a mejorar. ¿Por qué cancelas?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Cancel immediately checkbox */}
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="immediate"
              checked={cancelImmediately}
              onCheckedChange={(checked) => setCancelImmediately(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="immediate"
                className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cancelar inmediatamente
              </Label>
              <p className="text-sm text-muted-foreground">
                El acceso terminará hoy. De lo contrario, termina al final del periodo actual.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              <strong>Advertencia:</strong> Una vez cancelada, perderás acceso a todas las
              funciones premium{cancelImmediately ? ' inmediatamente' : ' al final del periodo de facturación'}.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            No, mantener suscripción
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Cancelando...' : 'Sí, cancelar suscripción'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
