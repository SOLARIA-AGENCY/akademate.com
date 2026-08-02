import { academyModelCoverage } from '@/lib/marketing-content'

const midpoint = Math.ceil(academyModelCoverage.length / 2)
const rows = [
  academyModelCoverage.slice(0, midpoint),
  academyModelCoverage.slice(midpoint),
] as const

export function ClientMarquee() {
  return (
    <section
      aria-labelledby="client-marquee-title"
      className="overflow-hidden border-y border-slate-200 bg-white py-8"
    >
      <div className="mx-auto mb-7 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p id="client-marquee-title" className="text-sm font-semibold text-slate-500">
          Built around every academy model
        </p>
        <p className="sr-only">{academyModelCoverage.join(', ')}</p>
      </div>
      <div className="space-y-4" aria-hidden="true">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="client-marquee-mask overflow-hidden">
            <div
              className={`client-marquee-track ${rowIndex === 1 ? 'client-marquee-track-reverse' : ''}`}
            >
              {[...row, ...row].map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="client-marquee-name flex shrink-0 items-center gap-5 whitespace-nowrap text-lg font-semibold text-slate-400 sm:text-xl"
                >
                  {name}
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
