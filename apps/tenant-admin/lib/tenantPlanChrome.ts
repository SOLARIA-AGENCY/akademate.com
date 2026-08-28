/**
 * ENTERPRISE / ON-PREMISE live on the tenant row. Chrome never paints them.
 * Configuración may, and only when that tenant actually has the value.
 */

export type TenantPlanSnapshot = {
  plan: string
  deploymentMode: string
}

export const DEFAULT_TENANT_PLAN: TenantPlanSnapshot = {
  plan: 'starter',
  deploymentMode: 'managed_cloud',
}

const ENTERPRISE_LABEL = 'ENTERPRISE'
const ON_PREMISE_LABEL = 'ON-PREMISE'

export function isEnterprisePlan(plan: string): boolean {
  return plan === 'enterprise'
}

export function isOnPremiseDeployment(deploymentMode: string): boolean {
  return deploymentMode === 'on_premise'
}

/** Labels allowed in Configuración. Empty for a default tenant. */
export function settingsPlanLabels(snapshot: TenantPlanSnapshot): string[] {
  const labels: string[] = []
  if (isEnterprisePlan(snapshot.plan)) labels.push(ENTERPRISE_LABEL)
  if (isOnPremiseDeployment(snapshot.deploymentMode)) labels.push(ON_PREMISE_LABEL)
  return labels
}

/** Chrome (sidebar, footer, public) never shows these labels. */
export function chromePlanLabels(_snapshot: TenantPlanSnapshot): string[] {
  return []
}
