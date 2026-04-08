import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { queryFirst } from '@/@payload-config/lib/db'

const PersonalizacionSchema = z.object({
  primary: z.string().min(4),
  secondary: z.string().min(4).default('#64748b'),
  accent: z.string().min(4).default('#1d4ed8'),
  success: z.string().min(4).default('#22c55e'),
  warning: z.string().min(4).default('#f59e0b'),
  danger: z.string().min(4).default('#ef4444'),
})
const DomainsSchema = z.array(z.string().min(3))
const LogosSchema = z.object({
  principal: z.string().min(1),
  oscuro: z.string().default(''),
  claro: z.string().default(''),
  favicon: z.string().default(''),
})
const IntegrationsSchema = z.object({
  ga4MeasurementId: z.string().default(''),
  gtmContainerId: z.string().default(''),
  metaPixelId: z.string().default(''),
  metaAdAccountId: z.string().default(''),
  metaBusinessId: z.string().default(''),
  metaConversionsApiToken: z.string().default(''),
  metaMarketingApiToken: z.string().default(''),
  mailchimpApiKey: z.string().default(''),
  whatsappBusinessId: z.string().default(''),
})

const AcademiaSchema = z.object({
  nombre: z.string().min(1),
  razonSocial: z.string().default(''),
  cif: z.string().default(''),
  direccion: z.string().default(''),
  codigoPostal: z.string().default(''),
  ciudad: z.string().default(''),
  provincia: z.string().default(''),
  telefono1: z.string().default(''),
  telefono2: z.string().default(''),
  email1: z.string().default(''),
  email2: z.string().default(''),
  web: z.string().default(''),
  horario: z.string().default(''),
  facebook: z.string().default(''),
  twitter: z.string().default(''),
  instagram: z.string().default(''),
  linkedin: z.string().default(''),
  youtube: z.string().default(''),
})

// Branding structure stored in tenant.branding jsonb
interface TenantBranding {
  academia?: z.infer<typeof AcademiaSchema>
  logos?: z.infer<typeof LogosSchema>
  theme?: z.infer<typeof PersonalizacionSchema>
  integrations?: z.infer<typeof IntegrationsSchema>
  [key: string]: unknown
}

// Request body for PUT operations
interface ConfigPutBody {
  section: string
  data: unknown
  tenantId?: string
}

// Database query result types
interface TenantBrandingResult {
  id: string
  name: string
  branding: TenantBranding
}

interface TenantDomainsResult {
  domains: string[]
}

interface ConfigData {
  academia: z.infer<typeof AcademiaSchema>
  logos: z.infer<typeof LogosSchema>
  personalizacion: z.infer<typeof PersonalizacionSchema>
  domains?: z.infer<typeof DomainsSchema>
}

