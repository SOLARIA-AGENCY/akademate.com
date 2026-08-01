import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
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

describe('shared Akademate UI authority', () => {
  it('composes an accessible workspace without app-local primitives', () => {
    render(
      <WorkspaceShell sidebar={(
        <WorkspaceSidebar>
          <WorkspaceBrand eyebrow="Campus" name="Akademate" />
          <WorkspaceNav aria-label="Primary">
            <WorkspaceNavItem active>Dashboard</WorkspaceNavItem>
          </WorkspaceNav>
        </WorkspaceSidebar>
      )}>
        <PageHeader title="Student workspace" description="Current learning activity" actions={<Button>Continue</Button>} />
        <MetricCard label="Progress" value="64%" />
        <Progress value={150} aria-label="Course completion" />
        <EmptyState title="No courses" description="Courses appear after enrolment." />
      </WorkspaceShell>,
    )

    expect(screen.getByRole('complementary')).not.toBeNull()
    expect(screen.getByRole('navigation', { name: 'Primary' })).not.toBeNull()
    expect(screen.getByText('Dashboard').getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
    expect((screen.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false)
  })
})
