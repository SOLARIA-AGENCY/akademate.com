import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';
import {
  validateTargetRelationship,
  validateTargetLeads,
  validateTargetEnrollments,
} from '../Campaigns.validation';

/**
 * Hook: Validate Campaign Targets (beforeValidate)
 *
 * Purpose:
 * - Validate target_enrollments <= target_leads (if both provided)
 * - Validate target_leads >= 0
 * - Validate target_enrollments >= 0
 * - Validate targets are integers (no decimals)
 *
 * Validation Rules:
 * 1. Targets must be >= 0 (non-negative integers)
 * 2. If both provided: target_enrollments <= target_leads
 * 3. Equal targets allowed (100% conversion goal)
 * 4. Either target can be undefined (optional)
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Security Considerations (SP-004):
 * - No business intelligence logging (targets are sensitive)
 * - Only log campaign.id and validation status
 */
export const validateCampaignTargets: CollectionBeforeValidateHook = ({ data, operation }) => {
  // Only validate on create and update
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  const { target_leads, target_enrollments } = data;

  // Validate target_leads format (if provided)
  if (target_leads !== undefined) {
    const leadsResult = validateTargetLeads(target_leads);
    if (leadsResult !== true) {
      throw new ValidationError({
        errors: [
          {
            field: 'target_leads',
            message: leadsResult,
          },
        ],
      });
    }
  }

  // Validate target_enrollments format (if provided)
  if (target_enrollments !== undefined) {
    const enrollmentsResult = validateTargetEnrollments(target_enrollments);
    if (enrollmentsResult !== true) {
      throw new ValidationError({
        errors: [
          {
            field: 'target_enrollments',
            message: enrollmentsResult,
          },
        ],
      });
    }
  }

  // Validate relationship: target_enrollments <= target_leads
  const relationshipResult = validateTargetRelationship(target_leads, target_enrollments);
  if (relationshipResult !== true) {
    throw new ValidationError({
      errors: [
        {
          field: 'target_enrollments',
          message: relationshipResult,
        },
      ],
    });
  }

  return data;
};
