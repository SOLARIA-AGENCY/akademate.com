# @akademate/ui

Kit UI base (shadcn/ui + Tailwind v4) con tokens compartidos y helpers visuales. Usa CSS vars para theming por tenant y mantiene consistencia con el UI kit externo.

## Objetivos
- Reutilizar patrones visuales (badges, surfaces, layouts) en apps Next.
- Centralizar tokens (`--background`, `--primary`, etc.) y estilos globales.
- Facilitar la integración con shadcn/ui y Tailwind v4.

## Uso
Importa `@akademate/ui/styles.css` en el `layout` de cada app y consume componentes/helpers exportados desde `@akademate/ui`.
