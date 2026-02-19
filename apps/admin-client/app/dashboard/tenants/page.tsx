export default function TenantsRootPage() {
  return (
    <main className="p-6 space-y-4" data-testid="tenants-page">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Create Tenant
        </button>
      </header>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search tenants"
          className="w-full max-w-sm rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-3 py-2 text-left">Tenant</th>
            <th className="border px-3 py-2 text-left" data-column="domain">Domain</th>
            <th className="border px-3 py-2 text-left">Plan</th>
            <th className="border px-3 py-2 text-left">Estado</th>
            <th className="border px-3 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-3 py-2">CEP Formacion</td>
            <td className="border px-3 py-2">cepformacion.akademate.com</td>
            <td className="border px-3 py-2">
              <span className="plan-info rounded-md bg-muted px-2 py-1 text-xs">Professional</span>
            </td>
            <td className="border px-3 py-2">
              <span className="badge rounded-md bg-emerald-100 px-2 py-1 text-xs">Activo</span>
            </td>
            <td className="border px-3 py-2 space-x-2">
              <button className="text-sm">Edit</button>
              <button className="text-sm">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="pagination flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando 1-1</span>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-1">Prev</button>
          <button className="rounded-md border px-3 py-1">Next</button>
        </div>
      </div>
    </main>
  )
}
