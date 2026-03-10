'use client'
import { useState, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
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
  Check,
  Save,
} from 'lucide-react'

interface APIKey {
  id: number
  name: string
  key: string
  created: string
  lastUsed?: string
  active: boolean
}

interface FacebookPixelConfig {
  enabled: boolean
  pixelId: string
  accessToken: string
}

interface GoogleTagsConfig {
  enabled: boolean
  measurementId: string
  analyticsId: string
  tagManagerId: string
  siteVerification: string
}

interface MCPFeatures {
  taskMaster: boolean
  sequentialThinking: boolean
  specKit: boolean
}

interface MCPConfig {
  enabled: boolean
  serverUrl: string
  apiKey: string
  features: MCPFeatures
}

interface WebhookConfig {
  id: number
  name: string
  url: string
  events: string[]
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
      active: true,
    },
    {
      id: 2,
      name: 'Development API',
      key: 'pk_dev_test987zyx654wvu321tsr098qpo765nml432kji109hgf876edc543',
      created: '2025-01-08',
      lastUsed: '2025-01-15 09:15',
      active: true,
    },
  ])

  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  // Integration configurations
  const [facebookPixel, setFacebookPixel] = useState<FacebookPixelConfig>({
    enabled: false,
    pixelId: '',
    accessToken: '',
  })

  const [googleTags, setGoogleTags] = useState<GoogleTagsConfig>({
    enabled: false,
    measurementId: 'G-XXXXXXXXXX',
    analyticsId: 'UA-XXXXXXXXX-X',
    tagManagerId: 'GTM-XXXXXXX',
    siteVerification: '',
  })

  const [mcpConfig, setMcpConfig] = useState<MCPConfig>({
    enabled: false,
    serverUrl: '',
    apiKey: '',
    features: {
      taskMaster: true,
      sequentialThinking: true,
      specKit: false,
    },
  })

  const [webhooks, _setWebhooks] = useState<WebhookConfig[]>([
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
    void navigator.clipboard.writeText(text)
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
    setKeys(keys.filter((k) => k.id !== id))
  }

  const handleSaveIntegrations = () => {
    // TODO: Save to database/API
    console.log('Saving integrations:', { facebookPixel, googleTags, mcpConfig })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-6xl" data-oid="vwlk:-i">
      <PageHeader
        title="APIs y Webhooks"
        description="Gestiona claves de API, integraciones y webhooks"
        icon={Webhook}
        actions={
          <Button onClick={() => setShowCreateModal(true)} data-oid="gm_lxi-">
            <Plus className="mr-2 h-4 w-4" data-oid="_doj69c" />
            Nueva Clave API
          </Button>
        }
        data-oid="8k9xwgt"
      />

      {showSuccess && (
        <div
          className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center gap-2"
          data-oid="ze6vsjt"
        >
          <Check className="h-5 w-5" data-oid="jfgx4pj" />
          <span data-oid="k_brk0u">Cambios guardados correctamente</span>
        </div>
      )}

      {/* API Keys */}
      <Card data-oid=":qcgm3a">
        <CardHeader data-oid="jujtj0s">
          <CardTitle className="flex items-center gap-2" data-oid="2azh17k">
            <Key className="h-5 w-5" data-oid="w2c06s:" />
            Claves de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="h5ftppf">
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-oid="8mkaipe">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" data-oid="v_98b5w" />
              <p data-oid="6wedzgn">No hay claves de API creadas</p>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
                data-oid="5e6gzjf"
              >
                Crear Primera Clave
              </Button>
            </div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="border rounded-lg p-4 space-y-3" data-oid="7csjynb">
                <div className="flex items-start justify-between" data-oid="noxe6pi">
                  <div className="flex-1" data-oid="no4c128">
                    <div className="flex items-center gap-2" data-oid="yv9r6t:">
                      <p className="font-medium" data-oid="y1w8w9l">
                        {key.name}
                      </p>
                      {key.active && (
                        <CheckCircle className="h-4 w-4 text-success" data-oid="rz9zjzo" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" data-oid="4ibc-jz">
                      Creada: {key.created}
                      {key.lastUsed && ` • Último uso: ${key.lastUsed}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    data-oid="t4vmnj."
                  >
                    <Trash2 className="h-4 w-4 text-destructive" data-oid="_i-kgea" />
                  </Button>
                </div>

                <div className="flex gap-2" data-oid="kvs3kts">
                  <div
                    className="flex-1 bg-muted px-3 py-2 rounded font-mono text-sm"
                    data-oid="4.h7sto"
                  >
                    {visibleKeys.has(key.id) ? key.key : '•'.repeat(key.key.length)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleKeyVisibility(key.id)}
                    data-oid="8p24rk6"
                  >
                    {visibleKeys.has(key.id) ? (
                      <EyeOff className="h-4 w-4" data-oid="r-3tw4b" />
                    ) : (
                      <Eye className="h-4 w-4" data-oid="o:4_8v-" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(key.key)}
                    data-oid="klyvvni"
                  >
                    <Copy className="h-4 w-4" data-oid="69k-5v:" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Facebook Pixel */}
      <Card data-oid="m.xjm7b">
        <CardHeader data-oid="hztz0._">
          <div className="flex items-center justify-between" data-oid="zradjmg">
            <CardTitle className="flex items-center gap-2" data-oid="_36exj3">
              <Facebook className="h-5 w-5" data-oid="wtku:2." />
              Facebook Pixel
            </CardTitle>
            <div className="flex items-center gap-2" data-oid="8g2a5c1">
              <Label
                htmlFor="fb-pixel-toggle"
                className="text-sm cursor-pointer"
                data-oid="4g6zxj0"
              >
                {facebookPixel.enabled ? 'Activado' : 'Desactivado'}
              </Label>
              <input
                id="fb-pixel-toggle"
                type="checkbox"
                checked={facebookPixel.enabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFacebookPixel({ ...facebookPixel, enabled: e.target.checked })
                }
                className="rounded"
                data-oid="c59cdf7"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="bawbgv0">
          <div className="grid gap-4 md:grid-cols-2" data-oid="o1duak7">
            <div className="space-y-2" data-oid="-qt-f60">
              <Label htmlFor="pixel-id" data-oid="jhegk1-">
                Pixel ID
              </Label>
              <Input
                id="pixel-id"
                value={facebookPixel.pixelId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFacebookPixel({ ...facebookPixel, pixelId: e.target.value })
                }
                placeholder="1234567890123456"
                disabled={!facebookPixel.enabled}
                data-oid="x2b.z9z"
              />
            </div>
            <div className="space-y-2" data-oid="-hfa:y8">
              <Label htmlFor="fb-access-token" data-oid="07akama">
                Access Token (Opcional)
              </Label>
              <Input
                id="fb-access-token"
                type="password"
                value={facebookPixel.accessToken}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFacebookPixel({ ...facebookPixel, accessToken: e.target.value })
                }
                placeholder="EAAxxxxxxxxxxxxx"
                disabled={!facebookPixel.enabled}
                data-oid="i30c3__"
              />
            </div>
          </div>

          {facebookPixel.enabled && facebookPixel.pixelId && (
            <div className="bg-muted p-3 rounded-lg" data-oid="5lyn:7:">
              <p className="text-sm font-medium mb-2" data-oid="7_2gu1u">
                Código de Instalación (Web):
              </p>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto" data-oid="h6.6mf7">
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
      <Card data-oid="i1muol0">
        <CardHeader data-oid="qgfrx7i">
          <div className="flex items-center justify-between" data-oid="g.01fky">
            <CardTitle className="flex items-center gap-2" data-oid="f3rmc5u">
              <Chrome className="h-5 w-5" data-oid="szvs7d:" />
              Google Analytics & Tags
            </CardTitle>
            <div className="flex items-center gap-2" data-oid="97zj6kz">
              <Label htmlFor="google-toggle" className="text-sm cursor-pointer" data-oid="18466z3">
                {googleTags.enabled ? 'Activado' : 'Desactivado'}
              </Label>
              <input
                id="google-toggle"
                type="checkbox"
                checked={googleTags.enabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setGoogleTags({ ...googleTags, enabled: e.target.checked })
                }
                className="rounded"
                data-oid="80qviif"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="h2_1y95">
          <div className="grid gap-4 md:grid-cols-2" data-oid=":nz1:1r">
            <div className="space-y-2" data-oid="y1ujbha">
              <Label htmlFor="ga4-id" data-oid="ar:2p-.">
                GA4 Measurement ID
              </Label>
              <Input
                id="ga4-id"
                value={googleTags.measurementId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setGoogleTags({ ...googleTags, measurementId: e.target.value })
                }
                placeholder="G-XXXXXXXXXX"
                disabled={!googleTags.enabled}
                data-oid="goxg-mx"
              />
            </div>
            <div className="space-y-2" data-oid="s36ta-9">
              <Label htmlFor="ua-id" data-oid="3_ikk0_">
                Universal Analytics ID (Legacy)
              </Label>
              <Input
                id="ua-id"
                value={googleTags.analyticsId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setGoogleTags({ ...googleTags, analyticsId: e.target.value })
                }
                placeholder="UA-XXXXXXXXX-X"
                disabled={!googleTags.enabled}
                data-oid="r34mvft"
              />
            </div>
            <div className="space-y-2" data-oid="q6rpcm1">
              <Label htmlFor="gtm-id" data-oid="8.mndok">
                Google Tag Manager ID
              </Label>
              <Input
                id="gtm-id"
                value={googleTags.tagManagerId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setGoogleTags({ ...googleTags, tagManagerId: e.target.value })
                }
                placeholder="GTM-XXXXXXX"
                disabled={!googleTags.enabled}
                data-oid="9sg.xvo"
              />
            </div>
            <div className="space-y-2" data-oid="6:utyu3">
              <Label htmlFor="site-verification" data-oid="1_ig8yt">
                Site Verification Meta Tag
              </Label>
              <Input
                id="site-verification"
                value={googleTags.siteVerification}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setGoogleTags({ ...googleTags, siteVerification: e.target.value })
                }
                placeholder="google-site-verification=xxxxx"
                disabled={!googleTags.enabled}
                data-oid="wjhjay_"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP (Model Context Protocol) */}
      <Card data-oid="gws:-.2">
        <CardHeader data-oid="o31n4jl">
          <div className="flex items-center justify-between" data-oid="2bmhspj">
            <CardTitle className="flex items-center gap-2" data-oid="9fjsu6i">
              <Zap className="h-5 w-5" data-oid="knnftqa" />
              MCP (Model Context Protocol)
            </CardTitle>
            <div className="flex items-center gap-2" data-oid="fu5xzdg">
              <Label htmlFor="mcp-toggle" className="text-sm cursor-pointer" data-oid="b:lui4r">
                {mcpConfig.enabled ? 'Activado' : 'Desactivado'}
              </Label>
              <input
                id="mcp-toggle"
                type="checkbox"
                checked={mcpConfig.enabled}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMcpConfig({ ...mcpConfig, enabled: e.target.checked })
                }
                className="rounded"
                data-oid="9t5..69"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4" data-oid=".ccsan_">
          <div className="grid gap-4 md:grid-cols-2" data-oid="srh18pu">
            <div className="space-y-2" data-oid="l7_i7wh">
              <Label htmlFor="mcp-server" data-oid="ji_6lx:">
                Server URL
              </Label>
              <Input
                id="mcp-server"
                value={mcpConfig.serverUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMcpConfig({ ...mcpConfig, serverUrl: e.target.value })
                }
                placeholder="https://mcp.example.com"
                disabled={!mcpConfig.enabled}
                data-oid="jou16-4"
              />
            </div>
            <div className="space-y-2" data-oid="3g9k54q">
              <Label htmlFor="mcp-key" data-oid="gay4ak_">
                API Key
              </Label>
              <Input
                id="mcp-key"
                type="password"
                value={mcpConfig.apiKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMcpConfig({ ...mcpConfig, apiKey: e.target.value })
                }
                placeholder="mcp_xxxxxxxxxxxxx"
                disabled={!mcpConfig.enabled}
                data-oid="po5aom:"
              />
            </div>
          </div>

          <div className="space-y-2" data-oid="83_qxsu">
            <Label data-oid="pndwxyk">Características Habilitadas</Label>
            <div className="space-y-2" data-oid="rma41nd">
              {(Object.entries(mcpConfig.features) as [keyof MCPFeatures, boolean][]).map(
                ([feature, enabled]) => (
                  <div key={feature} className="flex items-center gap-2" data-oid="8bv4o13">
                    <input
                      type="checkbox"
                      id={`mcp-${feature}`}
                      checked={enabled}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setMcpConfig({
                          ...mcpConfig,
                          features: { ...mcpConfig.features, [feature]: e.target.checked },
                        })
                      }
                      disabled={!mcpConfig.enabled}
                      className="rounded"
                      data-oid="g:h-s2w"
                    />

                    <Label
                      htmlFor={`mcp-${feature}`}
                      className="cursor-pointer capitalize"
                      data-oid="2g:a342"
                    >
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                  </div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card data-oid="6piw9e2">
        <CardHeader data-oid="i_i28xo">
          <div className="flex items-center justify-between" data-oid="v0l-.be">
            <CardTitle className="flex items-center gap-2" data-oid="vahe7g-">
              <Webhook className="h-5 w-5" data-oid="aqfig4p" />
              Webhooks
            </CardTitle>
            <Button variant="outline" size="sm" data-oid="_p2h8e3">
              <Plus className="mr-2 h-4 w-4" data-oid="0aevgrk" />
              Nuevo Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="j7yq3p6">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border rounded-lg p-4" data-oid=":zxvh3:">
              <div className="flex items-start justify-between mb-2" data-oid="5w._-z0">
                <div className="flex-1" data-oid="jjpt_n9">
                  <div className="flex items-center gap-2" data-oid="m2hk:ib">
                    <p className="font-medium" data-oid="qe3tw53">
                      {webhook.name}
                    </p>
                    {webhook.active && (
                      <CheckCircle className="h-4 w-4 text-success" data-oid="bk9xroj" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-mono" data-oid=".x5v6uy">
                    {webhook.url}
                  </p>
                </div>
                <Button variant="ghost" size="sm" data-oid="m8jbkle">
                  <Trash2 className="h-4 w-4 text-destructive" data-oid="i6pl9m." />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap" data-oid="nfok3i0">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                    data-oid="ql7dtgq"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card data-oid="z0oqqr9">
        <CardHeader data-oid="jc5t61o">
          <CardTitle className="flex items-center gap-2" data-oid="y.y8ny-">
            <Code className="h-5 w-5" data-oid="-ic0rs4" />
            Documentación de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="6o0bpuk">
          <div className="space-y-2" data-oid="tcmb01.">
            <p className="text-sm text-muted-foreground" data-oid="_xn0ct9">
              Accede a la documentación completa de la API REST para integrar tu aplicación con
              AKADEMATE Admin.
            </p>
            <div className="flex gap-2" data-oid="0ytw35t">
              <Button variant="outline" data-oid="_4repvm">
                <Globe className="mr-2 h-4 w-4" data-oid="zl3x9jp" />
                Ver Documentación
              </Button>
              <Button variant="outline" data-oid=":p7-xlj">
                <Code className="mr-2 h-4 w-4" data-oid="z45tv6k" />
                Ejemplos de Código
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end" data-oid="cb:h3d5">
        <Button onClick={handleSaveIntegrations} data-oid="kbhe55t">
          <Save className="mr-2 h-4 w-4" data-oid="stfnxhz" />
          Guardar Configuración
        </Button>
      </div>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-oid="xjwvq3f"
        >
          <Card className="w-full max-w-md mx-4" data-oid="uood3sx">
            <CardHeader data-oid="6:vp9vr">
              <CardTitle data-oid="9anou99">Crear Nueva Clave API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="-mw5.po">
              <div className="space-y-2" data-oid="5:hfeft">
                <Label htmlFor="key-name" data-oid="0_so6mr">
                  Nombre de la Clave
                </Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewKeyName(e.target.value)}
                  placeholder="Ej: Production API, Mobile App, etc."
                  data-oid="u0m7759"
                />
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm" data-oid="bpp6.43">
                <p className="text-muted-foreground" data-oid="i-o2z7g">
                  Se generará una nueva clave de API única. Guárdala en un lugar seguro, no podrás
                  verla nuevamente después de crearla.
                </p>
              </div>
              <div className="flex gap-2" data-oid="cqiiuth">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  data-oid=".e7hy_3"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateKey}
                  className="flex-1"
                  disabled={!newKeyName}
                  data-oid="3o.rvgf"
                >
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
