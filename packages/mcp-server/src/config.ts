export interface AkademateMcpEnvironment {
  AKADEMATE_API_URL?: string
  AKADEMATE_API_KEY?: string
}

export interface AkademateMcpConfig {
  apiUrl: string
  apiKey: string
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function resolveAkademateMcpConfig(
  environment: AkademateMcpEnvironment,
): AkademateMcpConfig {
  const rawApiUrl = environment.AKADEMATE_API_URL?.trim()
  if (!rawApiUrl) {
    throw new Error('AKADEMATE_API_URL is required; no production endpoint is selected by default')
  }

  let endpoint: URL
  try {
    endpoint = new URL(rawApiUrl)
  } catch {
    throw new Error('AKADEMATE_API_URL must be a valid absolute URL')
  }

  if (endpoint.protocol !== 'https:' && endpoint.protocol !== 'http:') {
    throw new Error('AKADEMATE_API_URL must use HTTP or HTTPS')
  }

  if (endpoint.username || endpoint.password) {
    throw new Error('AKADEMATE_API_URL must not contain credentials')
  }

  if (endpoint.protocol === 'http:' && !LOOPBACK_HOSTS.has(endpoint.hostname)) {
    throw new Error('AKADEMATE_API_URL must use HTTPS unless it targets loopback development')
  }

  if (endpoint.search || endpoint.hash) {
    throw new Error('AKADEMATE_API_URL must not contain a query string or fragment')
  }

  const apiKey = environment.AKADEMATE_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('AKADEMATE_API_KEY is required')
  }

  return {
    apiUrl: endpoint.toString().replace(/\/$/, ''),
    apiKey,
  }
}
