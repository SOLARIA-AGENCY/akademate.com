import type { PlantillaCurso } from '@/types'

export type StudyTypeMeta = {
  label: string
  code: string
  color: string
}

type CoursesApiResponse<TCourse = PlantillaCurso> = {
  success: boolean
  data?: TCourse[]
  total?: number
  error?: string
  studyTypeMeta?: Record<string, StudyTypeMeta>
}

type FetchCoursesCatalogOptions = {
  includeInactive?: boolean
  limit?: number
  studyType?: string
  timeoutMs?: number
  retries?: number
}

export type CoursesCatalogResult<TCourse = PlantillaCurso> = {
  courses: TCourse[]
  total: number
  studyTypeMeta: Record<string, StudyTypeMeta>
}

function isRetriableError(error: Error): boolean {
  return error.name === 'AbortError' || error.message.toLowerCase().includes('fetch')
}

function toReadableError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new Error('Tiempo de espera agotado. El servidor tardó demasiado en responder.')
    }
    return error
  }
  return new Error('Error al cargar cursos')
}

export async function fetchCoursesCatalog<TCourse = PlantillaCurso>(
  options: FetchCoursesCatalogOptions = {}
): Promise<CoursesCatalogResult<TCourse>> {
  const includeInactive = options.includeInactive ?? false
  const timeoutMs = options.timeoutMs ?? 15000
  const retries = options.retries ?? 2
  const limit = options.limit ?? 1000

  const params = new URLSearchParams()
  if (includeInactive) params.set('includeInactive', '1')
  if (limit > 0) params.set('limit', String(limit))
  if (options.studyType) params.set('studyType', options.studyType)

  const url = `/api/cursos?${params.toString()}`
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        cache: 'no-cache',
        signal: controller.signal,
      })

      const payload = (await response.json()) as CoursesApiResponse<TCourse>
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo cargar el catálogo de cursos')
      }

      return {
        courses: Array.isArray(payload.data) ? payload.data : [],
        total: typeof payload.total === 'number' ? payload.total : (payload.data?.length ?? 0),
        studyTypeMeta: payload.studyTypeMeta ?? {},
      }
    } catch (error) {
      const normalizedError = toReadableError(error)
      lastError = normalizedError

      if (attempt < retries && isRetriableError(normalizedError)) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      throw normalizedError
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError ?? new Error('Error al cargar cursos')
}
