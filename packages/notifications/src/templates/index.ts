/**
 * @fileoverview Email Templates
 * All notification email templates
 */

import { baseLayout, formatDate, formatCurrency } from './base';
import type {
  NotificationType,
  TemplateData,
  WelcomeTemplateData,
  PasswordResetTemplateData,
  EnrollmentConfirmedTemplateData,
  CourseStartedTemplateData,
  LessonReminderTemplateData,
  CertificateIssuedTemplateData,
  PaymentReceivedTemplateData,
  PaymentFailedTemplateData,
  TrialEndingTemplateData,
  AccountLockedTemplateData,
  NewLeadTemplateData,
  LeadAssignedTemplateData,
  CampaignReportTemplateData,
} from '../types';

// ============================================================================
// TEMPLATE RENDERERS
// ============================================================================

function welcomeTemplate(data: WelcomeTemplateData): string {
  const content = `
    <h2>¡Bienvenido/a, ${data.recipientName}!</h2>
    <p>Tu cuenta en ${data.tenantName} ha sido creada exitosamente.</p>

    ${data.temporaryPassword ? `
    <div class="info-box">
      <strong>Tu contraseña temporal:</strong><br>
      <code style="font-size: 18px; background: #e4e4e7; padding: 8px 12px; border-radius: 4px;">${data.temporaryPassword}</code>
      <p style="margin: 8px 0 0 0; font-size: 14px;">Por seguridad, te recomendamos cambiarla en tu primer inicio de sesión.</p>
    </div>
    ` : ''}

    <p>Ya puedes acceder a tu cuenta y comenzar a explorar todos los cursos y recursos disponibles.</p>

    <p style="text-align: center;">
      <a href="${data.loginUrl}" class="button">Iniciar Sesión</a>
    </p>

    <hr class="divider">

    <p style="font-size: 14px; color: #71717a;">
      Si tienes alguna pregunta, no dudes en contactarnos en
      <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.
    </p>
  `;

  return baseLayout({
    title: `Bienvenido a ${data.tenantName}`,
    preheader: `¡Tu cuenta ha sido creada exitosamente!`,
    content,
    ...data,
  });
}

function passwordResetTemplate(data: PasswordResetTemplateData): string {
  const content = `
    <h2>Restablecer Contraseña</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>

    <p style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Restablecer Contraseña</a>
    </p>

    <div class="info-box warning">
      <strong>Este enlace expira en ${data.expiresIn}.</strong><br>
      <span style="font-size: 14px;">Por seguridad, el enlace solo puede usarse una vez.</span>
    </div>

    ${data.ipAddress ? `
    <p style="font-size: 14px; color: #71717a;">
      Solicitud realizada desde la IP: ${data.ipAddress}<br>
      Fecha: ${formatDate(data.requestedAt, true)}
    </p>
    ` : ''}

    <hr class="divider">

    <p style="font-size: 14px; color: #71717a;">
      Si no solicitaste este cambio, puedes ignorar este correo.
      Tu contraseña actual seguirá funcionando.
    </p>
  `;

  return baseLayout({
    title: 'Restablecer Contraseña',
    preheader: `Haz clic para restablecer tu contraseña (expira en ${data.expiresIn})`,
    content,
    ...data,
  });
}

