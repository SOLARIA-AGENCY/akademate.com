import type { FieldHook } from 'payload';
import { calculateEstimatedReadTime } from '../BlogPosts.validation';

/**
 * Hook: Calculate Read Time (beforeChange)
 *
 * Purpose:
 * - Auto-calculate 'estimated_read_time' from blog post content
 * - Calculation: word count / 200 words per minute
 * - Rounds up to nearest minute (minimum 1 minute)
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Business Logic:
 * - Recalculates on EVERY update (content may change)
 * - System-managed field (users cannot manually set)
 * - Extracts plain text from richText content nodes
 *
 * Security Considerations:
 * - Layer 1 (UX): admin.readOnly = true (prevents UI edits)
 * - Layer 2 (Security): access.update = false (blocks API updates)
 * - Layer 3 (Business Logic): This hook enforces system calculation
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id and read time (non-sensitive)
 * - NEVER logs post.content or text content
 *
 * @param args - Field hook arguments
 * @returns Calculated read time in minutes
 */
export const calculateReadTime: FieldHook = ({ data, req, operation }) => {
  const content = data?.content;

  // If no content, default to 1 minute
  if (!content || !Array.isArray(content)) {
    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Read time calculated (no content)', {
      operation,
      readTime: 1,
    });

    return 1;
  }

  // Calculate read time from content
  const readTime = calculateEstimatedReadTime(content);

  // SECURITY (SP-004): No logging of content
  // Only log non-sensitive metrics
  req.payload.logger.info('[BlogPost] Read time calculated', {
    operation,
    readTime,
    hasContent: !!content,
  });

  return readTime;
};
