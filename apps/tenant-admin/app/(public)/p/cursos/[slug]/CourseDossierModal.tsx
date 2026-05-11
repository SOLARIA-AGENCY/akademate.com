'use client'

import { ArrowRight, FileText, GraduationCap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LeadForm } from '../../ciclos/[slug]/LeadForm'

interface CourseDossierModalProps {
  courseId: string
  courseName: string
  dossierUrl?: string | null
  triggerLabel?: string
  title?: string
  description?: string
  submitLabel?: string
  sourceForm?: string
  leadType?: string
  notes?: string
  leadMetadata?: Record<string, string>
}

export function CourseDossierModal({
  courseId,
  courseName,
  dossierUrl,
  triggerLabel = 'Solicitar Dossier',
  title = 'Recibe el dossier del curso',
  description,
  submitLabel = 'Enviar y recibir dossier',
  sourceForm = 'dossier_curso',
  leadType = 'waiting_list',
  notes,
  leadMetadata,
}: CourseDossierModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-3 brand-btn px-10 py-5 rounded-full font-bold text-xl shadow-lg transition-all hover:-translate-y-1 active:translate-y-0"
        >
          {triggerLabel}
          <ArrowRight className="w-6 h-6" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-2xl border-0 bg-white p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="px-7 pt-7 text-left">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50 text-[#f2014b] border border-rose-100">
            <GraduationCap className="h-7 w-7" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-gray-950">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-gray-600">
            {description || `Deja tus datos y te enviaremos la ficha PDF de ${courseName}. El lead quedará registrado para seguimiento comercial.`}
          </DialogDescription>
        </DialogHeader>
        <div className="px-7 pb-7">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-800">
            <FileText className="h-5 w-5 text-[#f2014b]" />
            {dossierUrl ? 'PDF adjunto automáticamente tras enviar el formulario.' : 'El equipo de CEP te enviará la información disponible del curso.'}
          </div>
          <LeadForm
            variant="card"
            cycleId={courseId}
            cycleName={courseName}
            hasActiveConvocatorias={false}
            labelClassName="text-gray-800"
            inputClassName="rounded-lg border-gray-300 bg-white focus:border-transparent focus:ring-2 focus:ring-[var(--brand)]"
            buttonClassName="rounded-lg !bg-[#f2014b] hover:!bg-[#c9003f] !text-white shadow-none uppercase tracking-wide py-4 disabled:opacity-100 disabled:!bg-[#f2014b] disabled:!text-white"
            linkClassName="brand-text"
            submitLabel={submitLabel}
            submittingLabel="Enviando dossier..."
            sourceForm={sourceForm}
            leadType={leadType}
            notes={notes || `Solicitud de dossier: ${courseName}`}
            leadMetadata={leadMetadata}
            dossierUrl={dossierUrl || undefined}
            dossierName={`${courseName}.pdf`}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
