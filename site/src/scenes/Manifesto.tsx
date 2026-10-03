import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { config } from '../content/config'

/**
 * Cena 3. O manifesto acende palavra por palavra conforme a rolagem.
 *
 * A rolagem é o cursor aqui: cada palavra só acende quando ela entra na tela, e
 * acende uma vez só. Reacender seria truque de demonstração.
 */
export function Manifesto({ reduzido }: { reduzido: boolean }) {
  const raiz = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = raiz.current
    if (!el) return

    const ctx = gsap.context(() => {
      const palavras = el.querySelectorAll<HTMLElement>('[data-palavra]')

      if (reduzido) {
        gsap.set(palavras, { opacity: 1, color: 'var(--color-branco)' })
        return
      }

      gsap.set(palavras, { color: 'rgba(184, 188, 196, 0.22)' })

      ScrollTrigger.create({
        trigger: el,
        start: 'top 72%',
        end: 'bottom 55%',
        scrub: true,
        onUpdate: (self) => {
          // Cada palavra tem sua própria janela dentro do progresso da cena,
          // o que faz o texto acender em diagonal em vez de bloco a bloco.
          const p = self.progress
          palavras.forEach((palavra, i) => {
            const inicio = i / palavras.length
            const janela = 0.22
            const local = Math.min(1, Math.max(0, (p - inicio) / janela))
            gsap.set(palavra, {
              color: `rgba(245, 245, 240, ${0.22 + local * 0.78})`,
              x: local * 6,
            })
          })
        },
      })
    }, el)

    return () => ctx.revert()
  }, [reduzido])

  return (
    <section
      ref={raiz}
      className="relative flex min-h-[110svh] items-center px-5 py-32 sm:px-8"
      aria-label="Manifesto"
    >
      <div className="display mx-auto w-full max-w-5xl text-mega">
        {config.manifesto.map((verso, i) => (
          <p
            key={verso}
            className={
              i === 0 ? 'text-branco' : i === 1 ? 'text-nitro' : 'text-branco/90'
            }
          >
            {verso.split(' ').map((palavra, j) => (
              <span key={`${palavra}-${j}`} data-palavra className="inline-block">
                {palavra}
                {j < verso.split(' ').length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  )
}
