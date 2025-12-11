'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Button } from '@payload-config/components/ui/button'
import { DeleteCourseDialog } from '@payload-config/components/ui/DeleteCourseDialog'
import { AlertTriangle, Info, Trash2 } from 'lucide-react'

interface DangerZoneProps {
  cursoId: string
  nombreCurso: string
  tieneConvocatorias: boolean
  numeroConvocatorias?: number
}

export function DangerZone({
  cursoId,
  nombreCurso,
  tieneConvocatorias,
  numeroConvocatorias,
}: DangerZoneProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const router = useRouter()

  const handleEliminar = async () => {
    setIsDeleting(true)
    try {
      // In real implementation, this would call API to delete course
      console.log('Eliminando curso:', cursoId)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Show success message (in real app use toast)
      console.log('Curso eliminado correctamente')

      // Redirect to courses list
      router.push('/cursos')
    } catch (error) {
      console.error('Error al eliminar curso:', error)
      setIsDeleting(false)
      // Show error message (in real app use toast)
    }
  }

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
              <CardDescription className="text-destructive/80">
                Las acciones en esta sección son irreversibles
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Información sobre convocatorias */}
            {tieneConvocatorias && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <Info className="w-4 h-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  Convocatorias Vinculadas
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Este curso tiene <strong>{numeroConvocatorias} convocatoria(s)</strong>{' '}
                  asociada(s). Las convocatorias NO se eliminarán y quedarán huérfanas.
                </AlertDescription>
              </Alert>
            )}

            {/* Descripción de la acción */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Eliminar Plantilla de Curso</h4>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará permanentemente la plantilla del curso y toda su información
                (objetivos, contenidos, recursos).{' '}
                {tieneConvocatorias ? (
                  <>
                    Las <strong>convocatorias permanecerán</strong> en el sistema pero quedarán
                    desvinculadas de esta plantilla.
                  </>
                ) : (
                  <>Esta acción no se puede deshacer.</>
                )}
              </p>
            </div>

            {/* Botón de eliminación */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                Esta acción requiere confirmación
              </div>
              <Button
                variant="destructive"
                onClick={() => setIsDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Curso
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmación */}
      <DeleteCourseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleEliminar}
        nombreCurso={nombreCurso}
        tieneConvocatorias={tieneConvocatorias}
        numeroConvocatorias={numeroConvocatorias}
        isDeleting={isDeleting}
      />
    </>
  )
}
