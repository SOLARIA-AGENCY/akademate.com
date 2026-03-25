# Meta Ads Platform Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify Facebook/Instagram into "Meta Ads" in the campaigns UI, build creative asset management (4 formats), and connect the Marketing API to create ad campaigns directly from Akademate.

**Architecture:** Campaigns page gets unified Meta Ads platform. Creatividades page becomes asset uploader with 4 format slots per campaign. A new `/api/meta/ads` endpoint wraps the Marketing API to create campaigns programmatically. Creative assets upload to Payload Media, then push to Meta via adimages API.

**Tech Stack:** Next.js App Router, Payload CMS (Campaigns + Media collections), Meta Marketing API v21.0, shadcn/ui components

**Key Context (from memory — read these files):**
- `memory/reference_meta_marketing_api_token.md` — Marketing API token (SECRETO)
- `memory/reference_meta_marketing_api.md` — App ID, permissions, endpoints
- `memory/project_cep_facebook_ads.md` — Account IDs (Ad Account: 730494526974837)
- `memory/project_cep_ads_copy_ciclos_2026.md` — Ad copy ready for 2 campaigns
- `memory/project_cep_campaign_codification.md` — Campaign code system SA-SEDE-AREA-CURSO-AÑOTEMP-TIPO

**Current state of files:**
- `apps/tenant-admin/app/(app)/(dashboard)/campanas/page.tsx` — Campaign list with create modal
- `apps/tenant-admin/app/(app)/(dashboard)/creatividades/page.tsx` — Empty placeholder
- `apps/tenant-admin/src/collections/Campaigns/Campaigns.ts` — Payload collection
- `apps/tenant-admin/src/collections/AdsTemplates/AdsTemplates.ts` — Ad templates collection
- `apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx` — Sidebar nav
- `apps/tenant-admin/src/lib/meta-capi.ts` — Existing CAPI utility (reference for API patterns)

---

## Task 1: Unify platform options — Meta Ads replaces Facebook/Instagram

**Files:**
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/campanas/page.tsx`

**What to do:**

Replace `PLATFORM_OPTIONS` array:

```typescript
const PLATFORM_OPTIONS = [
  { value: 'meta_ads', label: 'Meta Ads', color: 'bg-blue-600', icon: 'meta' },
  { value: 'google_ads', label: 'Google Ads', color: 'bg-green-600', icon: 'google' },
  { value: 'tiktok_ads', label: 'TikTok Ads', color: 'bg-black', icon: 'tiktok' },
  { value: 'email', label: 'Email Marketing', color: 'bg-orange-500', icon: 'email' },
]
```

Remove `facebook_ads` and `instagram_ads` as separate options. Meta Ads covers both.

Also update the `getPlatformBadge` function and any references to the old values.

**Commit:** `refactor: unify Facebook/Instagram into Meta Ads platform`

---

## Task 2: Add Meta Marketing API token to tenant integrations

**Files:**
- Modify: `apps/tenant-admin/src/collections/Tenants/Tenants.ts` (integrations group)
- Modify: `apps/tenant-admin/app/(app)/(dashboard)/configuracion/page.tsx` (Integraciones section)
- Modify: `apps/tenant-admin/app/api/config/route.ts` (IntegrationsSchema)

**What to do:**

Add field `metaMarketingApiToken` to the integrations group in Tenants.ts:

```typescript
{
  name: 'metaMarketingApiToken',
  type: 'text',
  label: 'Meta Marketing API Token',
  admin: {
    description: 'Token para crear campañas via API. Generar en Business Manager > System Users.',
  },
},
```

Add to the Integraciones section UI in the Meta/Facebook card (password field with eye toggle, same pattern as CAPI token).

Add to IntegrationsSchema in config route.

**Commit:** `feat: add Marketing API token field to tenant integrations`

---

## Task 3: Create Meta Marketing API utility library

**Files:**
- Create: `apps/tenant-admin/src/lib/meta-marketing.ts`

**What to do:**

Create a utility module with functions for the Meta Marketing API. Similar pattern to `meta-capi.ts` but for ads management:

```typescript
const META_GRAPH_API = 'https://graph.facebook.com/v21.0'

interface CreateCampaignParams {
  adAccountId: string
  accessToken: string
  name: string
  objective?: string // default: OUTCOME_LEADS
  status?: string // default: PAUSED
}

interface CreateAdSetParams {
  adAccountId: string
  accessToken: string
  campaignId: string
  name: string
  dailyBudget: number // in cents
  pixelId: string
  optimizationGoal?: string // default: LEAD_GENERATION
  billingEvent?: string // default: IMPRESSIONS
  targeting: {
    geoLocations: { regions: Array<{ key: string }> }
    // Tenerife SC region key: "3872"
  }
}

interface CreateAdParams {
  adAccountId: string
  accessToken: string
  adSetId: string
  name: string
  creativeId: string
  status?: string // default: PAUSED
}

