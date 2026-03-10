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
    <Dialog open={isOpen} onOpenChange={handleClose} data-oid="y86p00p">
      <DialogContent className="max-w-md" data-oid="8zcb7qa">
        <DialogHeader data-oid="oet_cbg">
          <div className="flex items-center gap-3" data-oid="zq79kwd">
            <div className="p-3 bg-destructive/10 rounded-full" data-oid="dk2v2d:">
              <AlertTriangle className="w-6 h-6 text-destructive" data-oid="qqxd-w1" />
            </div>
            <div className="flex-1" data-oid="dpxou38">
              <DialogTitle className="text-xl" data-oid="ia_r9fs">
                ¿Eliminar curso?
              </DialogTitle>
              <DialogDescription data-oid="fpg:3ey">
                Esta acción no se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4" data-oid="7::f8c5">
          {/* Nombre del curso a eliminar */}
          <div className="bg-muted p-3 rounded border" data-oid="0njohh-">
            <p className="text-sm text-muted-foreground mb-1" data-oid="oiuctxe">
              Curso a eliminar:
            </p>
            <p className="font-semibold" data-oid="5b68_h_">
              {nombreCurso}
            </p>
          </div>

          {/* Advertencias */}
          <div className="space-y-3" data-oid="xrn4l7o">
            <Alert variant="destructive" data-oid="0f63_a8">
              <XCircle className="w-4 h-4" data-oid="wfgimbm" />
              <AlertTitle data-oid="0c4bf5:">Se eliminará permanentemente:</AlertTitle>
              <AlertDescription data-oid="6n1mo_q">
                <ul className="list-disc list-inside space-y-1 text-sm mt-2" data-oid="s1g:y99">
                  <li data-oid=":dgmx5l">Toda la información del curso</li>
                  <li data-oid="mbzfbe3">Objetivos de aprendizaje</li>
                  <li data-oid="5h-7czj">Contenidos del programa</li>
                  <li data-oid="ibt_-v7">Recursos asociados</li>
                  <li data-oid="nsz8nkm">Configuración de subvenciones</li>
                </ul>
              </AlertDescription>
            </Alert>

            {tieneConvocatorias && (
              <Alert
                className="border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                data-oid="9emza_v"
              >
                <Info className="w-4 h-4 text-amber-600" data-oid="qp_pskd" />
                <AlertTitle className="text-amber-900 dark:text-amber-100" data-oid="magppab">
                  Convocatorias Preservadas
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200" data-oid="l5686y_">
                  <p className="font-semibold mb-1" data-oid="vmz1alq">
                    {numeroConvocatorias} convocatoria(s) NO se eliminarán
                  </p>
                  <p className="text-sm" data-oid="hrpww2p">
                    Las convocatorias permanecerán en el sistema pero quedarán desvinculadas de esta
                    plantilla. Podrás vincularlas a una nueva plantilla en el futuro.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Campo de confirmación */}
          <div className="space-y-2" data-oid="_gsu35f">
            <Label htmlFor="confirm-text" className="text-sm font-medium" data-oid="9nlg832">
              Para confirmar, escribe{' '}
              <code
                className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-mono text-xs"
                data-oid="l-od07y"
              >
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
              data-oid="kwdka._"
            />
          </div>
        </div>

        <DialogFooter data-oid="qupezu_">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting} data-oid="s1n1:v8">
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className="gap-2"
            data-oid="qm2xq9z"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" data-oid="b1ee9ad" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" data-oid="vny62d4" />
                Eliminar Definitivamente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