function enrollmentConfirmedTemplate(data: EnrollmentConfirmedTemplateData): string {
  const content = `
    <h2>¡Inscripción Confirmada!</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Tu inscripción ha sido confirmada exitosamente.</p>

    <div class="info-box success">
      <strong style="font-size: 18px;">${data.courseName}</strong><br>
      <span style="color: #71717a;">${data.courseRunName}</span>
    </div>

    <table width="100%" cellpadding="8" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td style="color: #71717a;">Fecha de inicio:</td>
        <td style="text-align: right; font-weight: 600;">${formatDate(data.startDate)}</td>
      </tr>
      <tr>
        <td style="color: #71717a;">Fecha de fin:</td>
        <td style="text-align: right; font-weight: 600;">${formatDate(data.endDate)}</td>
      </tr>
      ${data.campusName ? `
      <tr>
        <td style="color: #71717a;">Campus:</td>
        <td style="text-align: right; font-weight: 600;">${data.campusName}</td>
      </tr>
      ` : ''}
      ${data.instructorName ? `
      <tr>
        <td style="color: #71717a;">Instructor:</td>
        <td style="text-align: right; font-weight: 600;">${data.instructorName}</td>
      </tr>
      ` : ''}
    </table>

    <p style="text-align: center;">
      <a href="${data.accessUrl}" class="button">Acceder al Curso</a>
    </p>

    <p style="font-size: 14px; color: #71717a;">
      Recibirás un recordatorio cuando el curso comience.
    </p>
  `;

  return baseLayout({
    title: `Inscripción Confirmada: ${data.courseName}`,
    preheader: `¡Tu inscripción a ${data.courseName} ha sido confirmada!`,
    content,
    ...data,
  });
}

function courseStartedTemplate(data: CourseStartedTemplateData): string {
  const content = `
    <h2>¡Tu curso ha comenzado!</h2>
    <p>Hola ${data.recipientName},</p>
    <p>El curso <strong>${data.courseName}</strong> ya está disponible y listo para que comiences.</p>

    <div class="info-box">
      <strong>Primera lección:</strong> ${data.firstLessonTitle}<br>
      <span style="font-size: 14px; color: #71717a;">
        ${data.totalLessons} lecciones | Duración estimada: ${data.estimatedDuration}
      </span>
    </div>

    <p style="text-align: center;">
      <a href="${data.accessUrl}" class="button">Comenzar Ahora</a>
    </p>

    <p style="font-size: 14px; color: #71717a;">
      Recuerda que puedes avanzar a tu propio ritmo. ¡Éxito!
    </p>
  `;

  return baseLayout({
    title: `¡Comienza tu curso: ${data.courseName}!`,
    preheader: `${data.courseName} ya está disponible. ¡Empieza ahora!`,
    content,
    ...data,
  });
}

function lessonReminderTemplate(data: LessonReminderTemplateData): string {
  const content = `
    <h2>Recordatorio de Lección</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Tienes una lección pendiente en <strong>${data.courseName}</strong>.</p>

    <div class="info-box warning">
      <strong>${data.lessonTitle}</strong>
      ${data.dueDate ? `<br><span style="font-size: 14px;">Fecha límite: ${formatDate(data.dueDate)}</span>` : ''}
    </div>

    <p>Tu progreso actual: <strong>${data.progressPercent}%</strong></p>

    <div style="background: #e4e4e7; border-radius: 8px; overflow: hidden; margin: 16px 0;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); height: 8px; width: ${data.progressPercent}%;"></div>
    </div>

    <p style="text-align: center;">
      <a href="${data.accessUrl}" class="button">Continuar Lección</a>
    </p>
  `;

  return baseLayout({
    title: `Recordatorio: ${data.lessonTitle}`,
    preheader: `No olvides completar tu lección en ${data.courseName}`,
    content,
    ...data,
  });
}

function certificateIssuedTemplate(data: CertificateIssuedTemplateData): string {
  const content = `
    <h2>¡Felicitaciones! 🎉</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Has completado exitosamente el curso <strong>${data.courseName}</strong>.</p>

    <div class="info-box success">
      <strong>Tu certificado está listo</strong><br>
      <span style="font-size: 14px;">Fecha de completación: ${formatDate(data.completionDate)}</span>
    </div>

    <p style="text-align: center;">
      <a href="${data.certificateUrl}" class="button">Ver Certificado</a>
      ${data.shareUrl ? `<br><br><a href="${data.shareUrl}" class="button button-secondary">Compartir en LinkedIn</a>` : ''}
    </p>

    <p style="font-size: 14px; color: #71717a;">
      ¡Sigue aprendiendo! Explora más cursos en nuestra plataforma.
    </p>
  `;

  return baseLayout({
    title: `¡Certificado: ${data.courseName}!`,
    preheader: `¡Felicitaciones! Tu certificado de ${data.courseName} está listo.`,
    content,
    ...data,
  });
}

