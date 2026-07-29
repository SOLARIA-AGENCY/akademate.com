import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { OPTIONAL_TRACKERS } from '@/lib/tracking'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Información sobre cookies y tecnologías similares en Akademate.',
}

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      intro="Estado actual de las cookies y tecnologías similares utilizadas por esta web pública."
    >
      <h2>1. Estado actual</h2>
      <p>
        La web pública no declara trackers opcionales de analítica, publicidad o personalización.
        Por eso no se muestra un banner de consentimiento que no tendría ninguna elección real.
      </p>
      <h2>2. Cookies necesarias</h2>
      <p>
        Pueden utilizarse cookies estrictamente necesarias para seguridad, autenticación solicitada,
        preferencias técnicas o continuidad de una sesión. No se usan para publicidad y no pueden
        desactivarse desde un panel de consentimiento sin impedir la función solicitada.
      </p>
      <h2>3. Regla de activación</h2>
      <p>
        Cualquier tracker opcional futuro deberá declararse, documentarse por finalidad y permanecer
        bloqueado hasta una elección afirmativa para su categoría. Rechazar o no elegir mantendrá
        esos scripts sin cargar.
      </p>
      <h2>4. Registro técnico</h2>
      <p>
        Trackers opcionales declarados actualmente: <strong>{OPTIONAL_TRACKERS.length}</strong>.
      </p>
    </LegalPage>
  )
}
