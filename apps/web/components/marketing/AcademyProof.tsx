import Image from 'next/image'
import { academyTypes } from '@/lib/marketing-content'

export function AcademyProof() {
  return (
    <section aria-labelledby="academy-proof-title" className="border-y border-white/10 bg-[#071633] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.72fr_1.5fr] lg:items-center lg:px-8">
        <div className="flex items-center gap-5 border-white/15 lg:border-r lg:pr-10">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-xl bg-white px-3">
            <Image src="/logos/customers/cep-formacion.png" alt="CEP Formación" width={220} height={65} className="h-auto w-full" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-200">Running with Akademate</p>
            <h2 id="academy-proof-title" className="mt-2 text-lg font-semibold">CEP Formación</h2>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden">
          <p className="mb-4 text-xs font-semibold text-blue-200">Built for modern academy models</p>
          <div className="academy-rail flex w-max items-center gap-3 motion-reduce:transform-none">
            {[...academyTypes, ...academyTypes].map((type, index) => (
              <span
                key={`${type}-${index}`}
                aria-hidden={index >= academyTypes.length}
                className="whitespace-nowrap rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-sm text-blue-50"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
