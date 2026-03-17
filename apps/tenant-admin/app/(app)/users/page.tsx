import { TestShell } from '../_components/TestShell'

export default function UsersPage() {
  return (
    <TestShell title="Users" data-oid="dkizn5s">
      <section
        className="flex flex-wrap items-center gap-3"
        data-testid="users-page"
        data-oid="cw3gvg5"
      >
        <input
          type="search"
          placeholder="Search users"
          className="w-64 rounded border px-3 py-2"
          data-oid="wk2yivp"
        />

        <button
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          data-oid="tci01bh"
        >
          Create User
        </button>
      </section>

      <table className="w-full border" data-testid="users-table" data-oid="n1kdkcu">
        <thead className="bg-muted" data-oid="0zp0y.k">
          <tr data-oid="1ci9rym">
            <th className="px-4 py-2 text-left" data-oid="_5znl4q">
              Name
            </th>
            <th className="px-4 py-2 text-left" data-oid="bdrpw5x">
              Email
            </th>
            <th className="px-4 py-2 text-left" data-oid="t-ma10h">
              Role
            </th>
            <th className="px-4 py-2 text-left" data-oid="au40.ll">
              Actions
            </th>
          </tr>
        </thead>
        <tbody data-oid="3ivu_w9">
          <tr className="border-t" data-oid="g3f0uzl">
            <td className="px-4 py-2" data-oid="2r0y676">
              Admin User
            </td>
            <td className="px-4 py-2" data-oid=".hk0uwy">
              admin@tenant.com
            </td>
            <td className="px-4 py-2" data-oid="gs265x1">
              <span className="badge" data-testid="role-badge" data-oid="yxfrk:2">
                Admin
              </span>
            </td>
            <td className="px-4 py-2 space-x-2" data-oid="ektpdem">
              <button className="rounded border px-3 py-1 text-xs" data-oid="2kqxo8a">
                Edit
              </button>
              <button className="rounded border px-3 py-1 text-xs" data-oid="yajjcpg">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="pagination" data-testid="pagination" data-oid="0565ukl">
        Page 1 of 1
      </div>
    </TestShell>
  )
}
