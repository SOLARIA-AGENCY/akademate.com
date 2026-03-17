'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Avatar, AvatarImage, AvatarFallback } from '@payload-config/components/ui/avatar'
import { Separator } from '@payload-config/components/ui/separator'
import { ArrowLeft, Save, Upload, X, Loader2, User } from 'lucide-react'

export default function EditarPerfilPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'admin@akademate.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [_avatarFile, setAvatarFile] = useState<File | null>(null)

  const initials = formData.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate passwords if changing
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          throw new Error('Ingresa tu contraseña actual para cambiarla')
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Las contraseñas no coinciden')
        }
        if (formData.newPassword.length < 8) {
          throw new Error('La nueva contraseña debe tener al menos 8 caracteres')
        }
      }

      // TODO: Implement API call to update user profile
      // const formDataToSend = new FormData()
      // formDataToSend.append('name', formData.name)
      // formDataToSend.append('email', formData.email)
      // if (avatarFile) formDataToSend.append('avatar', avatarFile)
      // if (formData.newPassword) {
      //   formDataToSend.append('currentPassword', formData.currentPassword)
      //   formDataToSend.append('newPassword', formData.newPassword)
      // }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Success - redirect to profile
      router.push('/perfil')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl" data-oid="eqe.xdc">
      <PageHeader
        title="Editar Perfil"
        description="Actualiza tu información personal y configuración"
        icon={User}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid="2dk0vqq">
            <ArrowLeft className="h-5 w-5" data-oid="hu:7yhl" />
          </Button>
        }
        data-oid="j:1:cao"
      />

      <form onSubmit={handleSubmit} data-oid="9gmjwly">
        {/* Profile Photo */}
        <Card data-oid="mm6k.2a">
          <CardHeader data-oid="kprut7n">
            <CardTitle data-oid="11482o-">Foto de Perfil</CardTitle>
            <CardDescription data-oid="65ixzzt">
              Sube una imagen cuadrada (recomendado 400x400px, máx 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="hg88xsx">
            <div className="flex items-center gap-6" data-oid="kd_bnp0">
              <Avatar className="h-24 w-24" data-oid="-ogsrze">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Preview" data-oid="-er_n0:" />
                ) : null}
                <AvatarFallback
                  className="bg-primary text-primary-foreground text-2xl font-bold"
                  data-oid="7.wiobn"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex gap-2" data-oid="5x-at6v">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarClick}
                  disabled={loading}
                  data-oid="c-z_wws"
                >
                  <Upload className="mr-2 h-4 w-4" data-oid="docw1pk" />
                  {avatarPreview ? 'Cambiar Foto' : 'Subir Foto'}
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveAvatar}
                    disabled={loading}
                    data-oid="ecebnz0"
                  >
                    <X className="h-4 w-4" data-oid="-yg2wlx" />
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  data-oid="3jk.-8k"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card data-oid="m00vner">
          <CardHeader data-oid="0tnu.n.">
            <CardTitle data-oid="n0wxqsw">Información Personal</CardTitle>
            <CardDescription data-oid="blr_cxy">
              Actualiza tu nombre y email de contacto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="mvsudmi">
            {error && (
              <div
                className="p-4 rounded-md bg-destructive/10 text-destructive text-sm"
                data-oid="293wj-5"
              >
                <p className="font-semibold" data-oid="xrkdnb1">
                  Error
                </p>
                <p data-oid="2r_ah8j">{error}</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2" data-oid="ov.dv1o">
              <div className="space-y-2" data-oid="jastxu2">
                <Label htmlFor="name" data-oid="p7_.wy:">
                  Nombre Completo{' '}
                  <span className="text-destructive" data-oid="6ts.pwx">
                    *
                  </span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Tu nombre completo"
                  data-oid="f:i5y2:"
                />
              </div>

              <div className="space-y-2" data-oid="19tjn8w">
                <Label htmlFor="email" data-oid="_ulgwd2">
                  Email{' '}
                  <span className="text-destructive" data-oid="c3_in_5">
                    *
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  disabled={loading}
                  placeholder="tu@email.com"
                  data-oid="czmf8xv"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card data-oid="28uctt.">
          <CardHeader data-oid="0lv-n_.">
            <CardTitle data-oid="pqdodwn">Cambiar Contraseña</CardTitle>
            <CardDescription data-oid="xagsu5s">
              Deja en blanco si no deseas cambiar tu contraseña
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="k2xnm1e">
            <div className="space-y-2" data-oid="52r6zx:">
              <Label htmlFor="currentPassword" data-oid="hwksq7h">
                Contraseña Actual
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                disabled={loading}
                placeholder="Ingresa tu contraseña actual"
                data-oid="3mfk15n"
              />
            </div>

            <Separator data-oid=":_tduf2" />

            <div className="grid gap-4 md:grid-cols-2" data-oid="-dgrhai">
              <div className="space-y-2" data-oid="wzfrwmw">
                <Label htmlFor="newPassword" data-oid="mj3k-:2">
                  Nueva Contraseña
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  data-oid="fhwg83:"
                />
              </div>

              <div className="space-y-2" data-oid="aun0rnv">
                <Label htmlFor="confirmPassword" data-oid="u:z9lhc">
                  Confirmar Contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  placeholder="Repite la nueva contraseña"
                  data-oid="3n75vk3"
                />
              </div>
            </div>

            {formData.newPassword && formData.newPassword.length < 8 && (
              <p className="text-xs text-muted-foreground" data-oid="n7xslko">
                La contraseña debe tener al menos 8 caracteres
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end" data-oid="uu9f75_">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            data-oid="-geios2"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} data-oid="1uax9pl">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid="rel:nhd" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" data-oid="7f0:vn5" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
