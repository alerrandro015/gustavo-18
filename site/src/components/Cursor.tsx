import { useEffect, useRef } from 'react'

/**
 * Cursor farol: um círculo que acende quando o ponteiro entra num alvo.
 *
 * O cursor nativo continua visível. Esconder o ponteiro do sistema sem
 * reposicionar nada é a forma mais rápida de tornar um site inacessível, e
 * ninguém que usa teclado deveria perder a noção de onde está. Então isto é
 * um elemento a mais, não um substituto.
 */
export function Cursor({ reduzido }: { reduzido: boolean }) {
  const anel = useRef<HTMLDivElement>(null)
  const nucleo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduzido) return
    // Em toque não há cursor para seguir.
    if (window.matchMedia('(pointer: coarse)').matches) return

    let alvoX = window.innerWidth / 2
    let alvoY = window.innerHeight / 2
    let x = alvoX
    let y = alvoY
    let escala = 1
    let alvoEscala = 1
    let quadro = 0

    const sobreAlvo = (e: Event) => {
      const t = e.target as HTMLElement | null
      alvoEscala = t?.closest('a, button, [role="button"]') ? 2.6 : 1
    }

    const onMove = (e: MouseEvent) => {
      alvoX = e.clientX
      alvoY = e.clientY
    }

    const anime = () => {
      // Perseguir o ponteiro com atraso é o que dá a sensação de peso.
      const suave = 0.22
      x += (alvoX - x) * suave
      y += (alvoY - y) * suave
      escala += (alvoEscala - escala) * 0.15

      if (anel.current) {
        anel.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${escala})`
      }
      if (nucleo.current) {
        nucleo.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
      quadro = requestAnimationFrame(anime)
    }

    quadro = requestAnimationFrame(anime)
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', sobreAlvo)

    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', sobreAlvo)
    }
  }, [reduzido])

  if (reduzido) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[65] hidden md:block"
    >
      <div
        ref={anel}
        className="absolute top-0 left-0 size-8 rounded-full border border-neon/70"
        style={{ boxShadow: '0 0 16px rgb(0 208 255 / 0.35)' }}
      />
      <div
        ref={nucleo}
        className="absolute top-0 left-0 size-1 rounded-full bg-branco"
      />
    </div>
  )
}
