'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@payload-config/components/ui/alert'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { useToast } from '@payload-config/hooks/use-toast'
import { AlertCircle, Loader2 } from 'lucide-react'
import { EnrollmentBreadcrumb } from './EnrollmentBreadcrumb'
import { EnrollmentCart } from './EnrollmentCart'
import { EnrollmentStepper } from './EnrollmentStepper'
import { clearEnrollmentDraft, loadEnrollmentDraft, saveEnrollmentDraft } from './draft'
import {
  AlumnoStep,
  CourseStep,
  NextDisabledTooltip,
  PagoRgpdStep,
  ReviewStep,
  mapCourseRun,
  mapLeadToPerson,
} from './steps'
import {
  WIZARD_STAGES,
  createEmptyDraft,
  parseWizardStage,
  wizardStageFromStep,
  wizardStageTitle,
  wizardStepFromStage,
  type EnrollmentCourseOption,
  type EnrollmentDraft,
  type EnrollmentPerson,
  type PaymentMethod,
  type WizardStageId,
} from './types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function extractLeadList(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload)
  const docs = root?.docs
  if (Array.isArray(docs)) return docs.map((item) => asRecord(item) ?? {})
  const data = root?.data
  if (Array.isArray(data)) return data.map((item) => asRecord(item) ?? {})
  return []
}

function extractCourseRuns(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload)
  const data = root?.data
  if (Array.isArray(data)) return data.map((item) => asRecord(item) ?? {})
  if (Array.isArray(payload)) return payload.map((item) => asRecord(item) ?? {})
  return []
}

function nextDisabledReason(draft: EnrollmentDraft): string | null {
  const stage = wizardStageFromStep(draft.step)
  switch (stage) {
    case 1:
      return draft.course ? null : 'Selecciona una convocatoria'
    case 2:
      if (!draft.person.firstName.trim()) return 'El nombre es obligatorio'
      if (!draft.person.lastName.trim()) return 'Los apellidos son obligatorios'
      if (!draft.person.email.trim()) return 'El email es obligatorio'
      if (!draft.person.phone.trim()) return 'El teléfono es obligatorio'
      return null
    case 3:
      if (!draft.consentAccepted) return 'Debes aceptar el consentimiento'
      if (!draft.paymentMethod) return 'Selecciona un método de pago'
      return null
    case 4:
      return null
    default: {
      const _exhaustive: never = stage
      return _exhaustive
    }
  }
}

function accessChannel(draft: EnrollmentDraft): 'email' | 'sms' | 'qr' | 'webcam' | 'manual' {
  const kind = draft.course?.accessKind ?? 'fisico'
  if (kind === 'virtual') return draft.virtualSendChannel ?? 'email'
  if (draft.accessPhoto) return 'webcam'
  if (draft.accessPass === 'credential') return 'qr'
  return 'manual'
}

function continueLabel(stage: WizardStageId): string {
  switch (stage) {
    case 1:
      return 'Continuar a Alumno'
    case 2:
      return 'Continuar a Pago y RGPD'
    case 3:
      return 'Continuar a Confirmar'
    case 4:
      return 'Confirmar matrícula'
    default: {
      const _exhaustive: never = stage
      return _exhaustive
    }
  }
}

function backLabel(stage: WizardStageId): string | null {
  if (stage <= 1) return null
  return `Volver a ${wizardStageTitle((stage - 1) as WizardStageId)}`
}

