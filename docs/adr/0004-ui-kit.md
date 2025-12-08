# 0004 - UI kit compartido

- Status: Proposed
- Context: Se necesita coherencia visual entre web pública, admin y campus usando Tailwind v4 + shadcn/ui, con theming por tenant.
- Decision: Reutilizar patrones del repo `Academate-ui`; centralizar tokens en `@akademate/ui` con CSS vars (`--background`, `--primary`, etc.); componentes accesibles (focus/aria) y tipografía consistente; evitar colores en `theme.extend.colors`.
- Consequences: Las apps importan `@akademate/ui/styles.css` y sus componentes; cambios de marca por tenant se aplican vía CSS vars; build de UI debe respetar Tailwind v4 y PostCSS `@tailwindcss/postcss`.
