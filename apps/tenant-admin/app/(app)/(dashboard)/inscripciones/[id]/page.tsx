'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Textarea } from '@payload-config/components/ui/textarea'
import {
  ArrowLeft, UserPlus, Phone, Mail, Calendar, MapPin, MessageSquare,
  Loader2, CheckCircle2, XCircle, Clock, Copy, Check, AlertCircle, PhoneOff,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contactado', color: 'bg-amber-100 text-amber-800' },
  { value: 'interested', label: 'Interesado', color: 'bg-green-100 text-green-800' },
  { value: 'not_interested', label: 'No interesado', color: 'bg-gray-100 text-gray-800' },
  { value: 'no_answer', label: 'No contesta', color: 'bg-orange-100 text-orange-800' },
  { value: 'wrong_number', label: 'Numero incorrecto', color: 'bg-red-100 text-red-800' },
  { value: 'callback', label: 'Callback solicitado', color: 'bg-purple-100 text-purple-800' },
  { value: 'enrolled', label: 'Matriculado', color: 'bg-green-200 text-green-900' },
  { value: 'discarded', label: 'Descartado', color: 'bg-gray-100 text-gray-600' },
]

const CONTACT_RESULTS = [
  { value: 'sin_respuesta', label: 'Sin respuesta', icon: PhoneOff },
  { value: 'positivo', label: 'Respondio positivo', icon: CheckCircle2 },
  { value: 'negativo', label: 'Respondio negativo', icon: XCircle },
  { value: 'callback', label: 'Pide callback', icon: Clock },
  { value: 'incorrecto', label: 'Numero incorrecto', icon: AlertCircle },
]

interface Props { params: Promise<{ id: string }> }

export default function LeadDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [lead, setLead] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [noteText, setNoteText] = React.useState('')

  const loadLead = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}?depth=1`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setLead(data)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [id])

  React.useEffect(() => { void loadLead() }, [loadLead])

  const updateLead = async (updates: Record<string, any>) => {
    setSaving(true)
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      await loadLead()
    } catch { /* */ }
    finally { setSaving(false) }
  }

  const markContacted = async (channel: 'phone' | 'email' | 'whatsapp', result?: string) => {
    const now = new Date().toISOString()
    const updates: Record<string, any> = {
      [`contacted_${channel}`]: true,
      [`contacted_${channel}_date`]: now,
      last_contacted_at: now,
      contact_attempts: (lead?.contact_attempts || 0) + 1,
      status: 'contacted',
    }
    if (channel === 'phone' && result) {
      updates.contacted_phone_result = result
      updates.last_contact_result = result
      if (result === 'positivo') updates.status = 'interested'
      if (result === 'negativo') updates.status = 'not_interested'
      if (result === 'callback') updates.status = 'callback'
      if (result === 'incorrecto') updates.status = 'wrong_number'
      if (result === 'sin_respuesta') updates.status = 'no_answer'
    }
    await updateLead(updates)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (!lead) return (
    <div className="space-y-6">
      <PageHeader title="Lead" icon={UserPlus} actions={<Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
      <Card><CardContent className="p-8 text-center text-muted-foreground">Lead no encontrado</CardContent></Card>
    </div>
  )

  const name = lead.first_name || lead.last_name ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : lead.email
  const statusConfig = STATUS_OPTIONS.find(s => s.value === (lead.status || 'new')) || STATUS_OPTIONS[0]
  const isInscripcion = lead.lead_type === 'inscripcion'
  const timeSince = lead.createdAt ? Math.round((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60)) : 0

  // Guion personalizado para telemarketing
  const phoneScript = `Buenos dias${lead.first_name ? `, ${lead.first_name}` : ''}. Le llamo de CEP Formacion. Hemos recibido su solicitud de informacion${isInscripcion ? ' y preinscripcion' : ''} sobre nuestro ciclo formativo. ¿Es buen momento para hablar?

