import { ShieldCheck } from 'lucide-react'

export function RegulatoryNotice() {
  return (
    <p
      role="note"
      aria-label="Información regulatoria; este distintivo no es una certificación"
      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-foreground"
    >
      <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
      Información regulatoria · No es una certificación
    </p>
  )
}
