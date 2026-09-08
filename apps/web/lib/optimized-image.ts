const RASTER = /\.(png|jpe?g)$/i

export function isMarketingRaster(src: string): boolean {
  return src.startsWith('/images/marketing/') && RASTER.test(src)
}

export function optimizedSrc(src: string, format: 'webp' | 'avif' = 'webp'): string {
  if (!isMarketingRaster(src)) return src
  return src.replace(RASTER, `.${format}`)
}

export function originalSrc(src: string): string {
  return src
}
