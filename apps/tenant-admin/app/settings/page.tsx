import { TestShell } from '../_components/TestShell'

export default function SettingsPage() {
  return (
    <TestShell title="Settings" data-oid="_3u241w">
      <form className="space-y-4" data-testid="settings-page" data-oid="0ipaujp">
        <div className="rounded border p-4" data-oid="g9kpc7f">
          <label className="block text-sm font-medium" data-oid="v9aqqul">
            Academy name
          </label>
          <input
            name="academyName"
            className="mt-2 w-full rounded border px-3 py-2"
            placeholder="Akademate Demo"
            data-oid="2abpq.n"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2" data-oid="7.ss2wz">
          <div data-oid="amya55a">
            <label className="block text-sm font-medium" data-oid="n7556e0">
              Email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded border px-3 py-2"
              data-oid="t39ti08"
            />
          </div>
          <div data-oid="6t09wm.">
            <label className="block text-sm font-medium" data-oid="v_81mdr">
              Phone
            </label>
            <input type="tel" className="mt-2 w-full rounded border px-3 py-2" data-oid="3er3ove" />
          </div>
        </div>

        <div data-oid="xkvj0cq">
          <label className="block text-sm font-medium" data-oid="3i3fw29">
            Logo
          </label>
          <input type="file" className="mt-2" data-testid="logo-upload" data-oid="ad0gbv-" />
        </div>

        <div data-oid="ugbwzly">
          <label className="block text-sm font-medium" data-oid="a51fs7j">
            Theme color
          </label>
          <input type="color" className="mt-2" data-testid="color-picker" data-oid="956lqh:" />
        </div>

        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          data-oid="k84yuhn"
        >
          Save
        </button>
      </form>
    </TestShell>
  )
}
