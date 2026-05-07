#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import pg from 'pg'

const DEFAULT_MEDIA_DIR = '/app/apps/tenant-admin/public/media'
const DEFAULT_TENANT_ID = 1

function parseArgs(argv) {
  const args = {
    mediaDir: DEFAULT_MEDIA_DIR,
    tenantId: DEFAULT_TENANT_ID,
    suffixes: ['-tel', '-des'],
  }

  for (const arg of argv) {
    if (arg.startsWith('--media-dir=')) args.mediaDir = arg.split('=')[1]
    else if (arg.startsWith('--tenant-id=')) args.tenantId = Number(arg.split('=')[1] || DEFAULT_TENANT_ID)
    else if (arg.startsWith('--suffixes=')) {
      args.suffixes = arg
        .split('=')[1]
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    }
  }

  return args
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function detectMimeType(file) {
  const lower = file.toLowerCase()
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

function matchesSuffix(file, suffixes) {
  return suffixes.some((suffix) => file.includes(suffix) && /\.(png|jpg|jpeg|webp)$/i.test(file))
}

function slugFromFilename(file) {
  return file.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/__.+$/, '')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const files = (await fs.readdir(options.mediaDir))
    .filter((file) => matchesSuffix(file, options.suffixes))
    .sort()

  let created = 0
  let linked = 0
  let skipped = 0

  for (const file of files) {
    const slug = slugFromFilename(file)
    const courseSql =
      `select id, name, slug, course_type from courses ` +
      `where tenant_id = ${Number(options.tenantId)} and slug = ${sqlLiteral(slug)} limit 1`

    const courseRes = await client.query(courseSql)
    const course = courseRes.rows[0]

    if (!course) {
      console.log(`SKIP\t${slug}\tmissing-course`)
      skipped++
      continue
    }

    const existingMedia = await client.query(
      `select id from media where filename = ${sqlLiteral(file)} limit 1`,
    )

    let mediaId = existingMedia.rows[0]?.id

    if (!mediaId) {
      const absolutePath = path.join(options.mediaDir, file)
      const stat = await fs.stat(absolutePath)
      const meta = await sharp(absolutePath).metadata()
      const mime = detectMimeType(file)
      const url = `/api/media/file/${file}`
      const insertSql =
        `insert into media (alt, url, filename, mime_type, filesize, width, height, created_at, updated_at) values (` +
        `${sqlLiteral(`Imagen portada del curso ${course.name}`)},` +
        `${sqlLiteral(url)},` +
        `${sqlLiteral(file)},` +
        `${sqlLiteral(mime)},` +
        `${Number(stat.size)},` +
        `${meta.width ? Number(meta.width) : 'null'},` +
        `${meta.height ? Number(meta.height) : 'null'},` +
        `now(), now()) returning id`

      const insertRes = await client.query(insertSql)
      mediaId = insertRes.rows[0].id
      created++
    }

    await client.query(`update courses set featured_image_id = ${Number(mediaId)} where id = ${Number(course.id)}`)
    linked++
    console.log(`LINKED\t${course.course_type}\t${slug}\tmedia:${mediaId}`)
  }

  console.log(`SUMMARY\tcreated:${created}\tlinked:${linked}\tskipped:${skipped}\tfiles:${files.length}`)
  await client.end()
}

main().catch((error) => {
  console.error('[link-course-media-direct] fatal:', error)
  process.exit(1)
})
