'use client'

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'
// Image import removed — using native <img> for dynamic logos
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
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Plug,
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


interface IntegrationsConfig {
  ga4MeasurementId: string
  gtmContainerId: string
  metaPixelId: string
  metaAdAccountId: string
  metaBusinessId: string
  metaConversionsApiToken: string
  mailchimpApiKey: string
  whatsappBusinessId: string
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

interface ApiKeyItem {
  id: string
  name: string
  scopes: string[]
  is_active: boolean
  rate_limit_per_day: number
  last_used_at: string | null
  created_at: string
}

const ALL_SCOPES = [
  { value: 'courses:read', label: 'Cursos (Lectura)' },
  { value: 'courses:write', label: 'Cursos (Escritura)' },
  { value: 'cycles:read', label: 'Ciclos (Lectura)' },
  { value: 'cycles:write', label: 'Ciclos (Escritura)' },
  { value: 'campuses:read', label: 'Sedes (Lectura)' },
  { value: 'campuses:write', label: 'Sedes (Escritura)' },
  { value: 'staff:read', label: 'Personal (Lectura)' },
  { value: 'staff:write', label: 'Personal (Escritura)' },
  { value: 'convocatorias:read', label: 'Convocatorias (Lectura)' },
  { value: 'convocatorias:write', label: 'Convocatorias (Escritura)' },
  { value: 'students:read', label: 'Alumnos (Lectura)' },
  { value: 'students:write', label: 'Alumnos (Escritura)' },
  { value: 'enrollments:read', label: 'Matriculas (Lectura)' },
  { value: 'enrollments:write', label: 'Matriculas (Escritura)' },
  { value: 'analytics:read', label: 'Analiticas (Lectura)' },
  { value: 'keys:manage', label: 'API Keys (Gestion)' },
]

// ---------------------------------------------------------------------------
// Sections config
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'personalizacion', label: 'Personalizacion', icon: Palette },
  { id: 'areas', label: 'Areas', icon: BookOpen },
  { id: 'integraciones', label: 'Integraciones', icon: Plug },
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

  // ---- Integrations state ----
  const [integrations, setIntegrations] = useState<IntegrationsConfig>({
    ga4MeasurementId: '', gtmContainerId: '', metaPixelId: '', metaAdAccountId: '',
    metaBusinessId: '', metaConversionsApiToken: '', mailchimpApiKey: '', whatsappBusinessId: '',
  })
  const [showCapiToken, setShowCapiToken] = useState(false)
  const [showMailchimpKey, setShowMailchimpKey] = useState(false)

  // ---- API Keys state ----
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['courses:read', 'cycles:read', 'analytics:read'])
  const [createdKeyPlaintext, setCreatedKeyPlaintext] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [creatingKey, setCreatingKey] = useState(false)

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

        // Load integrations from branding
        const brandingRes = await fetch(`/api/config?section=integrations&tenantId=${tenantId}`)
        if (brandingRes.ok) {
          const payload = await brandingRes.json()
          if (payload.data) {
            setIntegrations(prev => ({ ...prev, ...payload.data }))
          }
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

  const handleConsentToggle = (key: keyof ConsentPreferences) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ---- Logo upload (instant) ----
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUploaded, setLogoUploaded] = useState(false)

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setLogos((prev) => ({ ...prev, principal: previewUrl }))
    setUploadingLogo(true)
    setLogoUploaded(false)
    try {
      const formData = new FormData()
      formData.append('file', file, file.name)
      formData.append('alt', 'Logo de la academia')
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (res.ok) {
        const uploaded = await res.json()
        const uploadedUrl = uploaded.doc?.url || `/media/${uploaded.doc?.filename}`
        URL.revokeObjectURL(previewUrl)
        setLogos((prev) => ({ ...prev, principal: uploadedUrl, oscuro: uploadedUrl, claro: uploadedUrl }))
        setLogoUploaded(true)
        setTimeout(() => setLogoUploaded(false), 3000)
      } else {
        console.error('Logo upload failed:', res.status)
      }
    } catch (err) {
      console.error('Logo upload error:', err)
    } finally {
      setUploadingLogo(false)
    }
  }

  const addDomain = () => setDomains((prev) => [...prev, ''])
  const removeDomain = (index: number) => setDomains((prev) => prev.filter((_, i) => i !== index))
  const updateDomain = (index: number, value: string) => {
    setDomains((prev) => prev.map((d, i) => (i === index ? value : d)))
  }

  // ---- API Keys functions ----
  const loadApiKeys = useCallback(async () => {
    setApiKeysLoading(true)
    try {
      const res = await fetch('/api/internal/api-keys')
      if (res.ok) {
        const json = await res.json()
        setApiKeys(json.data || [])
      }
    } catch (err) {
      console.error('Failed to load API keys:', err)
    } finally {
      setApiKeysLoading(false)
    }
  }, [])

  useEffect(() => { void loadApiKeys() }, [loadApiKeys])

  const createApiKey = async () => {
    if (!newKeyName.trim() || newKeyScopes.length === 0) return
    setCreatingKey(true)
    try {
      const res = await fetch('/api/internal/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes }),
      })
      if (res.ok) {
        const json = await res.json()
        setCreatedKeyPlaintext(json.data?.plain_key || null)
        setNewKeyName('')
        setNewKeyScopes(['courses:read', 'cycles:read', 'analytics:read'])
        void loadApiKeys()
      }
    } catch (err) {
      console.error('Failed to create API key:', err)
    } finally {
      setCreatingKey(false)
    }
  }

  const revokeApiKey = async (keyId: string) => {
    try {
      await fetch(`/api/internal/api-keys/${keyId}`, { method: 'DELETE' })
      void loadApiKeys()
    } catch (err) {
      console.error('Failed to revoke API key:', err)
    }
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
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
                    const endpoint = '/api/config'
                    // Logo already uploaded instantly via handleLogoFile — no blob URLs
                    const results = await Promise.all([
                      fetch(endpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ section: 'personalizacion', tenantId, data: colors }),
                      }),
                      fetch(endpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ section: 'logos', tenantId, data: logos }),
                      }),
                      fetch(endpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ section: 'academia', tenantId, data: academia }),
                      }),
                    ])
                    if (results.every((r) => r.ok)) {
                      await refresh()
                      showSaved('personalizacion')
                      window.dispatchEvent(new Event('config-updated'))
                    } else {
                      for (let i = 0; i < results.length; i++) {
                        if (!results[i].ok) {
                          const err = await results[i].json().catch(() => ({}))
                          console.error(`Save error [${['personalizacion','logos','academia'][i]}]:`, results[i].status, err)
                        }
                      }
                    }
                  } catch (err) {
                    console.error('Error saving personalizacion:', err)
                  } finally {
                    setSavingSection(null)
                  }
                }}
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Logo de la Academia
                </h4>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 rounded-xl border border-border bg-muted/50 p-4 flex items-center justify-center w-32 h-32">
                    {logos.principal ? (
                      <img
                        src={logos.principal}
                        alt="Logo"
                        className="object-contain max-h-24 max-w-24"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Subir logo</Label>
                      <label
                        className="relative max-w-md border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block"
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary') }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary') }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('border-primary')
                          const file = e.dataTransfer.files?.[0]
                          if (file) void handleLogoFile(file)
                        }}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {uploadingLogo ? 'Subiendo...' : <>Arrastra una imagen o <span className="text-primary font-medium">haz click para seleccionar</span></>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG o SVG. Recomendado: 512x512px</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) void handleLogoFile(file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                      {logoUploaded && (
                        <p className="text-xs text-green-500 flex items-center gap-1"><Check className="h-3 w-3" /> Logo subido correctamente</p>
                      )}
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

              {/* Brand color - single color */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Color de Marca
                </h4>
                <div className="max-w-md space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Este color se aplica a botones, enlaces, sidebar, badges y todos los elementos de la plataforma.
                  </p>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      id="color-primary"
                      value={colors.primary}
                      onChange={(e) => {
                        const hex = e.target.value
                        setColors((prev) => ({ ...prev, primary: hex, accent: hex }))
                      }}
                      className="h-12 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                    />
                    <div className="space-y-1">
                      <Input
                        value={colors.primary}
                        onChange={(e) => {
                          const hex = e.target.value
                          setColors((prev) => ({ ...prev, primary: hex, accent: hex }))
                        }}
                        className="font-mono text-sm max-w-28"
                        maxLength={7}
                      />
                      <p className="text-xs text-muted-foreground">Codigo hexadecimal</p>
                    </div>
                    <div
                      className="h-10 flex-1 rounded-lg border border-border flex items-center justify-center text-sm font-medium text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      Vista previa
                    </div>
                  </div>
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
                    Gestiona las areas de conocimiento para ciclos y cursos
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href="/administracion/areas-estudio">
                  Gestionar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </Button>
            </CardHeader>
          </Card>
        </section>

        {/* ================================================================
            INTEGRACIONES
        ================================================================ */}
        <section id="integraciones" ref={setRef('integraciones')} className="scroll-mt-20 space-y-4">
          {/* Google */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Plug className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Google</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Google Analytics 4 y Google Tag Manager
                  </p>
                </div>
              </div>
              <SaveButton section="integrations-google" onClick={() => void saveSection('integrations', integrations)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cfg-ga4">GA4 Measurement ID</Label>
                  <Input
                    id="cfg-ga4"
                    value={integrations.ga4MeasurementId}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, ga4MeasurementId: e.target.value }))}
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-gtm">GTM Container ID</Label>
                  <Input
                    id="cfg-gtm"
                    value={integrations.gtmContainerId}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, gtmContainerId: e.target.value }))}
                    placeholder="GTM-XXXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta / Facebook */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Plug className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Meta / Facebook</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pixel, Conversions API y cuentas publicitarias
                  </p>
                </div>
              </div>
              <SaveButton section="integrations-meta" onClick={() => void saveSection('integrations', integrations)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cfg-pixel">Meta Pixel ID</Label>
                  <Input
                    id="cfg-pixel"
                    value={integrations.metaPixelId}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, metaPixelId: e.target.value }))}
                    placeholder="ID del Pixel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-ad-account">Meta Ad Account ID</Label>
                  <Input
                    id="cfg-ad-account"
                    value={integrations.metaAdAccountId}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, metaAdAccountId: e.target.value }))}
                    placeholder="ID de cuenta publicitaria"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-business">Meta Business ID</Label>
                  <Input
                    id="cfg-business"
                    value={integrations.metaBusinessId}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, metaBusinessId: e.target.value }))}
                    placeholder="ID del Business Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-capi">Meta Conversions API Token</Label>
                  <div className="relative">
                    <Input
                      id="cfg-capi"
                      type={showCapiToken ? 'text' : 'password'}
                      value={integrations.metaConversionsApiToken}
                      onChange={(e) => setIntegrations(prev => ({ ...prev, metaConversionsApiToken: e.target.value }))}
                      placeholder="Token de Conversions API"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCapiToken(!showCapiToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCapiToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email y Messaging */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Email y Messaging</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mailchimp y WhatsApp Business
                  </p>
                </div>
              </div>
              <SaveButton section="integrations-messaging" onClick={() => void saveSection('integrations', integrations)} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cfg-mailchimp">Mailchimp API Key</Label>
                  <div className="relative">
                    <Input
                      id="cfg-mailchimp"
                      type={showMailchimpKey ? 'text' : 'password'}
                      value={integrations.mailchimpApiKey}
                      onChange={(e) => setIntegrations(prev => ({ ...prev, mailchimpApiKey: e.target.value }))}
                      placeholder="API Key de Mailchimp"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMailchimpKey(!showMailchimpKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showMailchimpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfg-whatsapp">WhatsApp Business ID</Label>
                  <Input
                    id="cfg-whatsapp"
                    value={integrations.whatsappBusinessId}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, whatsappBusinessId: e.target.value }))}
                    placeholder="ID de WhatsApp Business"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            Integraciones
        ================================================================ */}
        <section id="integraciones" ref={setRef('integraciones')} className="scroll-mt-20 space-y-4">
          {/* Google */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5" />
                Google
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Google Analytics 4 ID</Label>
                  <Input
                    placeholder="G-XXXXXXXXXX"
                    value={integrations.ga4MeasurementId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, ga4MeasurementId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Google Tag Manager ID</Label>
                  <Input
                    placeholder="GTM-XXXXXXX"
                    value={integrations.gtmContainerId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, gtmContainerId: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta / Facebook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plug className="h-5 w-5" />
                Meta / Facebook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Pixel ID</Label>
                  <Input
                    placeholder="1189071876088388"
                    value={integrations.metaPixelId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, metaPixelId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ad Account ID</Label>
                  <Input
                    placeholder="730494526974837"
                    value={integrations.metaAdAccountId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, metaAdAccountId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business ID</Label>
                  <Input
                    placeholder="598666359737310"
                    value={integrations.metaBusinessId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, metaBusinessId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conversions API Token</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showCapiToken ? 'text' : 'password'}
                      placeholder="EAAHqi5Y9X4..."
                      value={integrations.metaConversionsApiToken}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, metaConversionsApiToken: e.target.value }))}
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowCapiToken(!showCapiToken)}>
                      {showCapiToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email y Messaging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5" />
                Email y Messaging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mailchimp API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showMailchimpKey ? 'text' : 'password'}
                      placeholder="xxxxxxxx-us1"
                      value={integrations.mailchimpApiKey}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, mailchimpApiKey: e.target.value }))}
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowMailchimpKey(!showMailchimpKey)}>
                      {showMailchimpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Business ID</Label>
                  <Input
                    placeholder="ID de WhatsApp Business"
                    value={integrations.whatsappBusinessId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setIntegrations(prev => ({ ...prev, whatsappBusinessId: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveSection('integrations', integrations)} disabled={savingSection === 'integrations'}>
                  {savingSection === 'integrations' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : savedSection === 'integrations' ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {savedSection === 'integrations' ? 'Guardado' : 'Guardar Integraciones'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================================================================
            APIs
        ================================================================ */}
        <section id="apis" ref={setRef('apis')} className="scroll-mt-20 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Genera claves para acceso programatico a tu academia via REST API
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => { setShowCreateKey(true); setCreatedKeyPlaintext(null) }}>
                <Plus className="mr-1 h-4 w-4" /> Nueva API Key
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Created key alert */}
              {createdKeyPlaintext && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Guarda esta clave ahora — no se mostrara de nuevo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background rounded px-3 py-2 text-xs font-mono break-all border">
                      {createdKeyPlaintext}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(createdKeyPlaintext)}>
                      {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Create key form */}
              {showCreateKey && !createdKeyPlaintext && (
                <div className="rounded-lg border border-border p-4 space-y-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      placeholder="Ej: Integracion MCP, ChatGPT, CRM..."
                      value={newKeyName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">Permisos</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_SCOPES.map((s) => (
                        <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newKeyScopes.includes(s.value)}
                            onChange={() => toggleScope(s.value)}
                            className="rounded border-border"
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void createApiKey()} disabled={creatingKey || !newKeyName.trim()}>
                      {creatingKey ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Key className="mr-1 h-4 w-4" />}
                      Generar API Key
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowCreateKey(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Keys list */}
              {apiKeysLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay API keys creadas.</p>
                  <p className="text-xs mt-1">Crea una para conectar herramientas externas como MCP, ChatGPT o tu CRM.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{k.name}</span>
                          <Badge variant={k.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {k.is_active ? 'Activa' : 'Revocada'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {k.scopes.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] font-mono">{s}</Badge>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Creada {new Date(k.created_at).toLocaleDateString('es-ES')}
                          {k.last_used_at && ` · Ultimo uso ${new Date(k.last_used_at).toLocaleDateString('es-ES')}`}
                        </p>
                      </div>
                      {k.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => void revokeApiKey(k.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* API docs link */}
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <p><strong>Base URL:</strong> <code className="bg-background px-1 rounded">https://app.akademate.com/api/v1/</code></p>
                <p className="mt-1"><strong>Autenticacion:</strong> <code className="bg-background px-1 rounded">Authorization: Bearer {'<tu-api-key>'}</code></p>
                <p className="mt-1"><strong>Documentacion:</strong>{' '}
                  <a href="/api/v1/openapi" target="_blank" className="text-primary hover:underline">
                    OpenAPI Spec (JSON)
                  </a>
                </p>
                <p className="mt-1">17 endpoints disponibles: ciclos, cursos, sedes, personal, convocatorias, alumnos, matriculas, leads, analiticas, media.</p>
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
