# Email Templates — CEP Formacion / Akademate

## Reglas de Diseno

- **NUNCA usar emojis** — usar texto, iconos SVG inline, o letras estilizadas
- **Color primario**: #cc0000 (rojo corporativo CEP)
- **Color secundario**: #1a1a2e (navy oscuro)
- **Background**: #f4f4f5
- **Logo**: https://cepformacion.akademate.com/logos/cep-formacion-logo.png (circular, fondo blanco, 64x64)
- **Font**: Arial, Helvetica, sans-serif
- **Max-width**: 600px
- **Border-radius**: 12px (contenedor), 8px (cards internas)
- **Sender**: noreply@cepcomunicacion.com / CEP Formacion
- **Reply-To**: info@cepcomunicacion.com

## Templates

### 1. Newsletter Bienvenida (Brevo #9)
- **Archivo**: `newsletter-bienvenida.html`
- **Uso**: Se envia automaticamente al suscribirse al newsletter
- **Variables Brevo**: `{{ contact.FIRSTNAME }}`, `{{ unsubscribe }}`
- **Subject**: Bienvenido a CEP Formacion - Tu futuro profesional comienza aqui

### 2-6. Templates Transaccionales (en la app)
Ubicacion: `apps/tenant-admin/src/lib/email/templates.ts`

| Template | Funcion | Variables |
|----------|---------|-----------|
| welcomeUserEmail | Bienvenida con credenciales | name, email, password, role, loginUrl |
| passwordResetEmail | Reset de contrasena | name, resetUrl |
| leadConfirmationEmail | Confirmacion para interesados | name, courseName |
| enrollmentConfirmationEmail | Matricula confirmada | name, courseName, startDate, campus |
| notificationEmail | Notificacion generica | title, body, ctaText, ctaUrl |

## Estructura del Header (comun a todos)

```
[Logo circular sobre fondo rojo #cc0000]
[CEP FORMACION — texto blanco]
[Subtitulo en italic blanco 80% opacity]
```

## Estructura del Footer (comun a todos)

```
[CENTRO HOMOLOGADO — texto rojo sobre navy]
[Ministerio de Educacion — texto blanco 70%]
[MEC 38017275]
[---]
[Texto de baja / unsubscribe]
```

## Envio

- **Transaccional**: via Mailpit (localhost:1025) → Brevo SMTP relay (smtp-relay.brevo.com:587)
- **Marketing/Newsletter**: via Brevo campaign UI o API
- **Warm-up diario**: via Maddy (puerto 25 directo) — status report a admin@cepcomunicacion.com

## DNS Autenticacion

### cepcomunicacion.com (Cloudflare zone 47c5baea...)
- SPF: ip4:46.62.222.138 + mailjet + hostinger
- DKIM: akademate._domainkey (RSA 2048, key propia)
- DMARC: p=none; rua=postmaster@cepcomunicacion.com

### cepformacion.akademate.com (Cloudflare zone b679e7b...)
- Brevo code: TXT cepformacion
- DKIM 1: CNAME brevo1._domainkey.cepformacion → brevo
- DKIM 2: CNAME brevo2._domainkey.cepformacion → brevo
- DMARC: TXT _dmarc.cepformacion → brevo
