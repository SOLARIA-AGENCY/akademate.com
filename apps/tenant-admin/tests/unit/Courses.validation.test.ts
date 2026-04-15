import { describe, expect, it } from 'vitest';

import { CourseSchema, CourseUpdateSchema } from '../../src/collections/Courses/Courses.validation';

describe('Courses.validation schema compatibility', () => {
  it('accepts minimal course payload without cycle', () => {
    const result = CourseSchema.safeParse({
      slug: 'curso-demo',
      name: 'Curso Demo',
      modality: 'presencial',
    });

    expect(result.success).toBe(true);
  });

  it('accepts update payload with null optional fields and richText array', () => {
    const richTextArray = [
      {
        type: 'paragraph',
        children: [{ text: 'Contenido enriquecido' }],
      },
    ];

    const result = CourseUpdateSchema.safeParse({
      cycle: null,
      long_description: richTextArray,
      base_price: null,
      duration_hours: null,
      meta_title: null,
      meta_description: null,
      created_by: null,
      campuses: [1, '2'],
    });

    expect(result.success).toBe(true);
  });

  it('accepts richText object shape in updates', () => {
    const result = CourseUpdateSchema.safeParse({
      long_description: {
        root: {
          type: 'root',
          children: [{ type: 'paragraph', children: [{ text: 'Lexical JSON' }] }],
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid modality', () => {
    const result = CourseSchema.safeParse({
      slug: 'curso-demo',
      name: 'Curso Demo',
      modality: 'mixto',
    });

    expect(result.success).toBe(false);
  });
});
