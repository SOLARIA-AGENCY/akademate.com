'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/page-header'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Clock,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_by: string
  created_by_name: string | null
  scopes: string[]
  status: 'active' | 'revoked'
  last_used_at: string | null
  revoked_at: string | null
  revoked_by: string | null
  expires_at: string | null
  created_at: string
  key?: string // Only present on creation response
}

const AVAILABLE_SCOPES = [
  { value: 'read:tenants', label: 'Leer tenants', description: 'Listar y ver detalles de tenants' },
  { value: 'write:tenants', label: 'Escribir tenants', description: 'Crear, editar y eliminar tenants' },
  { value: 'read:metrics', label: 'Leer métricas', description: 'Acceso a métricas del sistema' },
  { value: 'read:health', label: 'Health checks', description: 'Estado de salud de servicios' },
  { value: 'read:logs', label: 'Leer logs', description: 'Acceso a logs de requests' },
  { value: 'admin:*', label: 'Admin completo', description: 'Acceso total (superadmin)' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scopeColor(scope: string) {
  if (scope === 'admin:*') return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (scope.startsWith('write:')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState<ApiKey | null>(null)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newScopes, setNewScopes] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // ── Fetch keys ──────────────────────────────────────────────────────────

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/api-keys')
      if (res.ok) {
        const data = await res.json()
        setKeys(Array.isArray(data) ? data : [])
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  // ── Stats ───────────────────────────────────────────────────────────────

  const activeKeys = keys.filter((k) => k.status === 'active')
  const revokedKeys = keys.filter((k) => k.status === 'revoked')
  const lastCreated = keys.length > 0 ? keys[0] : null

  // ── Create handler ──────────────────────────────────────────────────────

  async function handleCreate() {
    setCreateError(null)
    if (!newName.trim()) {
      setCreateError('Nombre requerido')
      return
    }
    if (newScopes.length === 0) {
      setCreateError('Selecciona al menos un scope')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/ops/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), scopes: newScopes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateError(data.error ?? 'Error al crear')
        return
      }
      setCreatedKey(data.key)
      setNewName('')
      setNewScopes([])
      setShowCreateDialog(false)
      fetchKeys()
    } catch {
      setCreateError('Error de red')
    } finally {
      setCreating(false)
    }
  }

  // ── Revoke handler ──────────────────────────────────────────────────────

  async function handleRevoke(keyId: string) {
    try {
      const res = await fetch(`/api/ops/api-keys/${keyId}`, { method: 'DELETE' })
      if (res.ok) {
        setShowRevokeDialog(null)
        fetchKeys()
      }
    } catch {
      /* ignore */
    }
  }

  // ── Copy to clipboard ─────────────────────────────────────────────────

  function copyKey(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Toggle scope ──────────────────────────────────────────────────────

  function toggleScope(scope: string) {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  return (
    <>
      <PageHeader title="API Keys" description="Gestiona las API keys de acceso programático">
        <button
          onClick={() => {
            setShowCreateDialog(true)
            setCreateError(null)
            setNewName('')
            setNewScopes([])
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
        >
          <Plus className="size-4" />
          Nueva API Key
        </button>
      </PageHeader>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Key className="size-5 text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Activas</p>
              <p className="text-2xl font-bold text-green-400">{loading ? '—' : activeKeys.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Revocadas</p>
              <p className="text-2xl font-bold text-red-400">{loading ? '—' : revokedKeys.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="size-5 text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Ultima creada</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {loading ? '—' : lastCreated ? formatDate(lastCreated.created_at) : 'Ninguna'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Created key banner (shown once after creation) ───────────────── */}
      {createdKey && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 font-semibold text-sm">API Key creada correctamente</p>
              <p className="text-amber-300/70 text-xs mt-1">
                Copia la key ahora. No podras verla de nuevo.
              </p>
              <div className="flex items-center gap-2 mt-3 bg-black/20 rounded-lg px-4 py-3">
                <code className="text-amber-300 font-mono text-sm flex-1 break-all select-all">
                  {createdKey}
                </code>
                <button
                  onClick={() => copyKey(createdKey)}
                  className="p-2 text-amber-300 hover:text-amber-200 transition-colors shrink-0"
                  title="Copiar"
                >
                  {copied ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="p-1 text-amber-300/60 hover:text-amber-300 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Keys table ───────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Cargando API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No hay API keys creadas</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Crea tu primera API key para acceso programático
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Prefijo</th>
                  <th className="px-4 py-3 text-left">Creada por</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Ultimo uso</th>
                  <th className="px-4 py-3 text-left">Scopes</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Key className="size-4 text-muted-foreground/60" />
                        <span className="font-medium text-foreground">{apiKey.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                        {apiKey.key_prefix}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {apiKey.created_by_name ?? apiKey.created_by}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(apiKey.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(apiKey.last_used_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.scopes.map((scope) => (
                          <span
                            key={scope}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${scopeColor(scope)}`}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {apiKey.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          <CheckCircle className="size-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          <XCircle className="size-3" />
                          Revocada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {apiKey.status === 'active' && (
                        <button
                          onClick={() => setShowRevokeDialog(apiKey)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="size-3" />
                          Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Dialog (modal overlay) ────────────────────────────────── */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Shield className="size-5 text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Nueva API Key</h2>
              </div>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej: Backend Production, CI/CD Pipeline..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  autoFocus
                />
              </div>

              {/* Scopes */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Permisos (scopes)
                </label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        newScopes.includes(scope.value)
                          ? 'bg-indigo-500/10 border-indigo-500/40'
                          : 'bg-muted/10 border-border hover:bg-muted/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-0.5 accent-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{scope.label}</p>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                        <code className="text-[10px] text-muted-foreground/60 font-mono">
                          {scope.value}
                        </code>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {createError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="size-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{createError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear API Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Confirmation Dialog ───────────────────────────────────── */}
      {showRevokeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="size-5 text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Revocar API Key</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Seguro que quieres revocar <strong className="text-foreground">{showRevokeDialog.name}</strong>?
              </p>
              <p className="text-xs text-muted-foreground/70">
                Esta accion es irreversible. Cualquier servicio que use esta key dejara de funcionar
                inmediatamente.
              </p>
              <div className="p-3 bg-muted/20 rounded-lg">
                <code className="text-xs font-mono text-muted-foreground">
                  {showRevokeDialog.key_prefix}...
                </code>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/10">
              <button
                onClick={() => setShowRevokeDialog(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRevoke(showRevokeDialog.id)}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium"
              >
                <Trash2 className="size-4" />
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
