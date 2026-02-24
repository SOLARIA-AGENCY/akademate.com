import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, tenants } from '@/@payload-config/lib/db'

const PersonalizacionSchema = z.object({
  primary: z.string().min(4),
  secondary: z.string().min(4),
  accent: z.string().min(4),
  success: z.string().min(4),
  warning: z.string().min(4),
  danger: z.string().min(4),
})
const DomainsSchema = z.array(z.string().min(3))
const LogosSchema = z.object({
  principal: z.string().min(1),
  oscuro: z.string().min(1),
  claro: z.string().min(1),
  favicon: z.string().min(1),
})
const AcademiaSchema = z.object({
  nombre: z.string().min(1),
  razonSocial: z.string().min(1),
  cif: z.string().min(1),
  direccion: z.string().min(1),
  codigoPostal: z.string().min(1),
  ciudad: z.string().min(1),
  provincia: z.string().min(1),
  telefono1: z.string().min(1),
  telefono2: z.string().min(1),
  email1: z.string().min(1),
  email2: z.string().min(1),
  web: z.string().min(1),
  horario: z.string().min(1),
  facebook: z.string().min(1),
  twitter: z.string().min(1),
  instagram: z.string().min(1),
  linkedin: z.string().min(1),
  youtube: z.string().min(1),
})

// Branding structure stored in tenant.branding jsonb
interface TenantBranding {
  academia?: z.infer<typeof AcademiaSchema>
  logos?: z.infer<typeof LogosSchema>
  theme?: z.infer<typeof PersonalizacionSchema>
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

// Mock data
const mockConfig: ConfigData = {
  academia: {
    nombre: 'AKADEMATE',
    razonSocial: 'Akademate Platform S.L.',
    cif: 'B12345678',
    direccion: 'Calle Principal 123',
    codigoPostal: '28001',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    telefono1: '+34 912 345 678',
    telefono2: '+34 912 345 679',
    email1: 'info@akademate.com',
    email2: 'support@akademate.com',
    web: 'https://akademate.com',
    horario: 'Lunes a Viernes: 9:00 - 18:00',
    facebook: 'https://facebook.com/akademate',
    twitter: 'https://x.com/akademate',
    instagram: 'https://instagram.com/akademate',
    linkedin: 'https://linkedin.com/company/akademate',
    youtube: 'https://youtube.com/@akademate',
  },
  logos: {
    principal: '/logos/akademate-logo.svg',
    oscuro: '/logos/akademate-logo.svg',
    claro: '/logos/akademate-logo-alpha.svg',
    favicon: '/logos/akademate-favicon.svg',
  },
  personalizacion: {
    primary: '#0066cc',
    secondary: '#00cc66',
    accent: '#ff6600',
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
   
  const results = await db
    .select({ id: tenants.id, name: tenants.name, branding: tenants.branding })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
    .execute()
  const first = results[0]
   
  return first as TenantBrandingResult | undefined
}

function resolveTenantId(inputTenantId?: string | null): string | null {
  const envTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? null
  const uuidSchema = z.string().uuid()
  const fromInput = uuidSchema.safeParse(inputTenantId)
  if (fromInput.success) return fromInput.data

  const fromEnv = uuidSchema.safeParse(envTenantId)
  if (fromEnv.success) return fromEnv.data

  return null
}

function mapAcademiaInput(data: unknown): z.infer<typeof AcademiaSchema> | null {
  const raw = (data ?? {}) as Record<string, unknown>
  const maybeApiShape = AcademiaSchema.safeParse(raw)
  if (maybeApiShape.success) return maybeApiShape.data

  const mapped = {
    nombre: typeof raw.academyName === 'string' ? raw.academyName : '',
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
   
  const results = await db
    .select({ domains: tenants.domains })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
    .execute()
  const first = results[0]
   
  return first as TenantDomainsResult | undefined
}

async function updateTenantBranding(tenantId: string, branding: TenantBranding): Promise<void> {
   
  await db
    .update(tenants)
    .set({ branding, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .execute()
   
}

async function updateTenantDomains(tenantId: string, domains: string[]): Promise<void> {
   
  await db
    .update(tenants)
    .set({ domains, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .execute()
   
}

// ============================================================================
// Route handlers
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section')
    const tenantId = resolveTenantId(searchParams.get('tenantId'))

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
            const logos = LogosSchema.safeParse(tenant.branding?.logos ?? mockConfig.logos)
            return NextResponse.json({
              success: true,
              data: logos.success ? logos.data : mockConfig.logos,
            })
          }
        } catch {
          // Fallback to mock response when database is unavailable.
        }
      }

      return NextResponse.json({
        success: true,
        data: mockConfig.logos,
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
      const tenantId = resolveTenantId(searchParams.get('tenantId'))
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
    const tenantId = resolveTenantId(body.tenantId)

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
