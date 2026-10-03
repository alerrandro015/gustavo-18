import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { palco } from '../lib/palco'

/**
 * Cena 4. A página trava e o van gira em 3D enquanto a rolagem vira rotação.
 *
 * É a cena pinada do filme: `pin: true` segura a seção por 300% da altura da
 * janela. Quem usa teclado ou não quer rolagem suave ainda atravessa a cena
 * inteira, porque a seção tem altura de verdade no documento — nada aqui
 * depende de passar o mouse.
 */
export function CenaCaravan({ reduzido }: { reduzido: boolean }) {
  const raiz = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = raiz.current
    if (!el) return

    // Só os campos que o GSAP escreve no objeto do palco. Declarar o que é
    // Animated evita que o interpretador erre o alvo e deixe um tween rodando
    // em um objeto que já não existe.
    const pseudo = { presenca: palco.presenca } as unknown as Record<string, number>

    const ctx = gsap.context(() => {
      if (reduzido) {
        palco.visivel = true
        palco.presenca = 1
        palco.van.rotY = 0.6
        palco.van.escala = 1.1
        palco.farois = 1
        return
      }

      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 0.8,
        onUpdate: (self) => {
          const p = self.progress
          // Gira uma volta e meia: dá para ver a lateral, o fundo e a frente
          // antes da cena soltar. Uma volta só passa rápido demais.
          palco.van.rotY = p * Math.PI * 3
          palco.van.escala = 1.05 + Math.sin(p * Math.PI) * 0.25
          palco.van.y = Math.sin(p * Math.PI) * 0.5
          // Faróis acendem na primeira metade e ficam acesos.
          palco.farois = Math.min(1, p * 2.4)
          // Durante a cena inteira a van está totalmente presente.
          palco.presenca = 1
        },
        // A van não some de um quadro para o outro. Esta cena é a mais rápida
        // do site, e um corte de visibilidade aqui aparecia como um piscar no
        // meio da volta. `presenca` encolhe e afunda a van no asfalto, e a
        // visibilidade só é desligada quando não sobra mais nada na tela.
        onLeave: () => {
          gsap.to(palco, { ...pseudo, presenca: 0, duration: 0.6, ease: 'power2.in' })
        },
        onEnterBack: () => {
          palco.visivel = true
          gsap.to(palco, { presenca: 1, duration: 0.5, ease: 'power2.out' })
        },
      })
    }, el)

    return () => ctx.revert()
  }, [reduzido])

  return (
    <section
      ref={raiz}
      className="relative h-[100svh] overflow-hidden"
      aria-label="A Caravan"
    >
      {/* Rótulo da cena. Fica no canto e é o que diz o que está acontecendo
          quando o van está de costas, que é metade da cena. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
        <p className="max-w-[28ch] text-cromo text-titulo sm:max-w-[24ch]">
          Ele passou o ano inteiro preparando esse dia.
        </p>
        <div className="flex items-end justify-between gap-4">
          <p className="max-w-[30ch] text-pequeno text-branco/45">
            Sem bagagem no banco de trás. Só buzina, chiclete e o que sobrou da última
            volta.
          </p>
          {/* A placa do van. Não é um rótulo: é a identificação que já
              estava no carro e que o cinema sempre mostra. */}
          <span className="border-2 border-branco/25 px-3 py-1 font-display text-branco/70 text-titulo tracking-[0.12em]">
            GVS 0018
          </span>
        </div>
      </div>
    </section>
  )
}
