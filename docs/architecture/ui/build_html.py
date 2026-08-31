#!/usr/bin/env python3
"""Build AKA-ARCH-UI-001.html — UI and frontend architecture description (EN)."""
from __future__ import annotations

import html as html_lib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "AKA-ARCH-UI-001.html"
INGEST = ROOT / "AKA-ARCH-UI-001.ingest.json"
TOTAL = 46
DOC_ID = "AKA-ARCH-UI-001"
REV = "A"
ISSUE = "2026-08-30"
LANG = "en"

_OFFICIAL = Path(__file__).resolve().parent.parent / "official" / "build_html.py"
CSS = _OFFICIAL.read_text(encoding="utf-8").split('CSS = r"""', 1)[1].split('"""', 1)[0]

FIGS = [
    ("01-surfaces", "Figure 1", "Product surfaces"),
    ("02-dual-public", "Figure 2", "Two public webs"),
    ("03-token-pipeline", "Figure 3", "Token pipeline"),
    ("04-primitive-ownership", "Figure 4", "Primitive ownership"),
    ("05-dashboard-shell", "Figure 5", "Dashboard shell"),
    ("06-public-shell", "Figure 6", "Tenant public shell"),
    ("07-theming", "Figure 7", "Theming"),
    ("08-auth-surfaces", "Figure 8", "Auth surfaces"),
    ("09-catalog-order", "Figure 9", "Catalog order"),
    ("10-design-system-delivery", "Figure 10", "Design-system delivery"),
    ("11-compose-sequence", "Figure 11", "Compose sequence"),
    ("12-quality-a11y", "Figure 12", "Quality and access"),
]

SURFACES = [
    ("SURF-WEB", "apps/web", "SaaS marketing"),
    ("SURF-DASH", "apps/tenant-admin (app)/(dashboard)", "Academy dashboard"),
    ("SURF-PUBLIC", "apps/tenant-admin (public)", "Tenant public site"),
    ("SURF-CAMPUS", "apps/tenant-admin (app)/campus", "Academy campus"),
    ("SURF-OPS", "apps/admin-client", "Platform ops"),
    ("SURF-PORTAL", "apps/portal", "Access hub"),
    ("SURF-CMS", "Payload admin", "CMS chrome"),
]

SHELLS = [
    ("SHELL-DASH", "AppSidebar + SidebarProvider", "Dashboard"),
    ("SHELL-PUBLIC", "Public header and footer", "Tenant public"),
    ("SHELL-OPS", "OpsSidebar", "Platform ops"),
    ("SHELL-CAMPUS", "CampusNavbar", "Campus"),
    ("SHELL-AUTH", "Auth canvas", "Staff login"),
    ("SHELL-MKT", "Marketing header and footer", "SURF-WEB"),
]

TOKENS = [
    ("TOK-BASE", "packages/ui/src/tokens/base.css", "Primitive palette and type"),
    ("TOK-SEM", "packages/ui/src/tokens/semantic.css", "Purpose aliases"),
    ("TOK-TENANT", "packages/ui/src/tokens/tenant.css", "Brand accent"),
    ("TOK-THEME-V4", "@theme inline", "Tailwind v4 color map"),
    ("TOK-RUNTIME", "TenantBrandingProvider", "Injects --primary and --sidebar"),
]

CATALOG = [
    ("CAT-REPO", "components/ui in the app tree", "First"),
    ("CAT-SHADCN", "shadcn new-york official slug", "Second"),
    ("CAT-MOTION", "Magic UI or Aceternity by slug", "Marketing motion"),
    ("CAT-EXT", "One 21st.dev or ReUI block", "If the pattern is missing"),
]

ADRS = [
    ("ADR-U1", "Product UIs are Next.js 15 App Router."),
    ("ADR-U2", "Color is CSS variables in HSL channels. Tenant branding writes --primary and --sidebar."),
    ("ADR-U3", "The shadcn new-york catalog lives in tenant-admin. Dashboard imports the Payload-config alias."),
    ("ADR-U4", "@akademate/ui ships tokens and Pill. Primitives migrate into that package."),
    ("ADR-U5", "Dashboard chrome reads --sidebar and TenantBranding."),
    ("ADR-U6", "Tenant public is its own html document, separate from the dashboard shell."),
    ("ADR-U7", "Platform ops UI is apps/admin-client."),
    ("ADR-U8", "Campus product routes live under tenant-admin. apps/campus is a scaffold."),
    ("ADR-U9", "Light and dark are a class on html."),
    ("ADR-U10", "Compose from catalog order: repo, official shadcn, motion by slug."),
    ("ADR-U11", "Tailwind v4 with theme.colors and @tailwindcss/postcss. SURF-WEB completes that cutover."),
    ("ADR-U12", "Motion on product chrome is CSS, Radix, and tw-animate. Marketing motion uses the Motion library by slug."),
]

