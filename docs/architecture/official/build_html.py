#!/usr/bin/env python3
"""Build AKA-ARCH-SAAS-001.html — Cloudflare architecture description (EN)."""
from __future__ import annotations

import html as html_lib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "AKA-ARCH-SAAS-001.html"
INGEST = ROOT / "AKA-ARCH-SAAS-001.ingest.json"
TOTAL = 55
DOC_ID = "AKA-ARCH-SAAS-001"
REV = "E"
ISSUE = "2026-08-30"
LANG = "en"

FIGS = [
    ("01-dos-planos", "Figure 1", "Two planes"),
    ("02-edge-workers", "Figure 2", "Edge and seven Workers"),
    ("03-identidad-datos", "Figure 3", "Identity and tenant data"),
    ("04-d1-resolucion", "Figure 4", "D1 resolution"),
    ("05-durable-objects", "Figure 5", "Durable Objects"),
    ("06-colas-workflows", "Figure 6", "Queues, DLQ and Workflows"),
    ("07-stream", "Figure 7", "Cloudflare Stream"),
    ("08-agents-ai", "Figure 8", "Agents and AI Gateway"),
    ("09-observabilidad-secretos", "Figure 9", "Observability and secrets"),
    ("10-perimetro-cuentas", "Figure 10", "Account perimeter"),
    ("11-oauth-clientes", "Figure 11", "Tenant OAuth"),
    ("12-dos-logins", "Figure 12", "Academy identity and Access"),
    ("13-billing", "Figure 13", "Platform billing and learner payments"),
    ("14-runtime-cloud", "Figure 14", "Cloudflare runtime"),
    ("15-mapa-comprimido", "Figure 15", "Compressed system map"),
    ("16-secuencia-request", "Figure 16", "Request sequence"),
    ("17-autonomous-loop", "Figure 17", "AutonomousOps loop"),
]

UNITS = [
    ("UNIT-APP", "akademate-app", "Frontend, BFF and tenant API"),
    ("UNIT-CTRL", "akademate-control", "Platform Ops and Control API"),
    ("UNIT-INT", "akademate-integrations", "OAuth, webhooks and connectors"),
    ("UNIT-MEDIA", "akademate-media", "Uploads, R2 and Stream tokens"),
    ("UNIT-EVT", "akademate-events", "Queue consumers"),
    ("UNIT-AUTO", "akademate-automation", "Workflows, schedules and Cron"),
    ("UNIT-AGENTS", "akademate-agents", "AutonomousOps / Agents SDK"),
]

QUEUES = [
    ("Q-DOMAIN", "domain-events", "Canonical domain outbox"),
    ("Q-INT", "integrations", "Connector and webhook work"),
    ("Q-NOTIFY", "notifications", "Outbound notices"),
    ("Q-USAGE", "usage-metering", "Platform usage"),
    ("Q-MEDIA", "media", "R2 and Stream jobs"),
    ("Q-AGENT", "agent-jobs", "Agent execution"),
]

OBJECTS = [
    ("DO-TC", "TenantCoordinator", "tenant-{id}"),
    ("DO-LOCK", "IdempotencyLock", "lock-{hash}"),
    ("DO-RATE", "RateLimiter", "rl-{tenant}-{route}"),
    ("DO-PRESENCE", "PresenceRoom", "room-{id}"),
    ("DO-AGENT", "AgentSession", "agent-{runId}"),
]

ADRS = [
    ("ADR-C1", "Cloud runtime is Cloudflare Workers, D1, R2, Durable Objects, Queues, Workflows, Stream."),
    ("ADR-C2", "Seven deployment units. Domain modules compose inside those units."),
    ("ADR-C3", "TenantDataContext is the path to tenant data."),
    ("ADR-C4", "V1 D1 uses Control + shards. Per-tenant D1 is the target once dynamic attach is GA."),
    ("ADR-C5", "R2 uses prefixes, a small set of product buckets."),
    ("ADR-C6", "Queues by function with DLQ. Workflows by class, instantiated per run."),
    ("ADR-C7", "Akademate Identity for the academy. Cloudflare Access for Platform Ops."),
    ("ADR-C8", "Agents execute through Policy Engine and Control API. Models through AI Gateway."),
    ("ADR-C9", "Platform Billing (BRIK64 Stripe / Mercury) is a separate box from tenant learner payments."),
    ("ADR-C10", "Plane 2 stays at one institutional account per system."),
]

