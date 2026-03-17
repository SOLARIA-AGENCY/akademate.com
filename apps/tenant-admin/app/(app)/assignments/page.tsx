import { ClipboardList } from 'lucide-react'

export default function AssignmentsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Entregas</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        No hay entregas pendientes. Las entregas de los alumnos aparecerán aquí cuando se asignen tareas en los cursos.
      </p>
    </div>
  )
}
