import Link from 'next/link'
import { Cookie, FileText, Network, ShieldCheck, Sparkles } from 'lucide-react'
import { ComplianceBadges } from '@/app/components/legal/ComplianceBadges'
import { LEGAL_CONTENT_UPDATED_AT } from '@/app/lib/legal/identities'

const documents = [
  { href: '/p/legal/privacidad', title: 'Privacidad', description: 'Responsable, datos, bases jurídicas, conservación y derechos.', icon: ShieldCheck },
  { href: '/p/legal/terminos', title: 'Términos de uso', description: 'Condiciones generales de la web, cuentas y servicios digitales.', icon: FileText },
  { href: '/p/legal/cookies', title: 'Cookies', description: 'Tecnologías necesarias, analítica, marketing y preferencias.', icon: Cookie },
  { href: '/p/legal/ia', title: 'Transparencia y AI Act', description: 'Usos actuales, límites, supervisión y funciones desactivadas.', icon: Sparkles },
  { href: '/p/legal/subencargados', title: 'Proveedores', description: 'Encargados, subencargados, ubicaciones y garantías pendientes.', icon: Network },
]

export default function LegalCenterPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-slate-700">Actualizado el {LEGAL_CONTENT_UPDATED_AT}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Centro legal y regulatorio</h1>
        <p className="text-base leading-7 text-slate-600">
          Acceso centralizado a la información jurídica y de transparencia de CEP Formación. Las
          marcas RGPD y AI ACT identifican estas secciones; no son sellos oficiales ni certificaciones.
        </p>
      </header>
      <ComplianceBadges className="justify-start lg:justify-start" />
      <div className="grid gap-4 md:grid-cols-2">
        {documents.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-6">
            <Icon aria-hidden="true" className="h-5 w-5 text-slate-700" />
            <h2 className="mt-4 font-semibold text-slate-950 group-hover:underline">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </div>
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        Los textos contienen datos registrales y contractuales pendientes de validación. Deben ser
        revisados por asesoría jurídica y por los responsables internos antes de su publicación definitiva.
      </p>
    </div>
  )
}
