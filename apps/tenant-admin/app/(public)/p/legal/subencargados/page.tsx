import Link from 'next/link'
import { Database, Mail, Server, Share2 } from 'lucide-react'
import { ComplianceBadges } from '@/app/components/legal/ComplianceBadges'
import {
  CEP_LEGAL_IDENTITY,
  LEGAL_CONTENT_UPDATED_AT,
  SOLARIA_LEGAL_IDENTITY,
} from '@/app/lib/legal/identities'

const providers = [
  {
    icon: Server,
    category: 'Alojamiento e infraestructura',
    provider: 'Hetzner Online GmbH',
    purpose: 'Cómputo, red y alojamiento de la instancia contratada.',
    location: 'Unión Europea',
  },
  {
    icon: Mail,
    category: 'Correo transaccional',
    provider: '[PROVEEDOR PENDIENTE DE VERIFICACIÓN CONTRACTUAL]',
    purpose: 'Mensajes operativos y acceso a la plataforma.',
    location: '[UBICACIÓN PENDIENTE]',
  },
  {
    icon: Database,
    category: 'Copias de seguridad y almacenamiento',
    provider: '[PROVEEDOR PENDIENTE DE VERIFICACIÓN CONTRACTUAL]',
    purpose: 'Continuidad, recuperación y activos de la plataforma.',
    location: '[UBICACIÓN PENDIENTE]',
  },
  {
    icon: Share2,
    category: 'Publicidad e IA opcional',
    provider: 'Meta Platforms / OpenAI, únicamente cuando la función correspondiente esté habilitada',
    purpose: 'Medición consentida de campañas o generación auxiliar revisada por personas.',
    location: 'Sujeta a revisión de transferencias y garantías aplicables.',
  },
]

export default function SubprocessorsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-emerald-700">Actualizado el {LEGAL_CONTENT_UPDATED_AT}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Proveedores y subencargados
        </h1>
        <p className="text-base leading-7 text-slate-600">
          {SOLARIA_LEGAL_IDENTITY.legalName} utiliza proveedores limitados para operar Akademate por
          cuenta de {CEP_LEGAL_IDENTITY.legalName}. Los campos pendientes deben verificarse antes de
          considerar definitivo este listado.
        </p>
      </header>

      <ComplianceBadges className="justify-start lg:justify-start" />

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map(({ icon: Icon, category, provider, purpose, location }) => (
          <section key={category} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon aria-hidden="true" className="h-5 w-5 text-slate-700" />
            <h2 className="mt-4 font-semibold text-slate-950">{category}</h2>
            <p className="mt-2 text-sm font-medium text-slate-800">{provider}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{purpose}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Ubicación/garantías: {location}</p>
          </section>
        ))}
      </div>

      <p className="text-sm leading-6 text-slate-600">
        CEP puede solicitar información adicional o formular objeciones conforme al contrato de
        encargo. Contacto:{' '}
        <a className="font-semibold text-slate-950 underline" href={`mailto:${CEP_LEGAL_IDENTITY.privacyEmail}`}>
          {CEP_LEGAL_IDENTITY.privacyEmail}
        </a>
        . Consulte la{' '}
        <Link href="/p/legal/privacidad" className="font-semibold text-slate-950 underline">
          política de privacidad
        </Link>
        .
      </p>
    </div>
  )
}
