'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@payload-config/components/ui/dialog'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Badge } from '@payload-config/components/ui/badge'
import { Loader2, UserPlus } from 'lucide-react'

type EligibleLead = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  status?: string | null
  enrollment_id?: string | number | null
}

type CourseRunOption = {
  id: string
  label: string
}

type EnrollmentSource = 'lead' | 'direct'

interface NewEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (enrollmentId: string) => void
  initialLeadId?: string | null
}

const NON_ENROLLABLE_LEAD_STATUSES = new Set(['not_interested', 'unreachable', 'discarded', 'spam', 'rejected'])
const ENROLLABLE_COURSE_RUN_STATUSES = new Set(['enrollment_open'])

export function NewEnrollmentDialog({ open, onOpenChange, onCreated, initialLeadId }: NewEnrollmentDialogProps) {
  const [source, setSource] = useState<EnrollmentSource>('lead')
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loadingCourseRuns, setLoadingCourseRuns] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadLoadError, setLeadLoadError] = useState<string | null>(null)
  const [courseRunLoadError, setCourseRunLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [selectedLeadCourseRunId, setSelectedLeadCourseRunId] = useState<string>('')
  const [courseRuns, setCourseRuns] = useState<CourseRunOption[]>([])
  const [leads, setLeads] = useState<EligibleLead[]>([])
  const [directForm, setDirectForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    courseRunId: '',
  })

  useEffect(() => {
    if (!open) {
      setSource('lead')
      setSearch('')
      setSelectedLeadId('')
      setSelectedLeadCourseRunId('')
      setError(null)
      setLeadLoadError(null)
      setCourseRunLoadError(null)
      setDirectForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        courseRunId: '',
      })
      return
    }

    let cancelled = false
    const loadLeads = async () => {
      setLoadingLeads(true)
      setLeadLoadError(null)
      try {
        const res = await fetch('/api/leads?limit=500', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('No se pudieron cargar los leads para matricular')
        }

        const payload = await res.json()
        const docs = Array.isArray(payload?.docs) ? payload.docs : []
        const eligible = docs
          .filter((lead: any) => {
            const leadStatus = String(lead?.status ?? '')
            return !NON_ENROLLABLE_LEAD_STATUSES.has(leadStatus)
          })
          .map((lead: any) => ({
            id: String(lead.id),
            first_name: lead.first_name ?? null,
            last_name: lead.last_name ?? null,
            email: lead.email ?? null,
            phone: lead.phone ?? null,
            status: lead.status ?? null,
            enrollment_id: lead.enrollment_id ?? null,
          }))

        if (!cancelled) {
          setLeads(eligible)
          if (eligible.length > 0) {
            if (initialLeadId && eligible.some((lead: EligibleLead) => lead.id === initialLeadId)) {
              setSelectedLeadId(initialLeadId)
              setSource('lead')
            } else {
              setSelectedLeadId((current) => (current ? current : eligible[0].id))
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLeads([])
          setLeadLoadError(e instanceof Error ? e.message : 'No se pudieron cargar los leads')
        }
      } finally {
        if (!cancelled) {
          setLoadingLeads(false)
        }
      }
    }

    const loadCourseRuns = async () => {
      setLoadingCourseRuns(true)
      setCourseRunLoadError(null)
      try {
        const res = await fetch('/api/convocatorias', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('No se pudieron cargar las convocatorias')
        }

        const payload = await res.json()
        const rows = Array.isArray(payload?.data) ? payload.data : []
        const options = rows
          .filter((row: any) => ENROLLABLE_COURSE_RUN_STATUSES.has(String(row?.estado ?? '').toLowerCase()))
          .map((row: any) => {
            const id = String(row?.id ?? '')
            const courseName = String(row?.cursoNombre ?? 'Curso')
            const campusName = String(row?.campusNombre ?? 'Sin sede')
            const startDate = String(row?.fechaInicio ?? '').slice(0, 10)
            const label = [courseName, campusName, startDate ? `Inicio ${startDate}` : null]
              .filter(Boolean)
              .join(' · ')
            return { id, label }
          })
          .filter((option: CourseRunOption) => option.id.length > 0)

        if (!cancelled) {
          setCourseRuns(options)
          if (options.length > 0) {
            setSelectedLeadCourseRunId((current) => current || options[0].id)
            setDirectForm((current) => ({
              ...current,
              courseRunId: current.courseRunId || options[0].id,
            }))
          }
        }
      } catch (e) {
        if (!cancelled) {
          setCourseRuns([])
          setCourseRunLoadError(e instanceof Error ? e.message : 'No se pudieron cargar las convocatorias')
        }
      } finally {
        if (!cancelled) {
          setLoadingCourseRuns(false)
        }
      }
    }

    void loadLeads()
    void loadCourseRuns()
    return () => {
      cancelled = true
    }
  }, [open, initialLeadId])

  useEffect(() => {
    if (!open || !initialLeadId) return
    if (leads.some((lead) => lead.id === initialLeadId)) {
      setSelectedLeadId(initialLeadId)
      setSource('lead')
    }
  }, [open, initialLeadId, leads])

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads
    const q = search.trim().toLowerCase()
    return leads.filter((lead) => {
      const fullName = `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.toLowerCase()
      return (
        fullName.includes(q) ||
        String(lead.email ?? '').toLowerCase().includes(q) ||
        String(lead.phone ?? '').toLowerCase().includes(q)
      )
    })
  }, [leads, search])

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null

  const canSubmitLead =
    !loadingLeads &&
    !loadingCourseRuns &&
    Boolean(selectedLeadId) &&
    Boolean(selectedLead) &&
    selectedLeadCourseRunId.trim().length > 0
  const canSubmitDirect =
    !loadingCourseRuns &&
    directForm.firstName.trim().length > 0 &&
    directForm.lastName.trim().length > 0 &&
    directForm.email.trim().length > 0 &&
    directForm.phone.trim().length > 0 &&
    directForm.courseRunId.trim().length > 0

  const handleCreate = async () => {
    if (source === 'lead' && !canSubmitLead) return
    if (source === 'direct' && !canSubmitDirect) return

    setSaving(true)
    setError(null)
    try {
      const res =
        source === 'lead'
          ? await fetch(`/api/leads/${selectedLeadId}/enroll`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseRunId: selectedLeadCourseRunId }),
            })
          : await fetch('/api/enrollments/direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName: directForm.firstName.trim(),
                lastName: directForm.lastName.trim(),
                email: directForm.email.trim(),
                phone: directForm.phone.trim(),
                courseRunId: directForm.courseRunId,
              }),
            })

      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo crear la matrícula')
      }

      const enrollmentId = String(
        (data as any).enrollmentId ?? (data as any).enrollment_id ?? (data as any).id ?? '',
      )
      if (!enrollmentId) {
        throw new Error('La API no devolvió el ID de matrícula')
      }

      onOpenChange(false)
      onCreated?.(enrollmentId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la matrícula')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nueva Matrícula
          </DialogTitle>
          <DialogDescription>
            Puedes crear la matrícula desde un lead existente o dar de alta al alumno directamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={source === 'lead' ? 'default' : 'outline'}
              onClick={() => {
                setSource('lead')
                setError(null)
              }}
              disabled={saving}
            >
              Desde lead
            </Button>
            <Button
              type="button"
              variant={source === 'direct' ? 'default' : 'outline'}
              onClick={() => {
                setSource('direct')
                setError(null)
              }}
              disabled={saving}
            >
              Alta directa
            </Button>
          </div>

          {source === 'lead' ? (
            <>
              <Input
                placeholder="Buscar lead por nombre, email o teléfono"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {loadingLeads ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando leads...
                </div>
              ) : leadLoadError ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {leadLoadError}
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No hay leads disponibles para matriculación.
                </div>
              ) : (
                <>
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLeads.map((lead) => {
                        const fullName = `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || lead.email || `Lead ${lead.id}`
                        return (
                          <SelectItem key={lead.id} value={lead.id}>
                            {fullName} · {lead.email ?? 'sin email'}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {loadingCourseRuns ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando convocatorias...
                    </div>
                  ) : courseRunLoadError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                      {courseRunLoadError}
                    </div>
                  ) : courseRuns.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No hay convocatorias abiertas para matrícula.
                    </div>
                  ) : (
                    <Select value={selectedLeadCourseRunId} onValueChange={setSelectedLeadCourseRunId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la convocatoria a matricular" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseRuns.map((courseRun) => (
                          <SelectItem key={courseRun.id} value={courseRun.id}>
                            {courseRun.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedLead && (
                    <div className="rounded-md bg-muted/50 p-3 text-sm">
                      <div className="font-medium">
                        {`${selectedLead.first_name ?? ''} ${selectedLead.last_name ?? ''}`.trim() || selectedLead.email || `Lead ${selectedLead.id}`}
                      </div>
                      <div className="text-muted-foreground">{selectedLead.email ?? 'Sin email'}</div>
                      <div className="text-muted-foreground">{selectedLead.phone ?? 'Sin teléfono'}</div>
                      <div className="mt-2">
                        <Badge variant="outline">{selectedLead.status ?? 'new'}</Badge>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Nombre"
                  value={directForm.firstName}
                  onChange={(event) => setDirectForm((current) => ({ ...current, firstName: event.target.value }))}
                />
                <Input
                  placeholder="Apellidos"
                  value={directForm.lastName}
                  onChange={(event) => setDirectForm((current) => ({ ...current, lastName: event.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={directForm.email}
                  onChange={(event) => setDirectForm((current) => ({ ...current, email: event.target.value }))}
                />
                <Input
                  placeholder="Teléfono"
                  value={directForm.phone}
                  onChange={(event) => setDirectForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>

              {loadingCourseRuns ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando convocatorias...
                </div>
              ) : courseRunLoadError ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {courseRunLoadError}
                </div>
              ) : courseRuns.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No hay convocatorias abiertas para matrícula.
                </div>
              ) : (
                <Select
                  value={directForm.courseRunId}
                  onValueChange={(value) => setDirectForm((current) => ({ ...current, courseRunId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una convocatoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseRuns.map((courseRun) => (
                      <SelectItem key={courseRun.id} value={courseRun.id}>
                        {courseRun.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={saving || (source === 'lead' ? !canSubmitLead : !canSubmitDirect)}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear Matrícula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
