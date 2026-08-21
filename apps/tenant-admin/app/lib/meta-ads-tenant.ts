import { buildGeoLocations } from '@/src/lib/meta-marketing'

export function tenantCampaignNamePrefix(): string {
  return (process.env.META_CAMPAIGN_NAME_PREFIX || '').trim()
}

export function tenantMetaPageId(): string {
  return (process.env.META_PAGE_ID || '').trim()
}

export function tenantMetaInstagramUserId(): string {
  return (process.env.META_INSTAGRAM_USER_ID || '').trim()
}

export function tenantTargetingGeo() {
  const cityId = (process.env.META_TARGET_CITY_ID || '').trim()
  const radiusKm = Number(process.env.META_TARGET_RADIUS_KM || '')
  return buildGeoLocations({
    cityId: cityId || undefined,
    radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : undefined,
  })
}
