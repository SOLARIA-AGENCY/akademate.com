const baseConfig = require('../../tailwind.config')

module.exports = {
  ...baseConfig,
  content: ['./app/**/*.{ts,tsx,mdx}', '../../packages/**/*.{ts,tsx,mdx}'],
}
