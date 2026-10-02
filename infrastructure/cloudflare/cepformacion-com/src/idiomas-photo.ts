export const IDIOMAS_PHOTO = '/website/cep/categories/idiomas-competencias-linguisticas.jpg'
const IDIOMAS_SVG = '/website/cep/categories/idiomas-competencias-linguisticas.svg'

export function isIdiomasAssetPath(pathname: string): boolean {
  return pathname === IDIOMAS_PHOTO
}

/** Swap the idiomas area SVG placeholder for the generated classroom photo. */
export function rewriteIdiomasPhoto(html: string): string {
  if (!html.includes('idiomas-competencias-linguisticas.svg')) return html
  return html.split(IDIOMAS_SVG).join(IDIOMAS_PHOTO)
}
