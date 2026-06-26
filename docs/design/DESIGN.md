# Akademate Tenant Dashboard Design System

## CEP Formación

CEP uses red as the primary brand accent, but interactive hover states must not become solid red unless the element is a primary call to action.

- Primary CTA: solid `bg-primary` with white foreground.
- Selected segmented state: solid `bg-primary` only for the active value.
- Hover/focus preview on neutral controls: use `bg-primary/10` with normal foreground text.
- Avoid solid blue, sky, or indigo utilities in tenant dashboard UI. Use semantic tokens (`primary`, `muted`, `accent`, `destructive`) or area/course tokens.
- Destructive states are not brand states. Reserve `destructive` for errors, deletion, cancellation, or irreversible actions.

## Responsive Lists

Operational lists with many data points should not force horizontal scrolling in the dashboard viewport.

- Prefer grouped columns at desktop sizes instead of one column per field.
- At tablet/mobile widths, render the same data as stacked cards.
- Keep action controls in their own row or trailing column with stable width.
- Do not rely on `min-w-*` table hacks unless the workflow explicitly requires spreadsheet-style overflow.
