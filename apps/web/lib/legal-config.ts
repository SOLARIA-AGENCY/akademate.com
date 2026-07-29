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

export const legalCompany = {
  name: 'SOLARIA AGENCY OÜ',
  registryCode: pending(
    'Código registral estonio',
    'Pendiente de validación documental antes de publicación definitiva.'
  ),
  vatId: pending(
    'Identificador fiscal / IVA',
    'Pendiente de validación fiscal antes de publicación definitiva.'
  ),
  registeredOffice: pending(
    'Domicilio social en Estonia',
    'Pendiente de validación registral antes de publicación definitiva.'
  ),
  operatingAddress: pending(
    'Dirección operativa en Malmö',
    'Pendiente de validación interna antes de publicación definitiva.'
  ),
  privacyContact: pending(
    'Contacto de privacidad',
    'Canal específico pendiente de validación. Mientras tanto, las consultas pueden dirigirse al canal general hola@akademate.com.'
  ),
} as const

export const legalLastUpdated = '29 de julio de 2026'

export const legalDraftNotice =
  'Borrador informativo pendiente de revisión profesional. No constituye asesoramiento jurídico, certificación, sello oficial ni declaración de conformidad.'

export const legalLinks = [
  { title: 'Privacidad', href: '/legal/privacidad' },
  { title: 'Términos', href: '/legal/terminos' },
  { title: 'Cookies', href: '/legal/cookies' },
  { title: 'Subencargados y proveedores', href: '/legal/subencargados' },
  { title: 'Transparencia de IA', href: '/legal/ia' },
] as const

export const trackingPolicy = {
  currentStatus: 'no-non-essential-trackers',
  statement:
    'La web pública no carga actualmente analítica ni marketing de terceros. No se instala un gestor de consentimiento porque no hay finalidades no esenciales que autorizar.',
  activationGate:
    'Antes de incorporar GA4, GTM, Meta Pixel o tecnología equivalente deberá añadirse consentimiento granular y fail-closed, actualizar el inventario de cookies y demostrar que ningún tracker carga antes de autorizar.',
} as const

export function formatLegalField(field: LegalField) {
  return field.value ?? field.publicNote
}
