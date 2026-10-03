import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Rolagem suave com inércia, ligada ao ScrollTrigger.
 *
 * As duas coisas precisam andar juntas: o ScrollTrigger mede a posição da
 * rolagem, e o Lenis é quem move a rolagem. Se um animate sem o outro, os
 * pinos das cenas saem do lugar e o texto acende fora de hora.
 */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    // âncoras smoother: o Lenis intercepta o clique e desliza.
    const onClick = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement | null)?.closest('a[href^="#"]')
      if (!alvo) return
      const id = alvo.getAttribute('href')
      if (!id || id === '#') return
      e.preventDefault()
      lenis.scrollTo(id, { offset: 0 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])
}
