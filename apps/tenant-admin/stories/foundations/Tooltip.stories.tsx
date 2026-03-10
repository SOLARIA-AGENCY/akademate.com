'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@payload-config/components/ui/tooltip'
import { Button } from '@payload-config/components/ui/button'
import { Info, HelpCircle } from 'lucide-react'

const meta = {
  title: 'Foundations/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [(Story) => <TooltipProvider><Story /></TooltipProvider>],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Pasa el cursor</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Información adicional</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const Positions: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>
            <p>Tooltip {side}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span className="text-sm">Plazas disponibles</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Número de plazas libres en esta convocatoria</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const Help: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>Los cursos subvencionados requieren acreditar situación laboral mediante documentación oficial.</p>
      </TooltipContent>
    </Tooltip>
  ),
}
