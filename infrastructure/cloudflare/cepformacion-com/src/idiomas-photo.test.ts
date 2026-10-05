import { describe, expect, it } from 'vitest'
import { IDIOMAS_PHOTO, isIdiomasAssetPath, rewriteIdiomasPhoto } from './idiomas-photo'

describe('rewriteIdiomasPhoto', () => {
  it('replaces the idiomas SVG cover with the generated classroom photo', () => {
    const html = rewriteIdiomasPhoto(
      '<img src="/website/cep/categories/idiomas-competencias-linguisticas.svg" alt="Área Idiomas y Competencias Lingüísticas">',
    )
    expect(html).toContain(IDIOMAS_PHOTO)
    expect(html).not.toContain('idiomas-competencias-linguisticas.svg')
    expect(isIdiomasAssetPath(IDIOMAS_PHOTO)).toBe(true)
    expect(isIdiomasAssetPath('/website/cep/categories/idiomas-competencias-linguisticas.svg')).toBe(false)
  })

  it('is a no-op when the SVG is already gone', () => {
    const html = `<img src="${IDIOMAS_PHOTO}" alt="Idiomas">`
    expect(rewriteIdiomasPhoto(html)).toBe(html)
  })
})
