'use client'
import { useState, useEffect, type ChangeEvent } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Image as ImageIcon,
  Check,
  Upload,
  ExternalLink,
} from 'lucide-react'
import { useTenantBranding } from '@/app/providers/tenant-branding'

interface AcademyConfig {
  academyName: string
  fiscalName: string
  cif: string
  address: string
  city: string
  postalCode: string
  country: string
  phone: string
  phoneAlternative: string
  email: string
  emailAdmissions: string
  emailSupport: string
  website: string
  facebook: string
  twitter: string
  instagram: string
  linkedin: string
  youtube: string
  description: string
  slogan: string
  foundedYear: string
  accreditation: string
}

interface LogosConfig {
  principal: string
  oscuro: string
  claro: string
  favicon: string
}

interface ApiResponse<T> {
  data: T
}

interface AcademiaApiConfig {
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
  facebook: string
  twitter: string
  instagram: string
  linkedin: string
  youtube: string
}

function mapApiAcademiaToForm(data: Partial<AcademiaApiConfig>): Partial<AcademyConfig> {
  return {
    academyName: data.nombre,
    fiscalName: data.razonSocial,
    cif: data.cif,
    address: data.direccion,
    postalCode: data.codigoPostal,
    city: data.ciudad,
    country: data.provincia,
    phone: data.telefono1,
    phoneAlternative: data.telefono2,
    email: data.email1,
    emailSupport: data.email2,
    website: data.web,
    facebook: data.facebook,
    twitter: data.twitter,
    instagram: data.instagram,
    linkedin: data.linkedin,
    youtube: data.youtube,
  }
}

function mapFormToApiAcademia(data: AcademyConfig): AcademiaApiConfig {
  return {
    nombre: data.academyName,
    razonSocial: data.fiscalName,
    cif: data.cif,
    direccion: data.address,
    codigoPostal: data.postalCode,
    ciudad: data.city,
    provincia: data.country,
    telefono1: data.phone,
    telefono2: data.phoneAlternative,
    email1: data.email,
    email2: data.emailSupport,
    web: data.website,
    horario: 'Lunes a Viernes: 9:00 - 18:00',
    facebook: data.facebook,
    twitter: data.twitter,
    instagram: data.instagram,
    linkedin: data.linkedin,
    youtube: data.youtube,
  }
}

