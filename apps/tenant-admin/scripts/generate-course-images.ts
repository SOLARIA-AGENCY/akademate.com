#!/usr/bin/env tsx

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import sharp from 'sharp'

import { getCatalogForCourseType, parseManagedCourseType, type ManagedCourseType } from './course-image-catalog'
import type { CourseImagePrompt } from './cep-course-image-prompts'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

type PayloadUser = {
  id: number | string
  email?: string | null
  role?: string | null
}

type CourseDoc = {
  id: number | string
  name?: string | null
  slug?: string | null
  featured_image?: number | { id?: number | string } | null
}

type GeneratedImageResponse = {
  data?: Array<{
    b64_json?: string
  }>
}

type CliOptions = {
  apply: boolean
  replaceExisting: boolean
  limit: number | null
  model: string
  courseType: ManagedCourseType
}

const OPENAI_IMAGES_ENDPOINT = 'https://api.openai.com/v1/images/generations'
const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
const OUTPUT_WIDTH = 1600
const OUTPUT_HEIGHT = 900

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: argv.includes('--apply'),
    replaceExisting: argv.includes('--replace-existing'),
    limit: null,
    model: DEFAULT_IMAGE_MODEL,
    courseType: 'privado',
  }

  for (const arg of argv) {
    if (arg.startsWith('--limit=')) {
      const parsed = Number.parseInt(arg.split('=')[1] || '', 10)
      if (Number.isFinite(parsed) && parsed > 0) options.limit = parsed
    }
    if (arg.startsWith('--model=')) {
      options.model = arg.split('=')[1] || DEFAULT_IMAGE_MODEL
    }
    if (arg.startsWith('--type=')) {
      options.courseType = parseManagedCourseType(arg.split('=')[1])
    }
  }

  return options
}

function resolveMediaId(value: CourseDoc['featured_image']): number | null {
  if (!value) return null
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value.id) {
    const parsed = Number.parseInt(String(value.id), 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function slugifyFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  if (!user?.id) throw new Error('No admin/gestor user found to perform media upload.')
  return user
}

async function generateImageBuffer(prompt: string, model: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is required to generate course images.')

  const response = await fetch(OPENAI_IMAGES_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      size: '1536x1024',
      quality: 'high',
      output_format: 'png',
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI image generation failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as GeneratedImageResponse
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI image generation returned no image payload.')
  return Buffer.from(b64, 'base64')
}

async function optimizeGeneratedImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .webp({ quality: 84, effort: 5 })
    .toBuffer()
}

async function uploadGeneratedImage(
  payload: PayloadClient,
  actingUser: PayloadUser,
  course: CourseImagePrompt,
  imageBuffer: Buffer,
) {
  const filename = `${slugifyFilename(course.slug)}-${Date.now()}.webp`
  return payload.create({
    collection: 'media',
    data: {
      alt: `Imagen portada del curso ${course.name}`,
      folder: 'courses/private-ai',
    },
    file: {
      data: imageBuffer,
      mimetype: 'image/webp',
      name: filename,
      size: imageBuffer.length,
    },
    user: actingUser,
  })
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  const catalog = getCatalogForCourseType(options.courseType)
  const payload = await getPayload({ config: configPromise })
  const actingUser = await getActingUser(payload)

  const courses = await payload.find({
    collection: 'courses',
    limit: 300,
    where: {
      course_type: { equals: options.courseType },
    },
  })

  const courseById = new Map<number, CourseDoc>()
  for (const doc of courses.docs as CourseDoc[]) courseById.set(Number(doc.id), doc)

  const targets = catalog
    .filter((course) => {
      const current = courseById.get(course.courseId)
      if (!current) return false
      if (options.replaceExisting) return true
      return !resolveMediaId(current.featured_image)
    })
    .slice(0, options.limit ?? catalog.length)

  console.log(`Catalog ${options.courseType}: ${catalog.length}`)
  console.log(`Existing ${options.courseType} courses in Payload: ${courses.docs.length}`)
  console.log(`Targets to process: ${targets.length}`)

  if (!options.apply) {
    for (const target of targets) {
      console.log(`DRY-RUN\t${target.courseId}\t${target.slug}\t${target.name}`)
    }
    console.log('Run with --apply to generate, upload and link the images.')
    return
  }

  for (const target of targets) {
    const courseDoc = courseById.get(target.courseId)
    if (!courseDoc) {
      console.log(`SKIP\t${target.courseId}\tmissing-course`)
      continue
    }

    console.log(`GENERATE\t${target.courseId}\t${target.name}`)
    const raw = await generateImageBuffer(target.prompt, options.model)
    const optimized = await optimizeGeneratedImage(raw)
    const media = await uploadGeneratedImage(payload, actingUser, target, optimized)

    await payload.update({
      collection: 'courses',
      id: courseDoc.id,
      data: { featured_image: media.id },
      user: actingUser,
    })

    console.log(`LINKED\t${target.courseId}\tmedia:${media.id}`)
  }
}

run().catch((error) => {
  console.error('[generate-course-images] fatal:', error)
  process.exit(1)
})
