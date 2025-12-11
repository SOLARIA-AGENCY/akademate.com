import type { Access } from 'payload';

/**
 * Access Control: canCreateLead
 *
 * IMPORTANT: Public users (unauthenticated) can create leads via form submission.
 * This is the PRIMARY use case for lead capture.
 *
 * Allowed:
 * - Public (unauthenticated): YES - Form submissions
 * - All authenticated users: YES - Can manually create leads in CMS
 *
 * Security considerations:
 * - GDPR consent is enforced at validation level
 * - Rate limiting should be implemented at API gateway level
 * - Spam protection via captcha should be added to public forms
 */
export const canCreateLead: Access = () => {
  // Allow public access for lead form submissions
  // This enables the contact form on the website to work without authentication
  return true;
};
