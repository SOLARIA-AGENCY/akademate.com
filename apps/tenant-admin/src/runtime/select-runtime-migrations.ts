const NEXT_RUNTIME = 'next'

export function assertAkademateNextRuntime(runtime: string | undefined): asserts runtime is 'next' {
  if (runtime !== NEXT_RUNTIME) {
    throw new Error('Akademate Next migration refused: AKADEMATE_RUNTIME must equal next')
  }
}

export function resolveNextDatabaseAppRole(value: string | undefined): string {
  if (!value || !/^[a-z_][a-z0-9_]{0,62}$/.test(value)) {
    throw new Error('Akademate Next migration refused: invalid application database role')
  }
  return value
}

export function selectRuntimeMigrations<T>(
  runtime: string | undefined,
  legacyMigrations: readonly T[],
  nextMigrations: readonly T[],
): T[] {
  if (runtime !== NEXT_RUNTIME) return [...legacyMigrations]
  return [...nextMigrations]
}
