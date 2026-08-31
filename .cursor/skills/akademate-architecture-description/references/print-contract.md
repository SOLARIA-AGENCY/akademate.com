# Print contract (AKADEMATE architecture description)

Load this after SKILL.md when writing copy, CSS, or sheet maps.

## Normative shape

- ISO 7200: identification number, owner, revision, date of issue, language, classification, sheet n / N.
- ISO/IEC/IEEE 42010: stakeholders, concerns, viewpoints, views. Name viewpoints (context, functional, runtime, deployment, security).
- arc42: sections 1–12 (introduction, constraints, context, strategy, building blocks, runtime, deployment, concepts, decisions, quality, risks/glossary). Section 12 in AKA-ARCH-SAAS-001 is agent ingest.
- Cover: product name, document type, compact title block. Back cover: id, rev, classification, sheet N/N.

## Copy

English. Affirmative. Specific (Workers, D1, R2, TenantDataContext). Sentence-case headings.

Banned in the architecture description body: Hetzner, OVH, NAZCAMEDIA, Traefik, CEP brand, em dash, "not just X but Y", meta layout talk.

Public marketing origin (`akademate.com` = Cloudflare Worker) belongs in ops rules, not in this AD unless the AD is explicitly about the marketing Worker.

## CSS / sheet

```
.sheet { width: 210mm; height: 297mm; padding: 44mm 28mm 34mm 28mm;
         position: relative; overflow: hidden; page-break-after: always; }
.sheet::before { /* 12mm frame */ }
.hdr { position: absolute; top: 16mm; }
.ftr { position: absolute; bottom: 16mm; }
```

`overflow: hidden` hides mistakes. Detect them with `pdftotext` (footer interleaved with body) and `pdftoppm`. Fix by splitting sheets.

Palatino body ~11pt. Arial tables. Brand rule `#0066CC`.

## Dual ingest

| Artifact | Role |
| --- | --- |
| `AKA-ARCH-*.html` | Print source |
| `AKA-ARCH-*_vX.Y.pdf` | Controlled issue |
| `AKA-ARCH-*.ingest.json` | Canonical machine form |
| `AKA-ARCH-*.AGENT.md` | Implementation prompt |
| `llms.txt` | Entry index |
| `diagrams/*.mmd` | Figure source (`text/vnd.mermaid`) |
| `diagrams/*.png` | Rendering of the matching `.mmd` |

Figure sheet line: `FIG-nn · diagrams/{real-stem}.mmd · text/vnd.mermaid`.

Appendix A: full Mermaid in `<pre>`, grouped ~2–3 figures per sheet after checking line count (FIG-02 was 34 lines).

## Chrome / mermaid-cli

Serialize. `PUPPETEER_EXECUTABLE_PATH` to Google Chrome. Quote `@` in node IDs. Drop `|label|` on edges if mmdc times out.

## Git

Commit `docs/architecture/official/` with the PDF. Dirty-tree-only packs vanish on checkout (session 2026-08-30).
