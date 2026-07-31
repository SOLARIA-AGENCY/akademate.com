# Akademate public email operations

## Scope and isolation

This runbook applies only to `akademate.com` and the general Akademate SaaS repository. It does not use, modify or depend on the CEP tenant application, repository, containers or deployment.

## Architecture

Two independent paths are active:

1. Public inbound email: `info@akademate.com` is a literal Cloudflare Email Routing rule that forwards to a verified private destination. Catch-all remains disabled.
2. Website forms: `akademate-web` validates the request and calls the authenticated `akademate-contact-mailer` Worker. The Worker validates again and sends through the Cloudflare Email Sending binding.

The private destination is stored only as the Worker secret `CONTACT_TO`. It must never be committed, returned by an API, included in a `NEXT_PUBLIC_*` variable or printed in logs.

## Runtime configuration

`akademate-web` server-only environment:

- `CONTACT_MAILER_URL`
- `CONTACT_MAILER_TOKEN`

Cloudflare Worker secrets:

- `CONTACT_MAILER_TOKEN`
- `CONTACT_TO`

The Worker binding is restricted to `info@akademate.com`. Email Sending provisions SPF, DKIM, return-path records and DMARC for `akademate.com`.

## Deployment

```bash
npx -y wrangler@4.118.0 deploy \
  --config infrastructure/cloudflare/akademate-contact-mailer/wrangler.jsonc
```

Set secrets through `wrangler secret put`; never place values in shell history, Git, `.env.example` or issue text.

## Verification

- Worker unit tests: `node --test infrastructure/cloudflare/akademate-contact-mailer/src/index.test.mjs`
- Web unit tests: `pnpm --filter @akademate/web test`
- Live health: `https://akademate.com/api/health`
- Expected adversarial statuses: wrong token `401`, unexpected field `400`, oversized payload `413`.
- A successful live form returns only `{ "success": true }`; it never returns the destination or provider detail.

## Current release evidence

- Web revision: `48ad1af4aef16ba1a290776f730b655ff765ce30`
- Worker version: `b70659cd-545d-491d-af35-b0076fc207c6`
- Email Routing rule: literal public contact address, enabled; catch-all disabled.
- Live checks: authenticated relay `200`, public form `200`, alias send accepted.

## Rollback

1. Web: retag `akademate-web:rollback-18c088deb7d0a1bfb8fd3d19753d2953de7d82ea` as `akademate-web:latest`, restore the pre-release compose and `.env`, then recreate only `web` with `--no-deps --no-build`.
2. Worker: use Cloudflare Workers version rollback for `akademate-contact-mailer`.
3. Inbound alias: disable or delete the single literal routing rule. Do not enable catch-all.
4. Email Sending: disable only after the Worker is rolled back or disconnected.

All rollback actions remain scoped to Akademate public web and its Cloudflare email resources.
