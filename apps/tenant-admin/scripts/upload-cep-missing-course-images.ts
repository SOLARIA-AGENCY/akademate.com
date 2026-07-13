#!/usr/bin/env tsx

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
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

async function main() {
  const payload = await getPayload({ config: configPromise })
  const apply = hasApplyFlag()
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
        folder: 'courses/generated',
      },
      file: {
        data,
        mimetype: filename.endsWith('.webp') ? 'image/webp' : 'image/png',
        name: path.basename(filename),
        size: data.length,
      },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'courses',
      id: course.id,
      data: { featured_image: media.id },
      overrideAccess: true,
    })
    report.push({ status: 'linked', courseId: course.id, mediaId: media.id, file: filename })
  }

  console.log(JSON.stringify({ apply, report }, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
