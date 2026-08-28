import type { CommercialPlan, DeploymentMode, StoredPlan } from '@akademate/types'
import { commercialPlanFromStored } from '@akademate/types'

export interface PlanDeploymentPair {
  storedPlan: StoredPlan
  commercialPlan: CommercialPlan
  deploymentMode: DeploymentMode
}

/**
 * Plan and deployment are independent. Enterprise may be dedicated or on-premise.
 * Launch/Business default to managed cloud.
 */
export function pairPlanAndDeployment(
  storedPlan: StoredPlan,
  deploymentMode: DeploymentMode,
): PlanDeploymentPair {
  return {
    storedPlan,
    commercialPlan: commercialPlanFromStored(storedPlan),
    deploymentMode,
  }
}

export function isValidPlanDeploymentPair(storedPlan: StoredPlan, deploymentMode: DeploymentMode): boolean {
  if (storedPlan === 'enterprise') {
    return (
      deploymentMode === 'managed_cloud' ||
      deploymentMode === 'dedicated_cloud' ||
      deploymentMode === 'on_premise'
    )
  }
  return deploymentMode === 'managed_cloud'
}

export function defaultPlacement() {
  return {
    regionId: 'eu',
    cellId: 'eu-01',
    deploymentId: 'eu-01',
  }
}
