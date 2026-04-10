import path from 'path'
import { readFile } from 'fs/promises'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type CourseTypeSeed = {
  name: string
  code: string
  color: string
  description: string
}

type AreaSeed = {
  nombre: string
  codigo: string
  color: string
  descripcion: string
}

type CampusPhotoSeed = {
  slug: string
  fallbackNameIncludes: string
  filePath: string
  alt: string
}

type SyncOptions = {
  tenantId?: number
  tenantSlug?: string
  tenantDomain?: string
}

const COURSE_TYPE_SEEDS: CourseTypeSeed[] = [
  {
    name: 'Privados',
    code: 'PRIV',
    color: '#E3003A',
    description: 'Cursos privados y de especialización.',
  },
  {
    name: 'Ocupados',
    code: 'OCU',
    color: '#22C55E',
    description: 'Formación para trabajadores ocupados.',
  },
  {
    name: 'Desempleados',
    code: 'DES',
    color: '#2563EB',
    description: 'Formación para personas desempleadas.',
  },
  {
    name: 'Teleformación',
    code: 'TEL',
    color: '#F97316',
    description: 'Formación online/teleformación.',
  },
]

const AREA_SEEDS: AreaSeed[] = [
  {
    nombre: 'Área Sanitaria y Clínica',
    codigo: 'SCLN',
    color: '#E3003A',
    descripcion: 'Formación sanitaria, clínica y especialización asistencial.',
  },
  {
    nombre: 'Área Veterinaria y Bienestar Animal',
    codigo: 'VETA',
    color: '#16A34A',
    descripcion: 'Programas de veterinaria, ATV y bienestar animal.',
  },
  {
    nombre: 'Área Salud, Bienestar y Deporte',
    codigo: 'SBD',
    color: '#2563EB',
    descripcion: 'Entrenamiento, nutrición, bienestar y actividad física.',
  },
  {
    nombre: 'Área Tecnología, Digital y Diseño',
    codigo: 'TDD',
    color: '#0EA5E9',
    descripcion: 'IA, competencias digitales, diseño y marketing digital.',
  },
  {
    nombre: 'Área Empresa, Administración y Gestión',
    codigo: 'EAG',
    color: '#F59E0B',
    descripcion: 'Gestión empresarial, administración, RRHH y finanzas.',
  },
  {
    nombre: 'Área Seguridad, Vigilancia y Protección',
    codigo: 'SVP',
    color: '#475569',
    descripcion: 'Formación de seguridad privada, vigilancia y protección.',
  },
]

const CAMPUS_PHOTO_SEEDS: CampusPhotoSeed[] = [
  {
    slug: 'sede-santa-cruz',
    fallbackNameIncludes: 'santa cruz',
    filePath: '/Users/carlosjperez/Downloads/sede-cep-santa-cruz.png',
    alt: 'Sede CEP Santa Cruz',
  },
  {
    slug: 'sede-norte',
    fallbackNameIncludes: 'norte',
    filePath: '/Users/carlosjperez/Downloads/sede-cep-norte.png',
    alt: 'Sede CEP Norte',
  },
]

function parseCliOptions(): SyncOptions {
  const options: SyncOptions = {}
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--tenant-id=')) {
      const value = Number.parseInt(arg.replace('--tenant-id=', ''), 10)
      if (Number.isFinite(value) && value > 0) options.tenantId = value
      continue
    }
    if (arg.startsWith('--tenant-slug=')) {
      const value = arg.replace('--tenant-slug=', '').trim()
      if (value) options.tenantSlug = value
      continue
    }
    if (arg.startsWith('--tenant-domain=')) {
      const value = arg.replace('--tenant-domain=', '').trim()
      if (value) options.tenantDomain = value
    }
  }
  return options
}

function mergeOptions(cliOptions: SyncOptions): SyncOptions {
  const envTenantIdRaw = process.env.TENANT_ID?.trim()
  const envTenantId = envTenantIdRaw ? Number.parseInt(envTenantIdRaw, 10) : NaN

  return {
    tenantId: cliOptions.tenantId ?? (Number.isFinite(envTenantId) && envTenantId > 0 ? envTenantId : undefined),
    tenantSlug: cliOptions.tenantSlug ?? process.env.TENANT_SLUG?.trim() ?? undefined,
    tenantDomain: cliOptions.tenantDomain ?? process.env.TENANT_DOMAIN?.trim() ?? undefined,
  }
}

function withTenantWhere(where: Record<string, unknown>, tenantId?: number | null) {
  if (!tenantId) return where
  return {
    and: [
      { tenant: { equals: tenantId } },
      where,
    ],
  }
}

