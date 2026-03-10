import type { Meta, StoryObj } from '@storybook/nextjs'
import { StaffCard } from '@payload-config/components/ui/StaffCard'

const baseProps = {
  id: 1,
  fullName: 'Ana Martínez López',
  position: 'Docente de Desarrollo Web',
  contractType: 'full_time',
  employmentStatus: 'active',
  photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
  email: 'ana.martinez@akademate.com',
  phone: '+34 612 345 678',
  bio: 'Especialista en React, TypeScript y arquitecturas frontend modernas. 8 años de experiencia en formación profesional.',
  assignedCampuses: [
    { id: 1, name: 'Madrid Centro', city: 'Madrid' },
    { id: 2, name: 'Madrid Norte', city: 'Madrid' },
  ],
  onView: () => {},
  onEdit: () => {},
  onDelete: () => {},
}

const meta = {
  title: 'Akademate/StaffCard',
  component: StaffCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: baseProps,
} satisfies Meta<typeof StaffCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Activo: Story = {
  args: { employmentStatus: 'active' },
}

export const BajaTemporal: Story = {
  args: {
    employmentStatus: 'temporary_leave',
    fullName: 'Roberto González Pérez',
    position: 'Docente de Marketing',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
    email: 'roberto.gonzalez@akademate.com',
  },
}

export const Inactivo: Story = {
  args: {
    employmentStatus: 'inactive',
    contractType: 'freelance',
    fullName: 'María Fernández Castro',
    position: 'Docente de Diseño',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    email: 'maria.fernandez@akademate.com',
    phone: '',
    bio: undefined,
  },
}

export const SinSedes: Story = {
  args: {
    assignedCampuses: [],
    fullName: 'Luis Sánchez Ruiz',
    position: 'Docente externo',
    contractType: 'freelance',
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luis',
    email: 'luis.sanchez@freelance.com',
  },
}

export const SinFoto: Story = {
  args: {
    photo: '/broken-image.jpg',
    fullName: 'Carmen Torres Díaz',
    position: 'Coordinadora Académica',
    email: 'carmen.torres@akademate.com',
  },
}

export const Grid: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-4xl">
      <StaffCard {...baseProps} />
      <StaffCard
        {...baseProps}
        id={2}
        fullName="Roberto González"
        position="Marketing"
        employmentStatus="temporary_leave"
        contractType="part_time"
        photo="https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto"
        email="roberto@akademate.com"
        bio={undefined}
      />
      <StaffCard
        {...baseProps}
        id={3}
        fullName="María Fernández"
        position="Diseño UX"
        employmentStatus="active"
        contractType="freelance"
        photo="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"
        email="maria@akademate.com"
        assignedCampuses={[{ id: 3, name: 'Barcelona', city: 'Barcelona' }]}
      />
    </div>
  ),
}
