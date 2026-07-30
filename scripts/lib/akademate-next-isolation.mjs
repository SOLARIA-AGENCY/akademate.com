const FORBIDDEN = [
  /cepformacion/i,
  /cepcomunicacion/i,
  /akademate-tenant-final/i,
  /tenant-admin_media_data/i,
  /(?:^|\s)akademate-db(?:\s|$)/i,
  /46\.62\.222\.138/,
  /100\.112\.153\.111/,
  /\/opt\/akademate\/tenant-admin/i,
]

function assert(condition, message) {
  if (!condition) throw new Error(`Akademate Next isolation failed: ${message}`)
}

export function validateNextIsolation({ composeText, envText }) {
  const combined = `${composeText}\n${envText}`
  for (const pattern of FORBIDDEN) assert(!pattern.test(combined), `forbidden production identifier matches ${pattern}`)

  assert(/^name:\s*akademate-next\s*$/m.test(composeText), 'Compose project must be akademate-next')
  assert(!/container_name\s*:/i.test(composeText), 'explicit container names are not allowed')
  assert(!/external\s*:\s*true/i.test(composeText), 'external Docker networks or volumes are not allowed')
  assert(!/network_mode\s*:/i.test(composeText), 'network_mode bypass is not allowed')
  assert(/internal\s*:\s*true/i.test(composeText), 'runtime network must be internal')
  assert(/image:\s*akademate-next-tenant:/i.test(composeText), 'tenant image must use the akademate-next namespace')
  assert(/image:\s*akademate-next-campus:/i.test(composeText), 'campus image must use the akademate-next namespace')
  assert(/AKADEMATE_RUNTIME:\s*next/g.test(composeText), 'runtime marker AKADEMATE_RUNTIME=next is required')
  const redisSection = composeText.split('\n  redis:')[1]?.split('\n  tenant-admin:')[0] ?? ''
  assert(/^ {6}AKADEMATE_NEXT_REDIS_PASSWORD:\s*/m.test(redisSection), 'Redis service must receive its dedicated password variable')

  for (const resource of ['akademate_next_postgres_data', 'akademate_next_redis_data', 'akademate_next_media_data', 'akademate_next_internal']) {
    assert(composeText.includes(`name: ${resource}`), `dedicated resource ${resource} is required`)
  }

  for (const variable of [
    'AKADEMATE_NEXT_DB_NAME=akademate_next',
    'AKADEMATE_NEXT_DB_USER=akademate_next',
    'AKADEMATE_NEXT_STORAGE_BUCKET=akademate-next-',
  ]) {
    assert(envText.includes(variable), `environment contract missing ${variable}`)
  }

  assert(!/^AKADEMATE_NEXT_TENANT_URL=https?:\/\/(?!localhost)/m.test(envText), 'example tenant URL must remain local')
  assert(!/^AKADEMATE_NEXT_CAMPUS_URL=https?:\/\/(?!localhost)/m.test(envText), 'example campus URL must remain local')

  return { project: 'akademate-next', isolated: true }
}

export function validateDockerContext(dockerignoreText) {
  for (const pattern of ['*.sql', '*.sql.gz', '*.dump', '*.tar.gz', 'backups', 'deploy*.tar*']) {
    assert(dockerignoreText.split('\n').includes(pattern), `Docker context must exclude ${pattern}`)
  }
  return { sensitiveArtifactsExcluded: true }
}

export function validateNextRuntimeCollectionBoundary(payloadConfigText) {
  assert(
    /import\s*\{[^}]*\bselectRuntimeCollections\b[^}]*\}\s*from\s*['"]\.\/runtime\/select-runtime-collections['"]/s.test(payloadConfigText),
    'Payload config must import the Next runtime collection selector',
  )
  assert(
    /collections:\s*selectRuntimeCollections\(\s*runtime,\s*baseCollections,\s*nextOnlyCollections,\s*legacyOnlyCollections,?\s*\)/s.test(payloadConfigText),
    'Payload collections must be materialized through the Next runtime boundary',
  )
  assert(
    /await\s+loadNextRuntimeCollections\(\s*runtime,\s*async\s*\(\)\s*=>\s*\{[\s\S]*?await\s+import\(['"]\.\/runtime\/next-only-collections['"]\)/.test(payloadConfigText),
    'Next-only collections must be loaded dynamically after the runtime gate',
  )
  assert(
    !/^\s*import(?:\s+[^'"\n]+\s+from)?\s*['"]\.\/runtime\/next-only-collections['"]/m.test(payloadConfigText),
    'Payload config must not statically import Next-only collections',
  )
  assert(
    /const\s+legacyOnlyCollections\s*=\s*isAkademateNextRuntime\(runtime\)\s*\?\s*\[\]\s*:\s*getCepMultiEntityShadowCollections\(\)/s.test(payloadConfigText),
    'CEP shadow collections must be excluded from the Next runtime',
  )

  return { runtimeBoundary: 'fail-closed' }
}
