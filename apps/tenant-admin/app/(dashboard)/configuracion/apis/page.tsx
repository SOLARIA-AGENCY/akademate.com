'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Textarea } from '@payload-config/components/ui/textarea'
import {
  Plus,
  Key,
  Globe,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  Facebook,
  Chrome,
  Zap,
  Code,
  Webhook,
  RefreshCw,
  Check,
  Save
} from 'lucide-react'

interface APIKey {
  id: number
  name: string
  key: string
  created: string
  lastUsed?: string
  active: boolean
}

export default function APIsPage() {
  const [keys, setKeys] = useState<APIKey[]>([
    { 
      id: 1, 
      name: 'Production API', 
      key: 'pk_live_abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567', 
      created: '2025-01-10',
      lastUsed: '2025-01-15 14:32',
      active: true 
    },
    { 
      id: 2, 
      name: 'Development API', 
      key: 'pk_dev_test987zyx654wvu321tsr098qpo765nml432kji109hgf876edc543', 
      created: '2025-01-08',
      lastUsed: '2025-01-15 09:15',
      active: true 
    },
  ])

  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  // Integration configurations
  const [facebookPixel, setFacebookPixel] = useState({
    enabled: false,
    pixelId: '',
    accessToken: '',
  })

  const [googleTags, setGoogleTags] = useState({
    enabled: false,
    measurementId: 'G-XXXXXXXXXX',
    analyticsId: 'UA-XXXXXXXXX-X',
    tagManagerId: 'GTM-XXXXXXX',
    siteVerification: '',
  })

  const [mcpConfig, setMcpConfig] = useState({
    enabled: false,
    serverUrl: '',
    apiKey: '',
    features: {
      taskMaster: true,
      sequentialThinking: true,
      specKit: false,
    },
  })

  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      name: 'Lead Created',
      url: 'https://api.example.com/webhooks/lead-created',
      events: ['lead.created'],
      active: true,
    },
    {
      id: 2,
      name: 'Course Enrollment',
      url: 'https://api.example.com/webhooks/enrollment',
      events: ['enrollment.created', 'enrollment.completed'],
      active: true,
    },
  ])

  const toggleKeyVisibility = (id: number) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const generateAPIKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let key = 'pk_live_'
    for (let i = 0; i < 48; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  const handleCreateKey = () => {
    const newKey: APIKey = {
      id: keys.length + 1,
      name: newKeyName,
      key: generateAPIKey(),
      created: new Date().toISOString().split('T')[0],
      active: true,
    }
    setKeys([...keys, newKey])
    setShowCreateModal(false)
    setNewKeyName('')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleDeleteKey = (id: number) => {
    setKeys(keys.filter(k => k.id !== id))
  }

  const handleSaveIntegrations = () => {
    // TODO: Save to database/API
    console.log('Saving integrations:', { facebookPixel, googleTags, mcpConfig })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">APIs y Webhooks</h1>
          <p className="text-muted-foreground">Gestiona claves de API, integraciones y webhooks</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Clave API
        </Button>
      </div>

      {showSuccess && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span>Cambios guardados correctamente</span>
        </div>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Claves de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay claves de API creadas</p>
              <Button variant="outline" onClick={() => setShowCreateModal(true)} className="mt-4">
                Crear Primera Clave
              </Button>
            </div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.name}</p>
                      {key.active && <CheckCircle className="h-4 w-4 text-success" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creada: {key.created}
                      {key.lastUsed && ` • Último uso: ${key.lastUsed}`}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm">
                    {visibleKeys.has(key.id) ? key.key : '•'.repeat(key.key.length)}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleKeyVisibility(key.id)}
                  >
                    {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(key.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Facebook Pixel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5" />
              Facebook Pixel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="fb-pixel-toggle" className="text-sm cursor-pointer">
                {facebookPixel.enabled ? 'Activado' : 'Desactivado'}
              </Label>
              <input
                id="fb-pixel-toggle"
                type="checkbox"
                checked={facebookPixel.enabled}
                onChange={(e) => setFacebookPixel({ ...facebookPixel, enabled: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pixel-id">Pixel ID</Label>
              <Input
                id="pixel-id"
                value={facebookPixel.pixelId}
                onChange={(e) => setFacebookPixel({ ...facebookPixel, pixelId: e.target.value })}
                placeholder="1234567890123456"
                disabled={!facebookPixel.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-access-token">Access Token (Opcional)</Label>
              <Input
                id="fb-access-token"
                type="password"
                value={facebookPixel.accessToken}
                onChange={(e) => setFacebookPixel({ ...facebookPixel, accessToken: e.target.value })}
                placeholder="EAAxxxxxxxxxxxxx"
                disabled={!facebookPixel.enabled}
              />
            </div>
          </div>
          
          {facebookPixel.enabled && facebookPixel.pixelId && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Código de Instalación (Web):</p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${facebookPixel.pixelId}');
  fbq('track', 'PageView');
</script>
<!-- End Facebook Pixel Code -->`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Tags */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Chrome className="h-5 w-5" />
              Google Analytics & Tags
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="google-toggle" className="text-sm cursor-pointer">
                {googleTags.enabled ? 'Activado' : 'Desactivado'}
              </Label>
              <input
                id="google-toggle"
                type="checkbox"
                checked={googleTags.enabled}
                onChange={(e) => setGoogleTags({ ...googleTags, enabled: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ga4-id">GA4 Measurement ID</Label>
              <Input
                id="ga4-id"
                value={googleTags.measurementId}
                onChange={(e) => setGoogleTags({ ...googleTags, measurementId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                disabled={!googleTags.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ua-id">Universal Analytics ID (Legacy)</Label>
              <Input
                id="ua-id"
                value={googleTags.analyticsId}
                onChange={(e) => setGoogleTags({ ...googleTags, analyticsId: e.target.value })}
                placeholder="UA-XXXXXXXXX-X"
                disabled={!googleTags.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtm-id">Google Tag Manager ID</Label>
              <Input
                id="gtm-id"
                value={googleTags.tagManagerId}
                onChange={(e) => setGoogleTags({ ...googleTags, tagManagerId: e.target.value })}
                placeholder="GTM-XXXXXXX"
                disabled={!googleTags.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-verification">Site Verification Meta Tag</Label>
              <Input
                id="site-verification"
                value={googleTags.siteVerification}
                onChange={(e) => setGoogleTags({ ...googleTags, siteVerification: e.target.value })}
                placeholder="google-site-verification=xxxxx"
                disabled={!googleTags.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP (Model Context Protocol) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              MCP (Model Context Protocol)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="mcp-toggle" className="text-sm cursor-pointer">
                {mcpConfig.enabled ? 'Activado' : 'Desactivado'}
              </Label>
              <input
                id="mcp-toggle"
                type="checkbox"
                checked={mcpConfig.enabled}
                onChange={(e) => setMcpConfig({ ...mcpConfig, enabled: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mcp-server">Server URL</Label>
              <Input
                id="mcp-server"
                value={mcpConfig.serverUrl}
                onChange={(e) => setMcpConfig({ ...mcpConfig, serverUrl: e.target.value })}
                placeholder="https://mcp.example.com"
                disabled={!mcpConfig.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mcp-key">API Key</Label>
              <Input
                id="mcp-key"
                type="password"
                value={mcpConfig.apiKey}
                onChange={(e) => setMcpConfig({ ...mcpConfig, apiKey: e.target.value })}
                placeholder="mcp_xxxxxxxxxxxxx"
                disabled={!mcpConfig.enabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Características Habilitadas</Label>
            <div className="space-y-2">
              {Object.entries(mcpConfig.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`mcp-${feature}`}
                    checked={enabled}
                    onChange={(e) => setMcpConfig({
                      ...mcpConfig,
                      features: { ...mcpConfig.features, [feature]: e.target.checked }
                    })}
                    disabled={!mcpConfig.enabled}
                    className="rounded"
                  />
                  <Label htmlFor={`mcp-${feature}`} className="cursor-pointer capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{webhook.name}</p>
                    {webhook.active && <CheckCircle className="h-4 w-4 text-success" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">{webhook.url}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {webhook.events.map((event) => (
                  <span key={event} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {event}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Documentación de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Accede a la documentación completa de la API REST para integrar tu aplicación con CEP Admin.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">
                <Globe className="mr-2 h-4 w-4" />
                Ver Documentación
              </Button>
              <Button variant="outline">
                <Code className="mr-2 h-4 w-4" />
                Ejemplos de Código
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveIntegrations}>
          <Save className="mr-2 h-4 w-4" />
          Guardar Configuración
        </Button>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Crear Nueva Clave API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nombre de la Clave</Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ej: Production API, Mobile App, etc."
                />
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  Se generará una nueva clave de API única. Guárdala en un lugar seguro, 
                  no podrás verla nuevamente después de crearla.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateKey} className="flex-1" disabled={!newKeyName}>
                  Generar Clave
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