export default function ConfigGeneralPage() {
  const { branding, refresh } = useTenantBranding()
  const [showSuccess, setShowSuccess] = useState(false)
  const [config, setConfig] = useState<AcademyConfig>({
    // Información de la Academia
    academyName: 'AKADEMATE',
    fiscalName: 'Akademate Platform S.L.',
    cif: 'B12345678',

    // Contacto
    address: 'Calle Principal 123, 28001 Madrid',
    city: 'Madrid',
    postalCode: '28001',
    country: 'España',
    phone: '+34 910 123 456',
    phoneAlternative: '+34 910 654 321',
    email: 'info@akademate.com',
    emailAdmissions: 'admisiones@akademate.com',
    emailSupport: 'support@akademate.com',
    website: 'https://akademate.com',

    // Redes Sociales
    facebook: 'https://facebook.com/akademate',
    twitter: 'https://x.com/akademate',
    instagram: 'https://instagram.com/akademate',
    linkedin: 'https://linkedin.com/company/akademate',
    youtube: 'https://youtube.com/@akademate',

    // Información Adicional
    description:
      'Plataforma SaaS multitenant para academias y centros de formación con módulos de gestión académica, comercial y campus virtual.',
    slogan: 'La plataforma operativa de tu academia',
    foundedYear: '2026',
    accreditation: 'Infraestructura cloud y estándares de seguridad aplicados a entorno educativo',
  })

  const [logos, setLogos] = useState<LogosConfig>({
    principal: '/logos/akademate-logo-official.png',
    oscuro: '/logos/akademate-logo-official.png',
    claro: '/logos/akademate-logo-official.png',
    favicon: '/logos/akademate-favicon.svg',
  })

  // Fetch existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [academiaRes, logosRes] = await Promise.all([
          fetch(`/api/config?section=academia&tenantId=${branding.tenantId}`),
          fetch(`/api/config?section=logos&tenantId=${branding.tenantId}`),
        ])

        if (academiaRes.ok) {
          const { data } = (await academiaRes.json()) as ApiResponse<Partial<AcademiaApiConfig>>
          setConfig((prev) => ({ ...prev, ...mapApiAcademiaToForm(data) }))
        }

        if (logosRes.ok) {
          const { data } = (await logosRes.json()) as ApiResponse<LogosConfig>
          setLogos(data)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      }
    }
    void fetchConfig()
  }, [branding.tenantId])

  const handleSave = async () => {
    try {
      const academiaPayload = mapFormToApiAcademia(config)

      // Save academia config
      const academiaResponse = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'academia',
          tenantId: branding.tenantId,
          data: academiaPayload,
        }),
      })

      // Save logos config
      const logosResponse = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'logos', tenantId: branding.tenantId, data: logos }),
      })

      if (academiaResponse.ok && logosResponse.ok) {
        await refresh()
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)

        // Trigger a reload of logos in other components
        window.dispatchEvent(new Event('config-updated'))
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    }
  }

  const handleLogoUpload = (type: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // For demo, use URL.createObjectURL
      // In production, upload to media library first
      const url = URL.createObjectURL(file)
      setLogos((prev) => ({ ...prev, [type]: url }))
      console.log(`Logo ${type} updated:`, file.name)
    }
  }

  const handleConfigChange =
    (field: keyof AcademyConfig) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setConfig({ ...config, [field]: e.target.value })
    }

  return (
    <div className="space-y-6 max-w-5xl" data-oid="b61obzp">
      <PageHeader
        title="Configuración General"
        description="Datos de la academia, fiscales, contacto y redes sociales"
        icon={Building2}
        actions={
          <Button onClick={handleSave} data-oid="4ipn3fx">
            <Save className="mr-2 h-4 w-4" data-oid="k3z33a." />
            Guardar Cambios
          </Button>
        }
        data-oid="a6vifmz"
      />

      {showSuccess && (
        <div
          className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2"
          data-oid="70b48ev"
        >
          <Check className="h-5 w-5" data-oid="5i8ynk8" />
          <span data-oid="inzb23s">Configuración guardada correctamente</span>
        </div>
      )}

      {/* Información de la Academia */}
      <Card data-oid="mz3v2_w">
        <CardHeader data-oid="5mfoltv">
          <CardTitle className="flex items-center gap-2" data-oid="jrohs82">
            <Building2 className="h-5 w-5" data-oid="prs3n2q" />
            Información de la Academia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="1r6fibs">
          <div className="grid gap-4 md:grid-cols-2" data-oid="pmcd_h8">
            <div className="space-y-2" data-oid="_yrjb7d">
              <Label htmlFor="academyName" data-oid="7y8u4gu">
                Nombre Comercial
              </Label>
              <Input
                id="academyName"
                value={config.academyName}
                onChange={handleConfigChange('academyName')}
                data-oid="ff-v.04"
              />
            </div>
            <div className="space-y-2" data-oid="q:f:x0z">
              <Label htmlFor="fiscalName" data-oid="dn2yvpb">
                Razón Social
              </Label>
              <Input
                id="fiscalName"
                value={config.fiscalName}
                onChange={handleConfigChange('fiscalName')}
                data-oid="4s4-npe"
              />
            </div>
            <div className="space-y-2" data-oid="6hnnj.1">
              <Label htmlFor="cif" data-oid="q5wrsj3">
                CIF/NIF
              </Label>
              <Input
                id="cif"
                value={config.cif}
                onChange={handleConfigChange('cif')}
                data-oid="i83tsf0"
              />
            </div>
            <div className="space-y-2" data-oid="7r57yyr">
              <Label htmlFor="foundedYear" data-oid="qnw5gki">
                Año de Fundación
              </Label>
              <Input
                id="foundedYear"
                value={config.foundedYear}
                onChange={handleConfigChange('foundedYear')}
                data-oid="um0k..1"
              />
            </div>
          </div>

          <div className="space-y-2" data-oid="39qhbbj">
            <Label htmlFor="description" data-oid="i_bumc4">
              Descripción de la Academia
            </Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={handleConfigChange('description')}
              rows={3}
              placeholder="Breve descripción de la academia..."
              data-oid="54ozrc:"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2" data-oid="jsvevcr">
            <div className="space-y-2" data-oid="mybo.q.">
              <Label htmlFor="slogan" data-oid="eezd63e">
                Slogan
              </Label>
              <Input
                id="slogan"
                value={config.slogan}
                onChange={handleConfigChange('slogan')}
                placeholder="Frase representativa"
                data-oid="ixn_xe4"
              />
            </div>
            <div className="space-y-2" data-oid="hfqzo3x">
              <Label htmlFor="accreditation" data-oid="axxgb._">
                Acreditaciones
              </Label>
              <Input
                id="accreditation"
                value={config.accreditation}
                onChange={handleConfigChange('accreditation')}
                data-oid="i0qum04"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card data-oid="xj6jxln">
        <CardHeader data-oid="8uuqcsj">
          <CardTitle className="flex items-center gap-2" data-oid="hyobmqe">
            <Phone className="h-5 w-5" data-oid="w750id3" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="7lc4fl9">
          <div className="space-y-2" data-oid="jccwi9s">
            <Label htmlFor="address" data-oid="c:grk78">
              <MapPin className="h-4 w-4 inline mr-1" data-oid="4ry1t35" />
              Dirección Completa
            </Label>
            <Input
              id="address"
              value={config.address}
              onChange={handleConfigChange('address')}
              data-oid="hjohoq-"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3" data-oid="sbgg:dd">
            <div className="space-y-2" data-oid="rc:mp06">
              <Label htmlFor="city" data-oid="zflkfuf">
                Ciudad
              </Label>
              <Input
                id="city"
                value={config.city}
                onChange={handleConfigChange('city')}
                data-oid="n.opbo3"
              />
            </div>
            <div className="space-y-2" data-oid="fq36bw4">
              <Label htmlFor="postalCode" data-oid="q6ahqld">
                Código Postal
              </Label>
              <Input
                id="postalCode"
                value={config.postalCode}
                onChange={handleConfigChange('postalCode')}
                data-oid="_lj5fqs"
              />
            </div>
            <div className="space-y-2" data-oid="ue:hwlj">
              <Label htmlFor="country" data-oid="-zcmw8o">
                País
              </Label>
              <Input
                id="country"
                value={config.country}
                onChange={handleConfigChange('country')}
                data-oid="xz5iiba"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2" data-oid="nbyqauu">
            <div className="space-y-2" data-oid="f:5ik7:">
              <Label htmlFor="phone" data-oid="tma68xx">
                <Phone className="h-4 w-4 inline mr-1" data-oid="fl5et33" />
                Teléfono Principal
              </Label>
              <Input
                id="phone"
                type="tel"
                value={config.phone}
                onChange={handleConfigChange('phone')}
                data-oid="vat7j16"
              />
            </div>
            <div className="space-y-2" data-oid="p.w1qab">
              <Label htmlFor="phoneAlt" data-oid="ew41eu2">
                Teléfono Alternativo
              </Label>
              <Input
                id="phoneAlt"
                type="tel"
                value={config.phoneAlternative}
                onChange={handleConfigChange('phoneAlternative')}
                data-oid="0sin2z1"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2" data-oid="uktskrm">
            <div className="space-y-2" data-oid="96hm4xw">
              <Label htmlFor="email" data-oid="u5-_wt6">
                <Mail className="h-4 w-4 inline mr-1" data-oid="3jntj8s" />
                Email General
              </Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={handleConfigChange('email')}
                data-oid="iqbfxsh"
              />
            </div>
            <div className="space-y-2" data-oid="xfwixvk">
              <Label htmlFor="emailAdmissions" data-oid="ragps7q">
                Email Admisiones
              </Label>
              <Input
                id="emailAdmissions"
                type="email"
                value={config.emailAdmissions}
                onChange={handleConfigChange('emailAdmissions')}
                data-oid="q3wvrv8"
              />
            </div>
            <div className="space-y-2" data-oid="mjx_26d">
              <Label htmlFor="emailSupport" data-oid="329qz-k">
                Email Soporte Técnico
              </Label>
              <Input
                id="emailSupport"
                type="email"
                value={config.emailSupport}
                onChange={handleConfigChange('emailSupport')}
                data-oid="fhvd1-f"
              />
            </div>
            <div className="space-y-2" data-oid="pmridq4">
              <Label htmlFor="website" data-oid="u_25f9.">
                <Globe className="h-4 w-4 inline mr-1" data-oid="4rb.8z5" />
                Sitio Web
              </Label>
              <Input
                id="website"
                type="url"
                value={config.website}
                onChange={handleConfigChange('website')}
                data-oid="eo1xfg9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociales */}
      <Card data-oid="hcyz_dj">
        <CardHeader data-oid="0yocb79">
          <CardTitle data-oid="5uh.2rg">Redes Sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="_j2od3.">
          <div className="grid gap-4 md:grid-cols-2" data-oid="f.0fqeo">
            <div className="space-y-2" data-oid="d9c70f5">
              <Label htmlFor="facebook" className="flex items-center gap-2" data-oid="vkj6hrq">
                <ExternalLink className="h-4 w-4" data-oid="38_azg." />
                Facebook
              </Label>
              <Input
                id="facebook"
                type="url"
                value={config.facebook}
                onChange={handleConfigChange('facebook')}
                placeholder="https://facebook.com/tu-pagina"
                data-oid="-9e:p9e"
              />
            </div>

            <div className="space-y-2" data-oid="po2f9b6">
              <Label htmlFor="twitter" className="flex items-center gap-2" data-oid="utxw7kd">
                <ExternalLink className="h-4 w-4" data-oid="x4x7.a2" />
                Twitter / X
              </Label>
              <Input
                id="twitter"
                type="url"
                value={config.twitter}
                onChange={handleConfigChange('twitter')}
                placeholder="https://twitter.com/tu-cuenta"
                data-oid="em4sny3"
              />
            </div>

            <div className="space-y-2" data-oid="ce699dr">
              <Label htmlFor="instagram" className="flex items-center gap-2" data-oid="fu1vtzp">
                <ExternalLink className="h-4 w-4" data-oid="2xgqyfz" />
                Instagram
              </Label>
              <Input
                id="instagram"
                type="url"
                value={config.instagram}
                onChange={handleConfigChange('instagram')}
                placeholder="https://instagram.com/tu-perfil"
                data-oid="ii8m697"
              />
            </div>

            <div className="space-y-2" data-oid="4y_qku_">
              <Label htmlFor="linkedin" className="flex items-center gap-2" data-oid="f7rrw7y">
                <ExternalLink className="h-4 w-4" data-oid="b:li8nl" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={config.linkedin}
                onChange={handleConfigChange('linkedin')}
                placeholder="https://linkedin.com/company/tu-empresa"
                data-oid="zjd12w6"
              />
            </div>

            <div className="space-y-2 md:col-span-2" data-oid="67.mq:s">
              <Label htmlFor="youtube" className="flex items-center gap-2" data-oid="m89q.hc">
                <ExternalLink className="h-4 w-4" data-oid="._wfejr" />
                YouTube
              </Label>
              <Input
                id="youtube"
                type="url"
                value={config.youtube}
                onChange={handleConfigChange('youtube')}
                placeholder="https://youtube.com/@tu-canal"
                data-oid=":h8kmxd"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos y Marcas */}
      <Card data-oid="iox6vnr">
        <CardHeader data-oid="-_0vuaf">
          <CardTitle className="flex items-center gap-2" data-oid="zq6-dez">
            <ImageIcon className="h-5 w-5" data-oid="fjov2-3" />
            Logos y Marcas
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="yk-v1kq">
          <div className="grid gap-6 md:grid-cols-2" data-oid="5rzx-a4">
            <div className="space-y-2" data-oid="u.h4m7c">
              <Label htmlFor="logo-principal" data-oid="bok:fk5">
                Logo Principal
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors"
                data-oid="3_r4nsc"
              >
                {logos.principal ? (
                  <div className="relative" data-oid="snch34z">
                    <Image
                      src={logos.principal}
                      alt="Logo principal"
                      width={200}
                      height={80}
                      className="max-h-24 w-auto mx-auto"
                      data-oid="arj7kny"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLogos({ ...logos, principal: '/logos/akademate-logo-official.png' })}
                      data-oid="fec-xrs"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon
                      className="h-12 w-12 mx-auto mb-2 text-muted-foreground"
                      data-oid="i6tr-:u"
                    />
                    <p className="text-sm text-muted-foreground mb-2" data-oid="4doeqag">
                      Haz clic para subir
                    </p>
                    <input
                      id="logo-principal"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => handleLogoUpload('principal', e)}
                      className="hidden"
                      data-oid="0ayb9ea"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-principal')?.click()}
                      data-oid="12jiz.o"
                    >
                      <Upload className="mr-2 h-4 w-4" data-oid="pxcefez" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2" data-oid="v2ad3p5">
                      PNG, SVG, JPG (Max 2MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2" data-oid="z_rvk1u">
              <Label htmlFor="logo-oscuro" data-oid="asinj.q">
                Logo Oscuro (Sidebar/Login Fondo Oscuro)
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors"
                data-oid="38-:kx3"
              >
                {logos.oscuro ? (
                  <div className="relative" data-oid="sse2nce">
                    <Image
                      src={logos.oscuro}
                      alt="Logo oscuro"
                      width={200}
                      height={80}
                      className="max-h-24 w-auto mx-auto"
                      data-oid="l9zf62v"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLogos({ ...logos, oscuro: '/logos/akademate-logo-official.png' })}
                      data-oid="75jc8.0"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon
                      className="h-12 w-12 mx-auto mb-2 text-muted-foreground"
                      data-oid="1ng5t78"
                    />
                    <p className="text-sm text-muted-foreground mb-2" data-oid="675om-j">
                      Haz clic para subir
                    </p>
                    <input
                      id="logo-oscuro"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => handleLogoUpload('oscuro', e)}
                      className="hidden"
                      data-oid="2ptxlxl"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-oscuro')?.click()}
                      data-oid="4vw_2es"
                    >
                      <Upload className="mr-2 h-4 w-4" data-oid="x0z3u5p" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2" data-oid="pgjo5ip">
                      PNG, SVG, JPG (Max 2MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2" data-oid="570c6-j">
              <Label htmlFor="logo-claro" data-oid="xqfu8qk">
                Logo Claro (Login/Sidebar)
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors"
                data-oid="cy9yh.q"
              >
                {logos.claro ? (
                  <div className="relative" data-oid="wceg79q">
                    <Image
                      src={logos.claro}
                      alt="Logo claro"
                      width={200}
                      height={80}
                      className="max-h-24 w-auto mx-auto"
                      data-oid="cxpnlv4"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        setLogos({ ...logos, claro: '/logos/akademate-logo-official.png' })
                      }
                      data-oid=".kagj:l"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon
                      className="h-10 w-10 mx-auto mb-2 text-muted-foreground"
                      data-oid="sjcuali"
                    />
                    <p className="text-sm text-muted-foreground mb-2" data-oid="xtjg6o9">
                      Haz clic para subir
                    </p>
                    <input
                      id="logo-claro"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => handleLogoUpload('claro', e)}
                      className="hidden"
                      data-oid="bsjcjhj"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-claro')?.click()}
                      data-oid="c8e9iuo"
                    >
                      <Upload className="mr-2 h-4 w-4" data-oid="gfbqprt" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2" data-oid="e6z_7qz">
                      PNG con transparencia
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2" data-oid="k112d:n">
              <Label htmlFor="logo-favicon" data-oid="qb_gkcc">
                Favicon (32x32px)
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors"
                data-oid="-e6i59f"
              >
                {logos.favicon ? (
                  <div className="relative" data-oid="p_vy4y5">
                    <Image
                      src={logos.favicon}
                      alt="Favicon"
                      width={32}
                      height={32}
                      className="max-h-16 w-auto mx-auto"
                      data-oid="uc3egim"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        setLogos({ ...logos, favicon: '/logos/akademate-favicon.svg' })
                      }
                      data-oid="c5xsxpi"
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon
                      className="h-10 w-10 mx-auto mb-2 text-muted-foreground"
                      data-oid="2f-r264"
                    />
                    <p className="text-sm text-muted-foreground mb-2" data-oid="m1yqizd">
                      Haz clic para subir
                    </p>
                    <input
                      id="logo-favicon"
                      type="file"
                      accept="image/x-icon,image/png"
                      onChange={(e) => handleLogoUpload('favicon', e)}
                      className="hidden"
                      data-oid="i9env8r"
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-favicon')?.click()}
                      data-oid="8zp33_c"
                    >
                      <Upload className="mr-2 h-4 w-4" data-oid="o8:w9_m" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2" data-oid="x9d85px">
                      ICO, PNG (32x32px)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg" data-oid="t9-035f">
            <p className="text-sm text-muted-foreground" data-oid="c9i.cs4">
              <strong data-oid="ee5xgq8">Nota:</strong> Los logos se utilizan en diferentes
              contextos:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4" data-oid="q.4dwrw">
              <li data-oid="2wqylyh">
                • <strong data-oid="btbq0h9">Logo Claro:</strong> Login page y sidebar (fondo claro)
              </li>
              <li data-oid="i-z0txh">
                • <strong data-oid="g27.6re">Logo Oscuro:</strong> Alternativa para fondos oscuros
              </li>
              <li data-oid="h_n2bc1">
                • <strong data-oid="v3gm:lj">Favicon:</strong> Icono que aparece en la pestaña del
                navegador
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
