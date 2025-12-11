import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Campus code mapping
 * Maps campus slugs to short codes for convocation codes
 */
const CAMPUS_CODES: Record<string, string> = {
  'cep-norte': 'NOR',
  'cep-santa-cruz': 'SC',
  'cep-sur': 'SUR',
};

/**
 * Hook: generateCourseRunCode
 *
 * Auto-generates a unique code for course runs (convocations) with format:
 * {CAMPUS_CODE}-{YEAR}-{SEQUENTIAL}
 *
 * Examples:
 * - NOR-2025-001 (CEP Norte, year 2025, first convocation)
 * - SC-2025-012 (CEP Santa Cruz, year 2025, 12th convocation)
 * - SUR-2026-003 (CEP Sur, year 2026, 3rd convocation)
 *
 * Logic:
 * 1. Extract year from start_date
 * 2. Get campus code from campus relationship
 * 3. Find highest sequential number for this campus-year combination
 * 4. Generate new code with next sequential number (padded to 3 digits)
 *
 * Special cases:
 * - If no campus assigned: uses "ONL" (Online)
 * - Code is only generated on create, not on update
 * - If codigo already exists, it's preserved (no regeneration)
 */
export const generateCourseRunCode: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  // Only generate on create, not update
  if (operation !== 'create') {
    return data;
  }

  // If codigo already provided (e.g., from seed), preserve it
  if (data.codigo) {
    return data;
  }

  try {
    const { payload } = req;

    // 1. Extract year from start_date
    if (!data.start_date) {
      throw new Error('start_date is required to generate codigo');
    }

    const startDate = new Date(data.start_date);
    const year = startDate.getFullYear();

    // 2. Get campus code
    let campusCode = 'ONL'; // Default for online courses

    if (data.campus) {
      // Fetch campus to get its slug
      const campus = await payload.findByID({
        collection: 'campuses',
        id: data.campus,
      });

      if (campus && campus.slug) {
        campusCode = CAMPUS_CODES[campus.slug] || 'UNK';
      }
    }

    // 3. Find highest sequential number for this campus-year combination
    const prefix = `${campusCode}-${year}-`;

    const existingRuns = await payload.find({
      collection: 'course-runs',
      where: {
        codigo: {
          like: `${prefix}%`,
        },
      },
      limit: 1000, // Should be enough for one campus-year
      sort: '-codigo',
    });

    // 4. Calculate next sequential number
    let nextSequential = 1;

    if (existingRuns.docs.length > 0) {
      // Extract sequential numbers and find max
      const sequentials = existingRuns.docs
        .map((run: any) => {
          const match = run.codigo.match(/^[A-Z]{2,3}-\d{4}-(\d{3})$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num: number) => num > 0);

      if (sequentials.length > 0) {
        nextSequential = Math.max(...sequentials) + 1;
      }
    }

    // 5. Generate final code with padded sequential
    const codigo = `${prefix}${nextSequential.toString().padStart(3, '0')}`;

    console.log(`[COURSE_RUN] Generated codigo: ${codigo} (Campus: ${campusCode}, Year: ${year}, Seq: ${nextSequential})`);

    return {
      ...data,
      codigo,
    };
  } catch (error) {
    console.error('[COURSE_RUN] Error generating codigo:', error);
    throw new Error(`Failed to generate course run codigo: ${error.message}`);
  }
};
