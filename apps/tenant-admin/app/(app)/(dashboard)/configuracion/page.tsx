'use client'

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Badge } from '@payload-config/components/ui/badge'
import { Switch } from '@payload-config/components/ui/switch'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Settings,
  Building2,
  Palette,
  BookOpen,
  Key,
  ShieldCheck,
  ToggleLeft,
  Globe,
  Save,
  Check,
  Upload,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { useTenantBranding } from '@/app/providers/tenant-branding'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AcademiaConfig {
  nombre: string
  razonSocial: string
  cif: string
  direccion: string
  codigoPostal: string
  ciudad: string
  provincia: string
  telefono1: string
  telefono2: string
  email1: string
  email2: string
  web: string
  horario: string
}

interface LogosConfig {
  principal: string
  oscuro: string
  claro: string
  favicon: string
}

interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
}


interface ConsentPreferences {
  marketing_email: boolean
  marketing_sms: boolean
  marketing_phone: boolean
  analytics: boolean
  third_party_sharing: boolean
  profiling: boolean
  newsletter: boolean
}

interface FeatureFlag {
  key: string
  type: 'boolean' | 'percentage' | 'variant'
  effectiveValue: unknown
  eligible: boolean
}

// ---------------------------------------------------------------------------
// Sections config
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'personalizacion', label: 'Personalizacion', icon: Palette },
  { id: 'areas', label: 'Areas', icon: BookOpen },
  { id: 'apis', label: 'APIs', icon: Key },
  { id: 'gdpr', label: 'GDPR', icon: ShieldCheck },
  { id: 'flags', label: 'Feature Flags', icon: ToggleLeft },
  { id: 'dominios', label: 'Dominios', icon: Globe },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_COLORS: ColorScheme = {
  primary: '#0066cc',
  secondary: '#64748b',
  accent: '#1d4ed8',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
}

const CONSENT_LABELS: Record<string, string> = {
  marketing_email: 'Emails de marketing',
  marketing_sms: 'SMS de marketing',
  marketing_phone: 'Llamadas comerciales',
  analytics: 'Cookies de analisis',
  third_party_sharing: 'Compartir con terceros',
  profiling: 'Perfilado de usuarios',
  newsletter: 'Newsletter',
}

