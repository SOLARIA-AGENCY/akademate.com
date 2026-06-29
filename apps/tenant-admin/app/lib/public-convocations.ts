import { normalizeStudyType } from '@/app/lib/website/study-types'

const DAY_LABELS: Record<string, string> = {
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miércoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sábado',
  sunday: 'domingo',
  lunes: 'lunes',
  martes: 'martes',
  miercoles: 'miércoles',
  miércoles: 'miércoles',
  jueves: 'jueves',
  viernes: 'viernes',
  sabado: 'sábado',
  sábado: 'sábado',
  domingo: 'domingo',
}

function normalizeDayKey(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function formatPublicDate(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}): string {
  if (!value) return 'Fecha por confirmar'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar'
  return new Intl.DateTimeFormat('es-ES', options).format(date)
}

export function formatPublicMonth(value: string | null | undefined): string {
  if (!value) return 'Próximamente'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Próximamente'
  const month = date.toLocaleDateString('es-ES', { month: 'long' })
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`
}

export function formatRunDays(days: unknown): string {
  const rawDays = Array.isArray(days) ? days : []
  return rawDays
    .map((day) => {
      const key = normalizeDayKey(day)
      return DAY_LABELS[key] || String(day ?? '').trim()
    })
    .filter(Boolean)
    .join(', ')
}

export function normalizeRunTime(value: unknown): string {
  return typeof value === 'string' ? value.replace(/:00$/, '') : ''
}

export function formatRunSchedule(run: any): string {
  const days = formatRunDays(run?.schedule_days)
  const start = normalizeRunTime(run?.schedule_time_start)
  const end = normalizeRunTime(run?.schedule_time_end)
  if (days && start && end) return `${days} · ${start}-${end}`
  if (start && end) return `${start}-${end}`
  return days || 'Horario por confirmar'
}

export function formatPublicCurrency(value: unknown, fallback = 'Consultar'): string {
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return fallback
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price)
}

export function getRunPrice(run: any, course?: any, cycle?: any): number | null {
  const candidates = [
    run?.price_snapshot,
    run?.price_override,
    run?.price,
    cycle?.pricing?.totalPrice,
    course?.base_price,
  ]
  for (const candidate of candidates) {
    const value = Number(candidate)
    if (Number.isFinite(value) && value > 0) return value
  }
  return null
}

export function getRunEnrollmentFee(run: any, cycle?: any): number | null {
  const candidates = [run?.enrollment_fee_snapshot, cycle?.pricing?.enrollmentFee]
  for (const candidate of candidates) {
    const value = Number(candidate)
    if (Number.isFinite(value) && value > 0) return value
  }
  return null
}

export function getRunInstallmentLabel(run: any, cycle?: any): string | null {
  const amount = Number(run?.installment_amount_snapshot ?? cycle?.pricing?.monthlyFee)
  const count = Number(run?.installment_count_snapshot)
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (Number.isFinite(count) && count > 0) return `${count} cuotas de ${formatPublicCurrency(amount)}`
  return `Mensualidad: ${formatPublicCurrency(amount)}`
}

export function getPublicConvocationHref(run: any): string {
  return `/convocatorias/${run?.codigo || run?.id}`
}

export function hasPhysicalLocation(run: any): boolean {
  return Boolean(run?.campus || run?.classroom)
}

export function getRunModality(run: any, course?: any, cycle?: any): string {
  if (hasPhysicalLocation(run)) return run?.modality || 'presencial'
  const modality = run?.modality || cycle?.duration?.modality || course?.modality || 'presencial'
  const normalized = normalizeStudyType(String(modality))
  if (normalized === 'teleformacion') return 'online'
  return String(modality)
}

export function modalityLabel(modality: string | undefined): string {
  const map: Record<string, string> = {
    presencial: 'Presencial',
    semipresencial: 'Semipresencial',
    online: 'Online',
    mixto: 'Modalidad mixta',
    teleformacion: 'Online',
  }
  return modality ? map[modality] || modality : 'A consultar'
}

export function textFromRichValue(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  const lines: string[] = []

  function visit(node: unknown) {
    if (!node) return
    if (typeof node === 'string') {
      const text = node.trim()
      if (text) lines.push(text)
      return
    }
    if (Array.isArray(node)) {
      for (const child of node) visit(child)
      return
    }
    if (typeof node !== 'object') return

    const record = node as Record<string, unknown>
    if (typeof record.text === 'string') {
      const text = record.text.trim()
      if (text) lines.push(text)
    }

    if (Array.isArray(record.children)) {
      const textChildren = record.children
        .map((child) => {
          if (child && typeof child === 'object' && typeof (child as { text?: unknown }).text === 'string') {
            return String((child as { text: string }).text)
          }
          return ''
        })
        .join('')
        .trim()

      if (textChildren) {
        lines.push(textChildren)
        return
      }

      visit(record.children)
    }

    if (record.root) visit(record.root)
  }

  visit(value)
  return Array.from(new Set(lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean))).join('\n\n')
}
