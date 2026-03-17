import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <Settings className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Configuracion</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Accede a la configuracion desde el sidebar: Configuracion &gt; General, Personalizacion, Areas de Estudio, etc.
      </p>
    </div>
  )
}
