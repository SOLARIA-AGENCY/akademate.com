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
export { campusSchema, campusCreateSchema, campusUpdateSchema, validateCampus, validateCampusCreate, validateCampusUpdate, formatValidationErrors, formatSpanishPhone, isValidSpanishPostalCode, isValidSpanishPhone, } from './Campuses.validation';
export { canManageCampuses } from './access/canManageCampuses';
//# sourceMappingURL=index.js.map