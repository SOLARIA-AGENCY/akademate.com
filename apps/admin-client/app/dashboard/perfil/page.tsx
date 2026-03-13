'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PerfilPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    fetch('/api/ops/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setName(data.name ?? '')
          setEmail(data.email ?? '')
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError('')
    setNameSuccess(false)
    setIsSavingName(true)
    try {
      const res = await fetch('/api/ops/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNameError(data.error ?? 'Error al guardar')
      } else {
        setNameSuccess(true)
        setTimeout(() => setNameSuccess(false), 3000)
      }
    } catch {
      setNameError('Error de conexión')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsSavingPassword(true)
    try {
      const res = await fetch('/api/ops/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPasswordError(data.error ?? 'Error al cambiar contraseña')
      } else {
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 3000)
      }
    } catch {
      setPasswordError('Error de conexión')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Mi Perfil"
        description="Gestiona tu información y seguridad de cuenta"
      />

      {/* Profile info */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Información de Cuenta</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-md text-muted-foreground text-sm cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar.</p>
            </div>

            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
            {nameSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">Nombre actualizado correctamente.</p>
            )}

            <button
              type="submit"
              disabled={isSavingName || !name.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-3.5 w-3.5" />
              {isSavingName ? 'Guardando...' : 'Guardar Nombre'}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Cambiar Contraseña</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Mínimo 8 caracteres</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-muted/50 border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-muted/50 border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-xs text-green-600 dark:text-green-400">Contraseña actualizada correctamente.</p>
            )}

            <button
              type="submit"
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-3.5 w-3.5" />
              {isSavingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
