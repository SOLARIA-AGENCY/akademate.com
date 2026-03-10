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
    <AlertDialog open={open} onOpenChange={onOpenChange} data-oid="295ph.t">
      <AlertDialogContent className="max-w-md" data-oid="0d7qxua">
        <AlertDialogHeader data-oid=".pyjkv4">
          <AlertDialogTitle className="flex items-center gap-2" data-oid="2zuqa9j">
            <AlertCircle className="h-5 w-5 text-red-500" data-oid="59m15ol" />
            Cancelar Suscripción
          </AlertDialogTitle>
          <AlertDialogDescription data-oid="srmij.5">
            Esta acción cancelará tu suscripción.
            {!cancelImmediately && currentPeriodEnd && (
              <span className="block mt-2 font-medium text-foreground" data-oid="0vzph6e">
                Podrás seguir usando el servicio hasta el {formatDate(currentPeriodEnd)}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4" data-oid=".q:vgdj">
          {/* Reason */}
          <div className="space-y-2" data-oid="3noue_f">
            <Label htmlFor="reason" data-oid="j3-h.ha">
              Razón de cancelación (opcional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Ayúdanos a mejorar. ¿Por qué cancelas?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              data-oid="ol:c5k-"
            />
          </div>

          {/* Cancel immediately checkbox */}
          <div className="flex items-start gap-3 rounded-lg border p-4" data-oid="di0c6dt">
            <Checkbox
              id="immediate"
              checked={cancelImmediately}
              onCheckedChange={(checked) => setCancelImmediately(checked as boolean)}
              data-oid="t:-:a21"
            />

            <div className="grid gap-1.5 leading-none" data-oid="au37mqs">
              <Label
                htmlFor="immediate"
                className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                data-oid=".aik2af"
              >
                Cancelar inmediatamente
              </Label>
              <p className="text-sm text-muted-foreground" data-oid="slfqk73">
                El acceso terminará hoy. De lo contrario, termina al final del periodo actual.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4" data-oid="6v84f4:">
            <p className="text-sm text-orange-800" data-oid="mertsy9">
              <strong data-oid="55fwud-">Advertencia:</strong> Una vez cancelada, perderás acceso a
              todas las funciones premium
              {cancelImmediately ? ' inmediatamente' : ' al final del periodo de facturación'}.
            </p>
          </div>
        </div>

        <AlertDialogFooter data-oid="a0x99:w">
          <AlertDialogCancel disabled={isLoading} data-oid="m75drv:">
            No, mantener suscripción
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
            data-oid="ibcox:e"
          >
            {isLoading ? 'Cancelando...' : 'Sí, cancelar suscripción'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
