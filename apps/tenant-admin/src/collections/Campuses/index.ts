/**
 * Campuses Collection Module
 *
 * Exports all Campuses collection related functionality:
 * - Collection configuration
 * - Validation schemas
 * - Access control functions
 * - Type definitions
 * - Utility functions for phone/postal code validation
 */

export { Campuses } from './Campuses';
export {
  campusSchema,
  campusCreateSchema,
  campusUpdateSchema,
  validateCampus,
  validateCampusCreate,
  validateCampusUpdate,
  formatValidationErrors,
  formatSpanishPhone,
  isValidSpanishPostalCode,
  isValidSpanishPhone,
  type CampusData,
  type CampusCreateData,
  type CampusUpdateData,
} from './Campuses.validation';
export { canManageCampuses } from './access/canManageCampuses';
