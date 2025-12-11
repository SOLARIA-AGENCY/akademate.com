import { CollectionBeforeChangeHook } from 'payload';
import { slugify } from '../../../utils/slugify';

/**
 * Automatically generate slug from course name if not provided
 *
 * This hook runs before validation and creates a URL-friendly slug
 * from the course name if a slug is not already provided.
 */
export const generateSlug: CollectionBeforeChangeHook = async ({ data, operation }) => {
  // Only generate slug on create, or if name changes on update
  if (operation === 'create' || (operation === 'update' && data.name)) {
    // If slug is not provided or is empty, generate from name
    if (!data.slug || data.slug.trim() === '') {
      if (data.name) {
        data.slug = slugify(data.name);
      }
    }
  }

  return data;
};