AGENT_PROMPT = """# AKA-ARCH-UI-001 agent implementation prompt

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
"""

AGENT_PROMPT_A, AGENT_PROMPT_B = AGENT_PROMPT.split("## Implementation sequence", 1)
AGENT_PROMPT_B = "## Implementation sequence" + AGENT_PROMPT_B


def hdr() -> str:
    return (
        f'<div class="hdr"><span><strong>BRIK64 Inc.</strong> · AKADEMATE</span>'
        f"<span>{DOC_ID} · Rev {REV} · {LANG}</span></div>"
    )


def ftr(n: int) -> str:
    return (
        f'<div class="ftr"><span>Internal · Confidential</span>'
        f"<span>Sheet {n} / {TOTAL}</span></div>"
    )


def sheet(n: int, title: str, body: str, extra: str = "") -> str:
    klass = f"sheet {extra}".strip()
    return f"""
<section class="{klass}" aria-label="{title}">
  {hdr()}
  <div class="body">
  <h1>{title}</h1>
  {body}
  </div>
  {ftr(n)}
</section>
"""


def fig_sheet(n: int, stem: str, code: str, title: str) -> str:
    fig_id = f"FIG-{stem[:2]}"
    src = f"diagrams/{stem}.mmd"
    return f"""
<section class="sheet fig" aria-label="{code} {title}">
  {hdr()}
  <div class="body">
  <h1>{code}. {title}</h1>
  <p class="code-line">{fig_id} · {src} · text/vnd.mermaid · PNG is a rendering of that source</p>
  </div>
  <div class="fig-frame">
    <img src="diagrams/{stem}.png" alt="{fig_id} {title}. Machine source {src}" />
  </div>
  {ftr(n)}
</section>
"""


def fig_id_for(stem: str) -> str:
    return f"FIG-{stem[:2]}"


def load_figures() -> list[dict]:
    rows: list[dict] = []
    for stem, code, title in FIGS:
        src = ROOT / "diagrams" / f"{stem}.mmd"
        rows.append(
            {
                "id": fig_id_for(stem),
                "code": code,
                "title": title,
                "stem": stem,
                "source_path": f"diagrams/{stem}.mmd",
                "png_path": f"diagrams/{stem}.png",
                "mime": "text/vnd.mermaid",
                "mermaid": src.read_text(encoding="utf-8").rstrip() + "\n",
            }
        )
    return rows


def mermaid_appendix_sheets(start: int, figures: list[dict]) -> list[str]:
    out: list[str] = []
    n = start
    for chunk_i, i in enumerate(range(0, len(figures), 3)):
        chunk = figures[i : i + 3]
        label = f"{chunk[0]['id']} to {chunk[-1]['id']}"
        blocks: list[str] = []
        for fig in chunk:
            escaped = html_lib.escape(fig["mermaid"].rstrip())
            blocks.append(
                f'<p class="code-line">{fig["id"]} · {fig["source_path"]} · text/vnd.mermaid</p>'
                f'<pre class="mmd-src" id="{fig["id"]}-src">{escaped}</pre>'
            )
        out.append(sheet(n, f"A.{chunk_i + 1} Mermaid source {label}", "\n".join(blocks)))
        n += 1
    return out


def ingest_payload(figures: list[dict]) -> dict:
    return {
        "schema": "aka-arch-ingest/1",
        "doc_id": DOC_ID,
        "rev": REV,
        "issue": ISSUE,
        "language": LANG,
        "owner": "BRIK64 Inc.",
        "product": "AKADEMATE",
        "kind": "ui-frontend",
        "prompt_file": "AKA-ARCH-UI-001.AGENT.md",
        "html_file": "AKA-ARCH-UI-001.html",
        "pdf_file": "AKA-ARCH-UI-001_v1.0.pdf",
        "ingest_order": [
            "AKA-ARCH-UI-001.ingest.json",
            "diagrams/*.mmd",
            "AKA-ARCH-UI-001.AGENT.md",
            "AKA-ARCH-UI-001.html",
            "PDF text layer: ingest sheets, figure atlas, Appendix A",
        ],
        "codes": {
            "surfaces": [{"id": a, "path": b, "role": c} for a, b, c in SURFACES],
            "shells": [{"id": a, "impl": b, "surface": c} for a, b, c in SHELLS],
            "tokens": [{"id": a, "source": b, "role": c} for a, b, c in TOKENS],
            "catalog": [{"id": a, "source": b, "role": c} for a, b, c in CATALOG],
            "adrs": [{"id": a, "decision": b} for a, b in ADRS],
        },
        "figures": figures,
    }


