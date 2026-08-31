---
name: akademate-architecture-description
description: "Produces official AKADEMATE printable architecture descriptions (ISO 7200 title block, ISO/IEC/IEEE 42010 views, arc42) as A4 HTML printed to PDF, with a dual human and agent ingest pack (JSON, Mermaid .mmd as selectable text, implementation prompt). This skill should be used when writing or revising AKA-ARCH PDFs, architecture atlases, Mermaid figure sheets, agent-ingestible architecture docs, editing docs/architecture/official/build_html.py, or when a sheet overflows a footer or an agent would need OCR on diagrams."
---

# AKADEMATE architecture description

Printable architecture pack for AKADEMATE. Dual audience: human on paper, agent from text. Learned from AKA-ARCH-SAAS-001 Rev A–E (2026-08-30).

Read [print-contract.md](references/print-contract.md) before writing copy or CSS. Run [verify_print_pdf.py](scripts/verify_print_pdf.py) before calling the PDF done.

## Trigger

Activate on: architecture PDF, AKA-ARCH, ISO 7200 / 42010 / arc42 print pack, Mermaid atlas, agent ingest of an architecture doc, sheet overflow into footer, "el PDF debe ser ingestible".

## Bayesian loop (MEDIUM on layout, FULL on format)

Prior: A4 sheets with `overflow: hidden` plus packed tables collide with an absolute footer (class: this session, pages 26–27 Rev D).
Evidence: `pdftotext` footer interleaved with table rows = HIGH, layout overflow.
Posterior: 90 the sheet is over budget until split. Do not shrink fonts as the first fix.
Falsifier: `pdftoppm` of the dense sheet shows a clear gap above the footer AND `verify_print_pdf.py` exits 0.
Prueba: render the dense sheets, then run the verifier.
Recommendation: split the sheet. Keep the verify script as the gate.

## Hard gates

These are not style preferences. A miss fails the pack.

1. English. Affirmative copy only. No "this document is not X". No meta ("pages 25–41 are the atlas", "A4 for iPad").
2. In the architecture description itself, never name Hetzner, OVH, NAZCAMEDIA, Traefik, or CEP branding.
3. ISO 7200 title block. ISO/IEC/IEEE 42010 viewpoints. arc42 sections 1–12. Cover sheet + back cover.
4. A4 `210mm × 297mm`. Drawing frame ~12mm. Type-area padding ~`44mm 28mm 34mm 28mm`. Header and footer `position: absolute`. Body must end above the footer.
5. One Mermaid figure per figure sheet. PNG is a rendering. Machine source is `diagrams/*.mmd` plus Appendix A as selectable preformatted text in the PDF text layer.
6. Agent pack beside the PDF: ingest JSON, AGENT.md, llms.txt. Read order: JSON, then .mmd, then AGENT.md, then HTML or PDF text layer.
7. Split overflowing sheets. Do not rely on `overflow: hidden` to "crop" tables. That clips into the footer.
8. Controlled issue: bump revision when sheet count or ingest contract changes. Keep the pack in git. Uncommitted `docs/architecture/official/` disappears on branch checkout.
9. No em dash. No literal `{placeholder}` from a non-f-string. The verifier fails any `{placeholder}` except ALLOWED_BRACES. A page with no `Sheet n / N` is FAIL.
10. Serialize Chrome: do not run mermaid-cli and headless print in parallel.

## Type-area budget (do this before packing)

Usable body height ≈ `297 − 44 − 34 = 219mm` minus h1 (~12mm).

| Block | Budget |
| --- | --- |
| Table row (9.5pt + 2.2mm pad) | ~7.5–8.5mm |
| h2 + gap | ~8mm |
| Paragraph | ~8–12mm |

If estimated height > 200mm, split now. Three code tables on one sheet overflowed Rev D sheet 27.

## Workflow

Existing pack: edit `docs/architecture/official/build_html.py`. Substitute document id and `_vX.Y.pdf`. Do not scaffold a new generator.

Requires poppler (`pdftotext`, `pdfinfo`, `pdftoppm`). Chrome: macOS path below, or `google-chrome-stable` on Linux. Commit `docs/architecture/official/` with the PDF.

```
Task progress:
- [ ] 1. Lock format (7200 + 42010 + arc42 + copy gates)
- [ ] 2. Write HTML generator; codes as data (UNIT, Q, DO, ADR, FIG, R, PLANE)
- [ ] 3. Render Mermaid PNGs (serialized mmdc)
- [ ] 4. Emit ingest.json + AGENT.md + llms.txt from the same data
- [ ] 5. Figure sheets: PNG + source path line. Appendix A: full .mmd text
- [ ] 6. Print PDF (Chrome headless, no header/footer)
- [ ] 7. verify_print_pdf.py + pdftoppm of every dense sheet (2+ tables or long pre)
- [ ] 8. Fix splits until verifier exits 0
```

### Print

```bash
python3 docs/architecture/official/build_html.py
HTML="$PWD/docs/architecture/official/AKA-ARCH-SAAS-001.html"
PDF="$PWD/docs/architecture/official/AKA-ARCH-SAAS-001_v2.0.pdf"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PDF" "file://$HTML"
python3 ~/.cursor/skills/akademate-architecture-description/scripts/verify_print_pdf.py "$PDF"
```

Mermaid:

```bash
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="docs/architecture/official/diagrams"
for f in "$DIR"/*.mmd; do
  npx -y @mermaid-js/mermaid-cli@11 -i "$f" -o "${f%.mmd}.png" -b white -s 2 \
    -c "$DIR/mermaid-config.json" -p "$DIR/puppeteer.json"
done
```

Quote emails in Mermaid (`"admin@"`). Avoid edge labels that hang the CLI (`|consent|`).

### Ingest contract

Canonical machine form is JSON, not the PNG.

Codes (keep stable): `UNIT-APP`…`UNIT-AGENTS`, `Q-*` + DLQ, `DO-*`, `ADR-C1`…`ADR-C10`, `FIG-01`…, `R0`–`R4`, `PLANE-1`/`PLANE-2`.

Implementation prompt in the PDF as selectable text (split across sheets if wrapped height > 180mm).

## Verification (DoD)

`verify_print_pdf.py` must exit 0. Then visually check `pdftoppm` of cover, identification, approvals, contents, every ingest/code sheet, one figure, one appendix, back cover.

Verifier must fail any `{placeholder}` except ALLOWED_PLACEHOLDERS (`id`, `hash`, `tenant`, `route`, `runId`, `tenantId`, `resource`). A page with no `Sheet n / N` is FAIL.

Cap HUD at 90% until verifier + renders pass. Do not call the PDF done from HTML alone.

## Session failures encoded here

| Failure | Mechanic |
| --- | --- |
| Sheets 26–27 footer collision | Packed tables + absolute footer + overflow hidden |
| Agent would OCR figures | PNG-only figure sheets |
| `{stem}` printed | Placeholder inside a non-f-string |
| Pack vanished after checkout | Official files were dirty-tree only |
| FIG-10 / FIG-11 mmdc hang | Unquoted `@`, `\|consent\|` labels, parallel Chrome |
| Identification + signatures overflow | Split 0.1 and 0.1b |
| Spanish / negative / host names in AD | Copy gates 1–2 |

## Resources

- [print-contract.md](references/print-contract.md)
- [verify_print_pdf.py](scripts/verify_print_pdf.py)
- Reference pack: `docs/architecture/official/` (AKA-ARCH-SAAS-001)