function paymentReceivedTemplate(data: PaymentReceivedTemplateData): string {
  const content = `
    <h2>Pago Recibido</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Hemos recibido tu pago correctamente.</p>

    <div class="info-box success">
      <table width="100%" cellpadding="4" cellspacing="0">
        <tr>
          <td style="color: #71717a;">Factura:</td>
          <td style="text-align: right;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">Descripción:</td>
          <td style="text-align: right;">${data.description}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">Fecha:</td>
          <td style="text-align: right;">${formatDate(data.paymentDate)}</td>
        </tr>
        <tr style="border-top: 1px solid #d1fae5;">
          <td style="font-weight: 600;">Total:</td>
          <td style="text-align: right; font-weight: 600; font-size: 18px;">${formatCurrency(data.amount, data.currency)}</td>
        </tr>
      </table>
    </div>

    ${data.invoiceUrl ? `
    <p style="text-align: center;">
      <a href="${data.invoiceUrl}" class="button button-secondary">Descargar Factura</a>
    </p>
    ` : ''}

    <p style="font-size: 14px; color: #71717a;">
      Gracias por tu confianza en ${data.tenantName}.
    </p>
  `;

  return baseLayout({
    title: `Pago Recibido - ${data.invoiceNumber}`,
    preheader: `Hemos recibido tu pago de ${formatCurrency(data.amount, data.currency)}`,
    content,
    ...data,
  });
}

function paymentFailedTemplate(data: PaymentFailedTemplateData): string {
  const content = `
    <h2>Problema con tu Pago</h2>
    <p>Hola ${data.recipientName},</p>
    <p>No pudimos procesar tu pago.</p>

    <div class="info-box error">
      <strong>Factura: ${data.invoiceNumber}</strong><br>
      <span style="font-size: 14px;">Monto: ${formatCurrency(data.amount, data.currency)}</span><br>
      <span style="font-size: 14px;">Motivo: ${data.failureReason}</span>
    </div>

    ${data.retryDate ? `
    <p>Intentaremos cobrar nuevamente el <strong>${formatDate(data.retryDate)}</strong>.</p>
    ` : ''}

    <p style="text-align: center;">
      <a href="${data.updatePaymentUrl}" class="button">Actualizar Método de Pago</a>
    </p>

    <p style="font-size: 14px; color: #71717a;">
      Si tienes preguntas, contacta a nuestro equipo de soporte.
    </p>
  `;

  return baseLayout({
    title: `Problema con tu Pago - ${data.invoiceNumber}`,
    preheader: `No pudimos procesar tu pago. Por favor actualiza tu método de pago.`,
    content,
    ...data,
  });
}

function trialEndingTemplate(data: TrialEndingTemplateData): string {
  const content = `
    <h2>Tu Período de Prueba Termina Pronto</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Tu período de prueba gratuita termina en <strong>${data.daysRemaining} días</strong>.</p>

    <div class="info-box warning">
      <strong>Plan: ${data.planName}</strong><br>
      <span style="font-size: 14px;">Fecha de vencimiento: ${formatDate(data.trialEndDate)}</span>
    </div>

    <p>Para continuar disfrutando de todos los beneficios, actualiza tu suscripción antes de que expire.</p>

    <p style="text-align: center;">
      <a href="${data.upgradeUrl}" class="button">Actualizar Plan</a>
    </p>

    <p style="font-size: 14px; color: #71717a;">
      Si no actualizas, tu acceso será limitado después del ${formatDate(data.trialEndDate)}.
    </p>
  `;

  return baseLayout({
    title: `Tu prueba termina en ${data.daysRemaining} días`,
    preheader: `Actualiza tu plan para mantener el acceso completo`,
    content,
    ...data,
  });
}

