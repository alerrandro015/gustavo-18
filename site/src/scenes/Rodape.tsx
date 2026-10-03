import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { config, diasVividos, formatarDias } from '../content/config'

/**
 * Cena 9. O rodapé e a conta que fecha.
 *
 * O número de dias vividos é calculado a partir da data de nascimento, não
 * escrito à mão, então ele não envelhece errado e não pede manutenção todo ano.
 */
export function Rodape({ reduzido }: { reduzido: boolean }) {
  const [dias, setDias] = useState(() => diasVividos())
  const numero = useRef<HTMLParagraphElement>(null)

  // A data não muda a cada minuto, mas o site pode ficar aberto a noite
  // inteira. Recontar de hora em hora basta e não custa nada.
  useEffect(() => {
    const t = window.setInterval(() => setDias(diasVividos()), 3_600_000)
    return () => window.clearInterval(t)
  }, [])

  // O contador anima uma vez só, quando chega na tela. Se repetisse a cada
  // visita, o número viraria enfeite em vez de informação.
  useEffect(() => {
    const el = numero.current
    if (!el || reduzido) return

    const objeto = { n: 0 }
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })

    tl.to(objeto, {
      n: dias,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = formatarDias(Math.round(objeto.n))
      },
    })

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [dias, reduzido])

  return (
    <footer className="relative overflow-hidden border-t border-branco/10 px-5 pt-28 pb-16 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-cromo text-pequeno">Dias vividos</p>

        <p
          ref={numero}
          className="display mt-2 text-[15vw] leading-[0.8] text-branco sm:text-[9rem]"
        >
          {formatarDias(dias)}
        </p>

        <div className="mt-16 flex flex-col gap-3">
          <p className="text-grande text-branco">{config.assinatura}</p>
          <p className="text-corpo text-cromo">De: {config.de}</p>
        </div>

        <p className="mt-14 border-t border-branco/10 pt-6 text-pequeno text-branco/35">
          Para o {config.nome}. Dizer que a vida é curta não muda nada, mas pelo menos a
          rolagem fica boa.
        </p>
      </div>
    </footer>
  )
}
