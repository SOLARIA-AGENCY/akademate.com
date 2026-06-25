import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

interface Options {
  apply: boolean
  tenantId: number
  json: boolean
}

interface PhotoSource {
  label: string
  canonicalName: string
  aliases: string[]
  filePath: string
}

const DEFAULT_TENANT_ID = 1
const DENTAL_AREA = {
  codigo: 'ODO-HIG',
  nombre: 'Odontología e Higiene Bucodental',
  descripcion: 'Docencia de Auxiliar de Odontología y Técnico Superior en Higiene Bucodental.',
  color: '#0EA5E9',
  activo: true,
}

const photoSources: PhotoSource[] = [
  {
    label: 'MEDINA REVERON SERGIO',
    canonicalName: 'Sergio Medina Reveron',
    aliases: ['Medina Reveron Sergio', 'Sergio Medina Reveron'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/MEDINA REVERÓN SERGIO/MEDINA REVERÓN SERGIO ORLA.jpg',
  },
  {
    label: 'GORETTI',
    canonicalName: 'Goretti',
    aliases: ['Goretti'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/GORETTI/Foto Goretti ORLA.jpg',
  },
  {
    label: 'HERNANDEZ EPIFANIO',
    canonicalName: 'Epifanio Hernandez',
    aliases: ['Hernandez Epifanio', 'Epifanio Hernandez'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/HERNÁNDEZ EPIFANIO/HERNÁNDEZ EPIFANIO ORLA.jpg',
  },
  {
    label: 'LORENZO LORENA',
    canonicalName: 'Lorena Lorenzo',
    aliases: ['Lorenzo Lorena', 'Lorena Lorenzo'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/LORENZO LORENA/LORENZO LORENA ORLA.jpg',
  },
  {
    label: 'PITTI ELISA',
    canonicalName: 'Elisa Pitti Sicilia',
    aliases: ['Pitti Elisa', 'Elisa Pitti', 'Elisa Pitti Sicilia'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/PITTI ELISA/ORLAS ACATEN 20262863 PITTI ELISA ORLA.jpg',
  },
  {
    label: 'MARTINEZ BALLESTEROS SANDRA',
    canonicalName: 'Sandra Martinez Ballesteros',
    aliases: ['Martinez Ballesteros Sandra', 'Sandra Martinez Ballesteros'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/MARTÍNEZ BALLESTEROS SANDRA/MARTÍNEZ BALLESTEROS SANDRA ORLA.jpg',
  },
  {
    label: 'GALAN RODRIGUEZ ALEXIS',
    canonicalName: 'Alexis Galan Rodriguez',
    aliases: ['Galan Rodriguez Alexis', 'Alexis Galan Rodriguez'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/GALÁN RODRÍGUEZ ALEXIS/GALÁN RODRÍGUEZ ALEXIS ORLA.jpg',
  },
  {
    label: 'RODRIGUEZ PEREZ MARIA DE LOS ANGELES',
    canonicalName: 'Maria de los Angeles Rodriguez Perez',
    aliases: ['Rodriguez Perez Maria de los Angeles', 'Maria de los Angeles Rodriguez Perez'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/RODRÍGUEZ PÉREZ MARÍA DE LOS ANGELES/RODRÍGUEZ PÉREZ MARÍA DE LOS ÁNGELES ORLA.jpg',
  },
  {
    label: 'NURIA ESTHER ANGEL RAMOS',
    canonicalName: 'Nuria Esther Angel Ramos',
    aliases: ['Nuria', 'Nuria Esther Angel Ramos', 'Nuria Angel Ramos'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/NURIA/NURIA ORLA.jpg',
  },
  {
    label: 'HERNANDEZ GONZALEZ DAVID',
    canonicalName: 'David Hernandez Gonzalez',
    aliases: ['Hernandez Gonzalez David', 'David Hernandez Gonzalez'],
    filePath: '/Users/carlosjperez/Downloads/PROFES ACATEN/HERNÁNDEZ GONZÁLEZ DAVID/HERNÁNDEZ GONZÁLEZ DAVID ORLA.jpg',
  },
]

function parseArgs(argv: string[]): Options {
  const tenantArg = argv.find((arg) => arg.startsWith('--tenant-id='))
  return {
    apply: argv.includes('--apply'),
    json: argv.includes('--json'),
    tenantId: tenantArg ? Number(tenantArg.split('=')[1]) : DEFAULT_TENANT_ID,
  }
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function meaningfulTokens(value: string) {
  const stopWords = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'orla', 'foto'])
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWords.has(token))
}

function staffNames(member: Record<string, unknown>) {
  return [
    member.full_name,
    `${member.first_name ?? ''} ${member.last_name ?? ''}`,
    member.alias_names,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .flatMap((value) => value.split(','))
    .map(normalizeText)
}

function scoreMatch(source: PhotoSource, member: Record<string, unknown>) {
  const names = staffNames(member)
  const aliases = source.aliases.map(normalizeText)
  if (aliases.some((alias) => names.includes(alias))) return 100

  const sourceTokens = Array.from(new Set(source.aliases.flatMap(meaningfulTokens)))
  const bestTokenMatch = Math.max(
    0,
    ...names.map((name) => {
      const nameTokens = new Set(meaningfulTokens(name))
      return sourceTokens.filter((token) => nameTokens.has(token)).length
    }),
  )

  return bestTokenMatch
}

function safeFilename(source: PhotoSource) {
  return `${normalizeText(source.canonicalName).replace(/\s+/g, '-')}-orla.webp`
}

function relationIds(values: unknown): Array<string | number> {
  if (!Array.isArray(values)) return []
  return values
    .map((value) => {
      if (typeof value === 'string' || typeof value === 'number') return value
      if (value && typeof value === 'object' && 'id' in value) {
        const id = (value as { id?: string | number }).id
        if (typeof id === 'string' || typeof id === 'number') return id
      }
      return null
    })
    .filter((id): id is string | number => id != null)
}

async function ensureDentalArea(payload: PayloadClient, apply: boolean) {
  const existing = await payload.find({
    collection: 'areas-formativas',
    where: { codigo: { equals: DENTAL_AREA.codigo } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return { action: 'skip', id: existing.docs[0].id, name: existing.docs[0].nombre }
  if (!apply) return { action: 'create', name: DENTAL_AREA.nombre }

  const created = await payload.create({
    collection: 'areas-formativas',
    data: DENTAL_AREA,
    overrideAccess: true,
  })
  return { action: 'create', id: created.id, name: DENTAL_AREA.nombre }
}

async function ensurePhoto(payload: PayloadClient, source: PhotoSource, apply: boolean) {
  const filename = safeFilename(source)
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (existing.docs[0]) return { action: 'skip', id: existing.docs[0].id, filename }
  if (!apply) return { action: 'create', filename }

  const original = await readFile(source.filePath)
  const optimized = await sharp(original)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer()

  const created = await payload.create({
    collection: 'media',
    data: {
      alt: `${source.canonicalName}, docente de Odontología e Higiene Bucodental`,
      folder: 'staff/photos/acaten',
    },
    file: {
      data: optimized,
      mimetype: 'image/webp',
      name: filename,
      size: optimized.length,
    },
    overrideAccess: true,
  })
  return { action: 'create', id: created.id, filename }
}

async function fetchStaff(payload: PayloadClient, tenantId: number) {
  const result = await payload.find({
    collection: 'staff',
    where: {
      and: [
        { staff_type: { in: ['profesor', 'academico'] } },
        { 'assigned_campuses.tenant': { equals: tenantId } },
      ],
    },
    limit: 1000,
    depth: 1,
    overrideAccess: true,
  })
  return result.docs as Record<string, unknown>[]
}

function chooseMatch(source: PhotoSource, staff: Record<string, unknown>[]) {
  const scored = staff
    .map((member) => ({ member, score: scoreMatch(source, member) }))
    .filter((match) => match.score >= 2)
    .sort((a, b) => b.score - a.score)

  if (source.canonicalName === 'Nuria Esther Angel Ramos') {
    const exact = scored.find((match) => staffNames(match.member).some((name) => name === normalizeText('Nuria') || name.includes('nuria')))
    return exact && scored.filter((match) => match.score === exact.score).length === 1 ? exact : null
  }

  const best = scored[0]
  if (!best) return null
  const tied = scored.filter((match) => match.score === best.score)
  return best.score >= 2 && tied.length === 1 ? best : null
}

async function updateStaff(payload: PayloadClient, member: Record<string, unknown>, source: PhotoSource, photoId: unknown, areaId: unknown, apply: boolean) {
  const existingAreas = relationIds(member.qualified_areas)
  const nextAreas = areaId && !existingAreas.some((id) => String(id) === String(areaId))
    ? [...existingAreas, areaId as string | number]
    : existingAreas

  const data: Record<string, unknown> = {
    photo: photoId,
    qualified_areas: nextAreas,
    detected_courses: 'Docente de Auxiliar de Odontología / Técnico Superior en Higiene Bucodental',
  }

  if (source.canonicalName === 'Nuria Esther Angel Ramos') {
    data.first_name = 'Nuria Esther'
    data.last_name = 'Ángel Ramos'
    data.full_name = 'Nuria Esther Ángel Ramos'
    data.alias_names = 'Nuria'
  }

  if (apply) {
    await payload.update({
      collection: 'staff',
      id: member.id as string | number,
      data,
      overrideAccess: true,
    })
  }

  return {
    action: 'update',
    id: member.id,
    from: member.full_name,
    to: data.full_name ?? member.full_name,
    areaAdded: nextAreas.length > existingAreas.length,
  }
}

export async function runSync(options: Options) {
  const payload = await getPayload({ config: configPromise })
  const staff = await fetchStaff(payload, options.tenantId)
  const area = await ensureDentalArea(payload, options.apply)
  const actions = []
  const unresolved = []

  for (const source of photoSources) {
    const match = chooseMatch(source, staff)
    if (!match) {
      unresolved.push({ source: source.label, reason: 'no_unique_safe_match' })
      continue
    }

    const photo = await ensurePhoto(payload, source, options.apply)
    const staffAction = await updateStaff(payload, match.member, source, photo.id, area.id, options.apply)
    actions.push({ source: source.label, score: match.score, photo, staff: staffAction })
  }

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    area,
    matched: actions.length,
    unresolved,
    actions,
  }
}

async function main() {
  const result = await runSync(parseArgs(process.argv.slice(2)))
  if (parseArgs(process.argv.slice(2)).json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  console.log(`ACATEN professor photos sync (${result.mode})`)
  console.log(`Area: ${result.area.action} ${result.area.name}`)
  console.log(`Matched: ${result.matched}`)
  for (const action of result.actions) {
    console.log(`- ${action.source}: ${action.staff.from} -> ${action.staff.to} [${action.photo.filename}]`)
  }
  for (const item of result.unresolved) {
    console.log(`- unresolved ${item.source}: ${item.reason}`)
  }
  if (result.mode === 'dry-run') {
    console.log('Dry-run: no se aplicaron cambios. Repite con --apply para escribir en base de datos.')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
