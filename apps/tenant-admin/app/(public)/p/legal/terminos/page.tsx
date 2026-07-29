import Link from 'next/link'
import { AlertTriangle, FileText, Scale, ShieldCheck } from 'lucide-react'
import { ComplianceBadges } from '@/app/components/legal/ComplianceBadges'
import {
  CEP_LEGAL_IDENTITY,
  LEGAL_CONTENT_UPDATED_AT,
  SOLARIA_LEGAL_IDENTITY,
} from '@/app/lib/legal/identities'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-slate-700">Actualizado el {LEGAL_CONTENT_UPDATED_AT}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Términos y condiciones de uso</h1>
        <p className="text-base leading-7 text-slate-600">
          Condiciones generales para el uso de los servicios digitales de {CEP_LEGAL_IDENTITY.legalName}.
          Las condiciones económicas y académicas específicas comunicadas para cada curso o matrícula
          prevalecen sobre esta información general.
        </p>
      </header>

      <ComplianceBadges className="justify-start lg:justify-start" />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <FileText aria-hidden="true" className="h-5 w-5 text-slate-700" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">1. Titular y objeto</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          El titular de la web y de la relación educativa es {CEP_LEGAL_IDENTITY.legalName}, NIF{' '}
          {CEP_LEGAL_IDENTITY.taxId}, con domicilio en {CEP_LEGAL_IDENTITY.addressLine1},{' '}
          {CEP_LEGAL_IDENTITY.addressLine2}, {CEP_LEGAL_IDENTITY.country}. El servicio tecnológico
          Akademate es operado por {SOLARIA_LEGAL_IDENTITY.legalName} conforme al contrato suscrito con CEP.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">2. Acceso y cuentas</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Las cuentas son personales y no deben compartirse.</li>
            <li>Las personas usuarias deben mantener sus credenciales seguras y comunicar accesos no autorizados.</li>
            <li>Las funciones visibles dependen del rol, sede, permisos y configuración asignados por CEP.</li>
            <li>La denominación de un rol no implica acceso general a finanzas, alumnado, campañas u otras áreas restringidas.</li>
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-950">3. Servicios disponibles</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            La plataforma puede incluir gestión de oferta formativa, convocatorias, matrículas,
            comunicaciones y otras funciones habilitadas para CEP. Integraciones de publicidad,
            analítica o IA solo estarán disponibles cuando hayan sido configuradas, autorizadas y
            sometidas a los controles correspondientes. Una referencia pública no garantiza su
            activación para todas las personas usuarias.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">4. Matrícula, precios y desistimiento</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          El precio, forma de pago, calendario, condiciones de cancelación, posibles becas y demás
          condiciones se informarán antes de formalizar cada matrícula. No se establece aquí un
          porcentaje genérico de reembolso. Los derechos de consumidores, incluido el desistimiento
          cuando resulte aplicable y sus excepciones legales, no quedan limitados por estos términos.
          En caso de cancelación del curso por CEP se aplicarán las condiciones comunicadas y la
          normativa imperativa correspondiente.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">5. Uso aceptable y suspensión</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No está permitido utilizar el servicio con fines ilícitos, introducir código malicioso,
          intentar eludir controles de acceso, realizar extracción masiva no autorizada, suplantar a
          otras personas o comprometer la disponibilidad del sistema. CEP podrá limitar o suspender el
          acceso cuando sea necesario para seguridad, cumplimiento contractual o investigación de un
          uso indebido, aplicando proporcionalidad y los derechos que correspondan.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ShieldCheck aria-hidden="true" className="h-5 w-5 text-slate-700" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">6. Propiedad intelectual y contenidos</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Los contenidos educativos y marcas pertenecen a CEP o a sus respectivos titulares. El
          software, componentes y documentación tecnológica de Akademate pertenecen a{' '}
          {SOLARIA_LEGAL_IDENTITY.legalName} o a sus licenciantes. El acceso no concede derechos de
          reproducción, distribución, ingeniería inversa o explotación fuera de lo permitido por la
          ley o por una autorización expresa.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-700" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">7. Disponibilidad y responsabilidad</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pueden existir mantenimientos o incidencias técnicas. CEP y el proveedor tecnológico
          gestionarán el servicio conforme a las condiciones contratadas, sin que esta página prometa
          disponibilidad ininterrumpida. Ninguna cláusula excluye responsabilidades o derechos que no
          puedan limitarse legalmente. Los resultados auxiliares de IA, cuando estén habilitados,
          requieren revisión humana y no sustituyen decisiones académicas, jurídicas o profesionales.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Scale aria-hidden="true" className="h-5 w-5 text-slate-700" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">8. Ley aplicable y resolución de controversias</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Se aplica la legislación española. Cuando la persona usuaria tenga la condición de
          consumidora, serán competentes los juzgados y tribunales que determine la normativa
          imperativa, sin imponer una renuncia anticipada a su fuero. Para otros supuestos se atenderá
          al contrato aplicable y a las reglas legales de competencia.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <h2 className="font-semibold text-amber-950">Datos pendientes y modificaciones</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          El NIF y los datos registrales pendientes deben validarse antes de publicar este texto como
          definitivo. Los cambios materiales se comunicarán por un medio adecuado cuando afecten a
          una relación vigente; el mero uso continuado no sustituirá un consentimiento cuando la ley
          exija otra base jurídica.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <a className="font-semibold text-slate-950 underline" href={`mailto:${CEP_LEGAL_IDENTITY.generalEmail}`}>{CEP_LEGAL_IDENTITY.generalEmail}</a>
        <Link className="font-semibold text-slate-950 underline" href="/p/legal/privacidad">Política de privacidad</Link>
        <Link className="font-semibold text-slate-950 underline" href="/p/legal/cookies">Política de cookies</Link>
      </div>
    </div>
  )
}
