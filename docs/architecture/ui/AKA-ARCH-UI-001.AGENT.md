# AKA-ARCH-UI-001 agent implementation prompt

You are implementing AKADEMATE UI and frontend from architecture description AKA-ARCH-UI-001 (BRIK64 Inc.).

## Ingest order

1. Read AKA-ARCH-UI-001.ingest.json. Canonical machine form: codes, ADRs, surfaces, shells, tokens, catalog, figures as Mermaid.
2. Read each diagrams/*.mmd named in that file. PNG files are renderings of those sources.
3. Read this file for the execution contract.
4. Read AKA-ARCH-UI-001.html or the PDF text layer for the ingest sheets, the figure atlas, and Appendix A.

Appendix A holds Mermaid as selectable text. Figure sheets name the source path (example: FIG-01 · diagrams/01-surfaces.mmd).

## Execution contract

Apply every ADR-U1 through ADR-U12.

Paint from catalog. Search the repo primitive, then official shadcn slug, then Magic UI or Aceternity by slug for marketing motion. Name Superficie / Catalogo / Slug / Source / Tokens / Salto on every new visual surface.

Tokens flow TOK-BASE to TOK-SEM to TOK-TENANT to TOK-THEME-V4. Runtime accent is TOK-RUNTIME TenantBrandingProvider writing --primary, --sidebar, --brand. Default primary #0066CC. Sidebar default #0F2440.

SURF-DASH uses SHELL-DASH (AppSidebar, SidebarProvider, SidebarInset). SURF-PUBLIC uses SHELL-PUBLIC on its own html document. SURF-OPS uses SHELL-OPS. SURF-CAMPUS uses SHELL-CAMPUS. SURF-WEB uses SHELL-MKT.

Dashboard chrome is SaaS tokens. Tenant public may carry a host overlay (type, footer, contact channels) through CSS variables, not a second primitive catalog.

Canonical primitives today: tenant-admin components/ui, aliased as @payload-config/components/ui. Target: the same slugs in @akademate/ui.

Auth screens compose Card, Input, Button. SURF-WEB /login routes to the academy app login.

Quality: WCAG AA contrast, visible focus, keyboard path, semantic HTML. Product chrome uses CSS and Radix animation. SURF-WEB completes Tailwind v4 theme.colors.

## Implementation sequence

1. Map SURF-* to apps and route groups.
2. Wire TOK-* into each live surface. Remove duplicate palettes once the package import is in place.
3. Keep CAT-SHADCN slugs stable (button, card, dialog, sheet, sidebar, input, table, tabs, select, badge, tooltip).
4. Implement SHELL-DASH, SHELL-PUBLIC, SHELL-OPS, SHELL-CAMPUS, SHELL-AUTH, SHELL-MKT.
5. Auth: Card + Input + Button on each live login.
6. Design-system pages and Storybook stay delivery surfaces, not a second source of tokens.
7. Cut SURF-WEB to Tailwind v4 theme.colors and @tailwindcss/postcss.
8. Lift primitives from tenant-admin into @akademate/ui while the alias keeps working.

## Done when

Every figure in ingest.json has a matching .mmd. Every SURF, SHELL, TOK, CAT, ADR-U code is present in code or this pack. A new screen names a catalog slug. verify_print_pdf.py exits 0 on this PDF.

