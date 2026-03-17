import { Users } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <Users className="w-12 h-12 text-muted-foreground/40 mb-4" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Usuarios</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Gestiona los usuarios desde Administracion &gt; Usuarios en el sidebar.
      </p>
    </div>
  )
}
