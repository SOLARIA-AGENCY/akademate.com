/**
 * Hook: Generate Slug from Question
 *
 * Auto-generates URL-safe slug from FAQ question:
 * - Normalizes Spanish characters (á→a, ñ→n, ü→u, etc.)
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 * - Handles duplicates with numeric suffix (-1, -2, etc.)
 * - Truncates to max 100 characters
 *
 * SECURITY (SP-004): No logging of question content
 *
 * @hook beforeValidate
 */

import type { FieldHook } from 'payload';

/**
 * Normalize Spanish characters to ASCII equivalents
 */
function normalizeSpanishChars(str: string): string {
  const map: Record<string, string> = {
    á: 'a',
    é: 'e',
    í: 'i',
    ó: 'o',
    ú: 'u',
    ñ: 'n',
    ü: 'u',
    Á: 'a',
    É: 'e',
    Í: 'i',
    Ó: 'o',
    Ú: 'u',
    Ñ: 'n',
    Ü: 'u',
    '¿': '',
    '¡': '',
    '?': '',
    '!': '',
  };

  return str.replace(/[áéíóúñüÁÉÍÓÚÑÜ¿¡?!]/g, (char) => map[char] || char);
}

/**
 * Generate slug from text
 */
function slugify(text: string): string {
  return normalizeSpanishChars(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-word chars except hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim hyphens from start
    .replace(/-+$/, '') // Trim hyphens from end
    .substring(0, 100); // Truncate to max 100 chars
}

/**
 * Check if slug exists in database
 */
async function slugExists(slug: string, req: any, currentId?: string): Promise<boolean> {
  try {
    const existing = await req.payload.find({
      collection: 'faqs',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
    });

    // If updating, exclude current document
    if (currentId) {
      return existing.docs.some((doc: any) => doc.id !== currentId);
    }

    return existing.docs.length > 0;
  } catch (error) {
    // SECURITY (SP-004): No logging of error details
    req.payload.logger.error('[FAQ] Slug existence check failed', {
      hasError: true,
    });
    return false;
  }
}

/**
 * Generate unique slug with numeric suffix if needed
 */
async function generateUniqueSlug(
  baseSlug: string,
  req: any,
  currentId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await slugExists(slug, req, currentId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety: prevent infinite loop
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Generate slug hook
 */
export const generateSlug: FieldHook = async ({ data, req, operation, value }) => {
  // If slug is manually provided, validate and use it
  if (value && typeof value === 'string' && value.trim().length > 0) {
    return slugify(value);
  }

  // Auto-generate slug from question
  if (data?.question && typeof data.question === 'string') {
    const baseSlug = slugify(data.question);
    const currentId = operation === 'update' ? (data as any).id : undefined;

    const uniqueSlug = await generateUniqueSlug(baseSlug, req, currentId);

    // SECURITY (SP-004): No logging of question or slug content
    req.payload.logger.info('[FAQ] Slug generated', {
      operation,
      hasQuestion: !!data.question,
      slugLength: uniqueSlug.length,
    });

    return uniqueSlug;
  }

  // Fallback: generate random slug if no question provided
  const fallbackSlug = `faq-${Date.now()}`;

  // SECURITY (SP-004): No logging of slug content
  req.payload.logger.warn('[FAQ] Fallback slug generated', {
    operation,
    hasFallback: true,
  });

  return fallbackSlug;
};