Si responde SI:
"Perfecto. Le cuento brevemente: el ciclo es en modalidad semipresencial, con solo 1 dia de clase presencial a la semana, 500 horas de practicas en empresa, y disponemos de financiacion flexible. ¿Le gustaria que le enviemos toda la informacion detallada por email o WhatsApp?"

Si responde NO / NO ES BUEN MOMENTO:
"Entiendo perfectamente. ¿Cuando le vendria bien que le llame? Puedo llamarle en otro horario que le convenga mejor."

Si responde NO INTERESADO:
"De acuerdo, sin problema. Si en algun momento necesita informacion, puede contactarnos. Que tenga buen dia."`

  // Mensaje WhatsApp pre-escrito
  const whatsappMessage = `Hola${lead.first_name ? ` ${lead.first_name}` : ''}! 👋

Soy del equipo de CEP Formacion. Hemos recibido tu ${isInscripcion ? 'solicitud de preinscripcion' : 'interes'} en nuestro ciclo formativo.

Te escribo para resolver cualquier duda que tengas sobre:
📚 El programa y los modulos
📅 Las fechas de inicio y horarios
💰 Opciones de financiacion y matricula
🏥 Las practicas en empresa

¿Te viene bien que hablemos o prefieres que te enviemos la informacion por aqui?`

  const emailSubject = `Informacion sobre tu ${isInscripcion ? 'preinscripcion' : 'solicitud'} en CEP Formacion`
  const emailBody = `Hola${lead.first_name ? ` ${lead.first_name}` : ''},

Gracias por tu interes en CEP Formacion. Hemos recibido tu ${isInscripcion ? 'solicitud de preinscripcion' : 'solicitud de informacion'}.

Quedamos a tu disposicion para resolver cualquier duda sobre el programa, los horarios, las opciones de financiacion o el proceso de matricula.

Puedes contactarnos por telefono, WhatsApp o respondiendo a este email.