// Default fallback config — Akademate platform defaults.
// Used when no tenant-specific data exists in the database.
const mockConfig: ConfigData = {
  academia: {
    nombre: 'AKADEMATE',
    razonSocial: 'Akademate S.L.',
    cif: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    telefono1: '',
    telefono2: '',
    email1: 'hola@akademate.com',
    email2: '',
    web: 'https://www.akademate.com',
    horario: 'Lunes a Viernes: 9:00 - 18:00',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
  },
  logos: {
    principal: '/logos/akademate-logo-official.png',
    oscuro: '/logos/akademate-logo-official.png',
    claro: '/logos/akademate-logo-official.png',
    favicon: '/logos/akademate-favicon.svg',
  },
  personalizacion: {
    primary: '#0066CC',
    secondary: '#1a1a2e',
    accent: '#0088FF',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  domains: ['akademate.com', 'www.akademate.com'],
}

// ============================================================================
// Database helpers with proper typing
// The db proxy pattern prevents ESLint from resolving types, so we use typed
// wrapper functions to maintain type safety while suppressing lint warnings.
// ============================================================================

async function getTenantBranding(tenantId: string): Promise<TenantBrandingResult | undefined> {
  const isNumeric = /^\d+$/.test(tenantId)

  if (isNumeric) {
    // Payload CMS tenants table uses integer PKs and separate branding columns.
    // Use raw SQL to avoid Drizzle UUID type mismatch.
    type PayloadRow = {
      id: number
      name: string
      branding_primary_color: string | null
      branding_secondary_color: string | null
      branding_logo_url: string | null
      contact_email: string | null
      contact_phone: string | null
      contact_address: string | null
      contact_website: string | null
    }
    const row = await queryFirst<PayloadRow>(
      `SELECT
         id,
         name,
         branding_primary_color,
         branding_secondary_color,
         branding_logo_url,
         contact_email,
         contact_phone,
         contact_address,
         contact_website
       FROM tenants
       WHERE id = $1
       LIMIT 1`,
      [parseInt(tenantId, 10)]
    )
    if (!row) return undefined

    const branding: TenantBranding = {}
    branding.theme = {
      primary: row.branding_primary_color ?? mockConfig.personalizacion.primary,
      secondary: row.branding_secondary_color ?? mockConfig.personalizacion.secondary,
      accent: mockConfig.personalizacion.accent,
      success: mockConfig.personalizacion.success,
      warning: mockConfig.personalizacion.warning,
      danger: mockConfig.personalizacion.danger,
    }
    // Map Payload contact columns to academia structure
    branding.academia = {
      ...mockConfig.academia,
      nombre: row.name || mockConfig.academia.nombre,
      email1: row.contact_email ?? '',
      telefono1: row.contact_phone ?? '',
      direccion: row.contact_address ?? '',
      web: row.contact_website ?? '',
    }
    // Logos from branding_logo_url column
    if (row.branding_logo_url) {
      branding.logos = {
        principal: row.branding_logo_url,
        oscuro: row.branding_logo_url,
        claro: row.branding_logo_url,
        favicon: row.branding_logo_url,
      }
    }
    return { id: String(row.id), name: row.name, branding }
  }

  // UUID IDs → Drizzle SaaS schema (packages/db)
  return await queryFirst<TenantBrandingResult>(
    `SELECT
       id,
       name,
       branding
     FROM tenants
     WHERE id = $1
     LIMIT 1`,
    [tenantId]
  )
}

async function resolveTenantIdFromHost(hostHeader?: string | null): Promise<string | null> {
  const host = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  const normalizedHost = host.replace(/:\d+$/, '')
  if (!normalizedHost || normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return null
  }

  try {
    // Payload schema (single domain column)
    const byDomain = await queryFirst<{ id: string | number }>(
      `SELECT id FROM tenants WHERE LOWER(domain) = LOWER($1) LIMIT 1`,
      [normalizedHost]
    )
    if (byDomain?.id !== undefined && byDomain.id !== null) {
      return String(byDomain.id)
    }
  } catch {
    // Continue with other resolution strategies
  }

  try {
    // SaaS schema (domains jsonb column)
    const byDomains = await queryFirst<{ id: string | number }>(
      `SELECT id
       FROM tenants
       WHERE domains @> $1::jsonb
       LIMIT 1`,
      [JSON.stringify([normalizedHost])]
    )
    if (byDomains?.id !== undefined && byDomains.id !== null) {
      return String(byDomains.id)
    }
  } catch {
    // domains column may not exist in this deployment schema
  }

  // Fallback: subdomain -> slug.akademate.com
  const hostParts = normalizedHost.split('.')
  if (hostParts.length >= 3) {
    const slug = hostParts[0]
    if (slug) {
      try {
        const bySlug = await queryFirst<{ id: string | number }>(
          `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
          [slug]
        )
        if (bySlug?.id !== undefined && bySlug.id !== null) {
          return String(bySlug.id)
        }
      } catch {
        // Ignore and fall through to env/default tenant resolution.
      }
    }
  }

  return null
}

async function resolveTenantId(request: NextRequest, inputTenantId?: string | null): Promise<string | null> {
  const envTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? null
  const uuidSchema = z.string().uuid()
  const numericSchema = z.string().regex(/^\d+$/)

  // 1) Explicit tenantId in request (query/body) takes precedence.
  if (uuidSchema.safeParse(inputTenantId).success) return inputTenantId as string
  if (numericSchema.safeParse(inputTenantId).success) return inputTenantId as string

  // 2) Resolve by request host for tenant-driven runtime.
  const hostTenantId = await resolveTenantIdFromHost(
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  )
  if (hostTenantId) return hostTenantId

  // 3) Env fallback only when host cannot be resolved.
  if (uuidSchema.safeParse(envTenantId).success) return envTenantId as string
  if (numericSchema.safeParse(envTenantId).success) return envTenantId as string

  return null
}

function hostLooksLikeCep(hostHeader?: string | null): boolean {
  const host = (hostHeader ?? '').split(',')[0]?.trim().toLowerCase() ?? ''
  const normalizedHost = host.replace(/:\d+$/, '')
  return /(^|\.)cepformacion(\.|$)/i.test(normalizedHost) || normalizedHost.includes('cep-formacion')
}

function mapAcademiaInput(data: unknown): z.infer<typeof AcademiaSchema> | null {
  const raw = (data ?? {}) as Record<string, unknown>
  const maybeApiShape = AcademiaSchema.safeParse(raw)
  if (maybeApiShape.success) return maybeApiShape.data

  const mapped = {
    nombre: typeof raw.nombre === 'string' ? raw.nombre : (typeof raw.academyName === 'string' ? raw.academyName : ''),
    razonSocial: typeof raw.fiscalName === 'string' ? raw.fiscalName : '',
    cif: typeof raw.cif === 'string' ? raw.cif : '',
    direccion: typeof raw.address === 'string' ? raw.address : '',
    codigoPostal: typeof raw.postalCode === 'string' ? raw.postalCode : '',
    ciudad: typeof raw.city === 'string' ? raw.city : '',
    provincia: typeof raw.country === 'string' ? raw.country : '',
    telefono1: typeof raw.phone === 'string' ? raw.phone : '',
    telefono2: typeof raw.phoneAlternative === 'string' ? raw.phoneAlternative : '',
    email1: typeof raw.email === 'string' ? raw.email : '',
    email2: typeof raw.emailSupport === 'string' ? raw.emailSupport : '',
    web: typeof raw.website === 'string' ? raw.website : '',
    horario: typeof raw.horario === 'string' ? raw.horario : mockConfig.academia.horario,
    facebook: typeof raw.facebook === 'string' ? raw.facebook : '',
    twitter: typeof raw.twitter === 'string' ? raw.twitter : '',
    instagram: typeof raw.instagram === 'string' ? raw.instagram : '',
    linkedin: typeof raw.linkedin === 'string' ? raw.linkedin : '',
    youtube: typeof raw.youtube === 'string' ? raw.youtube : '',
  }

  const parsed = AcademiaSchema.safeParse(mapped)
  return parsed.success ? parsed.data : null
}

async function getTenantDomains(tenantId: string): Promise<TenantDomainsResult | undefined> {
  const isNumeric = /^\d+$/.test(tenantId)
  if (isNumeric) {
    const row = await queryFirst<{ domain: string | null }>(
      `SELECT domain FROM tenants WHERE id = $1 LIMIT 1`,
      [parseInt(tenantId, 10)]
    )
    if (!row) return undefined
    const domainValue = row.domain || ''
    return { domains: domainValue ? [domainValue] : [] } as TenantDomainsResult
  }
  try {
    const row = await queryFirst<{ domains: string[] | null }>(
      `SELECT domains FROM tenants WHERE id = $1 LIMIT 1`,
      [tenantId]
    )
    if (!row) return undefined
    return { domains: Array.isArray(row.domains) ? row.domains : [] }
  } catch {
    return undefined
  }
}

async function updateTenantBranding(tenantId: string, branding: TenantBranding): Promise<void> {
  const isNumeric = /^\d+$/.test(tenantId)

  if (isNumeric) {
    // Payload CMS tenants table uses integer PKs and separate columns.
    // Update the specific columns that exist in the Payload schema.
    const id = parseInt(tenantId, 10)
    const primaryColor = branding.theme?.primary ?? null
    const secondaryColor = branding.theme?.secondary ?? null
    const academia = branding.academia

    // Update branding colors if present
    if (primaryColor || secondaryColor) {
      await queryFirst(
        `UPDATE tenants
         SET branding_primary_color = $2, branding_secondary_color = $3, updated_at = NOW()
         WHERE id = $1`,
        [id, primaryColor, secondaryColor]
      )
    }
    // Update name and contact info if academia data is present
    if (academia) {
      const name = academia.nombre || null
      const contactEmail = academia.email1 || null
      const contactPhone = academia.telefono1 || null
      const contactAddress = academia.direccion || null
      const contactWebsite = academia.web || null
      await queryFirst(
        `UPDATE tenants
         SET
           name = COALESCE($2, name),
           contact_email = $3,
           contact_phone = $4,
           contact_address = $5,
           contact_website = $6,
           updated_at = NOW()
         WHERE id = $1`,
        [id, name, contactEmail, contactPhone, contactAddress, contactWebsite]
      )
    }
    return
  }

  await queryFirst(
    `UPDATE tenants
     SET branding = $2::jsonb, updated_at = NOW()
     WHERE id = $1`,
    [tenantId, JSON.stringify(branding)]
  )
}

async function updateTenantDomains(tenantId: string, domains: string[]): Promise<void> {
  const domainValue = domains[0] || ''
  const isNumeric = /^\d+$/.test(tenantId)
  if (isNumeric) {
    await queryFirst(
      `UPDATE tenants SET domain = $2, updated_at = NOW() WHERE id = $1`,
      [parseInt(tenantId, 10), domainValue]
    )
  } else {
    await queryFirst(
      `UPDATE tenants
       SET domains = $2::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [tenantId, JSON.stringify(domains)]
    )
  }
}

// ============================================================================
// Route handlers
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const tenantId = await resolveTenantId(request, searchParams.get('tenantId'))
    const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
    const cepHost = hostLooksLikeCep(requestHost)
    const hostDefaultLogos = cepHost
      ? {
          principal: '/logos/cep-formacion-logo.png',
          oscuro: '/logos/cep-formacion-logo.png',
          claro: '/logos/cep-formacion-logo.png',
          favicon: '/logos/cep-formacion-isotipo.svg',
        }
      : mockConfig.logos

    // Section parameter is required
    if (!section || section === '') {
      return NextResponse.json(
        { success: false, error: 'Section parameter is required' },
        { status: 400 }
      )
    }

    // Handle specific sections
    if (section === 'logos') {
      if (tenantId) {
        try {
          const tenant = await getTenantBranding(tenantId)
          if (tenant) {
            const logos = LogosSchema.safeParse(tenant.branding?.logos ?? hostDefaultLogos)
            const logosData = logos.success ? logos.data : hostDefaultLogos

            if (cepHost) {
              if (!logosData.principal) logosData.principal = hostDefaultLogos.principal
              if (!logosData.favicon || logosData.favicon === logosData.principal) {
                logosData.favicon = hostDefaultLogos.favicon
              }
            }

            return NextResponse.json({
              success: true,
              data: logosData,
            })
          }
        } catch {
          // Fallback to mock response when database is unavailable.
        }
      }

      return NextResponse.json({
        success: true,
        data: hostDefaultLogos,
      })
    }

    if (section === 'academia') {
      if (tenantId) {
        try {
          const tenant = await getTenantBranding(tenantId)
          if (tenant) {
            const fromBranding = AcademiaSchema.safeParse(tenant.branding?.academia ?? {})
            const merged = {
              ...mockConfig.academia,
              nombre: tenant.name || mockConfig.academia.nombre,
              ...(fromBranding.success ? fromBranding.data : {}),
            }
            return NextResponse.json({
              success: true,
              data: merged,
            })
          }
        } catch {
          // Fallback to mock response when database is unavailable.
        }
      }

      return NextResponse.json({
        success: true,
        data: mockConfig.academia,
      })
    }

    if (section === 'personalizacion') {
      const tenantId = await resolveTenantId(request, searchParams.get('tenantId'))
      if (!tenantId) {
        return NextResponse.json({
          success: true,
          data: mockConfig.personalizacion,
        })
      }
      try {
        const tenant = await getTenantBranding(tenantId)
        if (!tenant) {
          return NextResponse.json({
            success: true,
            data: mockConfig.personalizacion,
          })
        }
        const branding: TenantBranding = tenant.branding ?? {}
        const personalizacion = PersonalizacionSchema.safeParse(branding.theme ?? mockConfig.personalizacion)

        return NextResponse.json({
          success: true,
          data: personalizacion.success ? personalizacion.data : mockConfig.personalizacion,
        })
      } catch {
        return NextResponse.json({
          success: true,
          data: mockConfig.personalizacion,
        })
      }
    }

    if (section === 'limits') {
      const limitsTenantId = await resolveTenantId(request, searchParams.get('tenantId'))
      if (!limitsTenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId parameter is required' },
          { status: 400 }
        )
      }

      try {
        const isNumeric = /^\d+$/.test(limitsTenantId)
        if (isNumeric) {
          type LimitsRow = { limits_max_users: number | null; limits_max_courses: number | null; limits_max_leads_per_month: number | null; limits_storage_quota_m_b: number | null }
          const row = await queryFirst<LimitsRow>(
            `SELECT
               limits_max_users,
               limits_max_courses,
               limits_max_leads_per_month,
               limits_storage_quota_m_b
             FROM tenants
             WHERE id = $1
             LIMIT 1`,
            [parseInt(limitsTenantId, 10)]
          )
          if (!row) {
            return NextResponse.json({ success: true, data: { maxUsers: 50, maxCourses: 100, maxLeadsPerMonth: 1000, storageQuotaMB: 5120 } })
          }
          return NextResponse.json({
            success: true,
            data: {
              maxUsers: row.limits_max_users ?? 50,
              maxCourses: row.limits_max_courses ?? 100,
              maxLeadsPerMonth: row.limits_max_leads_per_month ?? 1000,
              storageQuotaMB: row.limits_storage_quota_m_b ?? 5120,
            },
          })
        }
        // UUID tenants — limits not stored in SaaS schema yet, return defaults
        return NextResponse.json({ success: true, data: { maxUsers: 50, maxCourses: 100, maxLeadsPerMonth: 1000, storageQuotaMB: 5120 } })
      } catch {
        return NextResponse.json({ success: true, data: { maxUsers: 50, maxCourses: 100, maxLeadsPerMonth: 1000, storageQuotaMB: 5120 } })
      }
    }

    if (section === 'domains') {
      const tenantId = searchParams.get('tenantId')
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId parameter is required' },
          { status: 400 }
        )
      }

      const tenant = await getTenantDomains(tenantId)

      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        )
      }

      const domains = DomainsSchema.safeParse(tenant.domains ?? [])

      return NextResponse.json({
        success: true,
        data: domains.success ? domains.data : mockConfig.domains ?? [],
      })
    }

    if (section === 'integrations') {
      if (tenantId) {
        try {
          const tenant = await getTenantBranding(tenantId)
          if (tenant) {
            const fromBranding = IntegrationsSchema.safeParse(tenant.branding?.integrations ?? {})
            return NextResponse.json({
              success: true,
              data: fromBranding.success ? fromBranding.data : IntegrationsSchema.parse({}),
            })
          }
        } catch {
          // Fallback to defaults
        }
      }
      return NextResponse.json({
        success: true,
        data: IntegrationsSchema.parse({}),
      })
    }

    // Section not found
    return NextResponse.json(
      { success: false, error: 'Section not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as ConfigPutBody
    const { section, data } = body
    const tenantId = await resolveTenantId(request, body.tenantId)

    if (section === 'personalizacion') {
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId is required' },
          { status: 400 }
        )
      }

      const parsed = PersonalizacionSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid personalization payload', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const tenant = await getTenantBranding(tenantId)

      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        )
      }

      const branding: TenantBranding = tenant.branding ?? {}
      const nextBranding: TenantBranding = {
        ...branding,
        theme: parsed.data,
      }

      await updateTenantBranding(tenantId, nextBranding)

      return NextResponse.json({
        success: true,
        message: 'Configuracion actualizada correctamente',
        data: parsed.data,
      })
    }

    if (section === 'domains') {
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId is required' },
          { status: 400 }
        )
      }

      const parsed = DomainsSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid domains payload', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      await updateTenantDomains(tenantId, parsed.data)

      return NextResponse.json({
        success: true,
        message: 'Dominios actualizados correctamente',
        data: parsed.data,
      })
    }

    if (section === 'academia') {
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId is required' },
          { status: 400 }
        )
      }

      const mapped = mapAcademiaInput(data)
      if (!mapped) {
        return NextResponse.json(
          { success: false, error: 'Invalid academia payload' },
          { status: 400 }
        )
      }

      const tenant = await getTenantBranding(tenantId)
      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        )
      }

      const nextBranding: TenantBranding = {
        ...(tenant.branding ?? {}),
        academia: mapped,
      }

      await updateTenantBranding(tenantId, nextBranding)

      return NextResponse.json({
        success: true,
        message: 'Configuracion academica actualizada correctamente',
        data: mapped,
      })
    }

    if (section === 'logos') {
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId is required' },
          { status: 400 }
        )
      }

      const parsed = LogosSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid logos payload', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const tenant = await getTenantBranding(tenantId)
      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        )
      }

      const nextBranding: TenantBranding = {
        ...(tenant.branding ?? {}),
        logos: parsed.data,
      }

      await updateTenantBranding(tenantId, nextBranding)

      return NextResponse.json({
        success: true,
        message: 'Logos actualizados correctamente',
        data: parsed.data,
      })
    }

    if (section === 'integrations') {
      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'tenantId is required' },
          { status: 400 }
        )
      }

      const parsed = IntegrationsSchema.safeParse(data)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid integrations payload', details: parsed.error.flatten() },
          { status: 400 }
        )
      }

      const tenant = await getTenantBranding(tenantId)
      if (!tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        )
      }

      const nextBranding: TenantBranding = {
        ...(tenant.branding ?? {}),
        integrations: parsed.data,
      }

      await updateTenantBranding(tenantId, nextBranding)

      return NextResponse.json({
        success: true,
        message: 'Integraciones actualizadas correctamente',
        data: parsed.data,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data,
    })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}