const COLOR_FIELDS = [
  { key: 'primary' as const, label: 'Primario', hint: 'Botones, links, sidebar' },
  { key: 'secondary' as const, label: 'Secundario', hint: 'Fondos secundarios' },
  { key: 'accent' as const, label: 'Acento', hint: 'Elementos destacados' },
  { key: 'success' as const, label: 'Exito', hint: 'Estados positivos' },
  { key: 'warning' as const, label: 'Alerta', hint: 'Avisos' },
  { key: 'danger' as const, label: 'Error', hint: 'Errores, destructivo' },
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConfiguracionUnifiedPage() {
  const { branding, refresh } = useTenantBranding()
  const tenantId = branding.tenantId

  // Active section tracking
  const [activeSection, setActiveSection] = useState<SectionId>('general')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Save feedback
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  // ---- General state ----
  const [academia, setAcademia] = useState<AcademiaConfig>({
    nombre: '',
    razonSocial: '',
    cif: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    telefono1: '',
    telefono2: '',
    email1: '',
    email2: '',
    web: '',
    horario: '',
  })
  const [logos, setLogos] = useState<LogosConfig>({
    principal: '/logos/akademate-logo-official.png',
    oscuro: '/logos/akademate-logo-official.png',
    claro: '/logos/akademate-logo-official.png',
    favicon: '/logos/akademate-favicon.svg',
  })

  // ---- Personalizacion state ----
  const [colors, setColors] = useState<ColorScheme>(DEFAULT_COLORS)

  // ---- GDPR state ----
  const [consents, setConsents] = useState<ConsentPreferences>({
    marketing_email: false,
    marketing_sms: false,
    marketing_phone: false,
    analytics: false,
    third_party_sharing: false,
    profiling: false,
    newsletter: false,
  })

  // ---- Flags state ----
  const [flags, setFlags] = useState<FeatureFlag[]>([])

  // ---- Domains state ----
  const [domains, setDomains] = useState<string[]>([])

  // ---- Loading ----
  const [loading, setLoading] = useState(true)

  // ---------------------------------------------------------------------------
  // Fetch all config on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [academiaRes, logosRes, colorsRes, flagsRes, domainsRes] = await Promise.all([
          fetch(`/api/config?section=academia&tenantId=${tenantId}`),
          fetch(`/api/config?section=logos&tenantId=${tenantId}`),
          fetch(`/api/config?section=personalizacion&tenantId=${tenantId}`),
          fetch(`/api/feature-flags?tenantId=${tenantId}`),
          fetch(`/api/config?section=domains&tenantId=${tenantId}`),
        ])

        if (academiaRes.ok) {
          const payload = await academiaRes.json()
          if (payload.data) setAcademia((prev) => ({ ...prev, ...payload.data }))
        }
        if (logosRes.ok) {
          const payload = await logosRes.json()
          if (payload.data) setLogos((prev) => ({ ...prev, ...payload.data }))
        }
        if (colorsRes.ok) {
          const payload = await colorsRes.json()
          if (payload.data) setColors((prev) => ({ ...prev, ...payload.data }))
        }
        if (flagsRes.ok) {
          const payload = await flagsRes.json()
          if (payload.flags) setFlags(payload.flags)
        }
        if (domainsRes.ok) {
          const payload = await domainsRes.json()
          if (Array.isArray(payload.data)) setDomains(payload.data)
        }
      } catch (err) {
        console.error('Error loading configuration:', err)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [tenantId])

  // ---------------------------------------------------------------------------
  // Intersection Observer for active tab
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (loading) return

    const observers: IntersectionObserver[] = []

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id]
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id)
            }
          })
        },
        { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 },
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [loading])

  // ---------------------------------------------------------------------------
  // Scroll to section
  // ---------------------------------------------------------------------------

  const scrollTo = (id: SectionId) => {
    const el = sectionRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ---------------------------------------------------------------------------
  // Save helpers
  // ---------------------------------------------------------------------------

  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showSaved = (section: string) => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSavedSection(section)
    savedTimerRef.current = setTimeout(() => setSavedSection(null), 3000)
  }
  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }, [])

  const saveSection = useCallback(
    async (section: string, data: unknown, endpoint = '/api/config') => {
      setSavingSection(section)
      try {
        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, tenantId, data }),
        })
        if (res.ok) {
          await refresh()
          showSaved(section)
          window.dispatchEvent(new Event('config-updated'))
        }
      } catch (err) {
        console.error(`Error saving ${section}:`, err)
      } finally {
        setSavingSection(null)
      }
    },
    [tenantId, refresh],
  )

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAcademiaChange = (field: keyof AcademiaConfig) => (e: ChangeEvent<HTMLInputElement>) => {
    setAcademia((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleColorChange = (key: keyof ColorScheme, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const handleLogoUpload = (type: keyof LogosConfig, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const prevUrl = logos[type]
      if (prevUrl?.startsWith('blob:')) URL.revokeObjectURL(prevUrl)
      const url = URL.createObjectURL(file)
      setLogos((prev) => ({ ...prev, [type]: url }))
    }
  }

  const handleConsentToggle = (key: keyof ConsentPreferences) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const addDomain = () => setDomains((prev) => [...prev, ''])
  const removeDomain = (index: number) => setDomains((prev) => prev.filter((_, i) => i !== index))
  const updateDomain = (index: number, value: string) => {
    setDomains((prev) => prev.map((d, i) => (i === index ? value : d)))
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const SaveButton = ({ section, onClick }: { section: string; onClick: () => void }) => (
    <Button
      size="sm"
      onClick={onClick}
      disabled={savingSection === section}
    >
      {savingSection === section ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : savedSection === section ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {savedSection === section ? 'Guardado' : 'Guardar'}
    </Button>
  )

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Configuracion"
          description="Cargando ajustes del sistema..."
          icon={Settings}
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="px-0 pb-4">
        <PageHeader
          title="Configuracion"
          description="Todos los ajustes de tu academia en un solo lugar"
          icon={Settings}
        />
      </div>

      {/* ── Layout: sidebar nav + content ── */}
      <div className="flex gap-8 pt-4">
        {/* Vertical sidebar nav */}
        <nav className="hidden md:flex flex-col gap-1 w-48 flex-shrink-0 sticky top-4 self-start">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`
                flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left
                ${
                  activeSection === id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile horizontal nav */}
        <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border -mx-4 px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${
                    activeSection === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sections content */}
        <div className="space-y-8 flex-1 min-w-0 max-w-4xl">
        {/* ================================================================
            GENERAL
        ================================================================ */}
        <section id="general" ref={setRef('general')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Informacion General</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Datos de la academia, datos fiscales y contacto
                  </p>
                </div>
              </div>
              <SaveButton section="academia" onClick={() => void saveSection('academia', academia)} />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cfg-nombre">Nombre Comercial</Label>
                  <Input
                    id="cfg-nombre"
                    value={academia.nombre}
                    onChange={handleAcademiaChange('nombre')}
                    placeholder="Nombre de la academia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-razon">Razon Social</Label>
                  <Input
                    id="cfg-razon"
                    value={academia.razonSocial}
                    onChange={handleAcademiaChange('razonSocial')}
                    placeholder="S.L. / S.A."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-cif">CIF / NIF</Label>
                  <Input
                    id="cfg-cif"
                    value={academia.cif}
                    onChange={handleAcademiaChange('cif')}
                    placeholder="B12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-web">Sitio Web</Label>
                  <Input
                    id="cfg-web"
                    value={academia.web}
                    onChange={handleAcademiaChange('web')}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Contacto
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cfg-tel1">Telefono Principal</Label>
                    <Input
                      id="cfg-tel1"
                      value={academia.telefono1}
                      onChange={handleAcademiaChange('telefono1')}
                      placeholder="+34 ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-tel2">Telefono Secundario</Label>
                    <Input
                      id="cfg-tel2"
                      value={academia.telefono2}
                      onChange={handleAcademiaChange('telefono2')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-email1">Email Principal</Label>
                    <Input
                      id="cfg-email1"
                      type="email"
                      value={academia.email1}
                      onChange={handleAcademiaChange('email1')}
                      placeholder="info@..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-email2">Email Soporte</Label>
                    <Input
                      id="cfg-email2"
                      type="email"
                      value={academia.email2}
                      onChange={handleAcademiaChange('email2')}
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Direccion
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="cfg-dir">Direccion</Label>
                    <Input
                      id="cfg-dir"
                      value={academia.direccion}
                      onChange={handleAcademiaChange('direccion')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-cp">Codigo Postal</Label>
                    <Input
                      id="cfg-cp"
                      value={academia.codigoPostal}
                      onChange={handleAcademiaChange('codigoPostal')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfg-city">Ciudad</Label>
                    <Input
                      id="cfg-city"
                      value={academia.ciudad}
                      onChange={handleAcademiaChange('ciudad')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            PERSONALIZACION
        ================================================================ */}
        <section id="personalizacion" ref={setRef('personalizacion')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Personalizacion</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Logo, nombre y colores de marca de tu academia
                  </p>
                </div>
              </div>
              <SaveButton
                section="personalizacion"
                onClick={async () => {
                  setSavingSection('personalizacion')
                  try {
                    await Promise.all([
                      saveSection('personalizacion', colors),
                      saveSection('logos', logos),
                      saveSection('academia', { nombre: academia.nombre }),
                    ])
                  } finally {
                    setSavingSection(null)
                  }
                }}
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo upload */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Logo de la Academia
                </h4>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 rounded-xl border border-border bg-muted/50 p-4 flex items-center justify-center w-32 h-32">
                    {logos.principal ? (
                      <Image
                        src={logos.principal}
                        alt="Logo"
                        width={96}
                        height={96}
                        className="object-contain max-h-24"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Subir nuevo logo</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/svg+xml,image/png,image/jpeg,image/webp"
                          onChange={(e) => handleLogoUpload('principal', e)}
                          className="max-w-xs"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        SVG, PNG o JPEG. Recomendado: 512x512px o vector.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academy name */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Nombre de la Academia
                </h4>
                <div className="max-w-md space-y-2">
                  <Label htmlFor="brand-name">
                    Nombre visible en sidebar y login
                  </Label>
                  <Input
                    id="brand-name"
                    value={academia.nombre}
                    onChange={handleAcademiaChange('nombre')}
                    placeholder="Nombre de tu academia"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este nombre aparece en la barra lateral, pagina de login y emails.
                  </p>
                </div>
              </div>

              {/* Color palette */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Colores de Marca
                </h4>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {COLOR_FIELDS.map(({ key, label, hint }) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`color-${key}`} className="text-sm">
                        {label}
                      </Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id={`color-${key}`}
                          value={colors[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="h-10 w-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                        />
                        <Input
                          value={colors[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="font-mono text-sm max-w-28"
                          maxLength={7}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                  ))}
                </div>

                {/* Live preview strip */}
                <div className="mt-4 flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground mr-2">Vista previa:</span>
                  {Object.entries(colors).map(([key, hex]) => (
                    <div
                      key={key}
                      className="h-8 w-8 rounded-md border border-border"
                      style={{ backgroundColor: hex }}
                      title={key}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            AREAS DE ESTUDIO
        ================================================================ */}
        <section id="areas" ref={setRef('areas')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Areas de Estudio</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestiona las areas academicas y sus cursos asociados
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="/configuracion/areas">
                  Gestionar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border p-4 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Accede a la pagina completa de areas para crear, editar y organizar
                  las areas de estudio de tu academia.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            APIs
        ================================================================ */}
        <section id="apis" ref={setRef('apis')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>API Keys y Webhooks</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestiona tus claves de API y endpoints de webhook
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="/configuracion/apis">
                  Gestionar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border p-4 text-center text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Accede a la pagina completa de APIs para crear claves, configurar
                  permisos y gestionar webhooks.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            GDPR
        ================================================================ */}
        <section id="gdpr" ref={setRef('gdpr')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Privacidad y GDPR</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configuracion de consentimientos y proteccion de datos
                  </p>
                </div>
              </div>
              <SaveButton section="gdpr" onClick={() => void saveSection('gdpr', { consents })} />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(CONSENT_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                    </div>
                    <Switch
                      checked={consents[key as keyof ConsentPreferences]}
                      onCheckedChange={() => handleConsentToggle(key as keyof ConsentPreferences)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            FEATURE FLAGS
        ================================================================ */}
        <section id="flags" ref={setRef('flags')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <ToggleLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Feature Flags</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Activa o desactiva funcionalidades de tu academia
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="/configuracion/flags">
                  Gestionar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              {flags.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-center text-muted-foreground">
                  <ToggleLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay feature flags configurados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flags.slice(0, 6).map((flag) => (
                    <div key={flag.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {flag.key}
                        </code>
                        {!flag.eligible && (
                          <Badge variant="secondary" className="text-xs">
                            Plan requerido
                          </Badge>
                        )}
                      </div>
                      <Badge variant={flag.effectiveValue ? 'default' : 'outline'} className="text-xs">
                        {flag.effectiveValue ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                  {flags.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      y {flags.length - 6} mas...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            DOMINIOS
        ================================================================ */}
        <section id="dominios" ref={setRef('dominios')} className="scroll-mt-20">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Dominios</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestiona los dominios asociados a tu academia
                  </p>
                </div>
              </div>
              <SaveButton
                section="domains"
                onClick={() => void saveSection('domains', domains.filter((d) => d.trim() !== ''))}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {domains.length === 0 ? (
                <div className="rounded-lg border border-border p-4 text-center text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay dominios configurados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.map((domain, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        value={domain}
                        onChange={(e) => updateDomain(index, e.target.value)}
                        placeholder="example.com"
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeDomain(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={addDomain}
              >
                <Plus className="mr-2 h-4 w-4" />
                Anadir dominio
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
      </div>{/* close flex layout */}
    </div>
  )
}
