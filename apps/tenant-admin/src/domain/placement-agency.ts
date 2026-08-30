export type PlacementAgencyContent = {
  title: string
  slug: string
  email: string
  hoursLabel: string
  authorizationCode: string
  campusLabel: string
  legalBlocks: string[]
}

export const DEFAULT_PLACEMENT_LEGAL_BLOCKS = [
  'Accesibilidad universal y adecuación entre la oferta y el perfil profesional.',
  'Igualdad de acceso al empleo, sin discriminación.',
  'Intermediación y orientación gratuitas para las personas trabajadoras.',
  'Atención a cualquier persona, con independencia de su residencia.',
]

export const SYNTHETIC_PLACEMENT_AGENCIES: PlacementAgencyContent[] = [
  {
    title: 'Agencia de colocación · Norte',
    slug: 'agencia-norte',
    email: 'verify.norte@cepformacion.local',
    hoursLabel: '11:00 – 16:00',
    authorizationCode: '0500000212',
    campusLabel: 'Sede Norte',
    legalBlocks: DEFAULT_PLACEMENT_LEGAL_BLOCKS,
  },
  {
    title: 'Agencia de colocación · Santa Cruz',
    slug: 'agencia-centro',
    email: 'verify.centro@cepformacion.local',
    hoursLabel: '11:00 – 16:00',
    authorizationCode: '0500000212',
    campusLabel: 'Sede Santa Cruz',
    legalBlocks: DEFAULT_PLACEMENT_LEGAL_BLOCKS,
  },
  {
    title: 'Agencia de colocación · Sur',
    slug: 'agencia-sur',
    email: 'verify.sur@cepformacion.local',
    hoursLabel: '11:00 – 16:00',
    authorizationCode: '0500000212',
    campusLabel: 'Sede Sur',
    legalBlocks: DEFAULT_PLACEMENT_LEGAL_BLOCKS,
  },
]

export function findSyntheticAgency(slug: string): PlacementAgencyContent | null {
  return SYNTHETIC_PLACEMENT_AGENCIES.find((agency) => agency.slug === slug) ?? null
}

export function isPublicPlacementEmail(email: string): boolean {
  return Boolean(email) && !email.endsWith('.local')
}
