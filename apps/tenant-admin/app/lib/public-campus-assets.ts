/**
 * Campus imagery for the public template.
 *
 * A campus image always comes from the tenant's own record. The template keeps
 * no per-campus asset map, so a campus without media falls back to the neutral
 * hero handled by the caller.
 */
export function getPublicCampusImage(
  _slug: string | number | null | undefined,
  currentImageUrl?: string | null,
): string | null {
  return currentImageUrl?.trim() || null
}
