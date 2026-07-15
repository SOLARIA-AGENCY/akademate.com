export const CEP_PUBLIC_HERO_ASSETS = {
  areas: '/website/cep/hero/areas-formacion-hero-v2.png',
  blog: '/website/cep/hero/blog-formacion-hero-v2.png',
  ciclos: '/website/cep/hero/ciclos-formativos-hero-v2.png',
  colabora: '/website/cep/hero/colabora-hero-v2.png',
  convocatorias: '/website/cep/hero/convocatorias-hero-v2.png',
  cursos: '/website/cep/hero/cepformacion-hero-01.png',
  orientacion: '/website/cep/hero/orientacion-hero-v2.png',
  sedes: '/website/cep/hero/sedes-tenerife-hero-v2.png',
} as const

const AREA_HERO_ASSETS: Record<string, string> = {
  'area-empresa-administracion-y-gestion': '/media/area-empresa-administracion-gestion.webp',
  'area-salud-bienestar-y-deporte': '/media/area-salud-bienestar-deporte.webp',
  'area-sanitaria-y-clinica': '/media/area-sanitaria-clinica.webp',
  'area-seguridad-vigilancia-y-proteccion': '/media/area-seguridad-vigilancia-proteccion.webp',
  'area-tecnologia-digital-y-diseno': '/media/area-tecnologia-digital-diseno.webp',
  'area-veterinaria-y-bienestar-animal': '/media/area-veterinaria-bienestar-animal.webp',
}

export function getAreaHeroAsset(slug: string): string {
  return AREA_HERO_ASSETS[slug] ?? CEP_PUBLIC_HERO_ASSETS.areas
}
