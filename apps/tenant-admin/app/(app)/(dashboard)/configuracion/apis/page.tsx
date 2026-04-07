'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@payload-config/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Checkbox } from '@payload-config/components/ui/checkbox'

// ============================================================================
// Types
// ============================================================================

type ApiScope =
  | 'courses:read'
  | 'courses:write'
  | 'cycles:read'
  | 'cycles:write'
  | 'campuses:read'
  | 'campuses:write'
  | 'convocatorias:read'
  | 'convocatorias:write'
  | 'students:read'
  | 'students:write'
  | 'enrollments:read'
  | 'enrollments:write'
  | 'staff:read'
  | 'staff:write'
  | 'analytics:read'
  | 'keys:manage'

interface ApiKey {
  id: string
  name: string
  scopes: ApiScope[]
  is_active: boolean
  rate_limit_per_day: number
  last_used_at: string | null
  created_at: string
}

// ============================================================================
// Scope definitions — grouped for UX
// ============================================================================

const SCOPE_GROUPS: { label: string; scopes: { value: ApiScope; label: string }[] }[] = [
  {
    label: 'Cursos',
    scopes: [
      { value: 'courses:read', label: 'Lectura' },
      { value: 'courses:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Ciclos Formativos',
    scopes: [
      { value: 'cycles:read', label: 'Lectura' },
      { value: 'cycles:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Sedes',
    scopes: [
      { value: 'campuses:read', label: 'Lectura' },
      { value: 'campuses:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Convocatorias',
    scopes: [
      { value: 'convocatorias:read', label: 'Lectura' },
      { value: 'convocatorias:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Alumnos y Leads',
    scopes: [
      { value: 'students:read', label: 'Lectura' },
      { value: 'students:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Matriculas',
    scopes: [
      { value: 'enrollments:read', label: 'Lectura' },
      { value: 'enrollments:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Personal',
    scopes: [
      { value: 'staff:read', label: 'Lectura' },
      { value: 'staff:write', label: 'Escritura' },
    ],
  },
  {
    label: 'Analiticas',
    scopes: [{ value: 'analytics:read', label: 'Lectura' }],
  },
  {
    label: 'Gestion de claves',
    scopes: [{ value: 'keys:manage', label: 'Gestionar API Keys' }],
  },
]

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string | null): string {
  if (!iso) return 'Nunca'
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function scopeColor(scope: ApiScope): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (scope.includes('write') || scope === 'keys:manage') return 'destructive'
  if (scope.includes('analytics')) return 'secondary'
  return 'outline'
}

// ============================================================================
// API helpers
// ============================================================================

async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await fetch('/api/internal/api-keys', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
  const json = (await res.json()) as { data: ApiKey[] }
  return json.data
}

async function createApiKey(body: {
  name: string
  scopes: ApiScope[]
  rate_limit_per_day: number
}): Promise<{ id: string; name: string; scopes: ApiScope[]; plain_key: string; created_at: string; is_active: boolean; rate_limit_per_day: number }> {
  const res = await fetch('/api/internal/api-keys', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = (await res.json()) as { error?: string }
    throw new Error(json.error ?? `Error ${res.status}`)
  }
  const json = (await res.json()) as { data: { id: string; name: string; scopes: ApiScope[]; plain_key: string; created_at: string; is_active: boolean; rate_limit_per_day: number } }
  return json.data
}

async function revokeApiKey(id: string): Promise<void> {
  const res = await fetch(`/api/internal/api-keys/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const json = (await res.json()) as { error?: string }
    throw new Error(json.error ?? `Error ${res.status}`)
  }
}

// ============================================================================
// Component: New Key Dialog
// ============================================================================

interface NewKeyDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (key: ApiKey, plainKey: string) => void
}

function NewKeyDialog({ open, onClose, onCreated }: NewKeyDialogProps) {
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([])
  const [rateLimit, setRateLimit] = useState<number>(1000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setSelectedScopes([])
    setRateLimit(1000)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleScope = (scope: ApiScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    )
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (selectedScopes.length === 0) {
      setError('Selecciona al menos un permiso')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const created = await createApiKey({
        name: name.trim(),
        scopes: selectedScopes,
        rate_limit_per_day: rateLimit,
      })
      onCreated(
        {
          id: created.id,
          name: created.name,
          scopes: created.scopes,
          is_active: created.is_active,
          rate_limit_per_day: created.rate_limit_per_day,
          last_used_at: null,
          created_at: created.created_at,
        },
        created.plain_key,
      )
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la clave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Nueva API Key
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="api-key-name">Nombre</Label>
            <Input
              id="api-key-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Integracion Moodle, App movil..."
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="rounded-md border p-3 space-y-3">
              {SCOPE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {group.scopes.map(({ value, label }) => (
                      <div key={value} className="flex items-center gap-1.5">
                        <Checkbox
                          id={`scope-${value}`}
                          checked={selectedScopes.includes(value)}
                          onCheckedChange={() => toggleScope(value)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={`scope-${value}`}
                          className="text-sm cursor-pointer select-none"
                        >
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limit */}
          <div className="space-y-1.5">
            <Label htmlFor="rate-limit">Limite de requests por dia</Label>
            <Input
              id="rate-limit"
              type="number"
              min={1}
              max={1000000}
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Default: 1000 requests/dia</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || selectedScopes.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Generar clave
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Component: Plain Key Modal (shown ONCE after creation)
// ============================================================================

interface PlainKeyModalProps {
  open: boolean
  keyName: string
  plainKey: string
  onClose: () => void
}

function PlainKeyModal({ open, keyName, plainKey, onClose }: PlainKeyModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available — user must copy manually
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <ShieldCheck className="h-5 w-5" />
            Clave generada: {keyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Warning */}
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Guarda esta clave ahora.</strong> No se mostrara de nuevo. Si la pierdes,
              tendras que revocarla y crear una nueva.
            </span>
          </div>

          {/* Key display */}
          <div className="space-y-1.5">
            <Label>Tu API Key</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm break-all select-all">
                {plainKey}
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Usa esta clave en el header{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              Authorization: Bearer {'<tu-clave>'}
            </code>{' '}
            para autenticar requests a la API.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Entendido, ya la guarde</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Component: Revoke Confirm Dialog
// ============================================================================

interface RevokeDialogProps {
  open: boolean
  keyName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function RevokeDialog({ open, keyName, onConfirm, onCancel, loading }: RevokeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldOff className="h-5 w-5" />
            Revocar API Key
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Estas a punto de revocar la clave <strong>{keyName}</strong>. Las integraciones que usen
          esta clave dejaran de funcionar inmediatamente.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revocando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Revocar clave
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function APIsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Dialog states
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newKeyResult, setNewKeyResult] = useState<{ key: ApiKey; plainKey: string } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)

  const loadKeys = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await fetchApiKeys()
      setKeys(data)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'No se pudieron cargar las claves')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  const handleCreated = (key: ApiKey, plainKey: string) => {
    setKeys((prev) => [key, ...prev])
    setShowNewDialog(false)
    setNewKeyResult({ key, plainKey })
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevokeLoading(true)
    try {
      await revokeApiKey(revokeTarget.id)
      setKeys((prev) =>
        prev.map((k) => (k.id === revokeTarget.id ? { ...k, is_active: false } : k)),
      )
      setRevokeTarget(null)
    } catch (err) {
      console.error('[APIsPage] revoke error:', err)
    } finally {
      setRevokeLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="APIs y Webhooks"
        description="Gestiona claves de API para acceso programatico a tus datos"
        icon={Key}
        actions={
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva API Key
          </Button>
        }
      />

      {/* API Keys table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Claves de API
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando claves...
            </div>
          )}

          {!loading && fetchError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {fetchError}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => void loadKeys()}
              >
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !fetchError && keys.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Key className="h-12 w-12 mb-3 opacity-30" />
              <p className="mb-4">No hay claves de API creadas</p>
              <Button variant="outline" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera clave
              </Button>
            </div>
          )}

          {!loading && !fetchError && keys.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Ultimo uso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id} className={!key.is_active ? 'opacity-50' : undefined}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Creada {formatDate(key.created_at)} &middot; {key.rate_limit_per_day}/dia
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant={scopeColor(scope)} className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(key.last_used_at)}
                    </TableCell>
                    <TableCell>
                      {key.is_active ? (
                        <Badge variant="default" className="bg-green-600 text-white">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ShieldOff className="mr-1 h-3 w-3" />
                          Revocada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {key.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(key)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Revocar</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewKeyDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreated={handleCreated}
      />

      {newKeyResult && (
        <PlainKeyModal
          open={true}
          keyName={newKeyResult.key.name}
          plainKey={newKeyResult.plainKey}
          onClose={() => setNewKeyResult(null)}
        />
      )}

      {revokeTarget && (
        <RevokeDialog
          open={true}
          keyName={revokeTarget.name}
          onConfirm={() => void handleRevoke()}
          onCancel={() => setRevokeTarget(null)}
          loading={revokeLoading}
        />
      )}
    </div>
  )
}
