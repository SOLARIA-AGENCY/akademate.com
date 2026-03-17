import { BookOpen } from 'lucide-react'

export default function CoursesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Cursos</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        No hay cursos creados. Utiliza la sección de Cursos en el sidebar para gestionar tu oferta formativa.
      </p>
    </div>
  )
}
