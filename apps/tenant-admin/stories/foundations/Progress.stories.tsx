import type { Meta, StoryObj } from '@storybook/nextjs'
import { Progress } from '@payload-config/components/ui/progress'

const meta = {
  title: 'Foundations/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    value: 40,
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Progress {...args} className="w-64" />,
}

export const Empty: Story = {
  args: { value: 0 },
  render: (args) => (
    <div className="w-64 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Sin avance</span>
        <span>0%</span>
      </div>
      <Progress {...args} />
    </div>
  ),
}

export const Quarter: Story = {
  args: { value: 25 },
  render: (args) => (
    <div className="w-64 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Iniciando módulo 1</span>
        <span>25%</span>
      </div>
      <Progress {...args} />
    </div>
  ),
}

export const MidProgress: Story = {
  args: { value: 68 },
  render: (args) => (
    <div className="w-64 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Módulo 3 de 5</span>
        <span>68%</span>
      </div>
      <Progress {...args} />
    </div>
  ),
}

export const Complete: Story = {
  args: { value: 100 },
  render: (args) => (
    <div className="w-64 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Curso completado</span>
        <span>100%</span>
      </div>
      <Progress {...args} />
    </div>
  ),
}

export const CourseList: Story = {
  render: () => (
    <div className="w-72 space-y-4">
      {[
        { name: 'Desarrollo Web Full-Stack', value: 82 },
        { name: 'Marketing Digital', value: 45 },
        { name: 'Diseño UX/UI', value: 100 },
        { name: 'Python Data Science', value: 12 },
      ].map((course) => (
        <div key={course.name} className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-medium truncate">{course.name}</span>
            <span className="text-muted-foreground ml-2">{course.value}%</span>
          </div>
          <Progress value={course.value} />
        </div>
      ))}
    </div>
  ),
}
