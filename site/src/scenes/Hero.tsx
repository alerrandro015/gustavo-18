import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { config } from '../content/config'
import { palco, resetarPalco } from '../lib/palco'

gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * Cena 2. O nome ocupa quase a tela toda, o "18" fica vermelho pulsando e a
 * Caravan entra pela direita e freia no centro.
 *
 * O título é tratado como elemento de desenho, não como texto: cada letra
 * entra de baixo, com deslocamento próprio, e o "18" ganha um batimento
 * separado porque é o número, não uma letra.
 */
export function Hero({ reduzido }: { reduzido: boolean }) {
  const raiz = useRef<HTMLElement>(null)
  const nomeRef = useRef<HTMLDivElement>(null)
  const dezoitoRef = useRef<HTMLSpanElement>(null)
  const subRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raizEl = raiz.current
    const nomeEl = nomeRef.current
    if (!raizEl || !nomeEl) return

    const ctx = gsap.context(() => {
      if (reduzido) {
        // Sem movimento: tudo aparece no lugar, a van fica parada no centro.
        gsap.set([nomeEl, dezoitoRef.current, subRef.current], {
          opacity: 1,
          y: 0,
        })
        resetarPalco()
        palco.visivel = true
        palco.farois = 1
        return
      }

      const letras = new SplitText(nomeEl, { type: 'chars' })
      const chars = letras.chars as HTMLElement[]

      const tl = gsap.timeline({ delay: 0.15 })

      tl.from(chars, {
        yPercent: 115,
        opacity: 0,
        rotateX: -70,
        duration: 0.9,
        ease: 'power4.out',
        stagger: { each: 0.045, from: 'start' },
      })
        .from(
          dezoitoRef.current,
          { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(2.4)' },
          '-=0.5',
        )
        .from(
          subRef.current?.children ?? [],
          { y: 24, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
          '-=0.35',
        )

      // Batimento do 18. Píngue-pongue em dois tempos, como um farol pisca.
      tl.to(
        dezoitoRef.current,
        {
          scale: 1.045,
          duration: 0.55,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        },
        '+=0.5',
      )

      // A van chega da direita e freia. O freio é o easing: entra rápido e
      // assenta devagar, que é o que faz um movimento virar "freada".
      //
      // O `set` antes do `fromTo` fixa a pose de partida de forma
      // determinística. Sem ele, a van ficaria no estado em que a última cena
      // a deixou, e a posição inicial do site deixa de ser previsível.
      palco.visivel = true
      gsap.set(palco.van, { x: 26, y: 0, z: -8, rotY: -0.5, escala: 1 })
      gsap.set(palco, { nitro: 0 })

      const chegada = gsap.timeline({ delay: 0.5 })
      chegada
        .fromTo(
          palco.van,
          { x: 26, z: -8, rotY: -0.5 },
          {
            x: 0,
            z: 0,
            rotY: 0,
            duration: 2.1,
            ease: 'power4.out',
          },
        )
        .fromTo(
          palco,
          { farois: 0 },
          { farois: 1, duration: 1.4, ease: 'power2.in' },
          0.4,
        )

      // Depois que a van assenta, os faróis passam a piscar devagar, como
      // alguém parado com o motor ligado.
      gsap.to(palco, {
        farois: 0.4,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 2.6,
      })

      // Ao sair do hero, a van não some: ela recua para o fundo, como se
      // tivesse seguido a rua. Cortar o objeto do nada denuncia o truque.
      ScrollTrigger.create({
        trigger: raizEl,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onRefresh: (self) => {
          // Recalcular a pose no refresh impede que a posição da van fique
          // presa no valor de uma rolagem anterior quando a janela muda de
          // tamanho ou quando as fontes trocam a altura do documento.
          const p = self.progress
          palco.van.x = p * -3.5
          palco.van.escala = 1 - p * 0.18
          palco.van.rotY = p * 0.5
        },
        onUpdate: (self) => {
          const p = self.progress
          palco.van.x = p * -3.5
          palco.van.escala = 1 - p * 0.18
          palco.van.rotY = p * 0.5
        },
      })

      return () => {
        letras.revert()
      }
    }, raizEl)

    return () => ctx.revert()
  }, [reduzido])

  return (
    <section
      ref={raiz}
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden px-5 pt-28 pb-10 sm:px-8 sm:pt-32"
      aria-label={`${config.nome}, ${config.idade} anos`}
    >
      {/* Faixa de velocidade no rodapé do hero: o asfalto passando. */}
      <div
        aria-hidden="true"
        className="linhas-velocidade pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-30"
      />

      <div ref={nomeRef} className="display text-hero text-branco">
        {config.nome}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-end gap-3 sm:gap-5">
          <span
            ref={dezoitoRef}
            className="display lanterna text-[26vw] leading-[0.72] sm:text-[19vw]"
          >
            {config.idade}
          </span>
          <span className="display pb-2 text-branco/25 text-mega sm:pb-4">anos</span>
        </div>

        <div ref={subRef} className="flex flex-col items-start gap-1 pb-2 sm:items-end">
          <p className="text-cromo text-corpo sm:text-right">{config.dedicatoria}</p>
          <span className="text-pequeno text-branco/40">Role para começar</span>
        </div>
      </div>
    </section>
  )
}
