'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Save, Building2, Mail, Phone, MapPin, Globe, Image as ImageIcon, Facebook, Twitter, Instagram, Linkedin, Youtube, Check, Upload } from 'lucide-react'

export default function ConfigGeneralPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [config, setConfig] = useState({
    // Información de la Academia
    academyName: 'CEP Comunicación',
    fiscalName: 'Centro de Estudios Profesionales Comunicación S.L.',
    cif: 'B12345678',

    // Contacto
    address: 'Calle Principal 123, 38001 Santa Cruz de Tenerife',
    city: 'Santa Cruz de Tenerife',
    postalCode: '38001',
    country: 'España',
    phone: '+34 922 123 456',
    phoneAlternative: '+34 922 654 321',
    email: 'info@cepcomunicacion.com',
    emailAdmissions: 'admisiones@cepcomunicacion.com',
    emailSupport: 'soporte@cepcomunicacion.com',
    website: 'https://www.cepcomunicacion.com',

    // Redes Sociales
    facebook: 'https://facebook.com/cepcomunicacion',
    twitter: 'https://twitter.com/cepcomunicacion',
    instagram: 'https://instagram.com/cepcomunicacion',
    linkedin: 'https://linkedin.com/company/cepcomunicacion',
    youtube: 'https://youtube.com/@cepcomunicacion',

    // Información Adicional
    description: 'Centro especializado en formación profesional en comunicación, marketing digital y diseño gráfico con más de 15 años de experiencia.',
    slogan: 'Tu futuro empieza aquí',
    foundedYear: '2008',
    accreditation: 'Certificado por la Consejería de Educación de Canarias',
  })

  const [logos, setLogos] = useState({
    principal: '/logos/cep-logo.png',
    oscuro: '/logos/cep-logo.png',
    claro: '/logos/cep-logo-alpha.png',
    favicon: '/logos/cep-logo-alpha.png',
  })

  // Fetch existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [academiaRes, logosRes] = await Promise.all([
          fetch('/api/config?section=academia'),
          fetch('/api/config?section=logos'),
        ])

        if (academiaRes.ok) {
          const { data } = await academiaRes.json()
          setConfig(prev => ({ ...prev, ...data }))
        }

        if (logosRes.ok) {
          const { data } = await logosRes.json()
          setLogos(data)
        }
      } catch (error) {
        console.error('Error fetching config:', error)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    try {
      // Save academia config
      const academiaResponse = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'academia', data: config }),
      })

      // Save logos config
      const logosResponse = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'logos', data: logos }),
      })

      if (academiaResponse.ok && logosResponse.ok) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)

        // Trigger a reload of logos in other components
        window.dispatchEvent(new Event('config-updated'))
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    }
  }

  const handleLogoUpload = (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // For demo, use URL.createObjectURL
      // In production, upload to media library first
      const url = URL.createObjectURL(file)
      setLogos(prev => ({ ...prev, [type]: url }))
      console.log(`Logo ${type} updated:`, file.name)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Configuración General</h1>
          <p className="text-muted-foreground">Datos de la academia, fiscales, contacto y redes sociales</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      {showSuccess && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Configuración guardada correctamente</span>
        </div>
      )}

      {/* Información de la Academia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información de la Academia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="academyName">Nombre Comercial</Label>
              <Input 
                id="academyName"
                value={config.academyName} 
                onChange={(e) => setConfig({...config, academyName: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalName">Razón Social</Label>
              <Input 
                id="fiscalName"
                value={config.fiscalName} 
                onChange={(e) => setConfig({...config, fiscalName: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cif">CIF/NIF</Label>
              <Input 
                id="cif"
                value={config.cif} 
                onChange={(e) => setConfig({...config, cif: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foundedYear">Año de Fundación</Label>
              <Input 
                id="foundedYear"
                value={config.foundedYear} 
                onChange={(e) => setConfig({...config, foundedYear: e.target.value})} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción de la Academia</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig({...config, description: e.target.value})}
              rows={3}
              placeholder="Breve descripción de la academia..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Input 
                id="slogan"
                value={config.slogan} 
                onChange={(e) => setConfig({...config, slogan: e.target.value})} 
                placeholder="Frase representativa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accreditation">Acreditaciones</Label>
              <Input 
                id="accreditation"
                value={config.accreditation} 
                onChange={(e) => setConfig({...config, accreditation: e.target.value})} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address"><MapPin className="h-4 w-4 inline mr-1" />Dirección Completa</Label>
            <Input 
              id="address"
              value={config.address} 
              onChange={(e) => setConfig({...config, address: e.target.value})} 
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input 
                id="city"
                value={config.city} 
                onChange={(e) => setConfig({...config, city: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input 
                id="postalCode"
                value={config.postalCode} 
                onChange={(e) => setConfig({...config, postalCode: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input 
                id="country"
                value={config.country} 
                onChange={(e) => setConfig({...config, country: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone"><Phone className="h-4 w-4 inline mr-1" />Teléfono Principal</Label>
              <Input 
                id="phone"
                type="tel"
                value={config.phone} 
                onChange={(e) => setConfig({...config, phone: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneAlt">Teléfono Alternativo</Label>
              <Input 
                id="phoneAlt"
                type="tel"
                value={config.phoneAlternative} 
                onChange={(e) => setConfig({...config, phoneAlternative: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email"><Mail className="h-4 w-4 inline mr-1" />Email General</Label>
              <Input 
                id="email"
                type="email"
                value={config.email} 
                onChange={(e) => setConfig({...config, email: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailAdmissions">Email Admisiones</Label>
              <Input 
                id="emailAdmissions"
                type="email"
                value={config.emailAdmissions} 
                onChange={(e) => setConfig({...config, emailAdmissions: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSupport">Email Soporte Técnico</Label>
              <Input 
                id="emailSupport"
                type="email"
                value={config.emailSupport} 
                onChange={(e) => setConfig({...config, emailSupport: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website"><Globe className="h-4 w-4 inline mr-1" />Sitio Web</Label>
              <Input 
                id="website"
                type="url"
                value={config.website} 
                onChange={(e) => setConfig({...config, website: e.target.value})} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociales */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input 
                id="facebook"
                type="url"
                value={config.facebook} 
                onChange={(e) => setConfig({...config, facebook: e.target.value})} 
                placeholder="https://facebook.com/tu-pagina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter / X
              </Label>
              <Input 
                id="twitter"
                type="url"
                value={config.twitter} 
                onChange={(e) => setConfig({...config, twitter: e.target.value})} 
                placeholder="https://twitter.com/tu-cuenta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input 
                id="instagram"
                type="url"
                value={config.instagram} 
                onChange={(e) => setConfig({...config, instagram: e.target.value})} 
                placeholder="https://instagram.com/tu-perfil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input 
                id="linkedin"
                type="url"
                value={config.linkedin} 
                onChange={(e) => setConfig({...config, linkedin: e.target.value})} 
                placeholder="https://linkedin.com/company/tu-empresa"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" />
                YouTube
              </Label>
              <Input 
                id="youtube"
                type="url"
                value={config.youtube} 
                onChange={(e) => setConfig({...config, youtube: e.target.value})} 
                placeholder="https://youtube.com/@tu-canal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos y Marcas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logos y Marcas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo-principal">Logo Principal</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors">
                {logos.principal ? (
                  <div className="relative">
                    <Image src={logos.principal} alt="Logo principal" width={200} height={80} className="max-h-24 w-auto mx-auto" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLogos({...logos, principal: '/logos/cep-logo.png'})}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Haz clic para subir</p>
                    <input
                      id="logo-principal"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => handleLogoUpload('principal', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-principal')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">PNG, SVG, JPG (Max 2MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-oscuro">Logo Oscuro (Sidebar/Login Fondo Oscuro)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors">
                {logos.oscuro ? (
                  <div className="relative">
                    <Image src={logos.oscuro} alt="Logo oscuro" width={200} height={80} className="max-h-24 w-auto mx-auto" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLogos({...logos, oscuro: '/logos/cep-logo.png'})}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Haz clic para subir</p>
                    <input
                      id="logo-oscuro"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => handleLogoUpload('oscuro', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-oscuro')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">PNG, SVG, JPG (Max 2MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-claro">Logo Claro (Login/Sidebar)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors">
                {logos.claro ? (
                  <div className="relative">
                    <Image src={logos.claro} alt="Logo claro" width={200} height={80} className="max-h-24 w-auto mx-auto" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLogos({...logos, claro: '/logos/cep-logo-alpha.png'})}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Haz clic para subir</p>
                    <input
                      id="logo-claro"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      onChange={(e) => handleLogoUpload('claro', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-claro')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">PNG con transparencia</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-favicon">Favicon (32x32px)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-card hover:bg-accent/5 transition-colors">
                {logos.favicon ? (
                  <div className="relative">
                    <Image src={logos.favicon} alt="Favicon" width={32} height={32} className="max-h-16 w-auto mx-auto" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLogos({...logos, favicon: '/logos/cep-logo-alpha.png'})}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Haz clic para subir</p>
                    <input
                      id="logo-favicon"
                      type="file"
                      accept="image/x-icon,image/png"
                      onChange={(e) => handleLogoUpload('favicon', e)}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-favicon')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar Archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">ICO, PNG (32x32px)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Los logos se utilizan en diferentes contextos:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
              <li>• <strong>Logo Claro:</strong> Login page y sidebar (fondo claro)</li>
              <li>• <strong>Logo Oscuro:</strong> Alternativa para fondos oscuros</li>
              <li>• <strong>Favicon:</strong> Icono que aparece en la pestaña del navegador</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
