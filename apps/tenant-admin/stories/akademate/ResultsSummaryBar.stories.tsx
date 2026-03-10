import type { Meta, StoryObj } from '@storybook/nextjs'
import { ResultsSummaryBar } from '@payload-config/components/ui/ResultsSummaryBar'

const meta = {
  title: 'Akademate/ResultsSummaryBar',
  component: ResultsSummaryBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    count: 12,
    entity: 'cursos encontrados',
  },
  argTypes: {
    count: { control: 'number' },
    entity: { control: 'text' },
    extra: { control: 'text' },
  },
} satisfies Meta<typeof ResultsSummaryBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithExtra: Story = {
  args: {
    count: 48,
    entity: 'cursos',
    extra: 'Mostrando todos',
  },
}

export const Filtered: Story = {
  args: {
    count: 7,
    entity: 'cursos',
    extra: 'Filtro activo: Online · Madrid',
  },
}

export const NoResults: Story = {
  args: {
    count: 0,
    entity: 'resultados',
    extra: 'Prueba con otros términos',
  },
}

export const Students: Story = {
  args: {
    count: 1847,
    entity: 'alumnos activos',
    extra: '284 certificados emitidos este año',
  },
}
