import { describe, expect, test, vi } from 'vitest';
import { applyCourseRunPriceSnapshot } from '../../src/collections/CourseRuns/hooks/applyCourseRunPriceSnapshot';
import { detectPlanningConflicts } from '../../src/collections/CourseRuns/hooks/detectPlanningConflicts';

function makeReq(payloadOverrides: Record<string, unknown>) {
  return {
    payload: {
      findByID: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
      create: vi.fn().mockResolvedValue({ id: 1 }),
      update: vi.fn().mockResolvedValue({}),
      ...payloadOverrides,
    },
  } as any;
}

describe('applyCourseRunPriceSnapshot', () => {
  test('uses explicit convocatoria override without mutating course price', async () => {
    const req = makeReq({
      findByID: vi.fn().mockResolvedValue({
        base_price: 1250,
        enrollment_fee: 150,
        installment_amount: 125,
        installment_count: 10,
      }),
    });

    const data = await applyCourseRunPriceSnapshot({
      data: { course: 10, price_override: 990 },
      req,
      operation: 'create',
    } as any);

    expect(data?.price_snapshot).toBe(990);
    expect(data?.price_source).toBe('run_override');
    expect(data?.enrollment_fee_snapshot).toBe(150);
    expect(data?.installment_amount_snapshot).toBe(125);
    expect(data?.installment_count_snapshot).toBe(10);
  });

  test('copies course default pricing into a new convocatoria snapshot', async () => {
    const req = makeReq({
      findByID: vi.fn().mockResolvedValue({
        base_price: 1155,
        enrollment_fee: 160,
        installment_amount: 105,
        installment_count: 11,
      }),
    });

    const data = await applyCourseRunPriceSnapshot({
      data: { course: 20 },
      req,
      operation: 'create',
    } as any);

    expect(data?.price_snapshot).toBe(1155);
    expect(data?.price_source).toBe('course_default');
    expect(data?.enrollment_fee_snapshot).toBe(160);
    expect(data?.installment_amount_snapshot).toBe(105);
    expect(data?.installment_count_snapshot).toBe(11);
  });

  test('marks missing course pricing as unknown', async () => {
    const req = makeReq({ findByID: vi.fn().mockResolvedValue({}) });

    const data = await applyCourseRunPriceSnapshot({
      data: { course: 30 },
      req,
      operation: 'create',
    } as any);

    expect(data?.price_snapshot).toBeUndefined();
    expect(data?.price_source).toBe('unknown');
  });
});

describe('detectPlanningConflicts', () => {
  test('blocks FPED in CEP Norte Aula 5 when validating planning', async () => {
    const req = makeReq({
      findByID: vi.fn(async ({ collection }) => {
        if (collection === 'classrooms') {
          return { id: 5, name: 'Aula 5', code: 'N-AULA-5', capacity: 17, usage_policy: 'private_only' };
        }
        if (collection === 'campuses') {
          return { id: 1, name: 'CEP Norte', slug: 'sede-norte' };
        }
        return {};
      }),
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    });

    await expect(
      detectPlanningConflicts({
        data: {
          id: 100,
          classroom: 5,
          campus: 1,
          training_type: 'fped',
          planning_status: 'validated',
          start_date: '2026-05-01T00:00:00.000Z',
          end_date: '2026-05-30T00:00:00.000Z',
          schedule_days: ['monday'],
          schedule_time_start: '10:00:00',
          schedule_time_end: '13:00:00',
        },
        req,
        operation: 'update',
      } as any)
    ).rejects.toThrow(/Planning conflict/);
  });

  test('allows draft with classroom warning but persists conflict records', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const req = makeReq({
      create,
      findByID: vi.fn(async ({ collection }) => {
        if (collection === 'classrooms') return { id: 1, name: 'Aula 1', capacity: 17, usage_policy: 'mixed' };
        if (collection === 'campuses') return { id: 1, name: 'CEP Santa Cruz', slug: 'sede-santa-cruz' };
        return {};
      }),
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    });

    const data = await detectPlanningConflicts({
      data: {
        id: 101,
        tenant: 1,
        classroom: 1,
        campus: 1,
        training_type: 'private',
        planning_status: 'draft',
        max_students: 25,
        start_date: '2026-05-01T00:00:00.000Z',
        end_date: '2026-05-30T00:00:00.000Z',
        schedule_days: ['monday'],
        schedule_time_start: '10:00:00',
        schedule_time_end: '13:00:00',
      },
      req,
      operation: 'create',
    } as any);

    expect(data?.planning_status).toBe('draft');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'planning-conflicts',
      data: expect.objectContaining({
        type: 'room_capacity_exceeded',
        severity: 'warning',
        status: 'open',
      }),
      overrideAccess: true,
    }));
  });

  test('detects overlapping classroom and instructor conflicts', async () => {
    const req = makeReq({
      findByID: vi.fn(async ({ collection }) => {
        if (collection === 'classrooms') return { id: 2, name: 'Aula 2', capacity: 18, usage_policy: 'mixed' };
        if (collection === 'campuses') return { id: 1, name: 'CEP Santa Cruz', slug: 'sede-santa-cruz' };
        return {};
      }),
      find: vi.fn().mockResolvedValue({
        docs: [{
          id: 200,
          classroom: 2,
          instructor: 9,
          start_date: '2026-05-05T00:00:00.000Z',
          end_date: '2026-06-05T00:00:00.000Z',
          schedule_days: ['monday'],
          schedule_time_start: '10:30:00',
          schedule_time_end: '12:30:00',
        }],
        totalDocs: 1,
      }),
    });

    await expect(
      detectPlanningConflicts({
        data: {
          id: 201,
          classroom: 2,
          campus: 1,
          instructor: 9,
          training_type: 'private',
          planning_status: 'published',
          start_date: '2026-05-01T00:00:00.000Z',
          end_date: '2026-05-30T00:00:00.000Z',
          schedule_days: ['monday'],
          schedule_time_start: '10:00:00',
          schedule_time_end: '13:00:00',
        },
        req,
        operation: 'update',
      } as any)
    ).rejects.toThrow(/Planning conflict/);
  });
});
