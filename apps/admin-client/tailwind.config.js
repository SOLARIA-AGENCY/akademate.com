const baseConfig = require('../../tailwind.config')

module.exports = {
  ...baseConfig,
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    './lib/**/*.{ts,tsx,mdx}',
    '../../packages/**/*.{ts,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    ...baseConfig.theme,
    colors: {
      ...baseConfig.theme.colors,
      sidebar: 'hsl(var(--sidebar))',
      'sidebar-foreground': 'hsl(var(--sidebar-foreground))',
      header: 'hsl(var(--header))',
      'header-foreground': 'hsl(var(--header-foreground))',
      'header-border': 'hsl(var(--header-border))',
      footer: 'hsl(var(--footer))',
      'footer-foreground': 'hsl(var(--footer-foreground))',
      popover: 'hsl(var(--popover))',
      'popover-foreground': 'hsl(var(--popover-foreground))',
    },
  },
}
