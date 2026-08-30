type TeacherRecord = Record<string, unknown>
const MAX_TEACHER_VALUES = 1024

function asRecord(value: unknown): TeacherRecord | null {
  return typeof value === 'object' && value !== null ? (value as TeacherRecord) : null
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function flattenTeacherValues(value: unknown): unknown[] {
  const pending: unknown[] = [value]
  const flattened: unknown[] = []

  for (
    let cursor = 0;
    cursor < pending.length && flattened.length < MAX_TEACHER_VALUES;
    cursor += 1
  ) {
    const item = pending[cursor]
    if (Array.isArray(item)) {
      for (let index = 0; index < item.length && pending.length < MAX_TEACHER_VALUES; index += 1) {
        pending.push(item[index])
      }
    } else {
      flattened.push(item)
    }
  }

  return flattened
}

/** Normalizes the Payload relation variants returned by the convocatorias API. */
export function normalizeTeacherName(value: unknown): string {
  if (typeof value === 'string') return value.trim()

  const record = asRecord(value)
  if (!record) return ''

  const directName =
    textValue(record.full_name) || textValue(record.fullName) || textValue(record.name)
  if (directName) return directName

  return [
    textValue(record.first_name) || textValue(record.firstName),
    textValue(record.last_name) || textValue(record.lastName),
  ]
    .filter(Boolean)
    .join(' ')
}

export function normalizeTeacherNames(value: unknown): string[] {
  const values = flattenTeacherValues(value)
  const names: string[] = []
  const seen = new Set<string>()

  for (const item of values) {
    const name = normalizeTeacherName(item)
    if (name && !seen.has(name)) {
      seen.add(name)
      names.push(name)
    }
  }

  return names
}

export function normalizeTeacherRefs(value: unknown): Array<{ id: string; name: string }> {
  const values = flattenTeacherValues(value)
  const refs: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()

  for (const item of values) {
    const record = asRecord(item)
    if (
      !record ||
      (record.id !== undefined && record.id !== null && String(record.id).trim() === '')
    ) {
      continue
    }

    const id = record.id === undefined || record.id === null ? '' : String(record.id).trim()
    const name = normalizeTeacherName(item)
    if (id && name && !seen.has(id)) {
      seen.add(id)
      refs.push({ id, name })
    }
  }

  return refs
}

export function mergeTeacherRefs(...values: unknown[]): Array<{ id: string; name: string }> {
  return normalizeTeacherRefs(values)
}
