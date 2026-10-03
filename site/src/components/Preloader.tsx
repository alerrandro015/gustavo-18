import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Semaphore } from './Semaphore'

/**
 * Cena 1. Contagem de 0 a 100, o semáforo subindo de faixa e a cortina
 * abrindo em diagonal.
 *
 * O número não está fingindo carregar nada: ele anda com um tempo real e não
 * chega em 100 antes das fontes e a cena 3D estarem prontas. Encher barra de
 * progress é o truque mais velho da internet e ele aparece na hora.
 */
export function Preloader({ pronto }: { pronto: boolean }) {
  const [numero, setNumero] = useState(0)
  const [fora, setFora] = useState(false)
  const saida = useRef(false)
  const cortina = useRef<HTMLDivElement>(null)
  const bloco = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const inicio = performance.now()
    const duracao = 2200
    let quadro = 0

    const contar = () => {
      const decorrido = performance.now() - inicio
      const bruto = Math.min(1, decorrido / duracao)
      // smootherstep: começa devagar, acelera no meio, segura no fim. Uma
      // rampa linear denunciaria a trapaça na hora.
      const suave = bruto * bruto * (3 - 2 * bruto)
      setNumero(Math.round(suave * 99))

      if (bruto < 1 && !pronto) {
        quadro = requestAnimationFrame(contar)
      } else if (pronto) {
        setNumero(100)
      }
    }

    quadro = requestAnimationFrame(contar)
    return () => cancelAnimationFrame(quadro)
  }, [pronto])

  // Só sai quando o número chegou a 100 E a aplicação está pronta.
  useEffect(() => {
    if (numero < 100 || !pronto || saida.current) return

    // `saida` é um ref e não um estado de propósito. O estado aqui só serviria
    // para impedir que este efeito rode duas vezes, e pagar um render inteiro
    // para guardar um booleano que ninguém desenha. Com ref, o guarda fica no
    // mundo do efeito, que é onde ele é usado.
    saida.current = true

    const tl = gsap.timeline({
      onComplete: () => setFora(true),
    })

    tl.to(bloco.current, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
    }).to(
      cortina.current,
      {
        // Duas folhas em diagonal, como bandeira quadriculada.
        clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%, 100% 100%, 100% 100%, 100% 0)',
        duration: 0.9,
        ease: 'power4.inOut',
        stagger: 0.08,
      },
      '-=0.1',
    )

    // A linha do tempo sobrevive ao desmonte se ninguém matar: o GSAP continua
    // escrevendo `clipPath` num elemento que já não pertence a ninguém.
    return () => {
      tl.kill()
    }
  }, [numero, pronto])

  if (fora) return null

  const fase = numero < 34 ? 'vermelho' : numero < 72 ? 'amarelo' : 'verde'

  return (
    <div
      ref={cortina}
      className="fixed inset-0 z-[70] flex items-end justify-between bg-asfalto"
      style={{
        clipPath:
          'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 100%, 100% 100%, 100% 0, 0 0)',
      }}
    >
      <div
        ref={bloco}
        className="carbono-fundo flex w-full flex-col justify-between p-6 sm:p-10"
      >
        <div className="flex items-center justify-between">
          <Semaphore fase={fase} />
          <span className="font-display text-branco/50 text-sm tracking-[0.3em]">
            ARRANCADA
          </span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <span className="display text-[22vw] leading-[0.78] text-branco sm:text-[16vw]">
            {String(numero).padStart(3, '0')}
          </span>
          <span className="text-cromo text-pequeno pb-2">
            {numero < 100 ? 'segurando o freio' : 'sinal aberto'}
          </span>
        </div>

        {/* Fita de progresso. A régua serve de moldura para o número, não de
            enfeite: ela mostra o quanto falta. */}
        <div className="h-px w-full bg-branco/15">
          <div
            className="h-px bg-nitro transition-[width] duration-150 ease-linear"
            style={{ width: `${numero}%` }}
          />
        </div>
      </div>
    </div>
  )
}
