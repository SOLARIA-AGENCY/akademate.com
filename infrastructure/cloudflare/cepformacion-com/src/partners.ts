export const CEP_PARTNERS = [
  { name: 'Clínica Veterinaria Añaza', file: 'clinica-veterinaria-anaza.jpg' },
  { name: 'Clínica Veterinaria Duggi', file: 'clinica-veterinaria-duggi.jpg' },
  { name: 'Centro Veterinario Alper', file: 'centro-veterinario-alper.jpg' },
  { name: 'Aboras Obediencia', file: 'aboras-obediencia.jpg' },
  { name: 'CIDME', file: 'cidme.jpg' },
  { name: 'Mi Óptica Central', file: 'mi-optica-central.jpg' },
  { name: 'ADDANCA', file: 'addanca.jpg' },
  { name: 'ADEPAC', file: 'adepac.jpg' },
  { name: 'Animal Club', file: 'animal-club.jpg' },
  { name: 'APANOT', file: 'apanot.jpg' },
  { name: 'La Esperanza del Sur', file: 'la-esperanza-del-sur.jpg' },
  { name: 'SOS Felina', file: 'sos-felina.jpg' },
  { name: 'Valle Colino', file: 'valle-colino.jpg' },
  { name: 'Gobierno de Canarias', file: 'gobierno-canarias.png' },
  { name: 'Universidad Miguel de Cervantes', file: 'universidad-miguel-de-cervantes.png' },
  { name: 'ASHOTEL', file: 'ashotel.jpg' },
  { name: 'DKV', file: 'dkv.jpg' },
  { name: 'Farmacia Charco del Pino', file: 'farmacia-charco-del-pino.jpg' },
  { name: 'Farmacia Fañabé Playa', file: 'farmacia-fanabe-playa.jpg' },
  { name: 'Farmacia Golf del Sur', file: 'farmacia-golf-del-sur.jpg' },
  { name: 'Farmacia Igara', file: 'farmacia-igara.jpg' },
  { name: 'Farmacia La Comunitaria', file: 'farmacia-la-comunitaria.jpg' },
  { name: 'Farmacia La Fuente', file: 'farmacia-la-fuente.jpg' },
  { name: 'Farmacia Las Chafiras', file: 'farmacia-las-chafiras.jpg' },
  { name: 'Farmacia Los Abrigos', file: 'farmacia-los-abrigos.jpg' },
  { name: 'Farmacia Magma Adeje', file: 'farmacia-magma-adeje.jpg' },
  { name: 'Farmacia Plasencia El Médano', file: 'farmacia-plasencia-el-medano.jpg' },
  { name: 'Farmacia Valle San Lorenzo', file: 'farmacia-valle-san-lorenzo.jpg' },
  { name: 'Farmacia Santiago del Teide', file: 'farmacia-santiago-del-teide.jpg' },
  { name: 'Farmacia Las Torres', file: 'farmacia-las-torres.jpg' },
  { name: 'Farmacia Torviscas', file: 'farmacia-torviscas.jpg' },
  { name: 'Farmacia y Nutrición', file: 'farmacia-y-nutricion.jpg' },
  { name: 'Óptica Granadilla', file: 'optica-granadilla.jpg' },
  { name: 'Hospital Quirón Salud', file: 'hospital-quiron-salud.jpg' },
  { name: 'Óptica Grand Vision', file: 'optica-grand-vision.jpg' },
  { name: 'Clínica Veterinaria Okapi', file: 'clinica-veterinaria-okapi.jpg' },
  { name: 'Tienda de Animales Dingo', file: 'tienda-de-animales-dingo.jpg' },
  { name: 'Hospital Veterinario El Madroñal', file: 'hospital-veterinario-el-madronal.jpg' },
  { name: 'Hospital Veterinario Patas y Colas', file: 'hospital-veterinario-patas-y-colas.jpg' },
  { name: 'Clínica Veterinaria Hospivet Sur', file: 'clinica-veterinaria-hospivet-sur.jpg' },
  { name: 'Clínica Veterinaria Los Llanos', file: 'clinica-veterinaria-los-llanos.jpg' },
  { name: 'Alexandre Hotels', file: 'alexandre-hotels.jpg' },
  { name: 'Baobab Suites', file: 'baobab-suites.jpg' },
  { name: 'Be Live Hotels', file: 'be-live-hotels.jpg' },
  { name: 'H10 Hotels', file: 'h10-hotels.jpg' },
  { name: 'Iberostar Hotels', file: 'iberostar-hotels.jpg' },
] as const

export const PARTNER_ASSET_PREFIX = '/website/cep/partners/'
export const CERTIFICATION_ASSET_PREFIX = '/website/cep/certifications/'

export const CEP_CERTIFICATIONS = [
  { name: 'Certificaciones de calidad', file: 'cursos-certificaciones.jpg' },
  { name: 'Fondo Social Europeo', file: 'fondo-social-europeo.jpeg' },
  { name: 'Servicio Canario de Empleo', file: 'servicio-canario-empleo.jpg' },
  { name: 'OCA Global ISO/IEC 27001', file: 'oca-iso-27001.png' },
  { name: 'ISO 9001', file: 'iso-9001.jpg' },
  { name: 'ISO 14001', file: 'iso-14001.jpg' },
  { name: 'EFQM 500', file: 'efqm-500.jpeg' },
  { name: 'EMAS', file: 'emas.png' },
] as const

export type CepPartner = (typeof CEP_PARTNERS)[number]

export function isPartnerAssetPath(pathname: string): boolean {
  if (!pathname.startsWith(PARTNER_ASSET_PREFIX) || pathname.includes('..')) return false
  const file = pathname.slice(PARTNER_ASSET_PREFIX.length)
  return CEP_PARTNERS.some((partner) => partner.file === file)
}

export function isCertificationAssetPath(pathname: string): boolean {
  if (!pathname.startsWith(CERTIFICATION_ASSET_PREFIX) || pathname.includes('..')) return false
  const file = pathname.slice(CERTIFICATION_ASSET_PREFIX.length)
  return CEP_CERTIFICATIONS.some((item) => item.file === file)
}
