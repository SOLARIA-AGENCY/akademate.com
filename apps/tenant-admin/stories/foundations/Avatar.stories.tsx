import type { Meta, StoryObj } from '@storybook/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@payload-config/components/ui/avatar'

const meta = {
  title: 'Foundations/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="Usuario" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-link.jpg" alt="Sin foto" />
      <AvatarFallback>AM</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="size-6">
        <AvatarFallback className="text-[10px]">XS</AvatarFallback>
      </Avatar>
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="size-14">
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>
      <Avatar className="size-20">
        <AvatarFallback className="text-2xl">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const GroupStack: Story = {
  render: () => (
    <div className="flex items-center">
      {['AM', 'JL', 'PR', 'MC', 'RS'].map((initials, i) => (
        <Avatar
          key={initials}
          className={`size-9 border-2 border-background ${i > 0 ? '-ml-3' : ''}`}
        >
          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      ))}
      <Avatar className="size-9 border-2 border-background -ml-3">
        <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
          +8
        </AvatarFallback>
      </Avatar>
    </div>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="relative">
        <Avatar className="size-10">
          <AvatarFallback>CM</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div className="relative">
        <Avatar className="size-10">
          <AvatarFallback>RG</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-amber-500 border-2 border-background" />
      </div>
      <div className="relative">
        <Avatar className="size-10">
          <AvatarFallback>TP</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-muted-foreground/40 border-2 border-background" />
      </div>
    </div>
  ),
}
