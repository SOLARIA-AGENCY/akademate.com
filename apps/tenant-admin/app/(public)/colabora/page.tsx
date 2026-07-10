import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Building2, Handshake, HeartHandshake, Lightbulb, Presentation, School, UsersRound } from 'lucide-react'
import { ColaboraForm } from './ColaboraForm'

export const metadata = {
  title: 'Colabora con CEP Formación | Empleo, prácticas, docencia y empresas',
  description: 'Oportunidades para trabajar, hacer prácticas, impartir formación o desarrollar proyectos y formación a medida con CEP Formación.',
}

export const dynamic = 'force-dynamic'

const opportunities = [
  {
    id: 'trabaja-con-nosotros', icon: BriefcaseBusiness, title: 'Trabaja con nosotros', image: '/website/cep/colabora/trabaja-con-nosotros.png', cta: 'Enviar candidatura',
    paragraphs: [
      'En CEP Formación creemos que las personas son el motor de nuestro proyecto. Si compartes nuestra pasión por la educación, la innovación y el desarrollo de las personas, nos encantará conocerte.',
      'Buscamos profesionales comprometidos, con vocación, iniciativa y ganas de seguir creciendo para puestos docentes y áreas de administración, coordinación, orientación, formación, marketing y gestión.',
      'Valoramos especialmente la implicación, la calidad humana, el trabajo en equipo y el deseo de contribuir a transformar vidas a través de la formación. Si quieres formar parte de una organización con más de 28 años formando profesionales, envíanos tu currículum y cuéntanos qué puedes aportar.',
    ],
  },
  {
    id: 'practicas-en-cep', icon: School, title: 'Haz prácticas con nosotros', image: '/website/cep/colabora/practicas-en-cep.png', cta: 'Solicitar prácticas',
    paragraphs: [
      '¿Estás estudiando un ciclo formativo, un grado universitario o una especialización y necesitas realizar tus prácticas?',
      'En CEP Formación abrimos nuestras puertas a estudiantes que quieran aprender en un entorno dinámico, profesional y comprometido con la excelencia. Podrás conocer el funcionamiento de un centro de formación referente, participar en proyectos reales y adquirir experiencia junto a un equipo que te acompañará durante todo el proceso.',
      'Si buscas un lugar donde crecer profesionalmente y desarrollar tus competencias, envíanos tu solicitud. Estudiaremos la posibilidad de incorporarte a nuestro programa de prácticas.',
    ],
  },
  {
    id: 'imparte-formacion', icon: Presentation, title: 'Imparte formación con nosotros', image: '/website/cep/colabora/imparte-formacion.png', cta: 'Entrar en la bolsa docente',
    paragraphs: [
      'En CEP Formación buscamos profesionales apasionados por compartir su conocimiento y contribuir al desarrollo de nuevas generaciones de profesionales.',
      'Colaboramos con expertos de diferentes ámbitos para impartir formación privada, certificados profesionales, formación para empresas, acciones subvencionadas y programas especializados.',
      'Valoramos el dominio técnico, la capacidad de comunicación, la cercanía con el alumnado, la innovación metodológica y el compromiso con la calidad. Si deseas incorporarte a nuestra bolsa de docentes, cuéntanos cuál es tu especialidad.',
    ],
  },
  {
    id: 'proyecto-colaborativo', icon: Handshake, title: '¿Tienes un proyecto? Colabora con CEP Formación', image: '/website/cep/colabora/proyecto-colaborativo.png', cta: 'Presentar un proyecto',
    paragraphs: [
      'En CEP Formación creemos en las alianzas que generan impacto. Si eres profesional, empresa, institución, asociación o entidad y tienes una idea o iniciativa que pueda aportar valor a la sociedad, queremos escucharte.',
      'Estamos abiertos a desarrollar proyectos conjuntos relacionados con formación, innovación, empleo, orientación profesional, responsabilidad social, bienestar, educación emocional, digitalización y cualquier iniciativa que contribuya al crecimiento de las personas y las organizaciones.',
      'Las grandes ideas nacen cuando diferentes talentos trabajan juntos. Cuéntanos tu propuesta y exploremos nuevas oportunidades de colaboración.',
    ],
  },
  {
    id: 'empresa-practicas', icon: UsersRound, title: 'Centro colaborador de prácticas', image: '/website/cep/colabora/empresa-practicas.png', cta: 'Ser empresa colaboradora',
    paragraphs: [
      '¿Quieres incorporar alumnado en prácticas a tu empresa? Colaborar con CEP Formación es una oportunidad para conocer nuevos profesionales, aportar al desarrollo del talento y establecer un vínculo directo con futuros trabajadores.',
      'Seleccionamos cuidadosamente al alumnado y realizamos un seguimiento continuo durante todo el periodo de prácticas para garantizar una experiencia satisfactoria tanto para la empresa como para el estudiante.',
      'Si tu organización desea formar parte de nuestra red de empresas colaboradoras, estaremos encantados de informarte sobre el procedimiento y las diferentes modalidades de colaboración.',
    ],
  },
  {
    id: 'formacion-empresas', icon: Building2, title: 'Formación para empresas', image: '/website/cep/colabora/formacion-empresas.png', cta: 'Solicitar propuesta',
    paragraphs: [
      'Cada empresa es única y sus necesidades formativas también. En CEP Formación diseñamos programas a medida para ayudar a las organizaciones a desarrollar el talento de sus equipos, mejorar la productividad y afrontar nuevos retos.',
      'Ofrecemos formación presencial, online y mixta, adaptándonos a objetivos, horarios y características de cada organización. Podemos ayudarte con habilidades directivas, competencias digitales, inteligencia artificial, atención al cliente, idiomas, bienestar laboral, prevención y liderazgo.',
      'Nuestro equipo estudiará tu proyecto y elaborará una propuesta personalizada. Invertir en formación es invertir en el futuro de tu empresa.',
    ],
  },
]

