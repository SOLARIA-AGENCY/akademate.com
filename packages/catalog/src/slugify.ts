/**
 * @module @akademate/catalog/slugify
 * URL slug generation utilities
 */

/**
 * Convert text to URL-friendly slug
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Normalize unicode (accents -> base chars)
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '') // Remove non-alphanumeric (keep underscore for replacement)
    .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens from start/end
}

/**
 * Generate unique slug by appending counter if needed
 */
export async function generateUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(text)
  let slug = baseSlug
  let counter = 1

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++

    // Safety limit
    if (counter > 100) {
      throw new Error('Unable to generate unique slug after 100 attempts')
    }
  }

  return slug
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
