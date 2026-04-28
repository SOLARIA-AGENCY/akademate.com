import type { CollectionBeforeChangeHook } from 'payload';

type CoursePricing = {
  base_price?: number | null;
  enrollment_fee?: number | null;
  installment_amount?: number | null;
  installment_count?: number | null;
};

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string | number }).id;
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }
  return null;
}

function coerceNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export const applyCourseRunPriceSnapshot: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!data || operation !== 'create') return data;

  const priceOverride = coerceNumber(data.price_override);
  if (priceOverride !== undefined) {
    data.price_snapshot = priceOverride;
    data.price_source = 'run_override';
  }

  const courseId = relationId(data.course ?? originalDoc?.course);
  if (!courseId) {
    if (data.price_source === undefined) data.price_source = priceOverride !== undefined ? 'run_override' : 'unknown';
    return data;
  }

  let course: CoursePricing | null = null;
  try {
    course = (await req.payload.findByID({
      collection: 'courses',
      id: courseId,
      depth: 0,
    })) as CoursePricing;
  } catch {
    course = null;
  }

  if (!course) return data;

  if (data.price_snapshot === undefined && course.base_price != null) {
    data.price_snapshot = course.base_price;
  }
  if (data.enrollment_fee_snapshot === undefined && course.enrollment_fee != null) {
    data.enrollment_fee_snapshot = course.enrollment_fee;
  }
  if (data.installment_amount_snapshot === undefined && course.installment_amount != null) {
    data.installment_amount_snapshot = course.installment_amount;
  }
  if (data.installment_count_snapshot === undefined && course.installment_count != null) {
    data.installment_count_snapshot = course.installment_count;
  }
  if (data.price_source === undefined) {
    data.price_source = data.price_snapshot !== undefined ? 'course_default' : 'unknown';
  }

  return data;
};
