# AKA-ARCH-UI-001

Legal owner: **BRIK64 Inc. (Delaware)**  
Product: **AKADEMATE**  
Identification: `AKA-ARCH-UI-001` · Rev **A** · Issue **2026-08-30** · Language **en**  
Type: architecture description (ISO/IEC/IEEE 42010, ISO 7200, arc42)

Companion: [AKA-ARCH-SAAS-001](../official/README.md) (Cloudflare runtime).

## Files

| File | Role |
| --- | --- |
| [AKA-ARCH-UI-001_v1.0.pdf](./AKA-ARCH-UI-001_v1.0.pdf) | Controlled issue |
| [AKA-ARCH-UI-001.html](./AKA-ARCH-UI-001.html) | Print source |
| [AKA-ARCH-UI-001.ingest.json](./AKA-ARCH-UI-001.ingest.json) | Canonical machine ingest |
| [AKA-ARCH-UI-001.AGENT.md](./AKA-ARCH-UI-001.AGENT.md) | Implementation prompt |
| [llms.txt](./llms.txt) | Entry index |
| [diagrams/](./diagrams/) | Figure sources (`*.mmd`) and PNG renderings |

46 sheets. Agent read order: ingest.json → `diagrams/*.mmd` → AGENT.md → HTML/PDF.

## Regenerate

```bash
python3 docs/architecture/ui/build_html.py

export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="docs/architecture/ui/diagrams"
for f in "$DIR"/*.mmd; do
  npx -y @mermaid-js/mermaid-cli@11 -i "$f" -o "${f%.mmd}.png" -b white -s 2 \
    -c "$DIR/mermaid-config.json" -p "$DIR/puppeteer.json"
done

HTML="docs/architecture/ui/AKA-ARCH-UI-001.html"
PDF="docs/architecture/ui/AKA-ARCH-UI-001_v1.0.pdf"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PDF" "file://$PWD/$HTML"

python3 ~/.cursor/skills/akademate-architecture-description/scripts/verify_print_pdf.py "$PDF" \
  --expect-pages 46 \
  --needles "flowchart TB,SURF-DASH,ADR-U1,INGEST-JSON,You are implementing AKADEMATE UI,CAT-SHADCN,TenantBranding"
```
