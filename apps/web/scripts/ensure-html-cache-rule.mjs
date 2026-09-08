const token = process.env.CLOUDFLARE_API_TOKEN
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? '522997f4f57193b06db3286d8d6f2778'

export async function ensureAkademateHtmlCacheRule() {
  if (!token) {
    console.warn('CLOUDFLARE_API_TOKEN missing; skip cache rule upsert')
    return { skipped: true }
  }

  const zonesRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones?name=akademate.com&account.id=${accountId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const zones = await zonesRes.json()
  const zoneId = zones.result?.[0]?.id
  if (!zoneId) {
    console.warn('Could not resolve akademate.com zone', zones.errors)
    return { skipped: true, reason: 'zone', errors: zones.errors }
  }

  const entryRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const entry = await entryRes.json()
  const description = 'Akademate HTML /en /es cache'
  const rule = {
    description,
    enabled: true,
    // Free plan cannot use operator `matches` (needs Business or WAF Advanced).
    expression:
      '(http.request.method eq "GET") and (http.request.uri.path eq "/en" or http.request.uri.path eq "/es" or starts_with(http.request.uri.path, "/en/") or starts_with(http.request.uri.path, "/es/"))',
    action: 'set_cache_settings',
    action_parameters: {
      cache: true,
      edge_ttl: { mode: 'override_origin', default: 600 },
      browser_ttl: { mode: 'respect_origin' },
    },
  }

  const existing = entry.result?.rules?.find((item) => item.description === description)
  const url = existing?.id
    ? `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/${entry.result.id}/rules/${existing.id}`
    : `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`

  const body = existing?.id
    ? rule
    : {
        rules: [
          ...(entry.result?.rules ?? []).filter((item) => item.description !== description),
          rule,
        ],
      }

  const updateRes = await fetch(url, {
    method: existing?.id ? 'PATCH' : 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const updated = await updateRes.json()
  return { zoneId, updated }
}

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/'))
if (isDirectRun) {
  const result = await ensureAkademateHtmlCacheRule()
  console.log(JSON.stringify(result, null, 2))
  if (result.updated?.success === false) process.exit(1)
}
