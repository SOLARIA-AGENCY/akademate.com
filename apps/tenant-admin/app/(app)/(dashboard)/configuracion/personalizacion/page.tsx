'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Save,
  Palette,
  Image as ImageIcon,
  Eye,
  RotateCcw,
  Download,
  Upload,
  Check,
} from 'lucide-react'
import { useTenantBranding } from '@/app/providers/tenant-branding'

interface ColorScheme {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
}

interface ThemePreset {
  name: string
  colors: ColorScheme
}

interface PersonalizacionApiResponse {
  data?: ColorScheme
}

const DEFAULT_THEMES: ThemePreset[] = [
  {
    name: 'AKADEMATE Blue',
    colors: {
      primary: '#0066cc',
      secondary: '#64748b',
      accent: '#1d4ed8',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    name: 'Default Blue',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#8b5cf6',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    name: 'Ocean',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
  },
  {
    name: 'Forest',
    colors: {
      primary: '#059669',
      secondary: '#84cc16',
      accent: '#eab308',
      success: '#22c55e',
      warning: '#f97316',
      danger: '#dc2626',
    },
  },
  {
    name: 'Sunset',
    colors: {
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#fbbf24',
      success: '#84cc16',
      warning: '#eab308',
      danger: '#dc2626',
    },
  },
]

const fallbackTheme: ThemePreset = {
  name: 'AKADEMATE Default',
  colors: {
    primary: '#0066cc',
    secondary: '#64748b',
    accent: '#1d4ed8',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
}

const baseTheme = DEFAULT_THEMES[0] ?? fallbackTheme

export default function PersonalizacionPage() {
  const { branding, refresh } = useTenantBranding()
  const tenantId = branding.tenantId
  const [colors, setColors] = useState<ColorScheme>(baseTheme.colors)
  const [savedColors, setSavedColors] = useState<ColorScheme>(baseTheme.colors)
  const [previewMode, setPreviewMode] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Convert hex to HSL for CSS variables
  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return '0 0% 50%'

    const r = parseInt(result[1] ?? '00', 16) / 255
    const g = parseInt(result[2] ?? '00', 16) / 255
    const b = parseInt(result[3] ?? '00', 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  // Apply colors to CSS variables in real-time
  useEffect(() => {
    const root = document.documentElement
    const currentColors = previewMode ? colors : savedColors

    root.style.setProperty('--primary', hexToHSL(currentColors.primary))
    root.style.setProperty('--secondary', hexToHSL(currentColors.secondary))
    root.style.setProperty('--accent', hexToHSL(currentColors.accent))
    root.style.setProperty('--success', hexToHSL(currentColors.success))
    root.style.setProperty('--warning', hexToHSL(currentColors.warning))
    root.style.setProperty('--destructive', hexToHSL(currentColors.danger))
  }, [colors, savedColors, previewMode])

  useEffect(() => {
    let isMounted = true

    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/config?section=personalizacion&tenantId=${tenantId}`)
        if (!response.ok) {
          throw new Error('No se pudo cargar la personalizacion')
        }
        const payload = (await response.json()) as PersonalizacionApiResponse
        if (payload.data) {
          if (!isMounted) return
          setColors(payload.data)
          setSavedColors(payload.data)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('No se pudo cargar la configuracion. Revisa la conexion.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadConfig()

    return () => {
      isMounted = false
    }
  }, [tenantId])

  const handleColorChange = (colorName: keyof ColorScheme, value: string) => {
    setColors({ ...colors, [colorName]: value })
    if (!previewMode) setPreviewMode(true)
  }

  const handleSave = async () => {
    setErrorMessage(null)
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'personalizacion', tenantId, data: colors }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar la configuracion')
      }

      setSavedColors(colors)
      setPreviewMode(false)
      await refresh()
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
    } catch {
      setErrorMessage('No se pudo guardar la configuracion. Intenta de nuevo.')
    }
  }

  const handleReset = () => {
    setColors(savedColors)
    setPreviewMode(false)
  }

  const handleLoadPreset = (preset: ThemePreset) => {
    setColors(preset.colors)
    setPreviewMode(true)
  }

  const handleExport = () => {
    const json = JSON.stringify(colors, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'akademate-theme.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as ColorScheme
        setColors(imported)
        setPreviewMode(true)
      } catch {
        alert('Error al importar el tema. Verifica que el archivo sea válido.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-6xl" data-oid="g:p9v.a">
      <PageHeader
        title="Personalización"
        description="Configura colores corporativos, logos y estilo visual del dashboard"
        icon={Palette}
        actions={
          previewMode ? (
            <>
              <Button variant="outline" onClick={handleReset} data-oid="i4.ysgb">
                <RotateCcw className="mr-2 h-4 w-4" data-oid="4ot-.em" />
                Descartar
              </Button>
              <Button onClick={handleSave} data-oid="8j.59sg">
                <Save className="mr-2 h-4 w-4" data-oid="-gs8-zh" />
                Guardar Tema
              </Button>
            </>
          ) : undefined
        }
        data-oid="mu.rib7"
      />

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="gs8s9tw"
        >
          {errorMessage}
        </div>
      )}

      {showSaveSuccess && (
        <div
          className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2"
          data-oid="xrm4r3o"
        >
          <Check className="h-5 w-5" data-oid="p-36z3b" />
          <span data-oid="-hs6yxk">Tema guardado correctamente y aplicado al dashboard</span>
        </div>
      )}

      {previewMode && (
        <div
          className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg flex items-center gap-2"
          data-oid="es8vqsi"
        >
          <Eye className="h-5 w-5" data-oid="baskxpw" />
          <span data-oid="b-pc43v">
            Vista previa activa - Los cambios se están aplicando en tiempo real
          </span>
        </div>
      )}

      {isLoading ? (
        <div
          className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground"
          data-oid="6pqn6cf"
        >
          Cargando configuracion...
        </div>
      ) : null}

      {/* Theme Presets */}
      <Card data-oid="a:f7qfe">
        <CardHeader data-oid="-xkte07">
          <CardTitle className="flex items-center gap-2" data-oid="7t-y31_">
            <Palette className="h-5 w-5" data-oid="r.:3k:i" />
            Temas Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="tgjci8v">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-oid="ikxj31c">
            {DEFAULT_THEMES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleLoadPreset(preset)}
                className="group relative border rounded-lg p-4 hover:border-primary transition-all hover:shadow-md bg-card"
                data-oid="6m3vl6e"
              >
                <p className="font-medium mb-3" data-oid="ilb.8qe">
                  {preset.name}
                </p>
                <div className="flex gap-1" data-oid="h:3ryn5">
                  {(Object.entries(preset.colors) as [string, string][]).map(([name, value]) => (
                    <div
                      key={name}
                      className="h-8 flex-1 rounded border"
                      style={{ backgroundColor: value }}
                      title={name}
                      data-oid="xs5edi_"
                    />
                  ))}
                </div>
                <div
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-oid="5q_26iq"
                >
                  <Eye className="h-4 w-4 text-primary" data-oid="zw:_py5" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card data-oid="ol_k9-6">
        <CardHeader data-oid="i.l35f8">
          <CardTitle className="flex items-center gap-2" data-oid="ej1795o">
            <Palette className="h-5 w-5" data-oid="j9qbpul" />
            Paleta de Colores Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="9z2-dvs">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid="w0d3ynr">
            {(Object.entries(colors) as [keyof ColorScheme, string][]).map(([name, value]) => (
              <div key={name} className="space-y-2" data-oid="s0_wed4">
                <Label className="capitalize flex items-center gap-2" data-oid="u0xdd4-">
                  {name === 'primary' && '🔵'}
                  {name === 'secondary' && '⚪'}
                  {name === 'accent' && '🟣'}
                  {name === 'success' && '🟢'}
                  {name === 'warning' && '🟡'}
                  {name === 'danger' && '🔴'}
                  {name}
                </Label>
                <div className="flex gap-2 items-center" data-oid="wpcwzxv">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(name, e.target.value)}
                    className="h-12 w-20 rounded border cursor-pointer"
                    data-oid="4ab6r0x"
                  />

                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(name, e.target.value)}
                    className="flex-1 h-12 px-3 rounded border text-sm font-mono bg-card"
                    placeholder="#000000"
                    data-oid="u032qb:"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card data-oid="lborsoe">
        <CardHeader data-oid="_mg_d8n">
          <CardTitle data-oid="jxuxh70">Vista Previa en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent data-oid="_dbryhk">
          <div className="space-y-4 p-6 border rounded-lg bg-background" data-oid="vra4j86">
            <div className="flex gap-2 flex-wrap" data-oid="u8ty2zx">
              <Button variant="default" data-oid="n0f9s59">
                Primary Button
              </Button>
              <Button variant="secondary" data-oid="4m.7f0q">
                Secondary
              </Button>
              <Button variant="outline" data-oid="bktums6">
                Outline
              </Button>
              <Button variant="destructive" data-oid="2sbemh3">
                Danger
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3" data-oid="2bqp8g2">
              <div
                className="p-4 bg-success/10 border border-success/20 rounded-lg"
                data-oid="bt2j6vl"
              >
                <p className="text-success font-medium" data-oid="5b2n38z">
                  ✓ Success State
                </p>
              </div>
              <div
                className="p-4 bg-warning/10 border border-warning/20 rounded-lg"
                data-oid="sc.n9oz"
              >
                <p className="text-warning font-medium" data-oid="w0e5b7_">
                  ⚠ Warning State
                </p>
              </div>
              <div
                className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                data-oid="7pk92q8"
              >
                <p className="text-destructive font-medium" data-oid="ek7aufu">
                  ✗ Error State
                </p>
              </div>
            </div>

            <Card data-oid="sre61mg">
              <CardHeader data-oid="cddi1u3">
                <CardTitle data-oid="i_jm5op">Card Example</CardTitle>
              </CardHeader>
              <CardContent data-oid="e-o2d-e">
                <p className="text-muted-foreground" data-oid="ichj6ht">
                  Este es un ejemplo de cómo se verán las tarjetas con tu paleta de colores
                  personalizada. Los cambios se aplican inmediatamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <Card data-oid="30le_j5">
        <CardHeader data-oid="wc31.ud">
          <CardTitle data-oid="vd4y8em">Importar / Exportar Tema</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3" data-oid="df68fqa">
          <Button variant="outline" onClick={handleExport} data-oid="3-68oe9">
            <Download className="mr-2 h-4 w-4" data-oid="q5maeut" />
            Exportar Tema
          </Button>
          <div className="relative" data-oid="wn-oeig">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              id="theme-import"
              data-oid="9m:sdi8"
            />

            <Button variant="outline" data-oid="5hz8o9:">
              <Upload className="mr-2 h-4 w-4" data-oid="7woelfy" />
              Importar Tema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo Management */}
      <Card data-oid="4h8urd7">
        <CardHeader data-oid="jxn65uu">
          <CardTitle className="flex items-center gap-2" data-oid="2uzc3pr">
            <ImageIcon className="h-5 w-5" data-oid="dg7b4l." />
            Logos y Marcas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="rxff5g9">
          <div className="grid gap-4 md:grid-cols-2" data-oid="zgd:.uq">
            <div className="space-y-2" data-oid="x0tgb11">
              <Label data-oid="smjb5am">Logo Principal (Modo Claro)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                data-oid="1z-kswu"
              >
                <ImageIcon
                  className="h-12 w-12 mx-auto mb-2 text-muted-foreground"
                  data-oid="6lghkb6"
                />
                <p className="text-sm text-muted-foreground" data-oid="k4:ab8b">
                  Haz clic para subir
                </p>
                <p className="text-xs text-muted-foreground" data-oid="e4qrri3">
                  PNG, SVG, JPG (Max 2MB)
                </p>
              </div>
            </div>

            <div className="space-y-2" data-oid="n-ue9hx">
              <Label data-oid="2la8abm">Logo Modo Oscuro</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                data-oid="9klxksj"
              >
                <ImageIcon
                  className="h-12 w-12 mx-auto mb-2 text-muted-foreground"
                  data-oid="n7lpcbj"
                />
                <p className="text-sm text-muted-foreground" data-oid="kd8l:zl">
                  Haz clic para subir
                </p>
                <p className="text-xs text-muted-foreground" data-oid="53b-e_l">
                  PNG, SVG, JPG (Max 2MB)
                </p>
              </div>
            </div>

            <div className="space-y-2" data-oid="ww6tz3e">
              <Label data-oid="1g9i.a6">Favicon</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                data-oid="bznhqqz"
              >
                <ImageIcon
                  className="h-12 w-12 mx-auto mb-2 text-muted-foreground"
                  data-oid="hv9a32u"
                />
                <p className="text-sm text-muted-foreground" data-oid="6sff1te">
                  Haz clic para subir
                </p>
                <p className="text-xs text-muted-foreground" data-oid="aumui9j">
                  ICO, PNG (32x32px)
                </p>
              </div>
            </div>

            <div className="space-y-2" data-oid="4m0niky">
              <Label data-oid="27rlk88">Logo Compacto (Sidebar)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                data-oid="9qo-t9l"
              >
                <ImageIcon
                  className="h-12 w-12 mx-auto mb-2 text-muted-foreground"
                  data-oid="g70uylh"
                />
                <p className="text-sm text-muted-foreground" data-oid="nf4qanc">
                  Haz clic para subir
                </p>
                <p className="text-xs text-muted-foreground" data-oid="jxav3-7">
                  Cuadrado recomendado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
