import Link from 'next/link'
import { AlertTriangle, Database, FileCheck2, LockKeyhole, Scale, UserRound } from 'lucide-react'
import { ComplianceBadges } from '@/app/components/legal/ComplianceBadges'
import {
  CEP_LEGAL_IDENTITY,
  LEGAL_CONTENT_UPDATED_AT,
  SOLARIA_LEGAL_IDENTITY,
} from '@/app/lib/legal/identities'

const dataCategories = [
  'Identificación, contacto y documentación necesaria para la matrícula.',
  'Datos académicos, asistencia, calificaciones, expedientes y certificaciones.',
  'Información administrativa, contractual y de pagos; los datos completos de tarjeta no se almacenan directamente en Akademate.',
  'Datos técnicos de acceso, seguridad, dispositivo y preferencias de consentimiento.',
  'Comunicaciones y solicitudes remitidas a CEP.',
]

const purposes = [
  'Gestionar información, admisión, matrícula, docencia, evaluación y certificación.',
  'Atender consultas y comunicaciones relacionadas con la formación contratada.',
  'Cumplir obligaciones educativas, fiscales, contables y administrativas aplicables.',
  'Proteger cuentas, prevenir fraude, mantener la seguridad y resolver incidencias.',
  'Enviar comunicaciones comerciales únicamente cuando exista una base jurídica válida y respetando la oposición o retirada del consentimiento.',
]

const rights = [
  'Acceso a los datos personales tratados.',
  'Rectificación de datos inexactos o incompletos.',
  'Supresión cuando concurran los requisitos legales.',
  'Oposición y limitación del tratamiento.',
  'Portabilidad cuando resulte aplicable.',
  'Retirada del consentimiento sin afectar a la licitud del tratamiento anterior.',
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-[#003399]">Actualizado el {LEGAL_CONTENT_UPDATED_AT}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Política de privacidad</h1>
        <p className="text-base leading-7 text-slate-600">
          Información sobre el tratamiento de datos personales en los servicios educativos de CEP y
          en la plataforma Akademate. Los campos entre corchetes permanecen pendientes de validación
          documental y no deben interpretarse como datos registrales definitivos.
        </p>
      </header>

      <ComplianceBadges className="justify-start lg:justify-start" />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <UserRound aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[#003399]" />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-950">1. Responsable del tratamiento</h2>
            <dl className="grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-[10rem_1fr]">
              <dt className="font-semibold text-slate-950">Entidad</dt><dd>{CEP_LEGAL_IDENTITY.legalName}</dd>
              <dt className="font-semibold text-slate-950">NIF</dt><dd>{CEP_LEGAL_IDENTITY.taxId}</dd>
              <dt className="font-semibold text-slate-950">Domicilio</dt><dd>{CEP_LEGAL_IDENTITY.addressLine1}, {CEP_LEGAL_IDENTITY.addressLine2}, {CEP_LEGAL_IDENTITY.country}</dd>
              <dt className="font-semibold text-slate-950">Contacto general</dt><dd><a className="underline" href={`mailto:${CEP_LEGAL_IDENTITY.generalEmail}`}>{CEP_LEGAL_IDENTITY.generalEmail}</a></dd>
              <dt className="font-semibold text-slate-950">Privacidad y derechos</dt><dd><a className="underline" href={`mailto:${CEP_LEGAL_IDENTITY.privacyEmail}`}>{CEP_LEGAL_IDENTITY.privacyEmail}</a></dd>
              <dt className="font-semibold text-slate-950">Teléfono</dt><dd>{CEP_LEGAL_IDENTITY.phone}</dd>
            </dl>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <Database aria-hidden="true" className="h-5 w-5 text-[#003399]" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">2. Datos tratados</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            {dataCategories.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <FileCheck2 aria-hidden="true" className="h-5 w-5 text-[#003399]" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">3. Finalidades</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            {purposes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Scale aria-hidden="true" className="h-5 w-5 text-[#003399]" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">4. Bases jurídicas</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Según la operación concreta, CEP tratará los datos para ejecutar la relación precontractual
          o contractual educativa, cumplir obligaciones legales, atender intereses legítimos
          documentados —como la seguridad del servicio— o sobre la base del consentimiento. Cuando el
          tratamiento dependa del consentimiento, podrá retirarse en cualquier momento.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">5. Conservación</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Los datos se conservarán durante la relación educativa y, después, durante los plazos
          exigidos por la normativa educativa, fiscal, contable y de prescripción de responsabilidades.
          Las comunicaciones comerciales se mantendrán hasta que se retire el consentimiento o se
          ejerza oposición. Los registros técnicos se conservarán solo durante el periodo necesario
          para seguridad, soporte y cumplimiento. Los plazos concretos deben quedar documentados en el
          registro interno de actividades de tratamiento de CEP.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">6. Destinatarios, encargados y transferencias</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Los datos podrán comunicarse a administraciones educativas, autoridades fiscales, entidades
          financieras y otros destinatarios cuando exista obligación o base jurídica. {SOLARIA_LEGAL_IDENTITY.legalName}{' '}
          opera Akademate como encargado tecnológico para los tratamientos contratados. Los proveedores,
          ubicaciones y garantías aplicables se publican en la página de{' '}
          <Link className="font-semibold text-slate-950 underline" href="/p/legal/subencargados">proveedores y subencargados</Link>.
          No se afirma la inexistencia de transferencias internacionales: deben evaluarse y, cuando
          proceda, contar con una garantía válida conforme al capítulo V del RGPD.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">7. Derechos de las personas</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
          {rights.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}
        </ul>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Puede ejercerlos escribiendo a <a className="font-semibold text-slate-950 underline" href={`mailto:${CEP_LEGAL_IDENTITY.privacyEmail}`}>{CEP_LEGAL_IDENTITY.privacyEmail}</a>.
          CEP podrá solicitar información adicional únicamente cuando existan dudas razonables sobre
          la identidad; no se exige con carácter general adjuntar una copia completa del documento de
          identidad. La solicitud se responderá, con carácter general, en un mes, prorrogable en los
          supuestos previstos por el RGPD. También puede reclamar ante la{' '}
          <a className="font-semibold text-slate-950 underline" href="https://www.aepd.es" rel="noreferrer" target="_blank">Agencia Española de Protección de Datos</a>.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <LockKeyhole aria-hidden="true" className="h-5 w-5 text-[#003399]" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">8. Seguridad y brechas</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          CEP y sus encargados aplicarán medidas técnicas y organizativas apropiadas al riesgo,
          incluyendo controles de acceso, protección de comunicaciones, continuidad y gestión de
          incidentes según la configuración contratada. La existencia y efectividad de cada medida
          debe respaldarse con evidencia operativa; esta página no constituye una auditoría de seguridad.
        </p>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-violet-950">9. Decisiones automatizadas e IA</h2>
        <p className="mt-3 text-sm leading-6 text-violet-900">
          No se han habilitado decisiones exclusivamente automatizadas con efectos jurídicos o
          similares sobre admisión, evaluación, acceso a formación, empleo o financiación. Consulte
          los usos, límites y supervisión en la página de{' '}
          <Link className="font-semibold underline" href="/p/legal/ia">transparencia y AI Act</Link>.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
          <div>
            <h2 className="font-semibold text-amber-950">Revisión y cambios</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Los cambios materiales se publicarán con una fecha actualizada y, cuando corresponda,
              se comunicarán por un canal adecuado. Este texto requiere validación jurídica y completar
              los datos registrales pendientes antes de considerarse definitivo.
            </p>
          </div>
        </div>
      </section>

      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">Volver</Link>
    </div>
  )
}