def write_sidecar(figures: list[dict]) -> None:
    INGEST.write_text(json.dumps(ingest_payload(figures), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (ROOT / "AKA-ARCH-UI-001.AGENT.md").write_text(AGENT_PROMPT.lstrip() + "\n", encoding="utf-8")
    (ROOT / "llms.txt").write_text(
        "\n".join(
            [
                f"# {DOC_ID} Rev {REV}",
                "Canonical machine ingest for AKADEMATE UI and frontend architecture.",
                "",
                "AKA-ARCH-UI-001.ingest.json",
                "AKA-ARCH-UI-001.AGENT.md",
                "AKA-ARCH-UI-001.html",
                "diagrams/*.mmd",
                "",
            ]
        ),
        encoding="utf-8",
    )


TOC_LEFT = [
    ("", "Cover", 1),
    ("0.1", "Identification", 2),
    ("0.1b", "Approvals", 3),
    ("0.2", "Stakeholders and concerns", 4),
    ("0.3", "Viewpoints", 5),
    ("0.4", "Contents", 6),
    ("1", "Introduction and goals", 7),
    ("2", "Constraints", 8),
    ("3", "Context and scope", 9),
    ("4", "Solution strategy", 10),
    ("5.1", "Building blocks: surfaces", 11),
    ("5.2", "Building blocks: tokens", 12),
    ("5.3", "Building blocks: primitives", 13),
    ("6.1", "Runtime: compose", 14),
    ("6.2", "Runtime: theming", 15),
    ("7.1", "Deployment: apps", 16),
    ("7.2", "Deployment: design system", 17),
    ("8.1", "Shells", 18),
    ("8.2", "Auth", 19),
    ("8.3", "Catalog and motion", 20),
    ("8.4", "Access", 21),
]

TOC_RIGHT = [
    ("9", "Architecture decisions", 22),
    ("10", "Quality requirements", 23),
    ("11", "Glossary and references", 24),
    ("12", "Agent ingest", 25),
    ("12.1", "Surface codes", 26),
    ("12.2", "Token and shell codes", 27),
    ("12.3", "Implementation prompt", 28),
    ("12.4", "Implementation sequence", 29),
    ("Fig. 1", "Product surfaces", 30),
    ("Fig. 2", "Two public webs", 31),
    ("Fig. 3", "Token pipeline", 32),
    ("Fig. 4", "Primitive ownership", 33),
    ("Fig. 5", "Dashboard shell", 34),
    ("Fig. 6", "Tenant public shell", 35),
    ("Fig. 7", "Theming", 36),
    ("Fig. 8", "Auth surfaces", 37),
    ("Fig. 9", "Catalog order", 38),
    ("Fig. 10", "Design-system delivery", 39),
    ("Fig. 11", "Compose sequence", 40),
    ("Fig. 12", "Quality and access", 41),
    ("A.1", "Mermaid FIG-01 to FIG-03", 42),
    ("A.2", "Mermaid FIG-04 to FIG-06", 43),
    ("A.3", "Mermaid FIG-07 to FIG-09", 44),
    ("A.4", "Mermaid FIG-10 to FIG-12", 45),
    ("", "Back cover", 46),
]


def toc_rows(rows: list[tuple[str, str, int]]) -> str:
    return "\n".join(
        f'<tr><td class="num">{a}</td><td>{b}</td><td class="pg">{c}</td></tr>' for a, b, c in rows
    )


def build() -> str:
    parts: list[str] = []
    parts.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{DOC_ID} Rev {REV} · AKADEMATE UI and frontend architecture</title>
  <meta name="author" content="BRIK64 Inc." />
  <meta name="aka:doc-id" content="{DOC_ID}" />
  <meta name="aka:rev" content="{REV}" />
  <meta name="aka:ingest" content="AKA-ARCH-UI-001.ingest.json" />
  <link rel="alternate" type="application/json" href="AKA-ARCH-UI-001.ingest.json" title="Machine ingest" />
  <link rel="alternate" type="text/markdown" href="AKA-ARCH-UI-001.AGENT.md" title="Agent implementation prompt" />
  <style>{CSS}
  </style>
</head>
<body>
""")

    parts.append(f"""
<section class="sheet cover" aria-label="Cover">
  <div class="cover-band">
    <div class="kicker">BRIK64 Inc. · Delaware</div>
  </div>
  <div class="cover-body">
    <h1>AKADEMATE</h1>
    <p class="sub">UI and frontend architecture description</p>
    <p>Seven product surfaces on Next.js 15 App Router. Tokens as CSS variables. shadcn new-york primitives. Shells per surface. Catalog order for every new screen.</p>
  </div>
  <div class="titleblock">
    <table>
      <tr><th>Legal owner</th><td>BRIK64 Inc. (Delaware)</td></tr>
      <tr><th>Identification</th><td>{DOC_ID}</td></tr>
      <tr><th>Revision / issue</th><td>{REV} · {ISSUE}</td></tr>
      <tr><th>Classification</th><td>Internal · Confidential</td></tr>
      <tr><th>Sheet</th><td>1 / {TOTAL}</td></tr>
    </table>
  </div>
  {ftr(1)}
</section>
""")

    parts.append(sheet(2, "0.1 Identification", f"""
  <table>
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Legal owner</td><td>BRIK64 Inc., Delaware, United States. Foundry. Initial legal owner.</td></tr>
    <tr><td>Identification number</td><td>{DOC_ID}</td></tr>
    <tr><td>Revision index</td><td>{REV}</td></tr>
    <tr><td>Date of issue</td><td>{ISSUE}</td></tr>
    <tr><td>Effective</td><td>On last approval signature</td></tr>
    <tr><td>Next review</td><td>2026-11-30</td></tr>
    <tr><td>Language</td><td>en (ISO 639)</td></tr>
    <tr><td>Document type</td><td>Architecture description</td></tr>
    <tr><td>Product</td><td>AKADEMATE</td></tr>
    <tr><td>System of interest</td><td>AKADEMATE UI and frontend across marketing, academy, campus, ops and CMS</td></tr>
    <tr><td>Classification</td><td>Internal · Confidential</td></tr>
    <tr><td>Paper size</td><td>A4</td></tr>
    <tr><td>Normative sources</td><td>ISO/IEC/IEEE 42010 · ISO 7200 · arc42 · ADR-0004 · ACADEIMATE SPEC v1.5</td></tr>
    <tr><td>Machine ingest</td><td>AKA-ARCH-UI-001.ingest.json · AKA-ARCH-UI-001.AGENT.md · diagrams/*.mmd · Appendix A</td></tr>
  </table>
"""))

    parts.append(sheet(3, "0.1b Approvals", """
  <table>
    <tr><th>Role</th><th>Organisation</th><th>Name</th><th>Date</th></tr>
    <tr><td>Creator / Foundry</td><td>BRIK64 Inc.</td><td></td><td></td></tr>
    <tr><td>Architect</td><td>AKADEMATE</td><td></td><td></td></tr>
    <tr><td>Product</td><td>AKADEMATE</td><td></td><td></td></tr>
    <tr><td>Design</td><td>AKADEMATE</td><td></td><td></td></tr>
    <tr><td>Approval</td><td>BRIK64 Inc. / AKADEMATE</td><td></td><td></td></tr>
  </table>
  <div class="sign-board">
    <div class="sign-cell">
      <div><div class="role">Creator / Foundry</div><div class="org">BRIK64 Inc.</div></div>
      <div class="line"><span>Signature</span><span>Date</span></div>
    </div>
    <div class="sign-cell">
      <div><div class="role">Architect</div><div class="org">AKADEMATE</div></div>
      <div class="line"><span>Signature</span><span>Date</span></div>
    </div>
    <div class="sign-cell">
      <div><div class="role">Product</div><div class="org">AKADEMATE</div></div>
      <div class="line"><span>Signature</span><span>Date</span></div>
    </div>
    <div class="sign-cell">
      <div><div class="role">Design</div><div class="org">AKADEMATE</div></div>
      <div class="line"><span>Signature</span><span>Date</span></div>
    </div>
    <div class="sign-cell wide">
      <div><div class="role">Approval</div><div class="org">BRIK64 Inc. / AKADEMATE</div></div>
      <div class="line"><span>Signature</span><span>Date</span></div>
    </div>
  </div>
"""))

    parts.append(sheet(4, "0.2 Stakeholders and concerns", """
  <table>
    <tr><th>Stakeholder</th><th>Concern</th></tr>
    <tr><td>Academy staff</td><td>Dense, keyboard-reachable dashboard. One chrome. Tokens follow the academy brand.</td></tr>
    <tr><td>Learners and teachers</td><td>Campus and public pages that read as the academy, with a clear login.</td></tr>
    <tr><td>Platform ops</td><td>A separate ops shell. Dark default. No academy sidebar mix-in.</td></tr>
    <tr><td>Foundry / design</td><td>One catalog, one token pipeline, WCAG AA, no painted-blank screens.</td></tr>
    <tr><td>Implementing agent</td><td>Codes, Mermaid source, and a prompt that names slugs before paint.</td></tr>
  </table>
"""))

    parts.append(sheet(5, "0.3 Viewpoints", """
  <table>
    <tr><th>Viewpoint</th><th>View in this description</th></tr>
    <tr><td>Context</td><td>Seven surfaces. Two public webs. Live product vs scaffold.</td></tr>
    <tr><td>Functional</td><td>Shells, primitives, catalog order, auth composition.</td></tr>
    <tr><td>Runtime</td><td>Token injection, class-based light/dark, compose sequence.</td></tr>
    <tr><td>Deployment</td><td>App packages, design-system pages, Storybook.</td></tr>
    <tr><td>Quality</td><td>AA contrast, focus, keyboard, motion policy.</td></tr>
  </table>
  <p>Companion description: AKA-ARCH-SAAS-001 (Cloudflare runtime). This document owns presentation.</p>
"""))

    parts.append(f"""
<section class="sheet" aria-label="0.4 Contents">
  {hdr()}
  <div class="body">
  <h1>0.4 Contents</h1>
  <div class="toc-wrap">
    <table class="toc">{toc_rows(TOC_LEFT)}</table>
    <table class="toc">{toc_rows(TOC_RIGHT)}</table>
  </div>
  </div>
  {ftr(6)}
</section>
""")

    parts.append(sheet(7, "1 Introduction and goals", """
  <p>AKADEMATE presents one product through several windows: marketing, academy dashboard, tenant public site, campus, platform ops, access hub, and CMS admin.</p>
  <p>The goal is a single visual language. Tokens in CSS variables. Primitives from shadcn new-york. A shell per surface. An implementing agent reads codes and Mermaid the same way a human reads the sheet.</p>
  <h2>Quality goals</h2>
  <ul>
    <li>WCAG 2.1 AA on text and controls.</li>
    <li>Visible focus and a complete keyboard path.</li>
    <li>Tenant brand through variables, one primitive catalog.</li>
    <li>Every new screen names a catalog slug before paint.</li>
  </ul>
"""))

    parts.append(sheet(8, "2 Constraints", """
  <ul>
    <li>Next.js 15 App Router, React 19, TypeScript.</li>
    <li>Tailwind v4 with colors in <code>theme.colors</code> and PostCSS <code>@tailwindcss/postcss</code>.</li>
    <li>shadcn/ui new-york, CSS variables, Lucide as the icon library of record.</li>
    <li>Multitenant brand: CSS variables, never a second component tree per tenant.</li>
    <li>Dashboard chrome stays on SaaS tokens. Tenant public may apply a host overlay through variables.</li>
    <li>Product chrome animation: CSS, Radix, tw-animate. Marketing motion: Motion library by slug.</li>
  </ul>
"""))

    parts.append(sheet(9, "3 Context and scope", """
  <p>System of interest: presentation for AKADEMATE. Runtime compute and data live in AKA-ARCH-SAAS-001.</p>
  <p>In scope: surfaces, tokens, primitives, shells, theming, auth screens, catalog order, access, design-system delivery.</p>
  <p>Live product UI: SURF-WEB, SURF-DASH, SURF-PUBLIC, SURF-CAMPUS, SURF-OPS, SURF-CMS. SURF-PORTAL is the access hub. <code>apps/campus</code> and <code>apps/ops</code> are scaffolds beside the live surfaces.</p>
  <p>Figure 1.</p>
"""))

    parts.append(sheet(10, "4 Solution strategy", """
  <ol>
    <li>Own each window as a surface code (SURF-*).</li>
    <li>Feed color and type from TOK-* . Runtime brand is TenantBrandingProvider.</li>
    <li>Compose pages from CAT-REPO then CAT-SHADCN. Motion by slug only.</li>
    <li>Give each surface one shell. Dashboard and tenant public do not share html.</li>
    <li>Lift primitives into <code>@akademate/ui</code> while the Payload-config alias keeps resolving.</li>
    <li>Complete SURF-WEB on Tailwind v4 <code>theme.colors</code>.</li>
  </ol>
"""))

    surf_rows = "\n".join(f"<tr><td>{a}</td><td><code>{b}</code></td><td>{c}</td></tr>" for a, b, c in SURFACES)
    parts.append(sheet(11, "5.1 Building blocks: surfaces", f"""
  <p>Seven windows. One product. Figure 1.</p>
  <table>
    <tr><th>Code</th><th>Location</th><th>Role</th></tr>
    {surf_rows}
  </table>
  <p>SURF-WEB is SaaS marketing on akademate.com. SURF-PUBLIC is the academy site on the tenant host. Figure 2.</p>
"""))

    tok_rows = "\n".join(f"<tr><td>{a}</td><td><code>{b}</code></td><td>{c}</td></tr>" for a, b, c in TOKENS)
    parts.append(sheet(12, "5.2 Building blocks: tokens", f"""
  <p>Three-layer tokens: primitive, semantic, tenant. Tailwind v4 maps them through TOK-THEME-V4. Figure 3.</p>
  <table>
    <tr><th>Code</th><th>Source</th><th>Role</th></tr>
    {tok_rows}
  </table>
  <p>Locked defaults: Manrope in TOK-BASE, runtime primary <code>#0066CC</code>, sidebar <code>#0F2440</code>. Light and dark as <code>.light</code> / <code>.dark</code> on html.</p>
"""))

    parts.append(sheet(13, "5.3 Building blocks: primitives", """
  <p>Canonical catalog: shadcn new-york in tenant-admin <code>components.json</code>, <code>cssVariables: true</code>, <code>iconLibrary: lucide</code>. Dashboard imports <code>@payload-config/components/ui</code>. Figure 4.</p>
  <p>Stable slugs: accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, card, checkbox, dialog, dropdown-menu, input, label, select, separator, sheet, sidebar, skeleton, switch, table, tabs, textarea, tooltip.</p>
  <p><code>@akademate/ui</code> exports tokens and Pill. The target is the same slugs in that package. SURF-WEB, SURF-PORTAL and SURF-OPS keep smaller local trees until the lift lands.</p>
"""))

    parts.append(sheet(14, "6.1 Runtime: compose", """
  <p>A route selects a shell. The shell applies tokens. The page composes primitives. Figure 11.</p>
  <ol>
    <li>Layout (SHELL-*) wraps the segment.</li>
    <li>ThemeProvider sets <code>light</code> or <code>dark</code> on html.</li>
    <li>TenantBrandingProvider writes --primary, --sidebar, --brand from academy color.</li>
    <li>The page imports button, card, dialog, table from the catalog alias.</li>
  </ol>
  <p>Forms: React Hook Form and zod on dashboard flows.</p>
"""))

    parts.append(sheet(15, "6.2 Runtime: theming", """
  <p>Three knobs, one tree. Figure 7.</p>
  <ul>
    <li>Class: <code>light</code> / <code>dark</code> on html. Storage key <code>akademate-theme</code> on the academy app. Ops uses <code>akademate-ops-theme</code>, dark default.</li>
    <li>Variables: --primary, --sidebar, --brand, --ring from TOK-RUNTIME.</li>
    <li>SURF-WEB may read an <code>akademate_theme</code> cookie into the same variables.</li>
  </ul>
  <p>Tenant public injects --brand from the academy primary color. Overlay type and footer copy stay variables and content, not a fork of button or card.</p>
"""))

    parts.append(sheet(16, "7.1 Deployment: apps", """
  <table>
    <tr><th>Surface</th><th>Package</th><th>Notes</th></tr>
    <tr><td>SURF-WEB</td><td><code>apps/web</code></td><td>Marketing Worker. Completes Tailwind v4 cutover.</td></tr>
    <tr><td>SURF-DASH, PUBLIC, CAMPUS, CMS</td><td><code>apps/tenant-admin</code></td><td>Primary product UI. Payload admin in the same app.</td></tr>
    <tr><td>SURF-OPS</td><td><code>apps/admin-client</code></td><td>Platform ops.</td></tr>
    <tr><td>SURF-PORTAL</td><td><code>apps/portal</code></td><td>Access hub.</td></tr>
  </table>
  <p>Scaffolds <code>apps/campus</code> and <code>apps/ops</code> remain beside the live surfaces until callers move to SURF-CAMPUS and SURF-OPS.</p>
"""))

    parts.append(sheet(17, "7.2 Deployment: design system", """
  <p>Delivery surfaces, not a second token source. Figure 10.</p>
  <ul>
    <li>SURF-WEB <code>/design-system</code> and template sandbox.</li>
    <li>SURF-DASH <code>/design-system</code> playground.</li>
    <li>Storybook on tenant-admin at port 6006: foundations, patterns, akademate blocks.</li>
    <li>Vendor kit copy-in: templates restyle to TOK-* at the moment of install.</li>
  </ul>
"""))

    shell_rows = "\n".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in SHELLS)
    parts.append(sheet(18, "8.1 Shells", f"""
  <p>One shell per window. Figures 5 and 6.</p>
  <table>
    <tr><th>Code</th><th>Implementation</th><th>Surface</th></tr>
    {shell_rows}
  </table>
  <p>SHELL-DASH: AppSidebar, SidebarProvider, SidebarInset, DashboardFooter, CommandPalette, NotificationBell, ThemeToggle. Canvas token --dashboard-canvas.</p>
"""))

    parts.append(sheet(19, "8.2 Auth", """
  <p>Every live login is Card, Input, Button. Figure 8.</p>
  <ul>
    <li>SURF-DASH: <code>/auth/login</code>, signup, forgot-password, accept-invite. SHELL-AUTH canvas.</li>
    <li>SURF-CAMPUS: <code>/campus/login</code>.</li>
    <li>SURF-OPS: <code>/login</code>.</li>
    <li>SURF-WEB: <code>/login</code> continues to the academy app login. <code>/registro</code> is the lead form.</li>
    <li>SURF-CMS: Payload admin login.</li>
  </ul>
"""))

    cat_rows = "\n".join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in CATALOG)
    parts.append(sheet(20, "8.3 Catalog and motion", f"""
  <p>Do not invent a hero, pricing, sidebar, form, empty state, or chat. Figure 9.</p>
  <table>
    <tr><th>Code</th><th>Source</th><th>When</th></tr>
    {cat_rows}
  </table>
  <p>Chat UI is the official shadcn block. Product chrome motion is CSS, Radix, tw-animate. Marketing motion is the Motion library by slug.</p>
"""))

    parts.append(sheet(21, "8.4 Access", """
  <p>Figure 12.</p>
  <ul>
    <li>WCAG 2.1 AA contrast on text and UI components.</li>
    <li>Visible focus ring on every control. Keyboard path through sidebar, dialog, sheet, select, tabs.</li>
    <li>Semantic headings, labels, and live regions (sonner toasts).</li>
    <li>Hit targets at least 44 by 44 CSS pixels on public and campus.</li>
    <li>Decorative icons: <code>aria-hidden</code>. Icon-only buttons: accessible name.</li>
  </ul>
"""))

    adr_rows = "\n".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in ADRS)
    parts.append(sheet(22, "9 Architecture decisions", f"""
  <table>
    <tr><th>Code</th><th>Decision</th></tr>
    {adr_rows}
  </table>
""", extra="codes"))

    parts.append(sheet(23, "10 Quality requirements", """
  <table>
    <tr><th>Quality</th><th>Requirement</th></tr>
    <tr><td>Accessibility</td><td>AA, focus, keyboard, names on icon buttons.</td></tr>
    <tr><td>Consistency</td><td>One catalog. One token pipeline. Shell per surface.</td></tr>
    <tr><td>Tenant brand</td><td>Variables only. Dashboard chrome stays SaaS-tokenized.</td></tr>
    <tr><td>Performance</td><td>next/image, self-hosted fonts, CSS animation on chrome.</td></tr>
    <tr><td>Evolvability</td><td>Primitive lift into @akademate/ui with the alias intact.</td></tr>
  </table>
"""))

    parts.append(sheet(24, "11 Glossary and references", """
  <table>
    <tr><th>Term</th><th>Definition</th></tr>
    <tr><td>Surface</td><td>A product window with its own shell and routes.</td></tr>
    <tr><td>Primitive</td><td>A catalog component (button, dialog, sidebar).</td></tr>
    <tr><td>Token</td><td>A CSS variable for color, type, space, or radius.</td></tr>
    <tr><td>Host overlay</td><td>Tenant public type, footer and contact channels on top of the same primitives.</td></tr>
    <tr><td>Catalog order</td><td>Repo, official shadcn, motion by slug, one extension block.</td></tr>
  </table>
  <h2>References</h2>
  <ul>
    <li>ISO/IEC/IEEE 42010:2022 · ISO 7200:2004 · arc42</li>
    <li>docs/adr/0004-ui-kit.md</li>
    <li>docs/specs/ACADEIMATE_SPEC.md v1.5</li>
    <li>AKA-ARCH-SAAS-001</li>
    <li>ui.shadcn.com new-york</li>
  </ul>
  <h2>Revision history</h2>
  <table>
    <tr><th>Rev</th><th>Date</th><th>Change</th></tr>
    <tr><td>A</td><td>2026-08-30</td><td>Initial UI and frontend architecture description.</td></tr>
  </table>
"""))

    parts.append(sheet(25, "12 Agent ingest", """
  <p>This description ships a machine form so an implementing agent reads the same source a human reads on paper.</p>
  <h2>Read order</h2>
  <ol>
    <li><code>AKA-ARCH-UI-001.ingest.json</code>: codes, ADRs, surfaces, shells, tokens, catalog, every figure as Mermaid.</li>
    <li><code>diagrams/*.mmd</code>: figure sources, MIME <code>text/vnd.mermaid</code>.</li>
    <li><code>AKA-ARCH-UI-001.AGENT.md</code>: implementation prompt.</li>
    <li>This HTML, or the PDF text layer: ingest sheets, figure atlas, and Appendix A.</li>
  </ol>
  <p>Each figure sheet names its source. Example: <code>FIG-01 · diagrams/01-surfaces.mmd</code>. Appendix A repeats the Mermaid as selectable text.</p>
"""))

    parts.append(sheet(26, "12.1 Surface codes", f"""
  <table>
    <tr><th>Code</th><th>Location</th><th>Role</th></tr>
    {surf_rows}
  </table>
  <p>Entry codes: INGEST-JSON, INGEST-PROMPT, INGEST-LLMS, FIG-01 to FIG-12, ADR-U1 to ADR-U12.</p>
""", extra="codes"))

    parts.append(sheet(27, "12.2 Token and shell codes", f"""
  <h2>Tokens</h2>
  <table>
    <tr><th>Code</th><th>Source</th><th>Role</th></tr>
    {tok_rows}
  </table>
  <h2>Shells</h2>
  <table>
    <tr><th>Code</th><th>Implementation</th><th>Surface</th></tr>
    {shell_rows}
  </table>
""", extra="codes"))

    parts.append(sheet(28, "12.3 Implementation prompt", f"""
  <p class="code-line">INGEST-PROMPT · AKA-ARCH-UI-001.AGENT.md · part 1 of 2</p>
  <pre class="mmd-src">{html_lib.escape(AGENT_PROMPT_A.strip())}</pre>
"""))
    parts.append(sheet(29, "12.4 Implementation sequence", f"""
  <p class="code-line">INGEST-PROMPT · AKA-ARCH-UI-001.AGENT.md · part 2 of 2</p>
  <pre class="mmd-src">{html_lib.escape(AGENT_PROMPT_B.strip())}</pre>
"""))

    page = 30
    for stem, code, title in FIGS:
        parts.append(fig_sheet(page, stem, code, title))
        page += 1

    for appendix in mermaid_appendix_sheets(42, load_figures()):
        parts.append(appendix)

    parts.append(f"""
<section class="sheet back" aria-label="Back cover">
  <div class="back-inner">
    <p class="kicker">BRIK64 Inc. · Delaware</p>
    <h1>AKADEMATE</h1>
    <p>{DOC_ID}</p>
    <p>Rev {REV} · {ISSUE} · en</p>
    <p>Internal · Confidential</p>
  </div>
  <div class="back-foot">
    <span>UI and frontend architecture</span>
    <span>Sheet {TOTAL} / {TOTAL}</span>
  </div>
</section>
""")
    parts.append("\n</body>\n</html>\n")
    return "".join(parts)


def main() -> None:
    figures = load_figures()
    write_sidecar(figures)
    html = build()
    OUT.write_text(html, encoding="utf-8")
    n = html.count("<section class=")
    print(f"wrote {OUT} ({len(html)} bytes, sections={n}, expected {TOTAL}, rev {REV})")


if __name__ == "__main__":
    main()
