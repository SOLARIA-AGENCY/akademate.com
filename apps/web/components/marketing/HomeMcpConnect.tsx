import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, MessageSquareText, PlugZap } from 'lucide-react'
import { agenticProviders } from '@/lib/agentic-growth-content'

const steps = [
  { icon: PlugZap, label: 'Connect', text: 'Choose an approved AI client.' },
  { icon: MessageSquareText, label: 'Ask', text: 'Request help with academy work.' },
  { icon: CheckCircle2, label: 'Review', text: 'Confirm actions in Akademate.' },
] as const

export function HomeMcpConnect() {
  return (
    <section
      data-testid="home-mcp-connect"
      className="bg-[#eaf1ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-10 rounded-2xl border border-blue-200 bg-white p-6 sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:p-12">
        <div>
          <p className="text-sm font-semibold text-blue-700">Optional AI connection</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Connect your AI agent to Akademate.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Manage and configure your academy with MCP assistance.
          </p>
          <Link
            href="/features#mcp-agentic-operations"
            className="mt-7 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
          >
            Explore the MCP roadmap <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            aria-label="Planned AI client connections"
          >
            {agenticProviders.map((provider) => (
              <div
                key={provider.id}
                className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center"
              >
                {provider.asset ? (
                  <Image
                    src={provider.asset}
                    alt=""
                    width={30}
                    height={30}
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    G
                  </span>
                )}
                <span className="mt-3 text-sm font-semibold">{provider.label}</span>
              </div>
            ))}
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, label, text }) => (
              <li key={label} className="rounded-xl bg-[#071633] p-4 text-white">
                <Icon className="h-5 w-5 text-blue-300" aria-hidden="true" />
                <p className="mt-4 font-semibold">{label}</p>
                <p className="mt-1 text-sm leading-6 text-blue-100/70">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
