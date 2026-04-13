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

interface NewEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (enrollmentId: string) => void
}

const ELIGIBLE_STATUSES = new Set(['interested', 'following_up', 'enrolling'])

export function NewEnrollmentDialog({ open, onOpenChange, onCreated }: NewEnrollmentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [leads, setLeads] = useState<EligibleLead[]>([])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedLeadId('')
      setError(null)
      return
    }

    let cancelled = false
    const loadLeads = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/leads?limit=500', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('No se pudieron cargar los leads para matricular')
        }

        const payload = await res.json()
        const docs = Array.isArray(payload?.docs) ? payload.docs : []
        const eligible = docs
          .filter((lead: any) => ELIGIBLE_STATUSES.has(String(lead?.status ?? '')) && !lead?.enrollment_id)
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
            setSelectedLeadId((current) => (current ? current : eligible[0].id))
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLeads([])
          setError(e instanceof Error ? e.message : 'No se pudieron cargar los leads')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadLeads()
    return () => {
      cancelled = true
    }
  }, [open])

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

  const selectedLead = filteredLeads.find((lead) => lead.id === selectedLeadId) ?? null

  const handleCreate = async () => {
    if (!selectedLeadId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${selectedLeadId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
            Selecciona un lead elegible y crea su ficha de matrícula.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder="Buscar lead por nombre, email o teléfono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando leads elegibles...
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No hay leads en estado `interested`, `following_up` o `enrolling` sin matrícula creada.
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
            disabled={saving || loading || filteredLeads.length === 0 || !selectedLeadId}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear Matrícula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

