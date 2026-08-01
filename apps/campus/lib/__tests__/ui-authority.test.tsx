import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  EmptyState,
  MetricCard,
  PageHeader,
  Progress,
  WorkspaceBrand,
  WorkspaceNav,
  WorkspaceNavItem,
  WorkspaceShell,
  WorkspaceSidebar,
} from '@akademate/ui'
import { CampusWorkspaceFrame } from '../../components/CampusWorkspace'

describe('shared Akademate UI authority', () => {
  it('composes an accessible workspace without app-local primitives', () => {
    render(
      <WorkspaceShell
        sidebar={
          <WorkspaceSidebar>
            <WorkspaceBrand eyebrow="Campus" name="Akademate" />
            <WorkspaceNav aria-label="Primary">
              <WorkspaceNavItem active>Dashboard</WorkspaceNavItem>
            </WorkspaceNav>
          </WorkspaceSidebar>
        }
      >
        <PageHeader
          title="Student workspace"
          description="Current learning activity"
          actions={<Button>Continue</Button>}
        />
        <MetricCard label="Progress" value="64%" />
        <Progress value={150} aria-label="Course completion" />
        <Alert variant="warning">
          <AlertTitle>Action required</AlertTitle>
          <AlertDescription>Review the current state.</AlertDescription>
        </Alert>
        <EmptyState title="No courses" description="Courses appear after enrolment." />
      </WorkspaceShell>
    )

    expect(screen.getByRole('complementary')).not.toBeNull()
    expect(screen.getByRole('navigation', { name: 'Primary' })).not.toBeNull()
    expect(screen.getByText('Dashboard').getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(
      false
    )
    expect(screen.getByRole('alert')).not.toBeNull()
  })

  it('uses one Campus navigation frame for every learner workspace', () => {
    render(
      <CampusWorkspaceFrame activePath="/progress">
        <main>Progress workspace</main>
      </CampusWorkspaceFrame>
    )

    expect(screen.getByRole('navigation', { name: 'Campus' })).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Progreso' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Asistencia' })).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Certificados' })).not.toBeNull()
  })
})
