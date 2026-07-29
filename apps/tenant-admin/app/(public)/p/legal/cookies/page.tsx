import Link from 'next/link'
import { BarChart3, Cookie, Megaphone, Settings2 } from 'lucide-react'
import { ComplianceBadges } from '@/app/components/legal/ComplianceBadges'
import { CookiePreferencesButton } from '@/app/(public)/_components/PublicConsentManager'
import { CEP_LEGAL_IDENTITY, LEGAL_CONTENT_UPDATED_AT } from '@/app/lib/legal/identities'

const categories = [
  {
    icon: Settings2,
    title: 'Necesarias',
    consent: 'No requieren consentimiento cuando son imprescindibles para prestar el servicio solicitado.',
    items: [
      'Preferencia de consentimiento `cep_cookie_consent_v1` almacenada localmente en el navegador.',
      'Cookies de sesión y seguridad del área autenticada, únicamente cuando se accede a dicha área.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analítica',
    consent: 'Desactivada hasta que la persona la autorice expresamente.',
    items: [
      'Google Analytics 4 (`_ga`, `_ga_*`) solo cuando existe un identificador configurado y consentimiento analítico.',
      'Google Tag Manager puede cargar etiquetas autorizadas, pero no se activa antes del consentimiento de marketing.',
    ],
  },
  {
    icon: Megaphone,
    title: 'Marketing',
    consent: 'Desactivado hasta que la persona lo autorice expresamente.',
    items: [
      'Meta Pixel puede utilizar identificadores como `_fbp` o `_fbc` cuando la medición publicitaria está configurada y consentida.',
      'La duración efectiva depende de la configuración y de la información vigente del proveedor.',
    ],
  },
]

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold text-amber-700">Actualizado el {LEGAL_CONTENT_UPDATED_AT}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Política de cookies y almacenamiento local</h1>
        <p className="text-base leading-7 text-slate-600">
          Explica qué tecnologías puede utilizar CEP Formación y cómo cambiar la selección. La lista
          distingue proveedores configurables de tecnologías realmente activadas: ninguna etiqueta
          analítica o publicitaria debe cargarse antes del consentimiento correspondiente.
        </p>
      </header>

      <ComplianceBadges className="justify-start lg:justify-start" />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Cookie aria-hidden="true" className="h-5 w-5 text-amber-700" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">1. Qué son estas tecnologías</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Las cookies son pequeños archivos que un sitio puede guardar en el navegador. El
          almacenamiento local cumple una función similar para recordar preferencias. Algunas
          tecnologías son necesarias para seguridad o funcionamiento; las de analítica y marketing
          requieren consentimiento previo y granular.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {categories.map(({ icon: Icon, title, consent, items }) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <Icon aria-hidden="true" className="h-5 w-5 text-slate-700" />
            <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{consent}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">2. Configurar o retirar el consentimiento</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Puede aceptar, rechazar o configurar analítica y marketing por separado desde el panel que
          aparece en la primera visita. La opción «Preferencias de cookies» del pie de página permite
          reabrirlo. Retirar el consentimiento impide nuevas cargas no esenciales, aunque no elimina
          automáticamente datos que un proveedor hubiera tratado legítimamente antes de la retirada.
          También puede borrar cookies y almacenamiento desde la configuración del navegador.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">3. Base jurídica y proveedores</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Las tecnologías necesarias se utilizan para prestar el servicio solicitado o protegerlo.
          Las de analítica y marketing se basan en el consentimiento conforme al artículo 22.2 de la
          LSSI y al RGPD. Los proveedores opcionales y posibles transferencias deben revisarse en la
          página de <Link className="font-semibold text-slate-950 underline" href="/p/legal/subencargados">proveedores y subencargados</Link>.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <h2 className="font-semibold text-amber-950">Inventario verificable</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Esta política no afirma que todos los proveedores configurables estén activos. El inventario
          definitivo debe contrastarse periódicamente con las etiquetas y cookies observadas en
          producción. Para consultas escriba a{' '}
          <a className="font-semibold underline" href={`mailto:${CEP_LEGAL_IDENTITY.privacyEmail}`}>{CEP_LEGAL_IDENTITY.privacyEmail}</a>.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="font-semibold text-slate-950 underline" href="/p/legal/privacidad">Privacidad</Link>
        <span className="font-semibold text-slate-950 underline"><CookiePreferencesButton /></span>
      </div>
    </div>
  )
}
