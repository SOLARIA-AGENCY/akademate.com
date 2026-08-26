export const DIRECTORY_PAGE_SIZES = [10, 25, 50] as const

export type DirectoryPageSize = (typeof DIRECTORY_PAGE_SIZES)[number]

export type DirectoryPageSlice<T> = {
  page: number
  pageSize: number
  total: number
  pageCount: number
  start: number
  end: number
  items: T[]
}

export function paginateDirectory<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): DirectoryPageSlice<T> {
  const total = items.length
  const safeSize = pageSize > 0 ? pageSize : 10
  const pageCount = Math.max(1, Math.ceil(total / safeSize) || 1)
  const safePage = Math.min(Math.max(1, page), pageCount)
  const startIndex = total === 0 ? 0 : (safePage - 1) * safeSize
  const itemsSlice = items.slice(startIndex, startIndex + safeSize)
  const start = total === 0 ? 0 : startIndex + 1
  const end = total === 0 ? 0 : startIndex + itemsSlice.length

  return {
    page: safePage,
    pageSize: safeSize,
    total,
    pageCount,
    start,
    end,
    items: itemsSlice,
  }
}

export function directoryRangeLabel(
  entityPlural: string,
  start: number,
  end: number,
  total: number,
): string {
  if (total === 0) return `Mostrando 0 ${entityPlural}`
  return `Mostrando ${start} a ${end} de ${total} ${entityPlural}`
}

export function directoryPageNumbers(page: number, pageCount: number): Array<number | 'ellipsis'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1])
  const sorted = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b)
  const result: Array<number | 'ellipsis'> = []

  for (const value of sorted) {
    const previous = result[result.length - 1]
    if (typeof previous === 'number' && value - previous > 1) {
      result.push('ellipsis')
    }
    result.push(value)
  }

  return result
}
