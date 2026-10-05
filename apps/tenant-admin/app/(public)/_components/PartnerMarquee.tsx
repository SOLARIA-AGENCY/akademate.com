'use client'

import { CEP_PARTNERS, PARTNER_ASSET_PREFIX } from '@/app/lib/website/cep-partners'
import { useEffect, useRef } from 'react'

const TITLE = 'Empresas colaboradoras'
const SUBTITLE = 'Agradecemos la buena relación y profesionalidad de nuestros colaboradores'

function duplicated(partners: Array<{ name: string; file: string }>) {
  return [...partners, ...partners]
}

function bindViewport(viewport: HTMLElement) {
  const track = viewport.querySelector<HTMLElement>('[data-cep-partners-track]')
  if (!track || track.getAttribute('data-cep-bound') === '1') return
  track.setAttribute('data-cep-bound', '1')
  track.style.animation = 'none'
  const dir = track.getAttribute('data-dir')
  const auto = dir === 'rtl' ? 0.026 : -0.022
  let offset = 0
  let paused = false
  let dragging = false
  let lastX = 0
  let lastT = 0
  let vel = 0
  let half = 0
  let pointerX = -1
  let pointerY = -1
  const measure = () => {
    half = track.scrollWidth / 2
  }
  const wrap = () => {
    measure()
    if (half <= 0) return
    offset = ((offset % half) + half) % half
  }
  const overBand = () => {
    if (pointerX < 0) return false
    const box = viewport.getBoundingClientRect()
    return pointerX >= box.left && pointerX <= box.right && pointerY >= box.top && pointerY <= box.bottom
  }
  const render = () => {
    wrap()
    track.style.transform = `translate3d(${-offset}px,0,0)`
  }
  const tick = (now: number) => {
    if (!document.body.contains(track)) return
    const dt = Math.min(32, now - lastT || 16)
    lastT = now
    if (!dragging) paused = overBand()
    if (dragging) {
      render()
    } else if (!paused) {
      offset += auto * dt
      vel = auto
      render()
    } else if (Math.abs(vel) > 0.003) {
      offset += vel * dt
      vel *= 0.92
      render()
    }
    requestAnimationFrame(tick)
  }
  document.addEventListener(
    'pointermove',
    (event) => {
      pointerX = event.clientX
      pointerY = event.clientY
      if (!dragging) paused = overBand()
    },
    { passive: true },
  )
  document.addEventListener('pointerleave', () => {
    pointerX = -1
    pointerY = -1
    if (!dragging) paused = false
  })
  window.addEventListener('blur', () => {
    pointerX = -1
    pointerY = -1
    if (!dragging) paused = false
  })
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    dragging = true
    paused = true
    vel = 0
    lastX = event.clientX
    viewport.setPointerCapture(event.pointerId)
    event.preventDefault()
  })
  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return
    const dx = event.clientX - lastX
    lastX = event.clientX
    offset -= dx
    vel = -dx / 16
    render()
  })
  const endDrag = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    try {
      viewport.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    pointerX = event.clientX
    pointerY = event.clientY
    paused = overBand()
  }
  viewport.addEventListener('pointerup', endDrag)
  viewport.addEventListener('pointercancel', endDrag)
  lastT = performance.now()
  requestAnimationFrame(tick)
}

export function PartnerMarquee() {
  const rootRef = useRef<HTMLElement>(null)
  const top = duplicated(CEP_PARTNERS.filter((_, index) => index % 2 === 0))
  const bottom = duplicated(CEP_PARTNERS.filter((_, index) => index % 2 === 1))

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    root.querySelectorAll<HTMLElement>('.cep-partners-viewport').forEach(bindViewport)
  }, [])

  return (
    <section ref={rootRef} data-cep-partners="1" aria-label={TITLE}>
      <style>{`
        [data-cep-partners="1"]{background:#fff;border-top:1px solid #eadadd;border-bottom:1px solid #eadadd;padding:2.25rem 0 2.35rem;overflow:hidden}
        [data-cep-partners="1"] .cep-partners-copy{max-width:72rem;margin:0 auto;padding:0 1rem;text-align:center}
        [data-cep-partners="1"] .cep-partners-kicker{margin:0;color:#f2014b;font-size:.72rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
        [data-cep-partners="1"] .cep-partners-title{margin:.65rem auto 0;max-width:38rem;color:#3E091A;font-size:clamp(1.35rem,2.4vw,1.85rem);line-height:1.25;font-weight:800}
        [data-cep-partners="1"] .cep-partners-bands{margin-top:1.7rem;display:grid;gap:.85rem}
        [data-cep-partners="1"] .cep-partners-viewport{overflow:hidden;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;pointer-events:auto;-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent)}
        [data-cep-partners="1"] .cep-partners-viewport:active{cursor:grabbing}
        [data-cep-partners="1"] .cep-partners-track{display:flex;width:max-content;gap:1.15rem;align-items:stretch;will-change:transform;pointer-events:none}
        [data-cep-partners="1"] .cep-partners-track[data-dir="rtl"]{animation:cep-partners-rtl 110s linear infinite}
        [data-cep-partners="1"] .cep-partners-track[data-dir="ltr"]{animation:cep-partners-ltr 125s linear infinite}
        [data-cep-partners="1"] .cep-partners-viewport:hover .cep-partners-track{animation-play-state:paused!important}
        [data-cep-partners="1"] .cep-partner-item{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:18rem;height:9.25rem;padding:.9rem 1.05rem;border:1px solid #eadadd;border-radius:1.25rem;background:#fff}
        [data-cep-partners="1"] .cep-partner-item img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;object-position:center;pointer-events:none}
        @keyframes cep-partners-rtl{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
        @keyframes cep-partners-ltr{from{transform:translate3d(-50%,0,0)}to{transform:translate3d(0,0,0)}}
        @media (max-width:640px){[data-cep-partners="1"] .cep-partner-item{width:14.5rem;height:7.6rem;padding:.7rem .8rem}}
        @media (prefers-reduced-motion:reduce){[data-cep-partners="1"] .cep-partners-track{animation:none}}
      `}</style>
      <div className="cep-partners-copy">
        <p className="cep-partners-kicker">{TITLE}</p>
        <h2 className="cep-partners-title">{SUBTITLE}</h2>
      </div>
      <div className="cep-partners-bands">
        <div className="cep-partners-viewport">
          <div className="cep-partners-track" data-cep-partners-track="1" data-dir="rtl">
            {top.map((partner, index) => (
              <div className="cep-partner-item" key={`rtl-${partner.file}-${index}`}>
                <img src={`${PARTNER_ASSET_PREFIX}${partner.file}`} alt={partner.name} width={280} height={160} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
        <div className="cep-partners-viewport">
          <div className="cep-partners-track" data-cep-partners-track="1" data-dir="ltr">
            {bottom.map((partner, index) => (
              <div className="cep-partner-item" key={`ltr-${partner.file}-${index}`}>
                <img src={`${PARTNER_ASSET_PREFIX}${partner.file}`} alt={partner.name} width={280} height={160} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
