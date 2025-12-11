/**
 * Collection exports
 *
 * Each collection will be implemented following TDD methodology:
 * 1. Write tests first (RED)
 * 2. Implement collection config (GREEN)
 * 3. Add validation, hooks, access control (REFACTOR)
 *
 * Collections to be implemented:
 * - Cycles: Educational cycle types (FP Básica, Grado Medio, Grado Superior)
 * - Campuses: Physical training locations
 * - Users: CMS users with role-based access control
 * - Courses: Course catalog
 * - CourseRuns: Scheduled course instances
 * - Campaigns: Marketing campaigns
 * - AdsTemplates: Ad creative templates
 * - Leads: Lead submissions (GDPR compliant)
 * - BlogPosts: Content management
 * - FAQs: Frequently asked questions
 * - Media: File uploads
 * - SEOMetadata: SEO optimization data
 * - AuditLogs: GDPR audit trail
 */

// Collections will be exported here as they are implemented
// IMPORTANT: Users MUST be exported first for auth to work properly
export { Users } from './Users';
export { Cycles } from './Cycles';
export { Campuses } from './Campuses';
export { Courses } from './Courses';
export { CourseRuns } from './CourseRuns/CourseRuns';
export { Leads } from './Leads';
export { Enrollments } from './Enrollments/Enrollments';
export { Students } from './Students/Students';
export { default as Campaigns } from './Campaigns';
export { AdsTemplates } from './AdsTemplates/AdsTemplates';
export { BlogPosts } from './BlogPosts/BlogPosts';
export { FAQs } from './FAQs/FAQs';
export { Media } from './Media/Media';
export { AuditLogs } from './AuditLogs/AuditLogs';
export { AreasFormativas } from './AreasFormativas';
export { Staff } from './Staff/Staff';
// ... more collections to come

export const collections = [
  // Collections will be added here as they are implemented
];