function accountLockedTemplate(data: AccountLockedTemplateData): string {
  const content = `
    <h2>Cuenta Bloqueada</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Tu cuenta ha sido bloqueada temporalmente.</p>

    <div class="info-box error">
      <strong>Motivo:</strong> ${data.reason}<br>
      <span style="font-size: 14px;">Fecha: ${formatDate(data.lockDate, true)}</span>
    </div>

    ${data.unlockUrl ? `
    <p style="text-align: center;">
      <a href="${data.unlockUrl}" class="button">Desbloquear Cuenta</a>
    </p>
    ` : ''}

    <p>Si crees que esto es un error, contacta a nuestro equipo de soporte.</p>

    <p style="text-align: center;">
      <a href="${data.supportUrl}" class="button button-secondary">Contactar Soporte</a>
    </p>
  `;

  return baseLayout({
    title: 'Cuenta Bloqueada',
    preheader: `Tu cuenta ha sido bloqueada. Contacta a soporte si necesitas ayuda.`,
    content,
    ...data,
  });
}

function newLeadTemplate(data: NewLeadTemplateData): string {
  const content = `
    <h2>Nuevo Lead Registrado</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Se ha registrado un nuevo lead en la plataforma.</p>

    <div class="info-box">
      <table width="100%" cellpadding="4" cellspacing="0">
        <tr>
          <td style="color: #71717a;">Nombre:</td>
          <td style="text-align: right; font-weight: 600;">${data.leadName}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">Email:</td>
          <td style="text-align: right;">${data.leadEmail}</td>
        </tr>
        ${data.leadPhone ? `
        <tr>
          <td style="color: #71717a;">Teléfono:</td>
          <td style="text-align: right;">${data.leadPhone}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #71717a;">Fuente:</td>
          <td style="text-align: right;">${data.source}</td>
        </tr>
        ${data.interestedIn ? `
        <tr>
          <td style="color: #71717a;">Interesado en:</td>
          <td style="text-align: right;">${data.interestedIn}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #71717a;">Score:</td>
          <td style="text-align: right; font-weight: 600;">${data.leadScore} puntos</td>
        </tr>
      </table>
    </div>

    <p style="text-align: center;">
      <a href="${data.dashboardUrl}" class="button">Ver en Dashboard</a>
    </p>
  `;

  return baseLayout({
    title: `Nuevo Lead: ${data.leadName}`,
    preheader: `Nuevo lead registrado: ${data.leadName} (${data.leadEmail})`,
    content,
    ...data,
  });
}

function leadAssignedTemplate(data: LeadAssignedTemplateData): string {
  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  const priorityLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };

  const content = `
    <h2>Lead Asignado</h2>
    <p>Hola ${data.recipientName},</p>
    <p><strong>${data.assignedBy}</strong> te ha asignado un nuevo lead.</p>

    <div class="info-box">
      <table width="100%" cellpadding="4" cellspacing="0">
        <tr>
          <td style="color: #71717a;">Lead:</td>
          <td style="text-align: right; font-weight: 600;">${data.leadName}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">Email:</td>
          <td style="text-align: right;">${data.leadEmail}</td>
        </tr>
        <tr>
          <td style="color: #71717a;">Prioridad:</td>
          <td style="text-align: right;">
            <span style="background: ${priorityColors[data.priority]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
              ${priorityLabels[data.priority]}
            </span>
          </td>
        </tr>
      </table>
      ${data.notes ? `
      <hr class="divider" style="margin: 12px 0;">
      <p style="font-size: 14px; color: #71717a; margin: 0;">
        <strong>Notas:</strong> ${data.notes}
      </p>
      ` : ''}
    </div>

    <p style="text-align: center;">
      <a href="${data.dashboardUrl}" class="button">Ver Lead</a>
    </p>
  `;

  return baseLayout({
    title: `Lead Asignado: ${data.leadName}`,
    preheader: `${data.assignedBy} te ha asignado el lead ${data.leadName}`,
    content,
    ...data,
  });
}

