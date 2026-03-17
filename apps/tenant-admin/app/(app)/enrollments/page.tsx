import { FileText } from 'lucide-react'

export default function EnrollmentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Inscripciones</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        No hay inscripciones registradas. Las inscripciones aparecerán aquí cuando los alumnos se matriculen en los cursos.
      </p>
    </div>
  )
}
