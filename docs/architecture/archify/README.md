# Archify maps (AKADEMATE)

Interactive companions to the print packs. Typed JSON IR in this folder. HTML is produced by Archify `deliver`.

Print sources stay canonical:

- Runtime: `docs/architecture/official/AKA-ARCH-SAAS-001.ingest.json`
- UI: `docs/architecture/ui/AKA-ARCH-UI-001.ingest.json`

## Maps

| File | Type | Question it answers |
| --- | --- | --- |
| [01-surfaces.architecture.json](./01-surfaces.architecture.json) | architecture | Which SURF-* windows exist and how they hand off |
| [02-dual-login.sequence.json](./02-dual-login.sequence.json) | sequence | Staff cookie vs campus JWT |
| [03-enrollment.workflow.json](./03-enrollment.workflow.json) | workflow | Four-stage staff enrollment wizard |
| [04-cloudflare-runtime.architecture.json](./04-cloudflare-runtime.architecture.json) | architecture | Plane 1: seven Workers, Edge, D1, R2, Queues |

## Deliver

```bash
ARCHIFY="$HOME/.cursor/skills/archify/archify"
DIR="docs/architecture/archify"
node "$ARCHIFY/bin/archify.mjs" deliver architecture "$DIR/01-surfaces.architecture.json" "$DIR/01-surfaces.architecture.html" --quality showcase --json
node "$ARCHIFY/bin/archify.mjs" deliver sequence "$DIR/02-dual-login.sequence.json" "$DIR/02-dual-login.sequence.html" --quality showcase --json
node "$ARCHIFY/bin/archify.mjs" deliver workflow "$DIR/03-enrollment.workflow.json" "$DIR/03-enrollment.workflow.html" --quality showcase --json
node "$ARCHIFY/bin/archify.mjs" deliver architecture "$DIR/04-cloudflare-runtime.architecture.json" "$DIR/04-cloudflare-runtime.architecture.html" --quality showcase --json
```

Archify does not inspect live traffic. Open the HTML to walk authored routes. Verify behavior with tests and the running app.

Delivered HTML is showcase-validated (9/9). `visual-check` still reports vertical overflow at 1440\times900 because of viewer chrome plus cards; treat screenshots as pending human review, not a polish claim.
