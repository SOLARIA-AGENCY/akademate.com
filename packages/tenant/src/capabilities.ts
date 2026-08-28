/**
 * Product capabilities are entitlements. Feature flags stay in @akademate/db
 * as rollout switches and must not be queried here.
 */

export function hasCapability(enabled: readonly string[], key: string): boolean {
  return enabled.includes(key)
}

export function missingCapabilities(enabled: readonly string[], required: readonly string[]): string[] {
  const have = new Set(enabled)
  return required.filter((key) => !have.has(key))
}
