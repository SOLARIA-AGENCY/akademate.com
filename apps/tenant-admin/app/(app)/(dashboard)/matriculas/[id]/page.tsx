'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Loader2, ArrowLeft, Edit, UserPlus, GraduationCap, CreditCard, User } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

interface MatriculaDetail {
  id: string | number
  status?: string
  payment_status?: string
  total_amount?: number
  amount_paid?: number
  financial_aid_applied?: boolean
  financial_aid_amount?: number
  financial_aid_status?: string | null
  notes?: string | null
  lead?: {
    id?: string | number
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
    dni?: string | null
    address?: string | null
    city?: string | null
    postal_code?: string | null
    date_of_birth?: string | null
    photo_url?: string | null
  }
  course?: {
    name?: string | null
  }
  course_run?: {
    id?: string | number
    code?: string | null
    status?: string | null
    start_date?: string | null
    end_date?: string | null
  }
  campus?: {
    name?: string | null
  }
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-ES')
}

export default function MatriculaDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doc, setDoc] = useState<MatriculaDetail | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setError(null)
        const res = await fetch(`/api/matriculas/${id}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(typeof data?.error === 'string' ? data.error : 'No se pudo cargar la matrícula')
        }
        if (!cancelled) {
          setDoc(data as MatriculaDetail)
        }
      } catch (e) {
        if (!cancelled) {
          setDoc(null)
          setError(e instanceof Error ? e.message : 'No se pudo cargar la matrícula')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const leadName = `${doc?.lead?.first_name ?? ''} ${doc?.lead?.last_name ?? ''}`.trim() || doc?.lead?.email || 'Alumno'

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Matrícula #${id}`}
        description={leadName}
        icon={GraduationCap}
        actions={
          <div className="flex gap-2">
            {doc?.lead?.id ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/matriculas?nueva=1&leadId=${String(doc.lead?.id)}`)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Matricular en otro curso
              </Button>
            ) : null}
            <Button onClick={() => router.push(`/matriculas/${id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar ficha
            </Button>
            <Button variant="ghost" onClick={() => router.push('/matriculas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        }
      />

      {error ? (
        <Card>
          <CardContent className="py-8 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {doc ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Alumno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-3 pb-2">
                  {doc.lead?.photo_url ? (
                    <img src={doc.lead.photo_url} alt={leadName} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
                      {leadName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{leadName}</p>
                    <p className="text-muted-foreground">{doc.lead?.email ?? '—'}</p>
                    <p className="text-muted-foreground">{doc.lead?.phone ?? '—'}</p>
                  </div>
                </div>
                <p><span className="font-medium">DNI:</span> {doc.lead?.dni ?? '—'}</p>
                <p><span className="font-medium">Dirección:</span> {doc.lead?.address ?? '—'}</p>
                <p><span className="font-medium">Ciudad:</span> {doc.lead?.city ?? '—'}</p>
                <p><span className="font-medium">CP:</span> {doc.lead?.postal_code ?? '—'}</p>
                <p><span className="font-medium">Nacimiento:</span> {formatDate(doc.lead?.date_of_birth ?? null)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Convocatoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Curso:</span> {doc.course?.name ?? '—'}</p>
                <p><span className="font-medium">Código:</span> {doc.course_run?.code ?? '—'}</p>
                <p><span className="font-medium">Sede:</span> {doc.campus?.name ?? '—'}</p>
                <p><span className="font-medium">Inicio:</span> {formatDate(doc.course_run?.start_date ?? null)}</p>
                <p><span className="font-medium">Fin:</span> {formatDate(doc.course_run?.end_date ?? null)}</p>
                <div className="pt-1">
                  <Badge variant="outline">{doc.course_run?.status ?? 'sin estado'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Estado y pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Estado matrícula:</span> {doc.status ?? '—'}</p>
                <p><span className="font-medium">Estado pago:</span> {doc.payment_status ?? '—'}</p>
                <p><span className="font-medium">Importe total:</span> {(doc.total_amount ?? 0).toLocaleString('es-ES')}€</p>
                <p><span className="font-medium">Pagado:</span> {(doc.amount_paid ?? 0).toLocaleString('es-ES')}€</p>
                <p><span className="font-medium">Ayuda financiera:</span> {doc.financial_aid_applied ? 'Sí' : 'No'}</p>
                <p><span className="font-medium">Estado ayuda:</span> {doc.financial_aid_status ?? '—'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas de matrícula</CardTitle>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap text-muted-foreground">
              {doc.notes?.trim() || 'Sin notas registradas.'}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
