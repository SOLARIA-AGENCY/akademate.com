/**
 * @module @akademate/catalog
 * Academic Catalog Domain Module
 *
 * Provides domain logic for:
 * - Courses and their publication workflow
 * - Cycles (academic programs)
 * - Centers (physical locations)
 * - Instructors
 * - Course Runs (scheduled course instances)
 */

// Types and schemas
export {
  PublicationStatus,
  Modality,
  CourseRunStatus,
  CourseSchema,
  CycleSchema,
  CenterSchema,
  InstructorSchema,
  CourseRunSchema,
  type Course,
  type Cycle,
  type Center,
  type Instructor,
  type CourseRun,
  type PublicationTransition,
  type PublicationEvent,
} from './types.js'

// Publication workflow
export {
  PublicationService,
  PublicationError,
  isValidTransition,
  canTransition,
  getNextStates,
} from './publication.js'

// Utilities
export {
  slugify,
  generateUniqueSlug,
  isValidSlug,
} from './slugify.js'
