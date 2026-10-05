# GlitchTip on CEP OVH

Self-hosted error tracker next to the CEP stack. C-BIAS Uptime Kuma remains the
external detector if this OVH host is down.

## Runtime

- Compose: `/opt/cep/glitchtip/docker-compose.yml`
- Origin bind: `127.0.0.1:8000` plus Traefik `Host(cepformacion-glitchtip.akademate.com)` on `:80`
- Projects: org `cep`, `staging` (id 1), `production` (id 2)
- Retention: 30 days
- Registration: disabled after the first superuser

## TLS

Same pattern as `cepformacion-sentry.akademate.com`: HTTP origin, TLS at Cloudflare
once DNS exists. The WAF-reader token in 1Password cannot create DNS records.
Create an orange-cloud A/CNAME for `cepformacion-glitchtip.akademate.com` to
`37.59.119.219` with a DNS-edit token, then enable TOTP on the admin user.

Until DNS exists, capture from CEP containers with the internal DSN host
`cep-glitchtip:8000` on `tenant-admin_proxy`.

## SMTP

`GLITCHTIP_EMAIL_URL` on the server. Prefer Resend `smtp+tls://resend:...@smtp.resend.com:587`.
Console backend is only for install.

## PII

Organization and projects scrub IP addresses. Do not send cookies, tokens,
passwords or Authorization headers from the Sentry SDK (`sendDefaultPii: false`).

## Backup

```bash
sudo /opt/cep/glitchtip/scripts/backup.sh
```

## Rollback

Leave the current Sentry DSN in production until a staging event is visible here.
Do not delete the Sentry stack until that checkpoint passes.
