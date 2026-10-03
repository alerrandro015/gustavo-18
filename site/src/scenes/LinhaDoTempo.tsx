import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { motion } from 'motion/react'
import dados from '../content/timeline.json'

interface Marco {
  ano: string
  titulo: string
  texto: string
}

/**
 * Cena 5. A rolagem vertical vira movimento lateral, como uma pista.
 *
 * O trilho é transladado em X conforme a rolagem, não é `overflow: auto`
 * horizontal: com o ScrollTrigger, o teclado, o trackpad e o toque continuam
 * funcionando sem nenhum código de arraste.
 */
export function LinhaDoTempo({ reduzido }: { reduzido: boolean }) {
  const trilho = useRef<HTMLDivElement>(null)
  const secao = useRef<HTMLElement>(null)

  useEffect(() => {
    const trilhoEl = trilho.current
    const secaoEl = secao.current
    if (!trilhoEl || !secaoEl) return

    const ctx = gsap.context(() => {
      const distancia = () => Math.max(0, trilhoEl.scrollWidth - window.innerWidth + 96)

      if (reduzido) return

      gsap.to(trilhoEl, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: {
          trigger: secaoEl,
          start: 'top top',
          end: () => `+=${distancia() + window.innerHeight * 0.5}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
    }, secaoEl)

    return () => ctx.revert()
  }, [reduzido])

  const marcos = dados as Marco[]

  // Sem pin nem translação, o trilho horizontal não cabe na tela e os cartões
  // ficam cortados. Quem pediu menos movimento recebe a mesma informação em
  // coluna, que é a forma que a página tem de ser lida sem arrastar.
  if (reduzido) {
    return (
      <section
        className="relative border-y border-branco/10 bg-carbono px-5 py-24 sm:px-8"
        aria-label="Linha do tempo"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          {marcos.map((marco, i) => (
            <article key={marco.ano}>
              <div className="mb-4 flex items-center gap-4">
                <span
                  className={`size-2.5 rounded-full ${
                    i === marcos.length - 1
                      ? 'bg-lanterna shadow-[0_0_14px_rgb(255_30_30/0.8)]'
                      : 'bg-nitro'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`display text-titulo leading-none ${
                    i === marcos.length - 1 ? 'lanterna' : 'text-branco'
                  }`}
                >
                  {marco.ano}
                </span>
              </div>
              <div className="border-l border-branco/15 pl-5">
                <h3 className="text-titulo text-branco">{marco.titulo}</h3>
                <p className="mt-2 text-cromo text-corpo">{marco.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      ref={secao}
      className="relative h-[100svh] overflow-hidden border-y border-branco/10 bg-carbono"
      aria-label="Linha do tempo"
    >
      {/* A linha da pista, no meio da faixa. Os marcos pendurados nela. */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-branco/12" />

      <div
        ref={trilho}
        className="flex h-full items-center gap-10 px-6 will-change-transform sm:gap-16 sm:px-12"
      >
        {marcos.map((marco, i) => (
          <motion.article
            key={marco.ano}
            className="relative w-[74vw] shrink-0 sm:w-[42vw] lg:w-[30vw]"
            initial={reduzido ? false : { opacity: 0, y: 40 }}
            whileInView={reduzido ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: reduzido ? 0 : 0.05 }}
          >
            {/* O ano é o número da pista. Alinhado na linha, não flutuando
                num card: ele é a marcação da estrada. */}
            <div className="mb-6 flex items-center gap-4">
              <span
                className={`size-2.5 rounded-full ${
                  i === marcos.length - 1
                    ? 'bg-lanterna shadow-[0_0_14px_rgb(255_30_30/0.8)]'
                    : 'bg-nitro'
                }`}
                aria-hidden="true"
              />
              <span
                className={`display text-mega leading-none ${
                  i === marcos.length - 1 ? 'lanterna' : 'text-branco'
                }`}
              >
                {marco.ano}
              </span>
            </div>

            <div className="border-l border-branco/15 pl-5">
              <h3 className="text-titulo text-branco">{marco.titulo}</h3>
              <p className="mt-2 text-cromo text-corpo">{marco.texto}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
