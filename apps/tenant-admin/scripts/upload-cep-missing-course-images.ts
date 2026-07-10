#!/usr/bin/env tsx

import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetDirectory = path.join(root, 'public', 'website', 'cep', 'courses', 'generated')

const assets = [
  ['PRIV-AUXFARM-PARA', 'farmacia-parafarmacia.png'],
  ['SCLN-CMED-cfgm-farmacia-y-parafarmacia', 'farmacia-parafarmacia.png'],
  ['SBD-TELE-dietetica-y-nutricion-online-priv', 'dietetica-nutricion-online.png'],
  ['SEPE-HOTR0020-DESE', 'logistica-cocina-aprovisionamiento.png'],
  ['SBD-TELE-nutricion-deportiva-online-100h', 'nutricion-deportiva-online.png'],
  ['SBD-TELE-nutricion-en-la-practica-deportiva-online-200h', 'nutricion-practica-deportiva-online.png'],
  ['EAG-PRIV-seminario-practico-gestion-unycop', 'seminario-gestion-unycop.png'],
  ['PRIV-GESTORVET', 'seminario-gestorvet.png'],
] as const

function hasApplyFlag() {
  return process.argv.includes('--apply')
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  const apply = hasApplyFlag()
  const report: Array<Record<string, unknown>> = []

  for (const [codigo, filename] of assets) {
    const found = await payload.find({
      collection: 'courses',
      where: { codigo: { equals: codigo } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const course = found.docs[0] as { id: number | string; name?: string | null; featured_image?: unknown } | undefined
    if (!course) {
      report.push({ codigo, status: 'missing-course' })
      continue
    }
    if (course.featured_image) {
      report.push({ codigo, status: 'already-linked', courseId: course.id })
      continue
    }

    const filePath = path.join(assetDirectory, filename)
    if (!apply) {
      report.push({ codigo, status: 'would-upload', courseId: course.id, file: filename })
      continue
    }

    const data = await readFile(filePath)
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Imagen de portada: ${course.name ?? codigo}`,
        folder: 'courses/generated',
      },
      file: { data, mimetype: 'image/png', name: filename, size: data.length },
      overrideAccess: true,
    })
    await payload.update({
      collection: 'courses',
      id: course.id,
      data: { featured_image: media.id },
      overrideAccess: true,
    })
    report.push({ codigo, status: 'linked', courseId: course.id, mediaId: media.id, file: filename })
  }

  console.log(JSON.stringify({ apply, report }, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
