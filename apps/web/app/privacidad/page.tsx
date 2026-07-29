import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { PUBLIC_LEGAL } from '@/lib/public-legal'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Información sobre privacidad y tratamiento de datos personales en Akademate.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Explica qué datos trata la web pública de Akademate, para qué se usan y cómo ejercer tus derechos."
    >
      <h2>1. Responsable de esta web</h2>
      <p>
        <strong>{PUBLIC_LEGAL.operatorName}</strong>, sociedad con sede registral en{' '}
        {PUBLIC_LEGAL.registeredCountry}, opera esta web y la marca Akademate.
      </p>
      <ul>
        <li>Registro: {PUBLIC_LEGAL.registryCode}</li>
        <li>IVA: {PUBLIC_LEGAL.vatNumber}</li>
        <li>Correspondencia: {PUBLIC_LEGAL.correspondenceAddress}</li>
        <li>
          Contacto de privacidad:{' '}
          <a href={`mailto:${PUBLIC_LEGAL.privacyEmail}`}>{PUBLIC_LEGAL.privacyEmail}</a> (indica
          “Privacidad Akademate” en el asunto).
        </li>
      </ul>
      <p className="legal-warning">
        Los campos marcados como pendientes deben completarse y validarse antes de publicación en
        producción.
      </p>
      <h2>2. Datos y finalidades</h2>
      <p>
        Tratamos los datos que facilitas en formularios de contacto, solicitud de acceso o lista de
        espera para responder a la petición, gestionar la relación precontractual y mantener
        evidencia de la solicitud. Los registros técnicos estrictamente necesarios se usan para
        seguridad y funcionamiento.
      </p>
      <h2>3. Base jurídica y conservación</h2>
      <p>
        La base será la aplicación de medidas precontractuales solicitadas por ti, el consentimiento
        cuando proceda y el interés legítimo en proteger el servicio. Conservaremos cada categoría
        solo durante el plazo necesario y los periodos exigibles para atender responsabilidades.
      </p>
      <h2>4. Destinatarios y transferencias</h2>
      <p>
        No vendemos datos personales. Los proveedores necesarios se documentan en la{' '}
        <a href="/subencargados">página de subencargados</a>. Cualquier transferencia internacional
        deberá apoyarse en el mecanismo jurídico aplicable y quedar reflejada allí.
      </p>
      <h2>5. Tus derechos</h2>
      <p>
        Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad
        escribiendo al contacto indicado. También puedes reclamar ante la autoridad de protección de
        datos competente.
      </p>
      <h2>6. Akademate para centros</h2>
      <p>
        Cuando una entidad educativa contrata Akademate para tratar datos académicos bajo sus
        instrucciones, esa entidad determina sus finalidades y debe informar a su comunidad. Las
        responsabilidades concretas se fijan en el contrato aplicable; esta página pública no lo
        sustituye.
      </p>
    </LegalPage>
  )
}