Un saludo,
Equipo CEP Formacion`

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description={`${isInscripcion ? 'Preinscripcion' : 'Lead'} · ${lead.email || ''}`}
        icon={UserPlus}
        badge={<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>}
        actions={<Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>}
      />

      {/* Urgency alert */}
      {isInscripcion && timeSince < 48 && (!lead.status || lead.status === 'new') && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Preinscripcion sin atender — hace {timeSince}h</p>
            <p className="text-sm text-red-700 dark:text-red-300">Esta persona ha solicitado reservar plaza. Contactar en menos de 24h.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions — call/whatsapp/email */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Acciones de contacto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Phone */}
              {lead.phone && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="font-medium">Llamar: {lead.phone}</span>
                    </div>
                    <a href={`tel:${lead.phone}`} className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium">Llamar</a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CONTACT_RESULTS.map(({ value, label, icon: Icon }) => (
                      <Button key={value} size="sm" variant="outline" disabled={saving}
                        onClick={() => void markContacted('phone', value)}
                        className="text-xs">
                        <Icon className="h-3 w-3 mr-1" />{label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {lead.phone && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <span className="font-medium">WhatsApp</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(whatsappMessage, 'whatsapp')}>
                        {copied === 'whatsapp' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied === 'whatsapp' ? 'Copiado' : 'Copiar mensaje'}
                      </Button>
                      <a href={`https://wa.me/${lead.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank" rel="noopener"
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium">
                        Abrir WhatsApp
                      </a>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs" disabled={saving}
                    onClick={() => void markContacted('whatsapp')}>
                    Marcar como contactado por WhatsApp
                  </Button>
                </div>
              )}

              {/* Email */}
              {lead.email && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{lead.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(emailBody, 'email')}>
                        {copied === 'email' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied === 'email' ? 'Copiado' : 'Copiar email'}
                      </Button>
                      <a href={`mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium">
                        Enviar email
                      </a>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs" disabled={saving}
                    onClick={() => void markContacted('email')}>
                    Marcar como contactado por email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone script */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />Guion de llamada</CardTitle>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(phoneScript, 'script')}>
                  {copied === 'script' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied === 'script' ? 'Copiado' : 'Copiar guion'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-muted/50 rounded-lg p-4">{phoneScript}</pre>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Notas del asesor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.callback_notes && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-1">Notas anteriores:</p>
                  {lead.callback_notes}
                </div>
              )}
              <Textarea
                placeholder="Escribir nota sobre esta interaccion..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
              />
              <Button size="sm" disabled={saving || !noteText.trim()}
                onClick={() => {
                  void updateLead({ callback_notes: `${lead.callback_notes ? lead.callback_notes + '\n---\n' : ''}[${new Date().toLocaleDateString('es-ES')}] ${noteText}` })
                  setNoteText('')
                }}>
                Guardar nota
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Estado</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${lead.status === opt.value ? opt.color + ' font-medium' : 'hover:bg-muted'}`}
                  disabled={saving}
                  onClick={() => void updateLead({ status: opt.value })}>
                  {opt.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Lead info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Informacion</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lead.first_name && <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{lead.first_name}</span></div>}
              {lead.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium truncate max-w-[60%]">{lead.email}</span></div>}
              {lead.phone && <div className="flex justify-between"><span className="text-muted-foreground">Telefono</span><span className="font-medium">{lead.phone}</span></div>}
              <div className="border-t pt-2 mt-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><Badge variant={isInscripcion ? 'default' : 'secondary'} className="text-[10px]">{isInscripcion ? 'Inscripcion' : lead.lead_type || 'Lead'}</Badge></div>
              {lead.source_form && <div className="flex justify-between"><span className="text-muted-foreground">Formulario</span><span className="text-xs">{lead.source_form}</span></div>}
              {lead.createdAt && <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="text-xs">{new Date(lead.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
              {lead.campaign_code && <div className="flex justify-between"><span className="text-muted-foreground">Campaña</span><span className="font-mono text-xs">{lead.campaign_code}</span></div>}
              <div className="border-t pt-2 mt-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Intentos contacto</span><span className="font-medium">{lead.contact_attempts || 0}</span></div>
              {lead.last_contact_result && <div className="flex justify-between"><span className="text-muted-foreground">Ultimo resultado</span><span className="text-xs">{lead.last_contact_result}</span></div>}
              {lead.last_contacted_at && <div className="flex justify-between"><span className="text-muted-foreground">Ultimo contacto</span><span className="text-xs">{new Date(lead.last_contacted_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>}
            </CardContent>
          </Card>

          {/* Contact history */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Canales utilizados</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className={`h-4 w-4 ${lead.contacted_phone ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span>{lead.contacted_phone ? `Llamado ${lead.contacted_phone_date ? new Date(lead.contacted_phone_date).toLocaleDateString('es-ES') : ''}` : 'No llamado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className={`h-4 w-4 ${lead.contacted_whatsapp ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span>{lead.contacted_whatsapp ? `WhatsApp ${lead.contacted_whatsapp_date ? new Date(lead.contacted_whatsapp_date).toLocaleDateString('es-ES') : ''}` : 'No enviado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className={`h-4 w-4 ${lead.contacted_email ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span>{lead.contacted_email ? `Email ${lead.contacted_email_date ? new Date(lead.contacted_email_date).toLocaleDateString('es-ES') : ''}` : 'No enviado'}</span>
              </div>
            </CardContent>
          </Card>

          {/* RGPD */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">RGPD</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <p>Consentimiento: {lead.gdpr_consent ? 'Si' : 'No'}</p>
              {lead.consent_timestamp && <p>Fecha: {new Date(lead.consent_timestamp).toLocaleDateString('es-ES')}</p>}
              {lead.gdpr_retention_until && <p>Retencion hasta: {new Date(lead.gdpr_retention_until).toLocaleDateString('es-ES')}</p>}
              {lead.source_page && <p className="break-all">Pagina: {lead.source_page}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
