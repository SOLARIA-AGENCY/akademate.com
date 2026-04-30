#!/usr/bin/env tsx

import { readdir, readFile } from 'fs/promises'
import path from 'path'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { getCatalogForCourseType, getDefaultOutputDir, parseManagedCourseType, type ManagedCourseType } from './course-image-catalog'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

type PayloadUser = {
  id: number | string
  email?: string | null
  role?: string | null
}

type CourseDoc = {
  id: number | string
  slug?: string | null
}

function detectMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase()
  if (extension === '.webp') return 'image/webp'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  return 'image/png'
}

async function getActingUser(payload: PayloadClient): Promise<PayloadUser> {
  const result = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      or: [{ role: { equals: 'superadmin' } }, { role: { equals: 'admin' } }, { role: { equals: 'gestor' } }],
    },
  })

  const user = result.docs[0] as PayloadUser | undefined
  if (!user?.id) throw new Error('No admin/gestor user found to upload generated course images.')
  return user
}

function parseCourseTypeArg(argv: string[]): ManagedCourseType {
  const raw = argv.find((arg) => arg.startsWith('--type='))?.split('=')[1]
  return parseManagedCourseType(raw)
}

async function run() {
  const courseType = parseCourseTypeArg(process.argv.slice(2))
  const inputDir = process.argv[2] && !process.argv[2].startsWith('--')
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), getDefaultOutputDir(courseType))
  const apply = process.argv.includes('--apply')

  const catalog = getCatalogForCourseType(courseType)
  const files = await readdir(inputDir)
  const payload = await getPayload({ config: configPromise })
  const actingUser = await getActingUser(payload)

  const courses = await payload.find({
    collection: 'courses',
    limit: 300,
    where: {
      course_type: { equals: courseType },
    },
  })

  const courseBySlug = new Map<string, CourseDoc>()
  for (const course of courses.docs as CourseDoc[]) {
    if (course.slug) courseBySlug.set(course.slug, course)
  }

  for (const item of catalog) {
    const course = courseBySlug.get(item.slug)
    if (!course) {
      console.log(`SKIP\t${item.slug}\tmissing-course`)
      continue
    }

    const source = files.find((file) => file.startsWith(item.slug))
    if (!source) {
      console.log(`MISS\t${item.slug}\tno-local-image`)
      continue
    }

    const absolutePath = path.join(inputDir, source)
    if (!apply) {
      console.log(`DRY-RUN\t${item.slug}\t${absolutePath}`)
      continue
    }

    const buffer = await readFile(absolutePath)
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Imagen portada del curso ${item.name}`,
        folder: 'courses/private-ai',
      },
      file: {
        data: buffer,
        mimetype: detectMimeType(source),
        name: source,
        size: buffer.length,
      },
      user: actingUser,
    })

    await payload.update({
      collection: 'courses',
      id: course.id,
      data: {
        featured_image: media.id,
      },
      user: actingUser,
    })

    console.log(`LINKED\t${item.slug}\tmedia:${media.id}`)
  }
}

run().catch((error) => {
  console.error('[upload-course-generated-images] fatal:', error)
  process.exit(1)
})
