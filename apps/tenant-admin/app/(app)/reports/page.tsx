import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <BarChart3 className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Informes</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Los informes se generaran automaticamente cuando haya datos de cursos, alumnos e inscripciones.
      </p>
    </div>
  )
}
