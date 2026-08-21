import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8')
}

describe('enrollments point to students and content collections exist', () => {
  it('retargets enrollments.student to students', () => {
    const enrollments = read('src/collections/Enrollments/Enrollments.ts')
    expect(enrollments).toContain("relationTo: 'students'")
    expect(enrollments).not.toContain("relationTo: 'leads'")
    expect(read('src/collections/Enrollments/hooks/validateEnrollmentRelationships.ts')).toContain("collection: 'students'")
    expect(read('app/api/leads/[id]/enroll/route.ts')).toContain('findOrCreateStudent')
    expect(read('app/api/enrollments/direct/route.ts')).toContain('findOrCreateStudent')
  })

  it('registers testimonials and website_forms', () => {
    const config = read('src/payload.config.ts')
    expect(config).toContain('Testimonials')
    expect(config).toContain('WebsiteForms')
    expect(read('src/collections/Testimonials/Testimonials.ts')).toContain("slug: 'testimonials'")
    expect(read('src/collections/WebsiteForms/WebsiteForms.ts')).toContain("slug: 'website_forms'")
    expect(read('app/api/contenido/testimonials/route.ts')).toContain("collection: 'testimonials'")
    expect(read('app/api/contenido/forms/route.ts')).toContain("collection: 'website_forms'")
  })

  it('writes a migration file without claiming it was executed', () => {
    const migration = read('migrations/20260821_testimonials_forms_enrollment_students.ts')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "testimonials"')
    expect(migration).toContain('enrollments_student_id_students_id_fk')
    expect(read('migrations/index.ts')).toContain('20260821_testimonials_forms_enrollment_students')
  })
})