const commitments = [
  'Acompañamiento cercano durante todo el proceso.',
  'Relaciones basadas en calidad humana y trabajo en equipo.',
  'Proyectos conectados con formación, empleo e impacto social.',
]

export default function ColaboraPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_83%_18%,rgba(242,1,75,0.3),transparent_35%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <h1 className="max-w-3xl text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Crece, enseña y colabora con CEP Formación</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78">Abrimos oportunidades para profesionales, estudiantes, empresas y entidades que quieren generar impacto a través de la formación.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#oportunidades" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-black text-white transition hover:bg-[#d0013f]">Ver oportunidades</a>
              <a href="#solicitud" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 text-sm font-black text-white transition hover:bg-white/10">Enviar una solicitud</a>
            </div>
          </div>
          <div className="grid content-center gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {commitments.map((commitment, index) => (
              <div key={commitment} className="border-l-2 border-[#f2014b] bg-white/[0.06] px-5 py-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff8bb3]">0{index + 1}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/90">{commitment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="oportunidades" className="scroll-mt-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Una puerta de entrada para cada forma de sumar</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Elige la vía que mejor encaja contigo. Cada solicitud llega al equipo adecuado desde el primer momento.</p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {opportunities.map((opportunity) => {
              const Icon = opportunity.icon
              return (
                <article key={opportunity.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <img src={opportunity.image} alt="" loading="lazy" decoding="async" className="h-52 w-full object-cover" />
                  <div className="p-7">
                    <Icon className="h-8 w-8 text-[#f2014b]" aria-hidden="true" />
                    <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{opportunity.title}</h3>
                    <div className="mt-4 space-y-3 text-base leading-7 text-slate-600">
                      {opportunity.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    <a href={`/colabora?tipo=${opportunity.id}#solicitud`} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#f2014b] transition group-hover:gap-3">
                      {opportunity.cta}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fff7fa]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <HeartHandshake className="h-10 w-10 text-[#f2014b]" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black tracking-tight">También conectamos formación y empleo</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">La Agencia de Colocación de CEP Formación ayuda a candidatos y empresas a encontrarse, con orientación y acompañamiento durante el proceso.</p>
            <Link href="/empleo" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-[#f2014b]/25 bg-white px-6 text-sm font-black text-[#f2014b] transition hover:bg-[#ffe8f0]">Conocer la bolsa de empleo</Link>
          </div>
          <div className="border-l border-[#f2014b]/20 pl-0 lg:pl-10">
            <Lightbulb className="h-10 w-10 text-[#f2014b]" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-black tracking-tight">Ideas que se convierten en oportunidades</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">Si compartes una propuesta vinculada a educación, innovación, empleo, digitalización, bienestar o impacto social, queremos conocerla.</p>
          </div>
        </div>
      </section>

      <section id="solicitud" className="scroll-mt-28 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Cuéntanos cómo quieres participar</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Tu solicitud se registra con su tipo específico para que llegue al equipo responsable sin perder contexto.</p>
            <p className="mt-8 border-l-2 border-[#f2014b] pl-4 text-sm font-semibold leading-7 text-slate-700">Para compartir documentación sensible, el equipo te indicará un canal seguro tras revisar la solicitud inicial.</p>
          </div>
          <div className="border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ColaboraForm />
          </div>
        </div>
      </section>
    </main>
  )
}
