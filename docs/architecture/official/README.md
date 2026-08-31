# AKA-ARCH-SAAS-001

Legal owner: **BRIK64 Inc. (Delaware)**  
Product: **AKADEMATE**  
Identification: `AKA-ARCH-SAAS-001` · Rev **E** · Issue **2026-08-30** · Language **en**  
Type: architecture description (ISO/IEC/IEEE 42010, ISO 7200 title block, arc42 sections)

## Files

| File | Role |
| --- | --- |
| [AKA-ARCH-SAAS-001_v2.0.pdf](./AKA-ARCH-SAAS-001_v2.0.pdf) | Controlled issue (text layer includes Appendix A Mermaid) |
| [AKA-ARCH-SAAS-001.html](./AKA-ARCH-SAAS-001.html) | Print source |
| [AKA-ARCH-SAAS-001.ingest.json](./AKA-ARCH-SAAS-001.ingest.json) | Canonical machine ingest |
| [AKA-ARCH-SAAS-001.AGENT.md](./AKA-ARCH-SAAS-001.AGENT.md) | Implementation prompt |
| [llms.txt](./llms.txt) | Entry index for agents |
| [diagrams/](./diagrams/) | Figure sources (`*.mmd`) and PNG renderings |

55 sheets. Agent read order: ingest.json → `diagrams/*.mmd` → AGENT.md → HTML/PDF.

## Regenerate

```bash
python3 docs/architecture/official/build_html.py

export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="docs/architecture/official/diagrams"
for f in "$DIR"/*.mmd; do
  npx -y @mermaid-js/mermaid-cli@11 -i "$f" -o "${f%.mmd}.png" -b white -s 2 -c "$DIR/mermaid-config.json"
done

HTML="docs/architecture/official/AKA-ARCH-SAAS-001.html"
PDF="docs/architecture/official/AKA-ARCH-SAAS-001_v2.0.pdf"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PDF" "file://$PWD/$HTML"
```

## Canon

- `docs/specs/AKADEMATE_MASTER_ARCHITECTURE_SPEC.md`
- `docs/specs/AKADEMATE_CLOUDFLARE_NATIVE_SAAS.md`
- `docs/specs/cloudflare-native/DIAGRAMS.md`
