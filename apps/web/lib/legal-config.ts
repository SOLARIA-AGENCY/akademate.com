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
  registryCode: LegalField
  vatId: LegalField
  registeredOffice: LegalField
  operatingAddress: LegalField
  privacyContact: LegalField
}

export type LegalLink = { title: string; href: string }

const legalIdentityEnv = {
  registryCode: 'AKADEMATE_LEGAL_REGISTRY_CODE',
  vatId: 'AKADEMATE_LEGAL_VAT_ID',
  registeredOffice: 'AKADEMATE_LEGAL_REGISTERED_OFFICE',
  operatingAddress: 'AKADEMATE_LEGAL_OPERATING_ADDRESS',
  privacyContact: 'AKADEMATE_LEGAL_PRIVACY_CONTACT',
} as const

function readLegalEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

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
    currentStatus: 'no-non-essential-trackers'
    statement: string
    activationGate: string
  }
}

const legalContent: Record<Locale, LegalContent> = {
  en: {
    company: {
      name: 'SOLARIA AGENCY OÜ',
      registryCode: pending(
        'Estonian registry code',
        'Pending documentary validation before final publication.'
      ),
      vatId: pending('Tax / VAT identifier', 'Pending tax validation before final publication.'),
      registeredOffice: pending(
        'Registered office in Estonia',
        'Pending registry validation before final publication.'
      ),
      operatingAddress: pending(
        'Operating address in Malmö',
        'Pending internal validation before final publication.'
      ),
      privacyContact: pending(
        'Privacy contact',
        'Dedicated channel pending validation. In the meantime, enquiries may be sent to info@akademate.com.'
      ),
    },
    lastUpdated: '29 July 2026',
    draftNotice:
      'Working legal information under professional review. Final registry, tax, address and privacy contact details will be published after documentary validation.',
    links: [
      { title: 'Legal notice', href: '/legal/aviso-legal' },
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
      currentStatus: 'no-non-essential-trackers',
      statement:
        'The public website does not currently load third-party analytics or marketing. No consent manager is installed because there are no non-essential purposes to authorise.',
      activationGate:
        'Before GA4, GTM, Meta Pixel or equivalent technology is introduced, granular fail-closed consent must be added, the cookie inventory updated and the absence of pre-consent tracking demonstrated.',
    },
  },
  es: {
    company: {
      name: 'SOLARIA AGENCY OÜ',
      registryCode: pending(
        'Código registral estonio',
        'Pendiente de validación documental antes de la publicación final.'
      ),
      vatId: pending(
        'Identificador fiscal / IVA',
        'Pendiente de validación fiscal antes de la publicación final.'
      ),
      registeredOffice: pending(
        'Domicilio social en Estonia',
        'Pendiente de validación registral antes de la publicación final.'
      ),
      operatingAddress: pending(
        'Dirección operativa en Malmö',
        'Pendiente de validación interna antes de la publicación final.'
      ),
      privacyContact: pending(
        'Contacto de privacidad',
        'Canal específico pendiente de validación. Mientras tanto, las consultas pueden enviarse a info@akademate.com.'
      ),
    },
    lastUpdated: '29 de julio de 2026',
    draftNotice:
      'Información legal de trabajo sometida a revisión profesional. Los datos finales de registro, fiscalidad, dirección y contacto de privacidad se publicarán tras la validación documental.',
    links: [
      { title: 'Aviso legal', href: '/legal/aviso-legal' },
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
      currentStatus: 'no-non-essential-trackers',
      statement:
        'El sitio web público no carga actualmente analítica ni marketing de terceros. No hay un gestor de consentimiento porque no existen finalidades no esenciales que autorizar.',
      activationGate:
        'Antes de introducir GA4, GTM, Meta Pixel o tecnología equivalente, debe añadirse un consentimiento granular que bloquee por defecto, actualizarse el inventario de cookies y demostrarse la ausencia de rastreo antes del consentimiento.',
    },
  },
}

export function getLegalContent(locale: Locale): LegalContent {
  const base = legalContent[locale]
  return {
    ...base,
    company: {
      ...base.company,
      registryCode: {
        ...base.company.registryCode,
        value: readLegalEnv(legalIdentityEnv.registryCode),
      },
      vatId: { ...base.company.vatId, value: readLegalEnv(legalIdentityEnv.vatId) },
      registeredOffice: {
        ...base.company.registeredOffice,
        value: readLegalEnv(legalIdentityEnv.registeredOffice),
      },
      operatingAddress: {
        ...base.company.operatingAddress,
        value: readLegalEnv(legalIdentityEnv.operatingAddress),
      },
      privacyContact: {
        ...base.company.privacyContact,
        value: readLegalEnv(legalIdentityEnv.privacyContact),
      },
    },
  }
}

export function isLegalIdentityComplete(
  company: LegalCompany = getLegalContent('en').company
): boolean {
  return [
    company.registryCode,
    company.vatId,
    company.registeredOffice,
    company.operatingAddress,
    company.privacyContact,
  ].every((field) => Boolean(field.value))
}

/**
 * Amber draft banner stays visible until identity fields are published via env,
 * unless counsel explicitly hides it after documentary validation.
 * Do not invent registry, VAT or address values to dismiss it.
 */
export function shouldShowLegalDraftBanner(locale: Locale = 'en'): boolean {
  if (process.env.AKADEMATE_LEGAL_HIDE_DRAFT_BANNER === 'true') return false
  return !isLegalIdentityComplete(getLegalContent(locale).company)
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
