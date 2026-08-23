export const defaultAppLoginUrl = 'https://app.akademate.com/auth/login'

export function getAppLoginUrl(): string {
  return (
    process.env.APP_LOGIN_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_LOGIN_URL?.trim() ||
    defaultAppLoginUrl
  )
}

export function isAppLoginAvailableStatus(status: number): boolean {
  return (status >= 200 && status < 400) || status === 401 || status === 403
}

export async function probeAppLoginHealth(
  url: string = getAppLoginUrl(),
  fetchImpl: typeof fetch = fetch
): Promise<{ available: boolean; status: number | null }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4_000)

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'text/html,application/json' },
    })
    return { available: isAppLoginAvailableStatus(response.status), status: response.status }
  } catch {
    return { available: false, status: null }
  } finally {
    clearTimeout(timer)
  }
}
