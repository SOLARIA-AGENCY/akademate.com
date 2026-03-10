'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import type { ViewType } from '@payload-config/hooks/useViewPreference'

const meta = {
  title: 'Akademate/ViewToggle',
  component: ViewToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ViewToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Grid: Story = {
  args: {
    view: 'grid',
    onViewChange: () => {},
  },
}

export const List: Story = {
  args: {
    view: 'list',
    onViewChange: () => {},
  },
}

export const Interactive: Story = {
  render: () => {
    const [view, setView] = useState<ViewType>('grid')
    return (
      <div className="flex flex-col items-center gap-4">
        <ViewToggle view={view} onViewChange={setView} />
        <p className="text-sm text-muted-foreground">
          Vista activa: <span className="font-medium text-foreground">{view}</span>
        </p>
      </div>
    )
  },
}
