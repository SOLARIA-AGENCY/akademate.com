// Mock data for web app tests

export const mockUsers = [
  {
    id: 'user-1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    tenantId: 'tenant-1',
    role: 'user',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    name: 'María García',
    email: 'maria@example.com',
    tenantId: 'tenant-1',
    role: 'user',
    createdAt: '2026-01-15T09:30:00Z',
  },
]

export const mockCourses = [
  {
    id: 'course-1',
    title: 'Curso de Ejemplo',
    slug: 'curso-de-ejemplo',
    tenantId: 'tenant-1',
    instructorId: 'instructor-1',
    isActive: true,
  },
  {
    id: 'course-2',
    title: 'Otro Curso',
    slug: 'otro-curso',
    tenantId: 'tenant-1',
    instructorId: 'instructor-1',
    isActive: false,
  },
]

export const mockTenant = {
  id: 'tenant-1',
  name: 'Academia de Prueba',
  slug: 'academia-prueba',
  domain: 'academia-prueba.akademate.com',
  plan: 'pro',
  settings: {
    logo: null,
    primaryColor: '#FF0000',
    currency: 'EUR',
  timezone: 'Europe/Madrid',
  },
}

export const mockResponse = {
  success: true,
  data: { items: mockUsers, courses: mockCourses },
  message: 'Success',
  timestamp: new Date().toISOString(),
}
}
