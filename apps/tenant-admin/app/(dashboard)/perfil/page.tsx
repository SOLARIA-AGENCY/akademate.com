'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@payload-config/components/ui/avatar'
import { Badge } from '@payload-config/components/ui/badge'
import { Separator } from '@payload-config/components/ui/separator'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Edit, Mail, Calendar, Shield, Camera, User } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()

  const [user, setUser] = useState({
    id: 1,
    name: 'Admin User',
    email: 'admin@akademate.com',
    role: 'Admin',
    avatar: null as string | null,
    initials: 'AU',
    joined: '2024-01-15',
    lastLogin: '2025-11-15T10:30:00',
  })

  useEffect(() => {
    const loadSessionUser = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        if (!response.ok) return

        const payload = (await response.json()) as {
          authenticated?: boolean
          user?: { id?: number | string; name?: string; email?: string; role?: string }
        }

        if (!payload.authenticated || !payload.user?.email) return

        const displayName = payload.user.name?.trim() || payload.user.email
        const initials =
          displayName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || 'AU'

        setUser((prev) => ({
          ...prev,
          id: Number(payload.user?.id ?? prev.id),
          name: displayName,
          email: payload.user?.email ?? prev.email,
          role: payload.user?.role ?? prev.role,
          initials,
        }))
      } catch (error) {
        console.warn('[Perfil] Unable to load session user:', error)
      }
    }

    void loadSessionUser()
  }, [])

  return (
    <div className="space-y-6 max-w-4xl" data-oid="q:3j:zi">
      <PageHeader
        title="Mi Perfil"
        description="Gestiona tu información personal y configuración de cuenta"
        icon={User}
        actions={
          <Button onClick={() => router.push('/perfil/editar')} data-oid="b:rqoh4">
            <Edit className="mr-2 h-4 w-4" data-oid="gp_cto-" />
            Editar Perfil
          </Button>
        }
        data-oid="2dn4jop"
      />

      {/* Profile Card */}
      <Card data-oid="vtgg6u-">
        <CardHeader data-oid="p2yf75g">
          <CardTitle data-oid="5:vtvwn">Información Personal</CardTitle>
          <CardDescription data-oid="8euc5d-">
            Tu información de usuario y rol en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6" data-oid="ek_6a_y">
          {/* Avatar Section */}
          <div className="flex items-center gap-6" data-oid="zcojqek">
            <div className="relative group" data-oid="zi:epk-">
              <Avatar className="h-24 w-24" data-oid="rp7f6wt">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} data-oid=":2bze98" />
                ) : null}
                <AvatarFallback
                  className="bg-primary text-primary-foreground text-2xl font-bold"
                  data-oid="l63s.en"
                >
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => router.push('/perfil/editar')}
                data-oid="ovjav47"
              >
                <Camera className="h-4 w-4" data-oid="ydg_730" />
              </Button>
            </div>
            <div className="flex-1" data-oid="8pqnmll">
              <h2 className="text-2xl font-bold" data-oid="g.rew_c">
                {user.name}
              </h2>
              <div className="flex items-center gap-2 mt-2" data-oid="7wh8mq1">
                <Badge variant="default" data-oid="jmrf3uk">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          <Separator data-oid="5-xyqhm" />

          {/* Contact Information */}
          <div className="grid gap-4 md:grid-cols-2" data-oid="uc.ny03">
            <div className="space-y-2" data-oid="per4yq:">
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                data-oid="3ftrtro"
              >
                <Mail className="h-4 w-4" data-oid="h49:t8e" />
                <span className="font-medium" data-oid="qe.z2ff">
                  Email
                </span>
              </div>
              <p className="text-base" data-oid="ypjvbm1">
                {user.email}
              </p>
            </div>

            <div className="space-y-2" data-oid="8cub2k3">
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                data-oid="bz6k0d_"
              >
                <Shield className="h-4 w-4" data-oid=".bejzx:" />
                <span className="font-medium" data-oid="-czjtxq">
                  Rol
                </span>
              </div>
              <p className="text-base" data-oid="l56tcn3">
                {user.role}
              </p>
            </div>

            <div className="space-y-2" data-oid="d_ie42v">
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                data-oid="bk_4fpe"
              >
                <Calendar className="h-4 w-4" data-oid="g2jurg:" />
                <span className="font-medium" data-oid="3b-fzgy">
                  Miembro desde
                </span>
              </div>
              <p className="text-base" data-oid="bhnibvo">
                {new Date(user.joined).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="space-y-2" data-oid="qfph0u2">
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                data-oid="i66vplb"
              >
                <Calendar className="h-4 w-4" data-oid="xkv-lj6" />
                <span className="font-medium" data-oid="0blgz.w">
                  Último acceso
                </span>
              </div>
              <p className="text-base" data-oid="ynog4bm">
                {new Date(user.lastLogin).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card data-oid="txjla08">
        <CardHeader data-oid="rnxzuan">
          <CardTitle data-oid="x9g_mfe">Seguridad</CardTitle>
          <CardDescription data-oid="alit7j8">Gestiona la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="kdsppz2">
          <div
            className="flex items-center justify-between p-4 border rounded-lg"
            data-oid="_mej:up"
          >
            <div data-oid="f8.o9g-">
              <p className="font-medium" data-oid="gqhf40e">
                Contraseña
              </p>
              <p className="text-sm text-muted-foreground" data-oid="ig.9w-k">
                Última modificación hace 30 días
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/perfil/editar#password')}
              data-oid="f.i7nnb"
            >
              Cambiar Contraseña
            </Button>
          </div>

          <div
            className="flex items-center justify-between p-4 border rounded-lg"
            data-oid="rd.2s-g"
          >
            <div data-oid="db47w7s">
              <p className="font-medium" data-oid="rnp6vta">
                Autenticación de dos factores
              </p>
              <p className="text-sm text-muted-foreground" data-oid="vz727.e">
                No configurada
              </p>
            </div>
            <Button variant="outline" disabled data-oid="kvjt4-9">
              Próximamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
