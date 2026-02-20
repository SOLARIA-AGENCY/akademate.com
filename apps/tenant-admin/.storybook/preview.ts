import type { Preview } from '@storybook/nextjs'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    actions: { argTypesRegex: '^on[A-Z].*' },
    options: {
      storySort: {
        order: ['Foundations', 'Akademate'],
      },
    },
    backgrounds: {
      default: 'dashboard-dark',
      values: [
        { name: 'dashboard-dark', value: '#0f0f0f' },
        { name: 'dashboard-light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
