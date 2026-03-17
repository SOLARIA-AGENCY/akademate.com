import { Award } from 'lucide-react'

export default function CertificatesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <Award className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Certificados</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Los certificados estaran disponibles cuando los alumnos completen sus cursos.
      </p>
    </div>
  )
}
