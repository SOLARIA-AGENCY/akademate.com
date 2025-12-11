'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { AlertTriangle, XCircle, Info, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeleteCourseDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  nombreCurso: string
  tieneConvocatorias: boolean
  numeroConvocatorias?: number
  isDeleting: boolean
}

export function DeleteCourseDialog({
  isOpen,
  onClose,
  onConfirm,
  nombreCurso,
  tieneConvocatorias,
  numeroConvocatorias,
  isDeleting,
}: DeleteCourseDialogProps) {
  const [confirmText, setConfirmText] = React.useState('')
  const CONFIRM_PHRASE = 'ELIMINAR'
  const canConfirm = confirmText === CONFIRM_PHRASE

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">¿Eliminar curso?</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre del curso a eliminar */}
          <div className="bg-muted p-3 rounded border">
            <p className="text-sm text-muted-foreground mb-1">Curso a eliminar:</p>
            <p className="font-semibold">{nombreCurso}</p>
          </div>

          {/* Advertencias */}
          <div className="space-y-3">
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertTitle>Se eliminará permanentemente:</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Toda la información del curso</li>
                  <li>Objetivos de aprendizaje</li>
                  <li>Contenidos del programa</li>
                  <li>Recursos asociados</li>
                  <li>Configuración de subvenciones</li>
                </ul>
              </AlertDescription>
            </Alert>

            {tieneConvocatorias && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Convocatorias Preservadas
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-1">
                    {numeroConvocatorias} convocatoria(s) NO se eliminarán
                  </p>
                  <p className="text-sm">
                    Las convocatorias permanecerán en el sistema pero quedarán desvinculadas de
                    esta plantilla. Podrás vincularlas a una nueva plantilla en el futuro.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Campo de confirmación */}
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              Para confirmar, escribe{' '}
              <code className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-mono text-xs">
                {CONFIRM_PHRASE}
              </code>
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder={`Escribe "${CONFIRM_PHRASE}"`}
              disabled={isDeleting}
              className={cn(
                'font-mono uppercase',
                canConfirm && 'border-green-500 focus-visible:ring-green-500'
              )}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar Definitivamente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
