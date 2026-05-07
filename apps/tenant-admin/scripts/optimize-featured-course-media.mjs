#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import pg from 'pg'

const MEDIA_DIR = '/app/apps/tenant-admin/public/media'
const TENANT_ID = Number(process.argv.find((arg) => arg.startsWith('--tenant-id='))?.split('=')[1] ?? 1)
const QUALITY = Number(process.argv.find((arg) => arg.startsWith('--quality='))?.split('=')[1] ?? 82)
const APPLY = process.argv.includes('--apply')

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function buildOptimizedFilename(filename) {
  return filename.replace(/\.(png|jpg|jpeg)$/i, '__optimized.webp')
}

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  const result = await client.query(
    `select c.id as course_id, c.name as course_name, c.slug, m.id as media_id, m.filename, m.filesize
     from courses c
     join media m on m.id = c.featured_image_id
     where c.tenant_id = ${TENANT_ID}
       and m.mime_type in ('image/png', 'image/jpeg')
     order by m.filesize desc nulls last, c.slug`,
  )

  let optimized = 0
  let skipped = 0

  for (const row of result.rows) {
    const input = path.join(MEDIA_DIR, row.filename)
    const outputFilename = buildOptimizedFilename(row.filename)
    const output = path.join(MEDIA_DIR, outputFilename)

    try {
      await fs.access(input)
    } catch {
      console.log(`SKIP\t${row.slug}\tmissing-file:${row.filename}`)
      skipped++
      continue
    }

    if (!APPLY) {
      console.log(`DRY\t${row.slug}\t${row.filename}\t${outputFilename}`)
      continue
    }

    await sharp(input)
      .rotate()
      .resize(1600, 900, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(output)

    const stat = await fs.stat(output)
    const meta = await sharp(output).metadata()
    const existing = await client.query(
      `select id from media where filename = ${sqlLiteral(outputFilename)} limit 1`,
    )

    let mediaId = existing.rows[0]?.id
    if (!mediaId) {
      const insert = await client.query(
        `insert into media (alt, url, filename, mime_type, filesize, width, height, created_at, updated_at)
         values (
           ${sqlLiteral(`Imagen portada optimizada del curso ${row.course_name}`)},
           ${sqlLiteral(`/api/media/file/${outputFilename}`)},
           ${sqlLiteral(outputFilename)},
           'image/webp',
           ${Number(stat.size)},
           ${meta.width ? Number(meta.width) : 'null'},
           ${meta.height ? Number(meta.height) : 'null'},
           now(),
           now()
         ) returning id`,
      )
      mediaId = insert.rows[0].id
    }

    await client.query(`update courses set featured_image_id = ${Number(mediaId)} where id = ${Number(row.course_id)}`)
    optimized++
    console.log(`OPTIMIZED\t${row.slug}\t${row.filename}\t${outputFilename}\t${row.filesize}->${stat.size}`)
  }

  console.log(`SUMMARY\toptimized:${optimized}\tskipped:${skipped}\tcandidates:${result.rows.length}\tapply:${APPLY}`)
  await client.end()
}

main().catch((error) => {
  console.error('[optimize-featured-course-media] fatal:', error)
  process.exit(1)
})
