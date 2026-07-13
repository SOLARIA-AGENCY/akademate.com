#!/usr/bin/env tsx

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import postgres from 'postgres'
import configPromise from '@payload-config'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetDirectory = path.join(root, 'public', 'website', 'cep', 'courses', 'generated')

const assets = [
  { codes: ['PRIV-AUXFARM-PARA'], slugs: [], filename: 'farmacia-parafarmacia.png' },
  { codes: ['SCLN-CMED-cfgm-farmacia-y-parafarmacia'], slugs: [], filename: 'farmacia-parafarmacia.png' },
  { codes: ['SBD-TELE-dietetica-y-nutricion-online-priv'], slugs: [], filename: 'dietetica-nutricion-online.png' },
  { codes: ['SEPE-HOTR0020-DESE'], slugs: [], filename: 'logistica-cocina-aprovisionamiento.png' },
  { codes: ['SBD-TELE-nutricion-deportiva-online-100h'], slugs: [], filename: 'nutricion-deportiva-online.png' },
  { codes: ['SBD-TELE-nutricion-en-la-practica-deportiva-online-200h'], slugs: [], filename: 'nutricion-practica-deportiva-online.png' },
  { codes: ['EAG-PRIV-seminario-practico-gestion-unycop'], slugs: [], filename: 'seminario-gestion-unycop.png' },
  {
    codes: ['PRIV-GESTORVET'],
    slugs: ['seminario-gestorvet-priv'],
    filename: 'seminario-gestorvet.png',
  },
  {
    codes: [],
    slugs: ['nutricosmetica-priv'],
    filename: 'nutricosmetica.png',
  },
  {
    codes: [],
    slugs: ['quiromasaje-11-meses-priv'],
    filename: 'quiromasaje-holistico.png',
  },
] as const

function hasApplyFlag() {
  return process.argv.includes('--apply')
}

function databaseUri(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (process.env.DATABASE_URI) return process.env.DATABASE_URI

  const { DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env
  if (DATABASE_USER && DATABASE_PASSWORD && DATABASE_HOST && DATABASE_PORT && DATABASE_NAME) {
    return `postgresql://${encodeURIComponent(DATABASE_USER)}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`
  }

  throw new Error('Missing database config. Set DATABASE_URL/DATABASE_URI or DATABASE_USER/PASSWORD/HOST/PORT/NAME.')
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  const apply = hasApplyFlag()
  const sql = apply ? postgres(databaseUri(), { max: 1 }) : null
  const report: Array<Record<string, unknown>> = []

  for (const asset of assets) {
    const filename = asset.filename
    const filePath = path.resolve(assetDirectory, filename)
    const found = await payload.find({
      collection: 'courses',
      where: {
        or: [
          ...asset.codes.map((codigo) => ({ codigo: { equals: codigo } })),
          ...asset.slugs.map((slug) => ({ slug: { equals: slug } })),
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const course = found.docs[0] as { id: number | string; name?: string | null; featured_image?: unknown } | undefined
    const courseLabel = course?.name ?? asset.codes[0] ?? asset.slugs[0] ?? 'Curso CEP Formación'
    if (!course) {
      report.push({ codes: asset.codes, slugs: asset.slugs, status: 'missing-course' })
      continue
    }
    if (course.featured_image) {
      report.push({ codes: asset.codes, slugs: asset.slugs, status: 'already-linked', courseId: course.id })
      continue
    }

    if (!existsSync(filePath)) {
      report.push({ courseId: course.id, status: 'missing-asset', file: filename })
      continue
    }
    if (!apply) {
      report.push({ status: 'would-upload', courseId: course.id, file: filename })
      continue
    }

    const data = await readFile(filePath)
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Imagen de portada: ${courseLabel}`,
      },
      file: {
        data,
        mimetype: filename.endsWith('.webp') ? 'image/webp' : 'image/png',
        name: path.basename(filename),
        size: data.length,
      },
      overrideAccess: true,
    })
    if (!sql) throw new Error('Database client is required when applying course images')
    await sql`
      UPDATE courses
      SET featured_image_id = ${Number(media.id)}, updated_at = NOW()
      WHERE id = ${Number(course.id)}
    `
    report.push({ status: 'linked', courseId: course.id, mediaId: media.id, file: filename })
  }

  if (sql) await sql.end()
  console.log(JSON.stringify({ apply, report }, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
