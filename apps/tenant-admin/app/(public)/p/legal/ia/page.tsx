import Link from 'next/link'
import { AlertTriangle, Bot, Eye, GraduationCap, ShieldCheck, Tags } from 'lucide-react'
import { ComplianceBadges } from '@/app/components/legal/ComplianceBadges'
import {
  CEP_LEGAL_IDENTITY,
  LEGAL_CONTENT_UPDATED_AT,
  SOLARIA_LEGAL_IDENTITY,
} from '@/app/lib/legal/identities'

const sections = [
  {
    icon: Bot,
    title: 'Cómo utilizamos inteligencia artificial',
    body: 'La plataforma puede incorporar herramientas auxiliares para generar o revisar contenidos. No se ha habilitado IA para decidir automáticamente admisiones, calificaciones, acceso a formación, contratación o financiación.',
  },
  {
    icon: Eye,
    title: 'Supervisión humana',
    body: 'Los contenidos o sugerencias generados con IA deben ser revisados por personal autorizado antes de su publicación o uso operativo. Las decisiones académicas corresponden a CEP.',
  },
  {
    icon: ShieldCheck,
    title: 'Reparto de responsabilidades',
    body: `${CEP_LEGAL_IDENTITY.legalName} determina las finalidades académicas. ${SOLARIA_LEGAL_IDENTITY.legalName} opera Akademate y documenta las funciones de IA que integre en el servicio según el rol legal aplicable.`,
  },
  {
    icon: Tags,
    title: 'Información y etiquetado',
    body: 'Cuando una persona interactúe directamente con un sistema de IA o reciba contenido que deba identificarse legalmente como generado o manipulado, se aplicará el aviso correspondiente según el caso. El identificador AI ACT de esta web informa sobre esta política; no etiqueta contenido como generado por IA.',
  },
  {
    icon: GraduationCap,
    title: 'Alfabetización en IA',
    body: 'Las funciones habilitadas deben utilizarse por personal con instrucciones adecuadas sobre finalidad, límites, protección de datos, supervisión y escalado de incidencias. La formación y evidencia concreta corresponde al plan interno de CEP y del proveedor tecnológico.',
  },
]

export default function AiTransparencyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-violet-700">Actualizado el {LEGAL_CONTENT_UPDATED_AT}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Transparencia y uso responsable de IA
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Esta página explica los usos actuales y los límites aplicados. No constituye una
          certificación ni implica que todas las funcionalidades de la plataforma sean sistemas de IA.
        </p>
      </header>

      <ComplianceBadges className="justify-start lg:justify-start" />

      <div className="grid gap-4">
        {sections.map(({ icon: Icon, title, body }) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <div>
            <h2 className="font-semibold text-amber-950">Funciones de alto riesgo desactivadas</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Cualquier futura función de IA que evalúe alumnado, determine acceso a formación,
              supervise exámenes o afecte a empleo o financiación requerirá clasificación previa,
              evaluación de impacto, supervisión humana y autorización formal antes de activarse.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold text-slate-950">Inventario y proveedores</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cada función de IA debe documentar proveedor, finalidad, datos utilizados, personas
          afectadas, supervisión, conservación y evaluación de riesgo antes de activarse. Consulte
          los proveedores declarados en la página de{' '}
          <Link className="font-semibold text-slate-950 underline" href="/p/legal/subencargados">
            proveedores y subencargados
          </Link>
          . Los campos pendientes impiden considerar cerrado el inventario contractual.
        </p>
      </section>

      <p className="text-sm text-slate-600">
        Para consultas sobre privacidad escriba a{' '}
        <a className="font-semibold text-slate-950 underline" href={`mailto:${CEP_LEGAL_IDENTITY.privacyEmail}`}>
          {CEP_LEGAL_IDENTITY.privacyEmail}
        </a>
        . Consulte también nuestra{' '}
        <Link className="font-semibold text-slate-950 underline" href="/p/legal/privacidad">
          política de privacidad
        </Link>
        .
      </p>
    </div>
  )
}