export function EnrollmentWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [draft, setDraft] = useState<EnrollmentDraft>(createEmptyDraft)
  const [hydrated, setHydrated] = useState(false)
  const [people, setPeople] = useState<EnrollmentPerson[]>([])
  const [peopleLoading, setPeopleLoading] = useState(false)
  const [peopleError, setPeopleError] = useState<string | null>(null)
  const [courses, setCourses] = useState<EnrollmentCourseOption[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [alumnoAttempted, setAlumnoAttempted] = useState(false)
  const [convocatoriaAttempted, setConvocatoriaAttempted] = useState(false)
  const [pagoAttempted, setPagoAttempted] = useState(false)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const leadId = searchParams.get('leadId')
  const stage = wizardStageFromStep(draft.step)
  const completed = useMemo(() => {
    return new Set(WIZARD_STAGES.filter((item) => item.id < stage).map((item) => item.id))
  }, [stage])
  const disabledReason = nextDisabledReason(draft)
  const nextDisabled = submitting

  const updateDraft = useCallback((patch: Partial<EnrollmentDraft> | ((current: EnrollmentDraft) => EnrollmentDraft)) => {
    setDraft((current) => (typeof patch === 'function' ? patch(current) : { ...current, ...patch }))
  }, [])

  const goStage = useCallback(
    (next: WizardStageId) => {
      updateDraft({ step: wizardStepFromStage(next) })
      router.replace(`/matriculas/nueva?paso=${next}`, { scroll: false })
    },
    [router, updateDraft],
  )

  useEffect(() => {
    const loaded = loadEnrollmentDraft()
    const urlStage = parseWizardStage(searchParams.get('paso'))
    const hasPaso = searchParams.get('paso') != null
    setDraft({
      ...loaded,
      step: wizardStepFromStage(hasPaso ? urlStage : wizardStageFromStep(loaded.step)),
    })
    setHydrated(true)
    if (!hasPaso) {
      router.replace(`/matriculas/nueva?paso=${wizardStageFromStep(loaded.step)}`, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveEnrollmentDraft(draft)
  }, [draft, hydrated])

  const loadPeople = useCallback(async (query: string) => {
    setPeopleLoading(true)
    setPeopleError(null)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (query.trim()) params.set('q', query.trim())
      const response = await fetch(`/api/leads?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('No se pudieron cargar las personas')
      const payload = await response.json()
      setPeople(extractLeadList(payload).map(mapLeadToPerson))
    } catch (error) {
      setPeople([])
      setPeopleError(error instanceof Error ? error.message : 'No se pudieron cargar las personas')
    } finally {
      setPeopleLoading(false)
    }
  }, [])

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true)
    setCoursesError(null)
    try {
      const response = await fetch('/api/convocatorias', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('No se pudieron cargar las convocatorias')
      const payload = await response.json()
      setCourses(extractCourseRuns(payload).map(mapCourseRun).filter((course) => course.id))
    } catch (error) {
      setCourses([])
      setCoursesError(error instanceof Error ? error.message : 'No se pudieron cargar las convocatorias')
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const handle = window.setTimeout(() => {
      void loadPeople(draft.searchQuery)
    }, 250)
    return () => window.clearTimeout(handle)
  }, [draft.searchQuery, hydrated, loadPeople])

  useEffect(() => {
    if (!hydrated) return
    void loadCourses()
  }, [hydrated, loadCourses])

  useEffect(() => {
    if (!hydrated || !leadId) return
    let cancelled = false
    const preload = async () => {
      try {
        const byId = await fetch(`/api/leads/${encodeURIComponent(leadId)}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        if (byId.ok) {
          const payload = await byId.json()
          const record = asRecord(payload)
          if (record && !cancelled) {
            const person = mapLeadToPerson(record)
            updateDraft({ personMode: 'existing', person, step: 'personal' })
            goStage(2)
            return
          }
        }
        const list = await fetch(`/api/leads?limit=50&q=`, {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!list.ok) return
        const payload = await list.json()
        const match = extractLeadList(payload).find((item) => String(item.id ?? '') === leadId)
        if (match && !cancelled) {
          updateDraft({ personMode: 'existing', person: mapLeadToPerson(match), step: 'personal' })
          goStage(2)
        }
      } catch {
        // Keep the draft as-is if the lead cannot be preloaded.
      }
    }
    void preload()
    return () => {
      cancelled = true
    }
  }, [goStage, hydrated, leadId, updateDraft])

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const capturePhoto = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      cameraStreamRef.current = stream
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      await video.play()
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve()
          return
        }
        video.onloadeddata = () => resolve()
        window.setTimeout(() => resolve(), 400)
      })
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg')
      stream.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
      updateDraft({ accessPhoto: dataUrl })
    } catch {
      setCameraError('No se pudo conectar la webcam')
    }
  }, [updateDraft])

  const submitEnrollment = useCallback(async () => {
    if (!draft.course?.id) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const courseRunId = draft.course.id
      let enrollmentId: string | null = null
      if (draft.person.id) {
        const response = await fetch(`/api/leads/${encodeURIComponent(draft.person.id)}/enroll`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseRunId }),
        })
        const payload = asRecord(await response.json().catch(() => ({})))
        if (!response.ok) {
          throw new Error(String(payload?.error ?? 'No se pudo crear la matrícula'))
        }
        enrollmentId = payload?.enrollmentId != null ? String(payload.enrollmentId) : null
      } else {
        const response = await fetch('/api/enrollments/direct', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: draft.person.firstName,
            lastName: draft.person.lastName,
            email: draft.person.email,
            phone: draft.person.phone,
            courseRunId,
          }),
        })
        const payload = asRecord(await response.json().catch(() => ({})))
        if (!response.ok) {
          throw new Error(String(payload?.error ?? 'No se pudo crear la matrícula'))
        }
        enrollmentId = payload?.enrollmentId != null ? String(payload.enrollmentId) : null
      }

      const kind = draft.course.accessKind
      const pass = kind === 'virtual' ? 'magic_link' : draft.accessPass ?? 'credential'
      await fetch('/api/accesos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: `${draft.person.firstName} ${draft.person.lastName}`.trim(),
          personId: draft.person.id,
          enrollmentId,
          courseRunId,
          campusName: draft.course.campusName,
          kind,
          pass,
          channel: accessChannel(draft),
          direction: 'in',
          note: 'Alta de matrícula',
        }),
      }).catch(() => null)

      clearEnrollmentDraft()
      toast({
        title: 'Matrícula creada',
        description: 'La solicitud se ha registrado correctamente.',
      })
      router.push(enrollmentId ? `/matriculas/${enrollmentId}` : '/matriculas')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo crear la matrícula')
    } finally {
      setSubmitting(false)
    }
  }, [draft, router, toast])

  const handleNext = useCallback(() => {
    if (submitting) return
    if (stage === 1) setConvocatoriaAttempted(true)
    if (stage === 2) setAlumnoAttempted(true)
    if (stage === 3) setPagoAttempted(true)
    if (disabledReason) {
      window.requestAnimationFrame(() => {
        const node = document.querySelector<HTMLElement>(
          '[data-slot="enrollment-wizard"] [data-invalid] input, [data-slot="enrollment-wizard"] [data-invalid] button, [data-slot="enrollment-wizard"] [data-invalid] [role="checkbox"]',
        )
        node?.focus()
      })
      return
    }
    if (stage === 4) {
      void submitEnrollment()
      return
    }
    goStage((stage + 1) as WizardStageId)
  }, [disabledReason, goStage, stage, submitEnrollment, submitting])

  const stepContent = (() => {
    switch (stage) {
      case 1:
        return (
          <CourseStep
            draft={draft}
            courses={courses}
            loading={coursesLoading}
            error={coursesError}
            attempted={convocatoriaAttempted}
            onRetry={() => void loadCourses()}
            onFilterCampus={(value) => updateDraft({ campusFilter: value })}
            onSelect={(course) => updateDraft({ course })}
          />
        )
      case 2:
        return (
          <AlumnoStep
            query={draft.searchQuery}
            onQuery={(value) => updateDraft({ searchQuery: value })}
            loading={peopleLoading}
            error={peopleError}
            people={people}
            onRetry={() => void loadPeople(draft.searchQuery)}
            onSelect={(person) => updateDraft({ personMode: 'existing', person })}
            onCreate={() =>
              updateDraft({
                personMode: 'new',
                person: createEmptyDraft().person,
              })
            }
            draft={draft}
            onChange={(patch) => updateDraft({ person: { ...draft.person, ...patch } })}
            showErrors={alumnoAttempted}
          />
        )
      case 3:
        return (
          <PagoRgpdStep
            draft={draft}
            cameraError={cameraError}
            showErrors={pagoAttempted}
            onAccept={(accepted) =>
              updateDraft({
                consentAccepted: accepted,
                consentAt: accepted ? new Date().toISOString() : null,
                consentBy: accepted ? 'usuario actual' : '',
              })
            }
            onDiscount={(value) => updateDraft({ discount: value })}
            onMethod={(value: PaymentMethod) => updateDraft({ paymentMethod: value })}
            onPlan={(value) => updateDraft({ paymentPlan: value })}
            onCapture={() => void capturePhoto()}
            onPass={(value) => updateDraft({ accessPass: value })}
            onChannel={(value) => updateDraft({ virtualSendChannel: value })}
            onRetryCamera={() => void capturePhoto()}
          />
        )
      case 4:
        return <ReviewStep draft={draft} onEdit={goStage} />
      default: {
        const _exhaustive: never = stage
        return _exhaustive
      }
    }
  })()

  const previousLabel = backLabel(stage)
  const persistAndLeave = useCallback(() => {
    saveEnrollmentDraft(draft)
    toast({
      title: 'Borrador guardado',
      description: 'Puedes retomar la matrícula desde Nueva matrícula.',
    })
    router.push('/matriculas')
  }, [draft, router, toast])

  return (
    <div className="space-y-6" data-slot="enrollment-wizard">
      <EnrollmentBreadcrumb current="Nueva matrícula" />
      <PageHeader
        title="Nueva matrícula"
        actions={
          <>
            <Button variant="outline" onClick={persistAndLeave}>
              Guardar borrador
            </Button>
            <Button variant="ghost" onClick={() => router.push('/matriculas')}>
              Cancelar
            </Button>
          </>
        }
      />

      <EnrollmentStepper current={stage} completed={completed} onSelect={goStage} />

      {submitError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudo confirmar la matrícula</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{submitError}</span>
            <Button size="sm" variant="outline" onClick={() => void submitEnrollment()} disabled={submitting}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">{stepContent}</div>
        <EnrollmentCart draft={draft} />
      </div>

      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-[hsl(var(--dashboard-canvas))] py-3">
        {previousLabel ? (
          <Button variant="outline" onClick={() => goStage((stage - 1) as WizardStageId)} disabled={submitting}>
            {previousLabel}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => router.push('/matriculas')}>
            Volver a Matrículas
          </Button>
        )}
        <NextDisabledTooltip disabled={Boolean(disabledReason)} reason={disabledReason ?? ''}>
          <Button onClick={handleNext} disabled={nextDisabled}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {continueLabel(stage)}
          </Button>
        </NextDisabledTooltip>
      </div>
    </div>
  )
}

export { WIZARD_STAGES, WIZARD_STEPS } from './types'
