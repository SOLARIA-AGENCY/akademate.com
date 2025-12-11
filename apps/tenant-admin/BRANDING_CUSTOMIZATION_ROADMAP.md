# Tenant Admin - Branding Customization Roadmap

## Overview
This document outlines the tasks required to make the Tenant Admin dashboard fully customizable per tenant for commercialization.

---

## Phase 1: Core Branding Infrastructure

### 1.1 Tenant Configuration Schema
- [ ] Create `TenantBranding` collection in Payload CMS
  - `tenantId`: relationship to Tenant
  - `logo`: upload field (PNG/SVG)
  - `logoAlt`: string (accessibility)
  - `favicon`: upload field
  - `primaryColor`: string (hex)
  - `secondaryColor`: string (hex)
  - `accentColor`: string (hex)
  - `companyName`: string
  - `companySlogan`: string (optional)
  - `supportEmail`: email
  - `supportPhone`: string (optional)

### 1.2 Theme Provider Implementation
- [ ] Create `TenantThemeProvider` context
- [ ] Implement CSS custom properties injection
- [ ] Create `useTenantBranding()` hook
- [ ] Add fallback/default theme values

### 1.3 Dynamic Logo Component
- [ ] Create `TenantLogo` component with dynamic src
- [ ] Support light/dark mode variants
- [ ] Implement lazy loading with placeholder
- [ ] Add error fallback to default logo

---

## Phase 2: UI Component Updates

### 2.1 Sidebar Branding
- [ ] Replace hardcoded "CEP Formacion" with `{tenant.companyName}`
- [ ] Replace logo image with `<TenantLogo />`
- [ ] Apply `primaryColor` to section headers
- [ ] Apply `accentColor` to active menu items

### 2.2 Header Updates
- [ ] Update page title to `{tenant.companyName} - Admin`
- [ ] Add tenant logo to header (optional setting)
- [ ] Apply theme colors to notification badges

### 2.3 Login/Auth Pages
- [ ] Dynamic logo on login page
- [ ] Customizable welcome message
- [ ] Apply tenant colors to buttons/inputs
- [ ] Custom background option

### 2.4 Footer Branding
- [ ] Replace "CEP Comunicacion" with tenant name
- [ ] Add optional custom footer links
- [ ] Privacy/Terms links per tenant

---

## Phase 3: Advanced Customization

### 3.1 Email Templates
- [ ] Create email template system
- [ ] Inject tenant branding into transactional emails
- [ ] Custom email signatures per tenant

### 3.2 PDF/Document Branding
- [ ] Invoice headers with tenant logo
- [ ] Certificate templates with branding
- [ ] Report headers customization

### 3.3 White-Label Features
- [ ] Custom domain support per tenant
- [ ] Remove "Powered by Akademate" option (premium)
- [ ] Custom favicon per tenant
- [ ] Custom meta tags (OG images, descriptions)

---

## Phase 4: Configuration UI

### 4.1 Branding Settings Page
- [ ] Logo upload interface
- [ ] Color picker for primary/secondary/accent
- [ ] Live preview component
- [ ] Reset to defaults option

### 4.2 Advanced Settings
- [ ] Custom CSS injection (premium)
- [ ] Font family selection
- [ ] Border radius presets
- [ ] Dark mode default toggle

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Tenant Configuration Schema | Medium | High |
| P0 | Theme Provider | Medium | High |
| P0 | Sidebar Branding | Low | High |
| P1 | Login Page Branding | Low | Medium |
| P1 | Dynamic Logo Component | Low | High |
| P1 | Page Titles | Low | Medium |
| P2 | Email Templates | High | Medium |
| P2 | Branding Settings UI | Medium | High |
| P3 | White-Label Features | High | Medium |
| P3 | Custom CSS Injection | Medium | Low |

---

## Files to Modify

### Core Files
```
apps/tenant-admin/
├── app/(dashboard)/layout.tsx          # Main layout with sidebar
├── app/layout.tsx                      # Root layout (title, favicon)
├── app/auth/login/page.tsx             # Login page branding
├── @payload-config/components/
│   └── layout/
│       ├── AppSidebar.tsx              # Sidebar with logo/colors
│       └── DashboardFooter.tsx         # Footer branding
```

### New Files to Create
```
apps/tenant-admin/
├── lib/
│   ├── tenant-context.tsx              # Tenant branding context
│   ├── use-tenant-branding.ts          # Hook for branding data
│   └── theme-utils.ts                  # CSS variable injection
├── components/
│   ├── TenantLogo.tsx                  # Dynamic logo component
│   └── ThemePreview.tsx                # Settings preview
```

### Payload Collections
```
apps/payload/collections/
├── TenantBranding.ts                   # Branding configuration
└── index.ts                            # Export collection
```

---

## Environment Variables

```env
# Default branding (fallback)
DEFAULT_LOGO_URL=/logos/akademate-logo.png
DEFAULT_PRIMARY_COLOR=#06B6D4
DEFAULT_SECONDARY_COLOR=#14B8A6
DEFAULT_ACCENT_COLOR=#10B981
DEFAULT_COMPANY_NAME=Akademate
```

---

## API Endpoints

```
GET  /api/tenant/branding              # Get current tenant branding
PUT  /api/tenant/branding              # Update branding (admin only)
POST /api/tenant/branding/logo         # Upload logo
POST /api/tenant/branding/reset        # Reset to defaults
```

---

## Testing Checklist

- [ ] Branding loads correctly on first visit
- [ ] Logo displays properly in all locations
- [ ] Colors apply consistently across components
- [ ] Fallback works when branding not configured
- [ ] Settings changes reflect immediately
- [ ] Dark mode respects tenant colors
- [ ] Mobile responsive branding
- [ ] Performance: branding doesn't cause layout shift

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 2-3 days | None |
| Phase 2 | 2-3 days | Phase 1 |
| Phase 3 | 3-5 days | Phase 2 |
| Phase 4 | 2-3 days | Phase 2 |

**Total: 9-14 days for full implementation**

---

## Notes

- Current CEP branding serves as the template/reference implementation
- All hardcoded CEP references are documented for easy search/replace
- Theme system should support future features (custom fonts, animations)
- Consider caching branding data for performance

---

*Document created: 2024-12-11*
*Status: Planning*
*Owner: SOLARIA AGENCY*
