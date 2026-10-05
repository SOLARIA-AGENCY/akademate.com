/** Convocation codes that must not appear on the public site yet. */
export const UNPUBLISHED_RUN_CODES = new Set([
  'NOR-2026-008',
  'SC-2026-007',
  'SC-2026-008',
  'SC-2026-012',
  'SC-2026-013',
  'SC-2026-019',
  'DES-SUR-2026-001',
])

export function isUnpublishedRunCode(codigo: string | null | undefined): boolean {
  const code = String(codigo || '').trim().toUpperCase()
  return Boolean(code) && UNPUBLISHED_RUN_CODES.has(code)
}

/** Drop public anchors and JSON hrefs that still point at unpublished run codes. */
export function stripUnpublishedRunLinks(html: string): string {
  let next = html
  for (const code of UNPUBLISHED_RUN_CODES) {
    const href = `/convocatorias/${code}`
    next = next.split(`href="${href}"`).join('href="/cursos"')
    next = next.split(`href='${href}'`).join("href='/cursos'")
    next = next.split(`"href":"${href}"`).join('"href":"/cursos"')
    next = next.split(`\\"href\\":\\"${href}\\"`).join('\\"href\\":\\"/cursos\\"')
  }
  return next
}
