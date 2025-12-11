import type { FieldHook } from 'payload';
import { generateSlugFromTitle } from '../BlogPosts.validation';

/**
 * Hook: Generate Slug (beforeValidate)
 *
 * Purpose:
 * - Auto-generate URL-safe slug from blog post title
 * - Normalize Spanish characters (á→a, ñ→n, ü→u, etc.)
 * - Convert to lowercase with hyphens
 * - Handle duplicate slugs with numeric suffix
 *
 * Execution:
 * - Runs BEFORE validation
 * - Applied to 'slug' field
 *
 * Process:
 * 1. Generate slug from title
 * 2. Check for duplicates in database
 * 3. If duplicate exists, append numeric suffix (-1, -2, etc.)
 * 4. Return unique slug
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id (non-sensitive)
 * - NEVER logs post.title, post.content, or user data
 *
 * @param args - Field hook arguments
 * @returns Generated unique slug
 */
export const generateSlug: FieldHook = async ({
  data,
  req,
  operation,
  originalDoc,
  value,
}) => {
  // Skip if slug is manually provided
  if (value && typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  // Get title from data
  const title = data?.title;
  if (!title || typeof title !== 'string') {
    // If no title, return empty (will fail required validation)
    return '';
  }

  // Generate base slug from title
  let slug = generateSlugFromTitle(title);

  // Check for duplicates
  const { payload } = req;

  // On update: allow keeping same slug
  if (operation === 'update' && originalDoc?.slug === slug) {
    return slug;
  }

  // Check if slug already exists
  const existing = await payload.find({
    collection: 'blog_posts',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  });

  // If slug exists, append numeric suffix
  if (existing.docs.length > 0) {
    let counter = 1;
    let uniqueSlug = `${slug}-${counter}`;

    // Keep incrementing until we find a unique slug
    while (true) {
      const check = await payload.find({
        collection: 'blog_posts',
        where: {
          slug: { equals: uniqueSlug },
        },
        limit: 1,
      });

      if (check.docs.length === 0) {
        slug = uniqueSlug;
        break;
      }

      counter++;
      uniqueSlug = `${slug}-${counter}`;

      // Safety: prevent infinite loop
      if (counter > 100) {
        // Append timestamp as fallback
        slug = `${slug}-${Date.now()}`;
        break;
      }
    }
  }

  // SECURITY (SP-004): No logging of title or content
  // Only log non-sensitive data
  req.payload.logger.info('[BlogPost] Slug generated', {
    operation,
    hasTitle: !!title,
    slugLength: slug.length,
  });

  return slug;
};
