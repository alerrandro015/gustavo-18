import { useEffect, useState } from 'react'

/**
 * O site inteiro é movimento, então respeitar `prefers-reduced-motion` não é
 * um detalhe: é a diferença entre o site ser bonito e o site ser hostil para
 * quem enjoa com paralaxe. Este hook decide o modo de execução da cena.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
