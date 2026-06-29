'use client'

import { useRef, type PointerEvent } from 'react'

type TeacherCarouselMember = {
  id?: string | number
  name: string
  role: string
  image: string
  areas: Array<{ name: string; color?: string | null }>
}

export function TeacherCarouselClient({ members }: { members: TeacherCarouselMember[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ pointerId: number; startX: number; scrollLeft: number } | null>(null)

  if (members.length === 0) return null

  const loopMembers = members.length > 4 ? [...members, ...members] : members

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (!track) return
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: track.scrollLeft,
    }
    track.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = dragState.current
    const track = trackRef.current
    if (!state || !track) return
    track.scrollLeft = state.scrollLeft - (event.clientX - state.startX)
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current
    if (track && dragState.current?.pointerId === event.pointerId) {
      track.releasePointerCapture(event.pointerId)
    }
    dragState.current = null
  }

  return (
    <div className="mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
      <div
        ref={trackRef}
        className="teacher-carousel-track flex cursor-grab gap-4 overflow-x-auto pb-4 active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="teacher-carousel-loop flex w-max gap-4">
          {loopMembers.map((member, index) => (
            <article
              key={`${member.id || member.name}-${index}`}
              className="w-[220px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex justify-center bg-slate-50 p-5">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-white"
                />
              </div>
              <div className="p-4">
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cep-brand)]">
                  Docente
                </span>
                <h3 className="mt-4 min-h-[2.75rem] text-sm font-black leading-snug text-slate-900">{member.name}</h3>
                <p className="mt-1 text-sm capitalize text-slate-600">{member.role}</p>
                {member.areas.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {member.areas.slice(0, 2).map((area) => (
                      <span
                        key={`${member.name}-${area.name}`}
                        className="rounded-full px-2.5 py-1 text-[10px] font-black leading-none"
                        style={{ backgroundColor: `${area.color || '#f2014b'}18`, color: area.color || '#b00032' }}
                      >
                        {area.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes cep-teacher-marquee-slow {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .teacher-carousel-loop {
          animation: cep-teacher-marquee-slow 145s linear infinite;
        }
        .teacher-carousel-track:hover .teacher-carousel-loop,
        .teacher-carousel-track:active .teacher-carousel-loop {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .teacher-carousel-loop {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
