'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Label } from '@payload-config/components/ui/label'
import { Save, Palette, Image as ImageIcon, Eye, RotateCcw, Download, Upload, Check } from 'lucide-react'

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

const DEFAULT_THEMES: ThemePreset[] = [
  {
    name: 'CEP FORMACIÓN',
    colors: {
      primary: '#f2014b',
      secondary: '#64748b',
      accent: '#f2014b',
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

export default function PersonalizacionPage() {
  const [colors, setColors] = useState<ColorScheme>(DEFAULT_THEMES[0].colors)
  const [savedColors, setSavedColors] = useState<ColorScheme>(DEFAULT_THEMES[0].colors)
  const [previewMode, setPreviewMode] = useState(false)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)

  // Convert hex to HSL for CSS variables
  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return '0 0% 50%'

    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
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

  const handleColorChange = (colorName: keyof ColorScheme, value: string) => {
    setColors({ ...colors, [colorName]: value })
    if (!previewMode) setPreviewMode(true)
  }

  const handleSave = () => {
    setSavedColors(colors)
    setPreviewMode(false)
    setShowSaveSuccess(true)
    setTimeout(() => setShowSaveSuccess(false), 3000)
    // TODO: Save to database/API
    localStorage.setItem('cep-theme', JSON.stringify(colors))
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
    a.download = 'cep-theme.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setColors(imported)
        setPreviewMode(true)
      } catch {
        alert('Error al importar el tema. Verifica que el archivo sea válido.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Personalización</h1>
          <p className="text-muted-foreground">
            Configura colores corporativos, logos y estilo visual del dashboard
          </p>
        </div>

        {previewMode && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Descartar
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Guardar Tema
            </Button>
          </div>
        )}
      </div>

      {showSaveSuccess && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Tema guardado correctamente y aplicado al dashboard</span>
        </div>
      )}

      {previewMode && (
        <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <span>Vista previa activa - Los cambios se están aplicando en tiempo real</span>
        </div>
      )}

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Temas Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {DEFAULT_THEMES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleLoadPreset(preset)}
                className="group relative border rounded-lg p-4 hover:border-primary transition-all hover:shadow-md bg-card"
              >
                <p className="font-medium mb-3">{preset.name}</p>
                <div className="flex gap-1">
                  {Object.entries(preset.colors).map(([name, value]) => (
                    <div
                      key={name}
                      className="h-8 flex-1 rounded border"
                      style={{ backgroundColor: value }}
                      title={name}
                    />
                  ))}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paleta de Colores Personalizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(colors).map(([name, value]) => (
              <div key={name} className="space-y-2">
                <Label className="capitalize flex items-center gap-2">
                  {name === 'primary' && '🔵'}
                  {name === 'secondary' && '⚪'}
                  {name === 'accent' && '🟣'}
                  {name === 'success' && '🟢'}
                  {name === 'warning' && '🟡'}
                  {name === 'danger' && '🔴'}
                  {name}
                </Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(name as keyof ColorScheme, e.target.value)}
                    className="h-12 w-20 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(name as keyof ColorScheme, e.target.value)}
                    className="flex-1 h-12 px-3 rounded border text-sm font-mono bg-card"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 p-6 border rounded-lg bg-background">
            <div className="flex gap-2 flex-wrap">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Danger</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-success font-medium">✓ Success State</p>
              </div>
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-warning font-medium">⚠ Warning State</p>
              </div>
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive font-medium">✗ Error State</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Card Example</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Este es un ejemplo de cómo se verán las tarjetas con tu paleta de colores
                  personalizada. Los cambios se aplican inmediatamente.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle>Importar / Exportar Tema</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Tema
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              id="theme-import"
            />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar Tema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Logos y Marcas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Logo Principal (Modo Claro)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Haz clic para subir</p>
                <p className="text-xs text-muted-foreground">PNG, SVG, JPG (Max 2MB)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo Modo Oscuro</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Haz clic para subir</p>
                <p className="text-xs text-muted-foreground">PNG, SVG, JPG (Max 2MB)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Favicon</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Haz clic para subir</p>
                <p className="text-xs text-muted-foreground">ICO, PNG (32x32px)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo Compacto (Sidebar)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-card hover:bg-accent/5 transition-colors cursor-pointer">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Haz clic para subir</p>
                <p className="text-xs text-muted-foreground">Cuadrado recomendado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