AGENT_PROMPT = """# AKA-ARCH-SAAS-001 agent implementation prompt

You are implementing AKADEMATE on Cloudflare from architecture description AKA-ARCH-SAAS-001 (BRIK64 Inc.).

## Ingest order

1. Read `AKA-ARCH-SAAS-001.ingest.json` in this folder. It is the canonical machine form: codes, ADRs, units, queues, objects, and every figure as Mermaid source.
2. Read each `diagrams/*.mmd` named in that file. PNG files are renderings of those sources.
3. Read this file for the execution contract.
4. Read `AKA-ARCH-SAAS-001.html` or the PDF text layer (sheets 12–12.5 and Appendix A) when you need the human layout.

Appendix A of the PDF holds the Mermaid as selectable text. Figure sheets name the source path on the page (example: FIG-01 · diagrams/01-dos-planos.mmd).

## Execution contract

Apply every ADR-C1 through ADR-C10.

Open tenant data only through TenantDataContext(tenantId). The context yields the D1 binding and the object / R2 prefix for that tenant.

Ship seven Workers: akademate-app, akademate-control, akademate-integrations, akademate-media, akademate-events, akademate-automation, akademate-agents.

Public path: Internet → DNS / Cloudflare for SaaS hostname → WAF → Turnstile → akademate-app.
Ops path: Cloudflare Access → akademate-control.

V1 D1: one Control D1 plus tenant shards. Binding budget about 5 000 per Worker. Shard map lives in Control D1.

R2: product buckets with tenant prefixes `tenants/{tenantId}/`.

Queues by function, each with a DLQ. Consumer akademate-events. Workflows by class, new instance per run, on akademate-automation.

Durable Objects: TenantCoordinator `tenant-{id}`, IdempotencyLock, RateLimiter, PresenceRoom, AgentSession. D1 remains the academic system of record.

Video: upload via akademate-media to Cloudflare Stream. Playback with a short-lived signed token bound to identity and tenant.

Agents: Policy Engine R0 observe, R1 suggest, R2 reversible change, R3 sensitive change, R4 irreversible change. Mutating work goes through Control API. Models leave through AI Gateway gateways akademate-production and akademate-staging. Metadata: tenantId, agentId, operation, riskClass, feature.

Identity: Akademate Identity for academy staff, teachers, learners. Cloudflare Access for Platform Ops.

Billing: BRIK64 Stripe / Mercury for the platform. Tenant learner payments in a separate box.

Plane 1 is the Cloudflare interior. Plane 2 is one institutional account set for the product.

Marketing host akademate.com and www run on the marketing Worker (OpenNext) on Cloudflare. Tenant runtime is akademate-app.

## Implementation sequence

1. Map UNIT-* to Wrangler projects and routes.
2. Create CONTROL_D1 and the first shard bindings. Implement TenantDataContext and the shard map.
3. Create R2 buckets and prefix helpers.
4. Create the six functional queues and their DLQs. Implement the outbox with the domain write.
5. Implement the five Durable Object classes.
6. Wire Stream signed playback on akademate-media.
7. Stand Akademate Identity and Access in front of the two paths.
8. Stand Policy Engine R0–R4 and AI Gateway.
9. Split Platform Billing from learner payments.
10. Emit traces, logs and Analytics Engine datasets named in section 8.4.

## Done when

Every figure in ingest.json has a matching `.mmd`. Every UNIT, Q, DO and ADR-C code is present in code or Wrangler config. Tenant isolation is enforced by TenantDataContext. Agents cannot mutate except through Control API at the stated R-class.
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
        "prompt_file": "AKA-ARCH-SAAS-001.AGENT.md",
        "html_file": "AKA-ARCH-SAAS-001.html",
        "pdf_file": "AKA-ARCH-SAAS-001_v2.0.pdf",
        "ingest_order": [
            "AKA-ARCH-SAAS-001.ingest.json",
            "diagrams/*.mmd",
            "AKA-ARCH-SAAS-001.AGENT.md",
            "AKA-ARCH-SAAS-001.html",
            "PDF text layer: sheets 12–12.5 and Appendix A",
        ],
        "figure_png": "Rendering of the matching .mmd. Machine source is the .mmd and Appendix A.",
        "codes": {
            "units": [{"id": a, "name": b, "role": c} for a, b, c in UNITS],
            "queues": [{"id": a, "name": b, "role": c} for a, b, c in QUEUES],
            "objects": [{"id": a, "class": b, "id_pattern": c} for a, b, c in OBJECTS],
            "adrs": [{"id": a, "decision": b} for a, b in ADRS],
            "risk_classes": [
                {"id": "R0", "meaning": "observe"},
                {"id": "R1", "meaning": "suggest"},
                {"id": "R2", "meaning": "reversible change"},
                {"id": "R3", "meaning": "sensitive change"},
                {"id": "R4", "meaning": "irreversible change"},
            ],
            "planes": [
                {"id": "PLANE-1", "name": "Cloudflare interior"},
                {"id": "PLANE-2", "name": "Institutional account perimeter"},
            ],
        },
        "figures": figures,
    }


def write_sidecar(figures: list[dict]) -> None:
    payload = ingest_payload(figures)
    INGEST.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (ROOT / "AKA-ARCH-SAAS-001.AGENT.md").write_text(AGENT_PROMPT.lstrip() + "\n", encoding="utf-8")
    (ROOT / "llms.txt").write_text(
        "\n".join(
            [
                f"# {DOC_ID} Rev {REV}",
                "Canonical machine ingest for AKADEMATE Cloudflare architecture.",
                "",
                "AKA-ARCH-SAAS-001.ingest.json",
                "AKA-ARCH-SAAS-001.AGENT.md",
                "AKA-ARCH-SAAS-001.html",
                "diagrams/*.mmd",
                "",
            ]
        ),
        encoding="utf-8",
    )


CSS = r"""
    :root {
      --ink: #1c1c1c;
      --muted: #5a5a5a;
      --rule: #0066CC;
      --line: #c4c4c4;
      --paper: #ffffff;
      --band: #0b1d36;
      --gutter: 25mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #cfcfcf;
      color: var(--ink);
      font-family: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif;
      font-size: 11pt;
      line-height: 1.48;
    }
    .sheet {
      width: 210mm;
      height: 297mm;
      background: var(--paper);
      margin: 10px auto;
      padding: 44mm 28mm 34mm 28mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .sheet::before {
      content: "";
      position: absolute;
      top: 12mm;
      right: 12mm;
      bottom: 12mm;
      left: 12mm;
      border: 0.7pt solid #2a2a2a;
      pointer-events: none;
    }
    .sheet:last-child { page-break-after: auto; break-after: auto; }
    .hdr, .ftr {
      position: absolute;
      left: 16mm;
      right: 16mm;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8pt;
      color: var(--muted);
      letter-spacing: 0.01em;
    }
    .hdr {
      top: 16mm;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1.25pt solid var(--rule);
      padding: 0 2mm 3mm 2mm;
    }
    .hdr strong { color: var(--ink); font-weight: 700; }
    .ftr {
      bottom: 16mm;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 0.6pt solid var(--line);
      padding: 3mm 2mm 0 2mm;
    }
    .body { min-height: 0; }
    .codes h2 { margin: 4mm 0 2mm; }
    .codes table { font-size: 9pt; margin: 0 0 3.5mm; }
    .codes th, .codes td { padding: 1.7mm 2.2mm; }
    h1 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 15pt;
      margin: 0 0 7mm;
      font-weight: 700;
      color: var(--ink);
      letter-spacing: -0.01em;
      line-height: 1.2;
    }
    h2 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      margin: 5.5mm 0 2.5mm;
      color: var(--rule);
      font-weight: 700;
    }
    p { margin: 0 0 3.2mm; }
    ul, ol { margin: 0 0 3.5mm 6mm; padding: 0; }
    li { margin-bottom: 1.4mm; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 4.5mm;
      font-size: 9.5pt;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.35;
    }
    th, td {
      border: 0.4pt solid #b0b0b0;
      padding: 2.2mm 2.4mm;
      text-align: left;
      vertical-align: top;
    }
    th { background: #eef4fb; font-weight: 700; }
    .tree {
      font-family: "Courier New", Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.4;
      white-space: pre;
      margin: 0 0 4mm;
    }
    .sign-board {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
      margin-top: 3mm;
    }
    .sign-cell {
      border: 0.5pt solid #b0b0b0;
      min-height: 38mm;
      padding: 3.5mm 4mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sign-cell.wide { grid-column: 1 / -1; }
    .sign-cell .role {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
    }
    .sign-cell .org { font-size: 8.5pt; color: var(--muted); margin-top: 0.8mm; }
    .sign-cell .line {
      border-top: 0.4pt solid #888;
      margin-top: 16mm;
      padding-top: 1.8mm;
      font-size: 8pt;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      font-family: Arial, Helvetica, sans-serif;
    }
    .label {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8pt;
      color: var(--muted);
      letter-spacing: 0.04em;
    }
    .cover { padding: 0; }
    .cover .hdr, .cover .ftr, .back .hdr, .back .ftr { display: none; }
    .cover-band {
      margin: 12mm 12mm 0 12mm;
      height: 38mm;
      background: var(--band);
      color: #fff;
      padding: 13mm 18mm 0;
    }
    .cover-band .kicker {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .cover-body {
      padding: 32mm 28mm 0;
      min-height: 100mm;
    }
    .cover h1 {
      font-size: 32pt;
      line-height: 1.08;
      margin: 0 0 5mm;
    }
    .cover .sub {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13pt;
      color: var(--rule);
      font-weight: 700;
      margin: 0 0 14mm;
    }
    .titleblock {
      position: absolute;
      left: 16mm;
      right: 16mm;
      bottom: 24mm;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
    }
    .titleblock table { margin: 0; }
    .titleblock th {
      width: 48mm;
      background: #eef4fb;
      font-weight: 700;
    }
    .toc-wrap { display: flex; gap: 10mm; }
    .toc-wrap table { width: 50%; margin: 0; }
    .toc td {
      border: none;
      border-bottom: 0.4pt dotted #ccc;
      padding: 1.05mm 0;
      font-size: 8.2pt;
    }
    .code-line {
      font-family: "Courier New", Courier, monospace;
      font-size: 8pt;
      color: var(--muted);
      margin: 0 0 2mm;
    }
    .mmd-src {
      font-family: "Courier New", Courier, monospace;
      font-size: 7pt;
      line-height: 1.22;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0 0 4mm;
      padding: 2mm 2.5mm;
      border: 0.4pt solid var(--line);
      background: #f7f8fa;
    }
    .toc .num { width: 16mm; font-weight: 700; color: var(--rule); font-family: Arial, Helvetica, sans-serif; }
    .toc .pg { width: 12mm; text-align: right; color: var(--muted); }
    .sheet.fig { display: flex; flex-direction: column; padding-bottom: 26mm; }
    .sheet.fig h1 { margin-bottom: 4mm; font-size: 13pt; }
    .fig-frame {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4mm 0 2mm;
    }
    .sheet.fig img {
      max-width: 160mm;
      max-height: 198mm;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .sheet h1 + .mmd-src { margin-top: 0; }
    code {
      font-family: "Courier New", Courier, monospace;
      font-size: 0.92em;
    }
    .back { padding: 0; background: var(--band); color: #fff; }
    .back::before { border-color: rgba(255,255,255,0.28); }
    .back-inner {
      padding: 70mm 28mm 0;
      text-align: left;
    }
    .back-inner .kicker {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      opacity: 0.8;
      margin: 0 0 8mm;
    }
    .back-inner h1 {
      color: #fff;
      font-size: 28pt;
      margin: 0 0 8mm;
    }
    .back-inner p {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      opacity: 0.9;
      margin: 0 0 2.5mm;
    }
    .back-foot {
      position: absolute;
      left: 28mm;
      right: 28mm;
      bottom: 24mm;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      opacity: 0.75;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      html, body { background: #fff; }
      .sheet {
        margin: 0;
        box-shadow: none;
        width: 210mm;
        height: 297mm;
      }
    }
    @page { size: A4; margin: 0; }
"""

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
    ("5.1", "Building blocks: Workers", 11),
    ("5.2", "Building blocks: persistence", 12),
    ("5.3", "Building blocks: objects", 13),
    ("6.1", "Runtime: request path", 14),
    ("6.2", "Runtime: asynchronous work", 15),
    ("7.1", "Deployment: edge", 16),
    ("7.2", "Deployment: provision", 17),
    ("8.1", "Identity", 18),
    ("8.2", "Media", 19),
    ("8.3", "Agents", 20),
    ("8.4", "Observability and secrets", 21),
    ("8.5", "Accounts, OAuth, billing", 22),
]

TOC_RIGHT = [
    ("9", "Architecture decisions", 23),
    ("10", "Quality requirements", 24),
    ("11", "Glossary and references", 25),
    ("12", "Agent ingest", 26),
    ("12.1", "Entry codes and planes", 27),
    ("12.2", "Workers and queues", 28),
    ("12.3", "Durable Objects", 29),
    ("12.4", "Implementation prompt", 30),
    ("12.5", "Implementation sequence", 31),
    ("Fig. 1", "Two planes", 32),
    ("Fig. 2", "Edge and seven Workers", 33),
    ("Fig. 3", "Identity and tenant data", 34),
    ("Fig. 4", "D1 resolution", 35),
    ("Fig. 5", "Durable Objects", 36),
    ("Fig. 6", "Queues, DLQ and Workflows", 37),
    ("Fig. 7", "Cloudflare Stream", 38),
    ("Fig. 8", "Agents and AI Gateway", 39),
    ("Fig. 9", "Observability and secrets", 40),
    ("Fig. 10", "Account perimeter", 41),
    ("Fig. 11", "Tenant OAuth", 42),
    ("Fig. 12", "Academy identity and Access", 43),
    ("Fig. 13", "Platform billing and learner payments", 44),
    ("Fig. 14", "Cloudflare runtime", 45),
    ("Fig. 15", "Compressed system map", 46),
    ("Fig. 16", "Request sequence", 47),
    ("Fig. 17", "AutonomousOps loop", 48),
    ("A.1", "Mermaid FIG-01 to FIG-03", 49),
    ("A.2", "Mermaid FIG-04 to FIG-06", 50),
    ("A.3", "Mermaid FIG-07 to FIG-09", 51),
    ("A.4", "Mermaid FIG-10 to FIG-12", 52),
    ("A.5", "Mermaid FIG-13 to FIG-15", 53),
    ("A.6", "Mermaid FIG-16 to FIG-17", 54),
    ("", "Back cover", 55),
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
  <title>{DOC_ID} Rev {REV} · AKADEMATE Cloudflare Architecture Description</title>
  <meta name="author" content="BRIK64 Inc." />
  <meta name="aka:doc-id" content="{DOC_ID}" />
  <meta name="aka:rev" content="{REV}" />
  <meta name="aka:ingest" content="AKA-ARCH-SAAS-001.ingest.json" />
  <meta name="aka:agent-prompt" content="AKA-ARCH-SAAS-001.AGENT.md" />
  <link rel="alternate" type="application/json" href="AKA-ARCH-SAAS-001.ingest.json" title="Machine ingest" />
  <link rel="alternate" type="text/markdown" href="AKA-ARCH-SAAS-001.AGENT.md" title="Agent implementation prompt" />
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
    <p class="sub">Cloudflare architecture description</p>
    <p>Multi-tenant academic SaaS on Cloudflare Workers, D1, R2, Durable Objects, Queues, Workflows, Stream and Agents. Canonical Core through TenantDataContext. Seven deployment units.</p>
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
    <tr><td>Next review</td><td>2026-11-30, or on material Cloudflare limit change</td></tr>
    <tr><td>Language</td><td>en (ISO 639)</td></tr>
    <tr><td>Document type</td><td>Architecture description</td></tr>
    <tr><td>Product</td><td>AKADEMATE</td></tr>
    <tr><td>System of interest</td><td>AKADEMATE Cloud SaaS on the Cloudflare account AKADEMATE</td></tr>
    <tr><td>Classification</td><td>Internal · Confidential</td></tr>
    <tr><td>Paper size</td><td>A4</td></tr>
    <tr><td>Normative sources</td><td>ISO/IEC/IEEE 42010 · ISO 7200 · arc42 · AKADEMATE Master Architecture Spec v1.2 · AKADEMATE Cloudflare-native SaaS v1.1</td></tr>
    <tr><td>Machine ingest</td><td>AKA-ARCH-SAAS-001.ingest.json · AKA-ARCH-SAAS-001.AGENT.md · diagrams/*.mmd · Appendix A</td></tr>
  </table>
"""))

    parts.append(sheet(3, "0.1b Approvals", """
  <table>
    <tr><th>Role</th><th>Organisation</th><th>Name</th><th>Date</th></tr>
    <tr><td>Creator / Foundry</td><td>BRIK64 Inc.</td><td></td><td></td></tr>
    <tr><td>Architect</td><td>AKADEMATE</td><td></td><td></td></tr>
    <tr><td>Product</td><td>AKADEMATE</td><td></td><td></td></tr>
    <tr><td>Security</td><td>AKADEMATE</td><td></td><td></td></tr>
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
      <div><div class="role">Security</div><div class="org">AKADEMATE</div></div>
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
    <tr><th>Stakeholder</th><th>Concerns</th></tr>
    <tr><td>BRIK64 Inc. foundry</td><td>Isolable product perimeter: identity, Cloudflare account, git, data, secrets, P&amp;L. Transferable asset.</td></tr>
    <tr><td>Architecture</td><td>One Core. TenantDataContext as the path to tenant data. Seven Workers. D1 shards in V1.</td></tr>
    <tr><td>Product</td><td>Academy workflows (Person, Enrollment, Campus P1, Finance) unchanged by serverless runtime.</td></tr>
    <tr><td>Security</td><td>Akademate Identity for the academy. Cloudflare Access for Platform Ops. Deny by default. R0–R4 on agents.</td></tr>
    <tr><td>Platform engineering</td><td>Wrangler bindings, D1 mapping, Queues, Durable Objects, Stream, AI Gateway.</td></tr>
    <tr><td>Tenant academy</td><td>Own Workspace, Zoom, Microsoft 365 and payment provider. Consent to AKADEMATE OAuth apps.</td></tr>
    <tr><td>Learner / teacher</td><td>Campus session, signed Stream playback, RBAC + ABAC inside the tenant.</td></tr>
  </table>
  <h2>Quality goals</h2>
  <table>
    <tr><th>Goal</th><th>Scenario</th></tr>
    <tr><td>Tenant isolation</td><td>A request opens TenantDataContext for one tenantId. Rows live in Control D1 mapping plus shard or tenant D1.</td></tr>
    <tr><td>Scale 10 to 10 000</td><td>Worker count stays in the order 7–12. Volume moves into D1 shards, queue shards and Durable Object IDs.</td></tr>
    <tr><td>Least privilege</td><td>Institutional identities @akademate.com. Short-lived credentials. Agents call Control API.</td></tr>
    <tr><td>Operability</td><td>Logs, traces, metrics, Analytics Engine and Platform Audit on the seven Workers. External synthetic monitor.</td></tr>
  </table>
"""))

    parts.append(sheet(5, "0.3 Viewpoints", """
  <p>Each concern is framed by a viewpoint. Each viewpoint has one view. Models of those views appear as Figures 1–17.</p>
  <table>
    <tr><th>Viewpoint</th><th>Stakeholders</th><th>Language</th><th>View / figure</th></tr>
    <tr><td>Context</td><td>Foundry, architecture</td><td>Context diagram</td><td>Figure 1, Figure 10, Figure 15</td></tr>
    <tr><td>Container</td><td>Engineering</td><td>Deployment units</td><td>Figure 2</td></tr>
    <tr><td>Data</td><td>Architecture, security</td><td>Store resolution</td><td>Figure 3, Figure 4, Figure 14</td></tr>
    <tr><td>Concurrency</td><td>Engineering</td><td>Object and queue graph</td><td>Figure 5, Figure 6</td></tr>
    <tr><td>Runtime</td><td>Engineering</td><td>Sequence / loop</td><td>Figure 16, Figure 17</td></tr>
    <tr><td>Media</td><td>Product, campus</td><td>Stream path</td><td>Figure 7</td></tr>
    <tr><td>Agents</td><td>Security, architecture</td><td>Policy chain</td><td>Figure 8</td></tr>
    <tr><td>Operations</td><td>SRE, security</td><td>Logs and vaults</td><td>Figure 9</td></tr>
    <tr><td>Identity</td><td>Security, tenant</td><td>OAuth and login</td><td>Figure 11, Figure 12</td></tr>
    <tr><td>Commerce</td><td>Finance, product</td><td>Two cash boxes</td><td>Figure 13</td></tr>
  </table>
"""))

    parts.append(sheet(6, "0.4 Contents", f"""
  <div class="toc-wrap">
    <table class="toc">{toc_rows(TOC_LEFT)}</table>
    <table class="toc">{toc_rows(TOC_RIGHT)}</table>
  </div>
"""))

    parts.append(sheet(7, "1 Introduction and goals", """
  <p>AKADEMATE is a multi-tenant SaaS for academies and schools. The academic domain (Person, Enrollment, Campus P1, Finance) is defined in the Master Architecture Spec. This architecture description covers runtime, data, account perimeter and scale on Cloudflare.</p>
  <h2>1.1 Requirements</h2>
  <ul>
    <li>One product perimeter: DNS, Cloudflare account, git, data, secrets, CI, P&amp;L.</li>
    <li>Hostnames akademate.com, app, api, campus, ops, plus tenant custom hostnames via Cloudflare for SaaS.</li>
    <li>Academy actors authenticate with Akademate Identity. AKADEMATE staff authenticate with Google Workspace and Cloudflare Access.</li>
    <li>Tenant data reached only through TenantDataContext.</li>
    <li>Same design from 10 to 10 000 tenants.</li>
  </ul>
  <h2>1.2 System of interest</h2>
  <p>Cloudflare account AKADEMATE. Workers Paid. D1 Control plus tenant shards. R2 prefixes. Durable Objects. Queues and Workflows. Stream. Agents SDK and AI Gateway.</p>
"""))

    parts.append(sheet(8, "2 Constraints", """
  <table>
    <tr><th>Source</th><th>Constraint</th></tr>
    <tr><td>Workers Paid (2026-08-29)</td><td>~5 000 bindings per Worker script. 50 000 D1 databases per account. 10 GB per database. ~1 TB aggregate D1 per account initially.</td></tr>
    <tr><td>D1</td><td>SQLite dialect. Single-threaded database. V1 uses CONTROL_D1 + TENANT_SHARD_00…N with tenantId → shardId mapping.</td></tr>
    <tr><td>Durable Objects</td><td>Unlimited objects, ≤500 classes, ≤10 GB SQLite per object, single-threaded, ~1 000 req/s soft limit per object.</td></tr>
    <tr><td>Queues</td><td>≤10 000 queues per account, ≤5 000 messages/s per queue, one active consumer, at-least-once.</td></tr>
    <tr><td>Cloudflare for SaaS</td><td>100 hostnames included; USD 0.10 per additional hostname on documented standard plans.</td></tr>
    <tr><td>Stream</td><td>Billed on stored minutes plus delivered minutes. Quotas by AKADEMATE plan.</td></tr>
    <tr><td>Governance</td><td>R3/R4 operations follow PREVIEW → VALIDATE → APPROVE → COMMIT → VERIFY. R4 requires a human signature.</td></tr>
    <tr><td>Beta products</td><td>Critical path uses GA capabilities. Secrets Store and Email Sending enter with a GA fallback.</td></tr>
  </table>
"""))

    parts.append(sheet(9, "3 Context and scope", """
  <p>Two planes. Plane 1 runs the SaaS. Plane 2 holds institutional accounts. Plane 1 scales with academies. Plane 2 stays constant. Figure 1.</p>
  <table>
    <tr><th>Plane 1. Cloudflare interior</th><th>Plane 2. External perimeter</th></tr>
    <tr>
      <td>Edge, Workers, D1, R2, Durable Objects, queues, workflows, Stream, Agents, logs.</td>
      <td>Workspace, GCP, GitHub, 1Password, Entra, Zoom, Stripe BRIK64, Mercury, AI providers.</td>
    </tr>
    <tr>
      <td>Grows with D1, objects, events, video, hostnames, AI use.</td>
      <td>One Workspace, one GCP org, one Cloudflare account, one GitHub, one legal Stripe.</td>
    </tr>
  </table>
  <p>Cloudflare for SaaS terminates campus.cliente.com. Access terminates Platform Ops, staging and internal tools.</p>
  <div class="tree">BRIK64 Inc. (Delaware)
  corporate: legal, Stripe / Mercury
  +-- AKADEMATE
  +-- other BRIK64 products</div>
"""))

    parts.append(sheet(10, "4 Solution strategy", """
  <ol>
    <li>Canonical Core. Cloud persistence through D1TenantDataStore and TenantDataContext.</li>
    <li>Seven deployment units. Domain modules (Students, Courses, Campus, Finance, CRM, …) live inside those units.</li>
    <li>V1 data: Control D1 + shard pool (N well below 5 000 bindings). Target: one D1 per tenant when dynamic attach is GA.</li>
    <li>R2 prefixes tenant/&#123;tenantId&#125;/… on a small set of product buckets.</li>
    <li>Queues by function, each with a DLQ. Workflows instantiated per run.</li>
    <li>Durable Objects keyed by tenant, session, hub, lock or agent.</li>
    <li>Video on Cloudflare Stream with signed playback tokens from akademate-media.</li>
    <li>Agents: Policy Engine R0–R4 → Control API → Application Service → TenantDataContext. Models through AI Gateway.</li>
    <li>Institutional identities @akademate.com. Break-glass dual control, audit, rotate after use.</li>
  </ol>
"""))

    parts.append(sheet(11, "5.1 Building blocks: Workers", """
  <p>Figure 2. Application Worker count stays in the order 8–12 at 10 000 tenants.</p>
  <table>
    <tr><th>Worker</th><th>Responsibility</th></tr>
    <tr><td>akademate-app</td><td>Frontend, BFF and tenant API</td></tr>
    <tr><td>akademate-control</td><td>Platform Ops and Control API</td></tr>
    <tr><td>akademate-integrations</td><td>OAuth, webhooks and connectors</td></tr>
    <tr><td>akademate-media</td><td>Uploads, R2 and Stream tokens</td></tr>
    <tr><td>akademate-events</td><td>Queue consumers</td></tr>
    <tr><td>akademate-automation</td><td>Workflows, schedules and Cron</td></tr>
    <tr><td>akademate-agents</td><td>AutonomousOps / Agents SDK</td></tr>
  </table>
  <p>Public path: Internet → DNS / SaaS hostname → WAF → Turnstile → akademate-app. Ops path: Access → akademate-control.</p>
"""))

    parts.append(sheet(12, "5.2 Building blocks: persistence", """
  <p>Control D1 holds platform metadata: tenant, plan, mapping, audit, agents. Academic data lives in shards; the target is one D1 per tenant. Figures 3, 4 and 14.</p>
  <table>
    <tr><th>Mode</th><th>Design</th></tr>
    <tr><td>V1</td><td>CONTROL_D1 + TENANT_SHARD_00…N. Mapping tenantId → shardId. tenant_id column inside the shard.</td></tr>
    <tr><td>Target</td><td>Provisioned D1 per tenant through the attach API once GA and verified.</td></tr>
  </table>
  <p>Preventive split at ~7–8 GB per tenant: core / academic / finance / archive. Account aggregate near 1 TB: request a limit lift from Cloudflare. Isolation is database or shard plus server-side policy.</p>
"""))

    parts.append(sheet(13, "5.3 Building blocks: objects", """
  <p>R2 product buckets with logical prefixes:</p>
  <div class="tree">akademate-prod-private
akademate-prod-exports
akademate-prod-system
akademate-staging-*

tenant/{tenantId}/students/...
tenant/{tenantId}/documents/...
tenant/{tenantId}/assignments/...</div>
  <p>Order of magnitude: 3 GB of documents per tenant → 10 tenants 30 GB; 10 000 tenants 30 TB. Documents, exports, backups and artefacts on R2. Video on Stream.</p>
  <h2>Durable Objects</h2>
  <table>
    <tr><th>Class</th><th>Key</th><th>Use</th></tr>
    <tr><td>TenantCoordinator</td><td>tenant-&#123;id&#125;</td><td>Per-academy coordination</td></tr>
    <tr><td>LiveClassSession</td><td>session-&#123;id&#125;</td><td>Live class / presence</td></tr>
    <tr><td>RealtimeHub</td><td>hub-&#123;id&#125;</td><td>Realtime fan-out</td></tr>
    <tr><td>CriticalLock</td><td>lock-&#123;resource&#125;</td><td>Short exclusions</td></tr>
    <tr><td>AgentRuntime</td><td>agent-&#123;id&#125;</td><td>Durable agent runtime</td></tr>
  </table>
  <p>10 000 tenants imply ~10 000 TenantCoordinator instances plus ephemeral objects. D1 remains the academic system of record. Figure 5.</p>
"""))

    parts.append(sheet(14, "6.1 Runtime: request path", """
  <p>Figure 16.</p>
  <ol>
    <li>Client HTTPS to akademate-app.</li>
    <li>Identity from session or token. Tenant from hostname or claim. Client-supplied tenantId is not authority.</li>
    <li>Authorization: RBAC + ABAC + ResourcePolicy.</li>
    <li>TenantDataContext.open(tenantId).</li>
    <li>Control D1 returns the store mapping.</li>
    <li>Query on tenant D1 or shard, with tenant_id.</li>
    <li>Domain operation. Outbox in the same transaction or batch.</li>
    <li>Response.</li>
  </ol>
"""))

    parts.append(sheet(15, "6.2 Runtime: asynchronous work", """
  <p>Queues by function: domain-events, integrations, notifications, usage-metering, media, agent-jobs, each with a DLQ. Consumer: akademate-events. Figure 6.</p>
  <p>At volume: domain-events-0…3 with hash(tenantId) modulo 4.</p>
  <p>Workflow classes deployed once: provisioning, offboarding, import, export, GDPR, billing, recording ingest, integration sync, incident. Instantiated per run. A step may wait on wall-clock. Active CPU 30 s default, configurable to five minutes on Paid.</p>
"""))

    parts.append(sheet(16, "7.1 Deployment: edge", """
  <p>Product hostnames: akademate.com, app.akademate.com, api.akademate.com, campus.akademate.com, ops.akademate.com, and tenant custom hostnames. Figure 2.</p>
  <table>
    <tr><th>Layer</th><th>Function</th></tr>
    <tr><td>DNS</td><td>Zone akademate.com in the AKADEMATE Cloudflare account</td></tr>
    <tr><td>Cloudflare for SaaS</td><td>TLS and tenant hostname</td></tr>
    <tr><td>WAF + DDoS + rate limit</td><td>Common edge for app and integrations</td></tr>
    <tr><td>Turnstile</td><td>Abuse on login and leads, with authentication</td></tr>
    <tr><td>Cloudflare Access</td><td>AKADEMATE staff on Platform Ops, staging and internal tools</td></tr>
  </table>
  <p>akademate.com and www run on the marketing Worker (OpenNext) on Cloudflare. Tenant runtime is akademate-app on the same platform.</p>
"""))

    parts.append(sheet(17, "7.2 Deployment: provision", """
  <ol>
    <li>Create or isolate Cloudflare account AKADEMATE and zone akademate.com.</li>
    <li>Bind the seven Workers to Control D1, shards, R2, Queues and Durable Objects.</li>
    <li>Enable Cloudflare for SaaS and Access for Platform Ops.</li>
    <li>Publish akademate-app, akademate-control and the remaining units with Wrangler / OpenNext by surface.</li>
    <li>Enable Stream, AI Gateway and Analytics Engine with tenant metadata.</li>
    <li>Verify health, Turnstile, signed playback and a synthetic transaction.</li>
  </ol>
  <p>PHASE 0 of the execution programme: audit schema and TenantDataContext mapping. Cutover by capability, with evidence in the ledger.</p>
  <h2>Scale matrix</h2>
  <table>
    <tr><th>Resource</th><th>10</th><th>100</th><th>1 000</th><th>10 000</th></tr>
    <tr><td>App Workers</td><td>~7</td><td>~7</td><td>7–9</td><td>8–12</td></tr>
    <tr><td>D1 Control</td><td>1</td><td>1</td><td>1</td><td>1</td></tr>
    <tr><td>D1 tenant / shards</td><td>10 / pool</td><td>100 / pool</td><td>shards</td><td>shards + 1 TB lift</td></tr>
    <tr><td>R2 prod buckets</td><td>3–4</td><td>3–4</td><td>3–5</td><td>3–8</td></tr>
    <tr><td>Queues + DLQ</td><td>6+6</td><td>6+6</td><td>6–10</td><td>12–24 shard</td></tr>
    <tr><td>TenantCoordinator DO</td><td>~10</td><td>~100</td><td>~1 000</td><td>~10 000</td></tr>
    <tr><td>Custom hostnames</td><td>0–10</td><td>~100</td><td>~1 000</td><td>~10 000+</td></tr>
    <tr><td>Admin accounts (plane 2)</td><td>constant</td><td>constant</td><td>constant</td><td>constant</td></tr>
  </table>
"""))

    parts.append(sheet(18, "8.1 Identity", """
  <table>
    <tr><th>Actor</th><th>Identity</th><th>Authorization</th></tr>
    <tr><td>Learner / teacher / academy admin</td><td>Akademate Identity (campus_session or equivalent)</td><td>RBAC + ABAC + tenant ResourcePolicy</td></tr>
    <tr><td>AKADEMATE staff</td><td>Google Workspace @akademate.com + Cloudflare Access</td><td>Akademate authorization on Control API</td></tr>
    <tr><td>Agent</td><td>AgentIdentity + AgentGrant (Master Spec §18)</td><td>R0–R4 via Policy Engine</td></tr>
  </table>
  <p>Campus P1: campus session distinct from staff AuthShell. GlobalIdentity indexes people across tenants. TenantMembership binds identity to tenant. Capability policies close features by plan. Figures 3 and 12.</p>
"""))

    parts.append(sheet(19, "8.2 Media", """
  <p>Teacher or admin uploads to akademate-media. The Worker publishes to Cloudflare Stream. The learner plays with a short-lived signed token bound to identity and tenant. Figure 7.</p>
  <p>Meet, Zoom and Teams recordings enter Stream through recording ingest. Dimension stored minutes plus delivered minutes. Quotas by AKADEMATE plan.</p>
"""))

    parts.append(sheet(20, "8.3 Agents", """
  <p>Event → Agent Runtime (Durable Object) → Policy Engine R0–R4 → Control API / MCP → Application Service → Domain / TenantDataContext. Figures 8 and 17.</p>
  <p>AI Gateway: akademate-production and akademate-staging. Metadata: tenantId, agentId, operation, riskClass, feature. Per-tenant quota, per-agent budget, emergency cap. Workers AI and frontier models leave through the Gateway.</p>
  <p>Heavy code (coding agent): Cloudflare Containers, isolated workspace, scale to zero, billed while active.</p>
  <p>Loop: Observe → Interpret → Plan → Execute → Verify → Record → Learn.</p>
"""))

    parts.append(sheet(21, "8.4 Observability and secrets", """
  <p>Workers Logs, Traces and Metrics on the seven Workers. Analytics Engine datasets: platform_usage, tenant_usage, platform_health, business_events, ai_usage, media_usage. Platform Audit on akademate-control. Figure 9.</p>
  <p>External monitor (Better Stack or equivalent) against akademate.com, app, api, ops, /auth health and one synthetic transaction.</p>
  <p>1Password is the human root of truth. Runtime GA: Workers Secrets. Secrets Store (open beta) enters gradually. Vaults AKADEMATE: ROOT, CLOUDFLARE, GITHUB, GOOGLE, MICROSOFT, ZOOM, AI, PAYMENTS, PROD, DR.</p>
  <p>EmailProvider with CloudflareEmailProvider and ExternalEmailProvider. Inbound Routing available. Outbound Sending in public beta; verify quotas at contract.</p>
"""))

    parts.append(sheet(22, "8.5 Accounts, OAuth, billing", """
  <table>
    <tr><th>System</th><th>Count at 10–10 000 tenants</th></tr>
    <tr><td>Google Workspace AKADEMATE</td><td>1 (employees)</td></tr>
    <tr><td>GCP Organization AKADEMATE</td><td>1</td></tr>
    <tr><td>Cloudflare account AKADEMATE</td><td>1</td></tr>
    <tr><td>GitHub Organization</td><td>1</td></tr>
    <tr><td>1Password</td><td>1 (separate vaults)</td></tr>
    <tr><td>Entra / Zoom OAuth apps</td><td>~2 environments each</td></tr>
    <tr><td>Stripe legal BRIK64</td><td>1</td></tr>
    <tr><td>Mercury</td><td>1 corporate</td></tr>
  </table>
  <p>GCP covers OAuth, Calendar, Meet and Drive. Tenant consents to AKADEMATE OAuth apps. Credentials stay per academy. Figures 10–12.</p>
  <table>
    <tr><th>Box</th><th>Flow</th></tr>
    <tr><td>Platform Billing</td><td>BRIK64 Inc. → Stripe (AKADEMATE products) → Mercury</td></tr>
    <tr><td>Learner payments</td><td>Tenant → tenant Stripe / Redsys / provider → learners</td></tr>
  </table>
  <p>Each box has its merchant of record. Figure 13. Cloudflare for Startups in the name of BRIK64 Inc. is a human step (B-050).</p>
"""))

    parts.append(sheet(23, "9 Architecture decisions", """
  <table>
    <tr><th>ID</th><th>Decision</th></tr>
    <tr><td>ADR-C1</td><td>Cloud runtime is Cloudflare Workers, D1, R2, Durable Objects, Queues, Workflows, Stream.</td></tr>
    <tr><td>ADR-C2</td><td>Seven deployment units. Domain modules compose inside those units.</td></tr>
    <tr><td>ADR-C3</td><td>TenantDataContext is the path to tenant data.</td></tr>
    <tr><td>ADR-C4</td><td>V1 D1 uses Control + shards. Per-tenant D1 is the target once dynamic attach is GA.</td></tr>
    <tr><td>ADR-C5</td><td>R2 uses prefixes, a small set of product buckets.</td></tr>
    <tr><td>ADR-C6</td><td>Queues by function with DLQ. Workflows by class, instantiated per run.</td></tr>
    <tr><td>ADR-C7</td><td>Akademate Identity for the academy. Cloudflare Access for Platform Ops.</td></tr>
    <tr><td>ADR-C8</td><td>Agents execute through Policy Engine and Control API. Models through AI Gateway.</td></tr>
    <tr><td>ADR-C9</td><td>Platform Billing (BRIK64 Stripe / Mercury) is a separate box from tenant learner payments.</td></tr>
    <tr><td>ADR-C10</td><td>Plane 2 stays at one institutional account per system.</td></tr>
  </table>
"""))

    parts.append(sheet(24, "10 Quality requirements", """
  <table>
    <tr><th>Attribute</th><th>Scenario</th></tr>
    <tr><td>Isolation</td><td>Given two tenants, a query under TenantDataContext A returns only A rows.</td></tr>
    <tr><td>Availability</td><td>Edge, Workers and Stream remain the serving path. External monitor alerts on health failure.</td></tr>
    <tr><td>Integrity</td><td>Outbox committed with the domain write. DLQ holds failed consumers.</td></tr>
    <tr><td>Confidentiality</td><td>Signed Stream tokens. Workers Secrets from 1Password. Access on ops hostnames.</td></tr>
    <tr><td>Scalability</td><td>10 000 tenants: shard D1 and high-volume queues; split a tenant near 10 GB; request D1 aggregate lift.</td></tr>
    <tr><td>Operability</td><td>Analytics Engine datasets and Platform Audit identify tenant, Worker and risk class.</td></tr>
    <tr><td>Evolvability</td><td>Core stays canonical. Capability cutover with ledger evidence.</td></tr>
  </table>
"""))

    parts.append(sheet(25, "11 Glossary and references", """
  <table>
    <tr><th>Term</th><th>Definition</th></tr>
    <tr><td>TenantDataContext</td><td>Opened with tenantId. Yields the D1 binding and object prefix for that tenant.</td></tr>
    <tr><td>Control D1</td><td>Platform metadata database: tenants, plans, shard map, audit, agents.</td></tr>
    <tr><td>Shard</td><td>Shared D1 holding many tenants, filtered by tenant_id. V1 isolation unit.</td></tr>
    <tr><td>Plane 1</td><td>Cloudflare interior: compute, data, async, media, agents.</td></tr>
    <tr><td>Plane 2</td><td>Institutional accounts of the product.</td></tr>
    <tr><td>R0–R4</td><td>Agent autonomy: observe, suggest, reversible change, sensitive change, irreversible change.</td></tr>
  </table>
  <h2>References</h2>
  <ul>
    <li>ISO/IEC/IEEE 42010:2022, Architecture description</li>
    <li>ISO 7200:2004, Data fields in title blocks and document headers</li>
    <li>arc42 template, sections 1–12</li>
    <li>Clements et al., Documenting Software Architectures: Views and Beyond</li>
    <li>docs/specs/AKADEMATE_MASTER_ARCHITECTURE_SPEC.md v1.2</li>
    <li>docs/specs/AKADEMATE_CLOUDFLARE_NATIVE_SAAS.md v1.1</li>
    <li>Cloudflare product limits, consulted 2026-08-29</li>
  </ul>
  <h2>Revision history</h2>
  <table>
    <tr><th>Rev</th><th>Date</th><th>Change</th></tr>
    <tr><td>A</td><td>2026-08-30</td><td>Initial architecture description.</td></tr>
    <tr><td>B</td><td>2026-08-30</td><td>English. ISO 7200 identification. arc42 + 42010 views. Type-area margins.</td></tr>
    <tr><td>C</td><td>2026-08-30</td><td>Cover and back cover. Approvals on a dedicated sheet.</td></tr>
    <tr><td>D</td><td>2026-08-30</td><td>Agent ingest: machine codes, implementation prompt, Mermaid source in Appendix A.</td></tr>
    <tr><td>E</td><td>2026-08-30</td><td>Split agent-ingest and machine-code sheets so tables sit above the footer.</td></tr>
  </table>
"""))

    unit_rows = "\n".join(
        f"<tr><td>{a}</td><td><code>{b}</code></td><td>{c}</td></tr>" for a, b, c in UNITS
    )
    queue_rows = "\n".join(
        f"<tr><td>{a}</td><td><code>{b}</code></td><td>{c}</td></tr>" for a, b, c in QUEUES
    )
    object_rows = "\n".join(
        f"<tr><td>{a}</td><td><code>{b}</code></td><td><code>{c}</code></td></tr>" for a, b, c in OBJECTS
    )
    parts.append(sheet(26, "12 Agent ingest", """
  <p>This architecture description ships a machine form so an implementing agent reads the same source a human reads on paper.</p>
  <h2>Read order</h2>
  <ol>
    <li><code>AKA-ARCH-SAAS-001.ingest.json</code>: codes, ADRs, units, queues, objects, every figure as Mermaid.</li>
    <li><code>diagrams/*.mmd</code>: figure sources, MIME <code>text/vnd.mermaid</code>.</li>
    <li><code>AKA-ARCH-SAAS-001.AGENT.md</code>: implementation prompt and done-when checks.</li>
    <li>This HTML, or the PDF text layer: sheets 12 to 12.5 and Appendix A.</li>
  </ol>
  <p>Each figure sheet names its source on the page. Example: <code>FIG-01 · diagrams/01-dos-planos.mmd</code>. The PNG is a rendering of that file. Appendix A repeats the Mermaid as selectable text in this PDF.</p>
  <p>Codes continue on 12.1 (entry and planes), 12.2 (Workers and queues), 12.3 (Durable Objects). The implementation prompt is 12.4 and 12.5.</p>
"""))
    parts.append(sheet(27, "12.1 Entry codes and planes", """
  <h2>Entry codes</h2>
  <table>
    <tr><th>Code</th><th>Artifact</th></tr>
    <tr><td>INGEST-JSON</td><td>AKA-ARCH-SAAS-001.ingest.json</td></tr>
    <tr><td>INGEST-PROMPT</td><td>AKA-ARCH-SAAS-001.AGENT.md</td></tr>
    <tr><td>INGEST-LLMS</td><td>llms.txt</td></tr>
    <tr><td>FIG-01 … FIG-17</td><td>diagrams/01-*.mmd … 17-*.mmd</td></tr>
    <tr><td>UNIT-APP … UNIT-AGENTS</td><td>Seven Workers</td></tr>
    <tr><td>ADR-C1 … ADR-C10</td><td>Architecture decisions, section 9</td></tr>
  </table>
  <h2>Planes and risk classes</h2>
  <table>
    <tr><th>Code</th><th>Meaning</th></tr>
    <tr><td>PLANE-1</td><td>Cloudflare interior: compute, data, async, media, agents</td></tr>
    <tr><td>PLANE-2</td><td>Institutional account perimeter</td></tr>
    <tr><td>R0</td><td>observe</td></tr>
    <tr><td>R1</td><td>suggest</td></tr>
    <tr><td>R2</td><td>reversible change</td></tr>
    <tr><td>R3</td><td>sensitive change</td></tr>
    <tr><td>R4</td><td>irreversible change</td></tr>
  </table>
""", extra="codes"))
    parts.append(sheet(28, "12.2 Workers and queues", f"""
  <h2>Workers</h2>
  <table>
    <tr><th>Code</th><th>Unit</th><th>Role</th></tr>
    {unit_rows}
  </table>
  <h2>Queues</h2>
  <p>Each queue has a companion DLQ. Consumer: <code>akademate-events</code>.</p>
  <table>
    <tr><th>Code</th><th>Queue</th><th>Role</th></tr>
    {queue_rows}
  </table>
""", extra="codes"))
    parts.append(sheet(29, "12.3 Durable Objects", f"""
  <p>D1 remains the academic system of record. Object IDs follow the patterns below.</p>
  <table>
    <tr><th>Code</th><th>Class</th><th>ID pattern</th></tr>
    {object_rows}
  </table>
""", extra="codes"))
    parts.append(sheet(30, "12.4 Implementation prompt", f"""
  <p class="code-line">INGEST-PROMPT · AKA-ARCH-SAAS-001.AGENT.md · part 1 of 2</p>
  <pre class="mmd-src">{html_lib.escape(AGENT_PROMPT_A.strip())}</pre>
"""))
    parts.append(sheet(31, "12.5 Implementation sequence", f"""
  <p class="code-line">INGEST-PROMPT · AKA-ARCH-SAAS-001.AGENT.md · part 2 of 2</p>
  <pre class="mmd-src">{html_lib.escape(AGENT_PROMPT_B.strip())}</pre>
"""))

    page = 32
    for stem, code, title in FIGS:
        parts.append(fig_sheet(page, stem, code, title))
        page += 1

    for appendix in mermaid_appendix_sheets(49, load_figures()):
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
    <span>Architecture description</span>
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
    print(f"wrote {OUT} ({len(html)} bytes, {TOTAL} sheets, rev {REV})")
    print(f"wrote {INGEST.name}, AKA-ARCH-SAAS-001.AGENT.md, llms.txt")


if __name__ == "__main__":
    main()
