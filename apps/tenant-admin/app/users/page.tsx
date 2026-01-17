import { TestShell } from '../_components/TestShell'

export default function UsersPage() {
  return (
    <TestShell title="Users">
      <section className="flex flex-wrap items-center gap-3" data-testid="users-page">
        <input
          type="search"
          placeholder="Search users"
          className="w-64 rounded border px-3 py-2"
        />
        <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Create User
        </button>
      </section>

      <table className="w-full border" data-testid="users-table">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Role</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-4 py-2">Admin User</td>
            <td className="px-4 py-2">admin@tenant.com</td>
            <td className="px-4 py-2">
              <span className="badge" data-testid="role-badge">
                Admin
              </span>
            </td>
            <td className="px-4 py-2 space-x-2">
              <button className="rounded border px-3 py-1 text-xs">Edit</button>
              <button className="rounded border px-3 py-1 text-xs">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="pagination" data-testid="pagination">
        Page 1 of 1
      </div>
    </TestShell>
  )
}