function campaignReportTemplate(data: CampaignReportTemplateData): string {
  const content = `
    <h2>Reporte de Campaña</h2>
    <p>Hola ${data.recipientName},</p>
    <p>Aquí está el resumen de la campaña <strong>${data.campaignName}</strong>.</p>

    <div class="info-box">
      <p style="font-size: 14px; color: #71717a; margin: 0 0 8px 0;">Período: ${data.reportPeriod}</p>

      <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 8px;">
        <tr>
          <td style="text-align: center; border-right: 1px solid #e4e4e7;">
            <div style="font-size: 24px; font-weight: 600; color: #6366f1;">${data.totalLeads}</div>
            <div style="font-size: 12px; color: #71717a;">Total Leads</div>
          </td>
          <td style="text-align: center;">
            <div style="font-size: 24px; font-weight: 600; color: #10b981;">${data.conversionRate}%</div>
            <div style="font-size: 12px; color: #71717a;">Tasa de Conversión</div>
          </td>
        </tr>
      </table>

      ${data.topPerformingAd ? `
      <hr class="divider" style="margin: 12px 0;">
      <p style="font-size: 14px; margin: 0;">
        <strong>Mejor anuncio:</strong> ${data.topPerformingAd}
      </p>
      ` : ''}
    </div>

    <p style="text-align: center;">
      <a href="${data.reportUrl}" class="button">Ver Reporte Completo</a>
    </p>
  `;

  return baseLayout({
    title: `Reporte: ${data.campaignName}`,
    preheader: `${data.totalLeads} leads | ${data.conversionRate}% conversión`,
    content,
    ...data,
  });
}

// ============================================================================
// TEMPLATE ROUTER
// ============================================================================

const templates: Record<NotificationType, (data: any) => string> = {
  welcome: welcomeTemplate,
  password_reset: passwordResetTemplate,
  enrollment_confirmed: enrollmentConfirmedTemplate,
  course_started: courseStartedTemplate,
  lesson_reminder: lessonReminderTemplate,
  certificate_issued: certificateIssuedTemplate,
  payment_received: paymentReceivedTemplate,
  payment_failed: paymentFailedTemplate,
  trial_ending: trialEndingTemplate,
  account_locked: accountLockedTemplate,
  new_lead: newLeadTemplate,
  lead_assigned: leadAssignedTemplate,
  campaign_report: campaignReportTemplate,
};

const subjects: Record<NotificationType, (data: any) => string> = {
  welcome: (data) => `¡Bienvenido/a a ${data.tenantName}!`,
  password_reset: () => `Restablecer tu Contraseña`,
  enrollment_confirmed: (data) => `Inscripción Confirmada: ${data.courseName}`,
  course_started: (data) => `¡Tu curso ${data.courseName} ha comenzado!`,
  lesson_reminder: (data) => `Recordatorio: ${data.lessonTitle}`,
  certificate_issued: (data) => `🎉 ¡Felicitaciones! Tu Certificado de ${data.courseName}`,
  payment_received: (data) => `Pago Recibido - ${data.invoiceNumber}`,
  payment_failed: (data) => `⚠️ Problema con tu Pago - ${data.invoiceNumber}`,
  trial_ending: (data) => `Tu prueba termina en ${data.daysRemaining} días`,
  account_locked: () => `⚠️ Tu Cuenta ha sido Bloqueada`,
  new_lead: (data) => `Nuevo Lead: ${data.leadName}`,
  lead_assigned: (data) => `Lead Asignado: ${data.leadName}`,
  campaign_report: (data) => `📊 Reporte: ${data.campaignName}`,
};

/**
 * Render a notification template
 */
export function renderTemplate<T extends TemplateData>(
  type: NotificationType,
  data: T
): string {
  const template = templates[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }
  return template(data);
}

/**
 * Get subject for a notification type
 */
export function getSubject<T extends TemplateData>(
  type: NotificationType,
  data: T
): string {
  const subjectFn = subjects[type];
  if (!subjectFn) {
    throw new Error(`Unknown notification type: ${type}`);
  }
  return subjectFn(data);
}

export { formatDate, formatCurrency };
