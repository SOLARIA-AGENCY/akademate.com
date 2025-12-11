import type { Access } from 'payload';
/**
 * Access Control: Can Read Courses
 *
 * Determines who can read courses and which courses they can see.
 *
 * Access Rules:
 * - Authenticated users (admin, gestor, marketing, asesor): See all courses
 * - Public/unauthenticated users: See only active courses (active=true)
 *
 * This implements a two-tier read access system:
 * 1. Authenticated staff can see draft/inactive courses for management
 * 2. Public users only see published/active courses
 *
 * @param req - Payload request object with user context
 * @returns Boolean or query constraint object
 */
export declare const canReadCourses: Access;
//# sourceMappingURL=canReadCourses.d.ts.map