async function resolveTenantId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  options: SyncOptions
): Promise<number> {
  if (options.tenantId) return options.tenantId

  const tenantResult = await payload.find({
    collection: 'tenants',
    limit: 50,
    depth: 0,
    sort: 'name',
  })

  const tenants = tenantResult.docs as Array<{
    id?: number | string
    slug?: string | null
    domain?: string | null
    name?: string | null
  }>

  const byDomain = (value?: string) =>
    value
      ? tenants.find((tenant) => (tenant.domain || '').toLowerCase() === value.toLowerCase())
      : null

  const bySlug = (value?: string) =>
    value
      ? tenants.find((tenant) => (tenant.slug || '').toLowerCase() === value.toLowerCase())
      : null

  const inferred =
    byDomain(options.tenantDomain) ||
    bySlug(options.tenantSlug) ||
    byDomain('cepformacion.akademate.com') ||
    byDomain('cepformacion.es') ||
    tenants.find((tenant) => (tenant.slug || '').toLowerCase().includes('cep')) ||
    null

  const resolved = inferred?.id
  const parsed =
    typeof resolved === 'number'
      ? resolved
      : resolved
        ? Number.parseInt(String(resolved), 10)
        : NaN

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      'No se pudo resolver tenant CEP. Ejecuta con --tenant-id=<id> o --tenant-slug=<slug>.'
    )
  }

  return parsed
}

async function ensureCourseTypes(payload: Awaited<ReturnType<typeof getPayload>>) {
  for (const seed of COURSE_TYPE_SEEDS) {
    const existing = await payload.find({
      collection: 'course-types',
      where: { code: { equals: seed.code } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0] as { id: string | number }
      await payload.update({
        collection: 'course-types',
        id: doc.id,
        data: {
          name: seed.name,
          color: seed.color,
          description: seed.description,
          active: true,
        },
      })
      console.log(`✓ course-type actualizado: ${seed.code}`)
      continue
    }

    await payload.create({
      collection: 'course-types',
      data: {
        name: seed.name,
        code: seed.code,
        color: seed.color,
        description: seed.description,
        active: true,
      },
    })
    console.log(`✓ course-type creado: ${seed.code}`)
  }
}

async function ensureAreas(payload: Awaited<ReturnType<typeof getPayload>>) {
  for (const seed of AREA_SEEDS) {
    const existing = await payload.find({
      collection: 'areas-formativas',
      where: { codigo: { equals: seed.codigo } },
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0] as { id: string | number }
      await payload.update({
        collection: 'areas-formativas',
        id: doc.id,
        data: {
          nombre: seed.nombre,
          color: seed.color,
          descripcion: seed.descripcion,
          activo: true,
        },
      })
      console.log(`✓ área formativa actualizada: ${seed.codigo}`)
      continue
    }

    await payload.create({
      collection: 'areas-formativas',
      data: {
        nombre: seed.nombre,
        codigo: seed.codigo,
        color: seed.color,
        descripcion: seed.descripcion,
        activo: true,
      },
    })
    console.log(`✓ área formativa creada: ${seed.codigo}`)
  }
}

async function ensureMediaFromFile(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  alt: string
) {
  const filename = path.basename(filePath)
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs.length > 0) {
    const media = existing.docs[0] as { id: string | number }
    return media.id
  }

  const data = await readFile(filePath)
  const created = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data,
      mimetype: 'image/png',
      name: filename,
      size: data.byteLength,
    },
  })
  const media = created as { id: string | number }
  console.log(`✓ media subida: ${filename}`)
  return media.id
}

async function resolveCampus(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: CampusPhotoSeed,
  tenantId: number
) {
  const bySlug = await payload.find({
    collection: 'campuses',
    where: withTenantWhere({ slug: { equals: seed.slug } }, tenantId),
    limit: 1,
    depth: 1,
  })
  if (bySlug.docs.length > 0) return bySlug.docs[0]

  const byName = await payload.find({
    collection: 'campuses',
    where: withTenantWhere({ name: { like: seed.fallbackNameIncludes } }, tenantId),
    limit: 1,
    depth: 1,
  })
  return byName.docs[0] ?? null
}

async function ensureCampusPhotos(payload: Awaited<ReturnType<typeof getPayload>>, tenantId: number) {
  for (const seed of CAMPUS_PHOTO_SEEDS) {
    const campus = (await resolveCampus(payload, seed, tenantId)) as
      | {
          id: string | number
          name?: string
          photos?: Array<{ photo?: string | number }>
        }
      | null

    if (!campus) {
      console.warn(`⚠ sede no encontrada para slug/fallback: ${seed.slug}`)
      continue
    }

    const mediaId = await ensureMediaFromFile(payload, seed.filePath, seed.alt)
    const existingPhotos = Array.isArray(campus.photos) ? campus.photos : []
    const nextPhotos = [
      { photo: mediaId },
      ...existingPhotos.filter((item) => item?.photo && String(item.photo) !== String(mediaId)),
    ]

    await payload.update({
      collection: 'campuses',
      id: campus.id,
      data: {
        image: mediaId,
        photos: nextPhotos,
      },
    })
    console.log(`✓ sede actualizada con imagen principal: ${campus.name ?? seed.slug}`)
  }
}

async function main() {
  const cliOptions = parseCliOptions()
  const options = mergeOptions(cliOptions)
  const payload = await getPayload({ config: configPromise })
  const tenantId = await resolveTenantId(payload, options)
  console.log(`ℹ️ Tenant objetivo: ${tenantId}`)
  console.log('🔄 Sincronizando foundation CEP (tipos, áreas, fotos de sedes)...')
  await ensureCourseTypes(payload)
  await ensureAreas(payload)
  await ensureCampusPhotos(payload, tenantId)
  console.log('✅ Sincronización completada')
}

void main().catch((error) => {
  console.error('✗ Error en sync-cep-website-foundation:', error)
  process.exitCode = 1
})
