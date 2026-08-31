'use client'

import { RequireAuth, useSession } from '../../providers/SessionProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export default function AjustesPage() {
  return (
    <RequireAuth>
      <AjustesView />
    </RequireAuth>
  )
}

function AjustesView() {
  const { student } = useSession()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajustes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-500">
        <p>
          Sesión de {student?.fullName ?? 'alumno'}. El tema claro u oscuro se cambia desde la barra
          superior.
        </p>
      </CardContent>
    </Card>
  )
}