interface UploadImageParams {
  adAccountId: string
  accessToken: string
  imageUrl: string // URL of the image to upload
}

interface CreateAdCreativeParams {
  adAccountId: string
  accessToken: string
  name: string
  pageId: string
  imageHash: string
  headline: string
  body: string
  description: string
  linkUrl: string
  callToAction: string
  urlParameters: string
}

// Export functions:
export async function createCampaign(params: CreateCampaignParams)
export async function createAdSet(params: CreateAdSetParams)
export async function createAdCreative(params: CreateAdCreativeParams)
export async function createAd(params: CreateAdParams)
export async function uploadImage(params: UploadImageParams)
export async function getCampaignInsights(adAccountId: string, accessToken: string, campaignId: string)
```

Each function:
- POSTs to `${META_GRAPH_API}/act_${adAccountId}/campaigns` (or adsets, ads, etc.)
- Returns `{ success: boolean, id?: string, error?: string }`
- Never throws
- Logs with `[meta-marketing]` prefix

**Commit:** `feat: add Meta Marketing API utility for campaign management`

---

## Task 4: Create /api/meta/ads endpoint

**Files:**
- Create: `apps/tenant-admin/app/api/meta/ads/route.ts`

**What to do:**

API endpoint that orchestrates campaign creation via Marketing API:

```
POST /api/meta/ads/create-campaign
Body: {
  convocatoriaId: number,
  campaignName: string,
  adSetName: string,
  adName: string,
  dailyBudget: number,
  targetRegion: string, // "3872" for Tenerife SC
  headlines: string[], // up to 5
  descriptions: string[], // up to 5
  primaryTexts: string[], // up to 5
  imageMediaId?: number, // Payload media ID
}
```

Logic:
1. Read tenant config for: metaMarketingApiToken, metaPixelId, metaAdAccountId, metaBusinessId
2. Read convocatoria for: campaign_code, landing URL, course name
3. Build UTM parameters from campaign_code
4. Call createCampaign() → get campaignId
5. Call createAdSet() with targeting → get adSetId
6. If imageMediaId provided, upload image → get imageHash
7. Call createAdCreative() with texts + image → get creativeId
8. Call createAd() → get adId
9. Return all IDs
10. Update Campaigns collection in Payload with Meta IDs

**Commit:** `feat: add /api/meta/ads endpoint for programmatic campaign creation`

---

## Task 5: Build Creatividades page — Asset uploader

**Files:**
- Rewrite: `apps/tenant-admin/app/(app)/(dashboard)/creatividades/page.tsx`

**What to do:**

Build a creative asset management page with:

**Header:** "Creatividades" with description

**Per-campaign asset grid:**
Each campaign/convocatoria shows 4 upload slots:

```
┌─────────────────────────────────────────────────┐
│ CFGM Farmacia y Parafarmacia (SC-2026-001)      │
│ Campaign: SA-SC-SAN-FAR-2628-CIC-CAP26          │
├────────────┬────────────┬────────────┬──────────┤
│  Imagen    │  Video     │  Imagen    │  Video   │
│  Cuadrada  │  Cuadrado  │  Vertical  │  Vertical│
│  1080x1080 │  1080x1080 │  1080x1920 │ 1080x1920│
│            │            │            │          │
│  [Upload]  │  [Upload]  │  [Upload]  │ [Upload] │
│  o arrastrar              o arrastrar            │
└────────────┴────────────┴────────────┴──────────┘
```

Each slot:
- Shows thumbnail preview when uploaded
- Accepts image (jpg/png/webp) or video (mp4) depending on slot type
- Uploads to Payload Media collection with folder `campaigns/{campaign_code}`
- Shows file size and dimensions
- Delete button to remove
- Status indicator (uploaded / pending)

**Data source:** Fetch convocatorias from `/api/convocatorias` (the ones with status `enrollment_open`)

**Storage:** Save asset references in Campaigns collection or a new `campaign_assets` field

**Commit:** `feat: build creatividades page with 4-format asset uploader`

---

## Task 6: Add "Crear Ad en Meta" button to campaign detail

**Files:**
- Modify or create: `apps/tenant-admin/app/(app)/(dashboard)/campanas/[id]/page.tsx`

**What to do:**

If a campaign detail page exists, add a section "Publicidad Meta" with:

1. **Preview card** showing the ad as it would appear on Facebook/Instagram
2. **Texts section** with the 5 headlines, 5 descriptions, 5 primary texts (editable)
3. **Creative selector** showing uploaded assets from Creatividades
4. **Settings** — daily budget, target region, optimization event
5. **Button "Crear borrador en Meta"** that:
   - Validates all required fields
   - Calls `/api/meta/ads/create-campaign`
   - Shows success with campaign/adset/ad IDs
   - Links to the ad in Meta Ads Manager
   - Does NOT publish — leaves in PAUSED/draft state

6. **Button "Publicar"** (separate, prominent, with confirmation dialog) that:
   - Calls Marketing API to change campaign status to ACTIVE
   - Requires explicit confirmation

If the detail page doesn't exist yet, create it with this content.

**Commit:** `feat: add Meta ad creation flow to campaign detail page`

---

## Task 7: Update sidebar and routing

**Files:**
- Modify: `apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx`

**What to do:**

Update the Marketing section in sidebar:

```typescript
{
  title: 'Marketing',
  icon: Megaphone,
  items: [
    { title: 'Campañas', icon: Megaphone, url: '/campanas' },
    { title: 'Creatividades', icon: Image, url: '/creatividades' },
  ],
}
```

No route changes needed — the pages already exist at the right paths.

**Commit:** `refactor: update marketing sidebar navigation`

---

## Task 8: Add campaign_code auto-generation hook

**Files:**
- Modify: `apps/tenant-admin/src/collections/CourseRuns/hooks/generateCourseRunCode.ts`
- Or create: `apps/tenant-admin/src/collections/CourseRuns/hooks/generateCampaignCode.ts`

**What to do:**

The `campaign_code` field exists in the DB but the auto-generation hook may not be implemented. Create or verify a hook that generates the campaign code following the codification system:

```
SA-[SEDE]-[AREA]-[CURSO]-[AÑO_INICIO][AÑO_FIN]-CIC-CAP[AÑO_CAPTACION]
```

Logic:
1. Read campus → map to sede code (SC, NT, TF, ON)
2. Read cycle/course → map to area code (SAN, ADM, INF, etc.) and course abbreviation (3 letters)
3. Read start_date → extract year for promotion period
4. Build the code string
5. Save to `campaign_code` field

If the hook already generates campaign_code correctly (which it does for the 2 existing convocatorias), just verify and document it.

**Commit:** `feat: verify/implement campaign_code auto-generation hook`

---

## Summary of files

| Action | File |
|--------|------|
| Modify | `apps/tenant-admin/app/(app)/(dashboard)/campanas/page.tsx` |
| Modify | `apps/tenant-admin/src/collections/Tenants/Tenants.ts` |
| Modify | `apps/tenant-admin/app/(app)/(dashboard)/configuracion/page.tsx` |
| Modify | `apps/tenant-admin/app/api/config/route.ts` |
| Create | `apps/tenant-admin/src/lib/meta-marketing.ts` |
| Create | `apps/tenant-admin/app/api/meta/ads/route.ts` |
| Rewrite | `apps/tenant-admin/app/(app)/(dashboard)/creatividades/page.tsx` |
| Create/Modify | `apps/tenant-admin/app/(app)/(dashboard)/campanas/[id]/page.tsx` |
| Modify | `apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx` |
| Verify | `apps/tenant-admin/src/collections/CourseRuns/hooks/generateCampaignCode.ts` |

## Key data for implementation

### Meta Marketing API
- **App ID:** `3589029217896274`
- **Ad Account:** `730494526974837`
- **Page ID:** `174953792552373` (CEP Formación)
- **Pixel ID:** `1189071876088388`
- **Token:** Stored in tenant config `integrations.metaMarketingApiToken`
- **Tenerife SC region key:** `3872`

### API endpoints used
```
POST /act_{AD_ACCOUNT}/campaigns — Create campaign
POST /act_{AD_ACCOUNT}/adsets — Create ad set
POST /act_{AD_ACCOUNT}/adcreatives — Create ad creative
POST /act_{AD_ACCOUNT}/ads — Create ad
POST /act_{AD_ACCOUNT}/adimages — Upload image
GET  /act_{AD_ACCOUNT}/campaigns — List campaigns
GET  /{CAMPAIGN_ID}/insights — Get metrics
```

### Creative asset formats
| Slot | Dimensions | Aspect | Use |
|------|-----------|--------|-----|
| Imagen cuadrada | 1080x1080 | 1:1 | Feed FB + IG |
| Video cuadrado | 1080x1080 | 1:1 | Feed FB + IG |
| Imagen vertical | 1080x1920 | 9:16 | Stories + Reels |
| Video vertical | 1080x1920 | 9:16 | Stories + Reels |

### Landing URL pattern
```
https://cursos.cepcomunicacion.com/p/convocatorias/{CONVOCATORIA_CODE}
```

### UTM pattern
```
utm_source=facebook&utm_medium=paid&utm_campaign={CAMPAIGN_CODE}
```

### Campaign naming convention
```
SOLARIA AGENCY - {CATEGORY} - {SEASON YEAR} - {CAMPAIGN_CODE}
```

### Ad set naming convention
```
{COURSE_NAME} / {LOCATION}
```

### Ad naming convention
```
AD-{NUMBER} / {COURSE_NAME} / {CREATIVE_TYPE}
```
