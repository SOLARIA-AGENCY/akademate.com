export const PUBLIC_LEGAL = {
  productName: 'Akademate',
  operatorName: 'SOLARIA AGENCY OÜ',
  registeredCountry: 'Estonia',
  registryCode: '[PENDIENTE DE VERIFICACIÓN: código registral de Estonia]',
  vatNumber: '[PENDIENTE DE VERIFICACIÓN: número de IVA intracomunitario]',
  correspondenceAddress: 'Malmö, Suecia [PENDIENTE DE VERIFICACIÓN: dirección postal completa]',
  contactEmail: 'hola@akademate.com',
  privacyEmail: 'hola@akademate.com',
  lastReviewed: '29 de julio de 2026',
} as const

export const PUBLIC_LEGAL_LINKS = [
  { name: 'Privacidad', href: '/privacidad' },
  { name: 'Términos', href: '/terminos' },
  { name: 'Cookies', href: '/cookies' },
  { name: 'Subencargados', href: '/subencargados' },
  { name: 'Transparencia e IA', href: '/transparencia-ia' },
] as const

export const PUBLIC_NAV_LINKS = [
  { name: 'Inicio', href: '/' },
  { name: 'Accesos', href: '/accesos' },
  { name: 'Cursos', href: '/cursos' },
  { name: 'Sobre Akademate', href: '/sobre-nosotros' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contacto', href: '/contacto' },
] as const

export const TRUST_NOTICES = [
  {
    label: 'Privacidad y RGPD',
    href: '/privacidad',
    detail: 'Información sobre tratamiento de datos y derechos.',
  },
  {
    label: 'Transparencia IA',
    href: '/transparencia-ia',
    detail: 'Información sobre funciones asistidas y sus límites.',
  },
] as const

export const NON_CERTIFICATION_NOTICE =
  'Estos distintivos enlazan a información pública. No son sellos, auditorías ni certificaciones de conformidad.'
