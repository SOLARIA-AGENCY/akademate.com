export const AKADEMATE_NEXT_RUNTIME = 'next' as const

export function isAkademateNextRuntime(runtime: string | undefined): boolean {
  return runtime === AKADEMATE_NEXT_RUNTIME
}

export async function loadNextRuntimeCollections<T>(
  runtime: string | undefined,
  load: () => Promise<readonly T[]>,
): Promise<T[]> {
  if (!isAkademateNextRuntime(runtime)) {
    return []
  }

  return [...await load()]
}

export function selectRuntimeCollections<T>(
  runtime: string | undefined,
  legacyCollections: readonly T[],
  nextOnlyCollections: readonly T[],
): T[] {
  if (!isAkademateNextRuntime(runtime)) {
    return [...legacyCollections]
  }

  return [...nextOnlyCollections]
}
