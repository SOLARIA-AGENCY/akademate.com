export const STOCK_FALLBACK_IMAGES = {
  book: '/stock/cursos.jpg',
  page: '/stock/convocatoria.jpg',
  cycle: '/stock/ciclos.jpg',
  campus: '/stock/sedes.jpg',
  person: '/stock/profesor.jpg',
  student: '/stock/alumno.jpg',
  admin: '/stock/administrativa.jpg',
} as const

export type StockFallbackKind = keyof typeof STOCK_FALLBACK_IMAGES

export function stockFallbackSrc(kind: StockFallbackKind): string {
  return STOCK_FALLBACK_IMAGES[kind]
}
