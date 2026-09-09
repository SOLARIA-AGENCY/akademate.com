import type { Locale } from '@/lib/i18n/routing'

export type LegalField = {
  label: string
  value: string | null
  publicNote: string
}

const pending = (label: string, publicNote: string): LegalField => ({
  label,
  value: null,
  publicNote,
})

type LegalCompany = {
  name: string
  tradeName: string
  jurisdiction: string
  registryCode: LegalField
  vatId: LegalField
  registeredOffice: LegalField
  operatingAddress: LegalField
  privacyContact: LegalField
}

type LegalLink = { title: string; href: string }

type LegalContent = {
  company: LegalCompany
  lastUpdated: string
  draftNotice: string
  links: readonly LegalLink[]
  labels: {
    backToAkademate: string
    trustCentre: string
    lastUpdated: string
    companyInformation: string
    provider: string
    tradeName: string
    relatedDocuments: string
    legalDocuments: string
  }
  compliance: {
    title: string
    privacy: string
    responsibleAi: string
    information: string
    detail: string
    gdprAlt: string
    euAiActAlt: string
  }
  trackingPolicy: {
    currentStatus: 'consent-gated-analytics'
    statement: string
    activationGate: string
  }
}

const legalContent: Record<Locale, LegalContent> = {
  en: {
    company: {
      name: 'Brik64 LLC',
      tradeName: 'Brik64 Inc.',
      jurisdiction: 'Delaware, United States',
      registryCode: pending(
        'Delaware file number',
        'Pending documentary validation before final publication.'
      ),
      vatId: pending(
        'EIN / tax identifier',
        'Pending tax validation before final publication.'
      ),
      registeredOffice: pending(
        'Delaware registered office',
        'Pending registry validation before final publication. No street address is published until that validation is complete.'
      ),
      operatingAddress: pending(
        'Operating address',
        'Pending. No operating address is published until internal validation is complete.'
      ),
      privacyContact: pending(
        'Privacy contact',
        'Dedicated channel pending validation. In the meantime, enquiries may be sent to info@akademate.com.'
      ),
    },
    lastUpdated: '8 September 2026',
    draftNotice:
      'Working legal information under professional review. Akademate is a product of Brik64 LLC, a Delaware limited liability company doing business as Brik64 Inc. Final registry, tax, address, EU representative and privacy-contact details will be published after documentary validation.',
    links: [
      { title: 'Privacy', href: '/legal/privacidad' },
      { title: 'Terms', href: '/legal/terminos' },
      { title: 'Cookies', href: '/legal/cookies' },
      { title: 'Subprocessors and providers', href: '/legal/subencargados' },
      { title: 'AI transparency', href: '/legal/ia' },
    ],
    labels: {
      backToAkademate: '← Back to Akademate',
      trustCentre: 'Akademate trust centre',
      lastUpdated: 'Last updated:',
      companyInformation: 'Company information',
      provider: 'Provider:',
      tradeName: 'Doing business as:',
      relatedDocuments: 'Related documents',
      legalDocuments: 'Legal documents',
    },
    compliance: {
      title: 'Privacy and responsible AI, built into the conversation.',
      privacy: 'Privacy and GDPR',
      responsibleAi: 'Responsible AI',
      information: 'Privacy and responsible AI information',
      detail: 'Explore how Akademate approaches privacy, transparency and human oversight.',
      gdprAlt: 'GDPR',
      euAiActAlt: 'EU Artificial Intelligence Act',
    },
    trackingPolicy: {
      currentStatus: 'consent-gated-analytics',
      statement:
        'The public website uses strictly necessary cookies for locale and theme. Google Tag Manager and Google Analytics 4 load only after you accept analytics. Advertising cookies and Meta Pixel are not used.',
      activationGate:
        'Analytics is fail-closed. The GTM container does not load until granular analytics consent is stored locally. Withdrawing consent stops new analytics loads. No advertising or remarketing tags are authorised.',
    },
  },
  es: {
    company: {
      name: 'Brik64 LLC',
      tradeName: 'Brik64 Inc.',
      jurisdiction: 'Delaware, Estados Unidos',
      registryCode: pending(
        'Número de archivo de Delaware',
        'Pendiente de validación documental antes de la publicación final.'
      ),
      vatId: pending(
        'EIN / identificador fiscal',
        'Pendiente de validación fiscal antes de la publicación final.'
      ),
      registeredOffice: pending(
        'Domicilio registrado en Delaware',
        'Pendiente de validación registral antes de la publicación final. No se publica dirección postal hasta completar esa validación.'
      ),
      operatingAddress: pending(
        'Dirección operativa',
        'Pendiente. No se publica dirección operativa hasta completar la validación interna.'
      ),
      privacyContact: pending(
        'Contacto de privacidad',
        'Canal específico pendiente de validación. Mientras tanto, las consultas pueden enviarse a info@akademate.com.'
      ),
    },
    lastUpdated: '8 de septiembre de 2026',
    draftNotice:
      'Información legal de trabajo sometida a revisión profesional. Akademate es un producto de Brik64 LLC, una limited liability company de Delaware que opera como Brik64 Inc. Los datos finales de registro, fiscalidad, dirección, representante en la UE y contacto de privacidad se publicarán tras la validación documental.',
    links: [
      { title: 'Privacidad', href: '/legal/privacidad' },
      { title: 'Términos', href: '/legal/terminos' },
      { title: 'Cookies', href: '/legal/cookies' },
      { title: 'Subencargados y proveedores', href: '/legal/subencargados' },
      { title: 'Transparencia de IA', href: '/legal/ia' },
    ],
    labels: {
      backToAkademate: '← Volver a Akademate',
      trustCentre: 'Centro de confianza de Akademate',
      lastUpdated: 'Última actualización:',
      companyInformation: 'Información de la empresa',
      provider: 'Proveedor:',
      tradeName: 'Nombre comercial:',
      relatedDocuments: 'Documentos relacionados',
      legalDocuments: 'Documentos legales',
    },
    compliance: {
      title: 'Privacidad e IA responsable, presentes en la conversación.',
      privacy: 'Privacidad y RGPD',
      responsibleAi: 'IA responsable',
      information: 'Información sobre privacidad e IA responsable',
      detail:
        'Descubre cómo aborda Akademate la privacidad, la transparencia y la supervisión humana.',
      gdprAlt: 'RGPD',
      euAiActAlt: 'Reglamento de Inteligencia Artificial de la Unión Europea',
    },
    trackingPolicy: {
      currentStatus: 'consent-gated-analytics',
      statement:
        'El sitio web público usa cookies estrictamente necesarias para idioma y tema. Google Tag Manager y Google Analytics 4 se cargan solo si aceptas la analítica. No se usan cookies publicitarias ni Meta Pixel.',
      activationGate:
        'La analítica está bloqueada por defecto. El contenedor de GTM no se carga hasta que el consentimiento granular de analítica se guarda en local. Retirar el consentimiento detiene nuevas cargas de analítica. No hay etiquetas de publicidad ni remarketing autorizadas.',
    },
  },
}

export function getLegalContent(locale: Locale): LegalContent {
  return legalContent[locale]
}

// English aliases preserve the existing public import contract for non-localized consumers.
export const legalCompany = legalContent.en.company
export const legalLastUpdated = legalContent.en.lastUpdated
export const legalDraftNotice = legalContent.en.draftNotice
export const legalLinks = legalContent.en.links
export const trackingPolicy = legalContent.en.trackingPolicy

export function getLegalLinks(locale: Locale): readonly LegalLink[] {
  return legalContent[locale].links
}

export function formatLegalField(field: LegalField) {
  return field.value ?? field.publicNote
}

export function formatProviderLine(locale: Locale) {
  const company = legalContent[locale].company
  return locale === 'es'
    ? `Akademate es un producto de ${company.name}, que opera como ${company.tradeName}.`
    : `Akademate is a product of ${company.name}, doing business as ${company.tradeName}.`
}
