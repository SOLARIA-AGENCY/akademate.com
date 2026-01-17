import { TestShell } from '../_components/TestShell'

export default function SettingsPage() {
  return (
    <TestShell title="Settings">
      <form className="space-y-4" data-testid="settings-page">
        <div className="rounded border p-4">
          <label className="block text-sm font-medium">Academy name</label>
          <input
            name="academyName"
            className="mt-2 w-full rounded border px-3 py-2"
            placeholder="Akademate Demo"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" className="mt-2 w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input type="tel" className="mt-2 w-full rounded border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Logo</label>
          <input type="file" className="mt-2" data-testid="logo-upload" />
        </div>

        <div>
          <label className="block text-sm font-medium">Theme color</label>
          <input type="color" className="mt-2" data-testid="color-picker" />
        </div>

        <button type="submit" className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Save
        </button>
      </form>
    </TestShell>
  )
}
