import { useEffect, useState } from 'react'
import { Semaphore } from './Semaphore'
import { som } from '../lib/audio'

/**
 * Botão de som no canto.
 *
 * Começa mudo porque nenhum navegador deixa tocar áudio antes de um gesto, e
 * porque um site que dispara som sozinho é um site que a pessoa fecha. O
 * semáforo aqui é o mesmo da arrancada: três lâmpadas viram controle de som.
 */
export function BotaoSom() {
  const [ligado, setLigado] = useState(false)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 2600)
    return () => clearTimeout(t)
  }, [])

  const alternar = () => {
    if (ligado) {
      som.desligar()
      setLigado(false)
      return
    }
    void som.ligar().then(() => setLigado(true))
  }

  if (!visivel) return null

  const fase = ligado ? 'verde' : 'vermelho'

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={ligado}
      aria-label={ligado ? 'Desligar o som' : 'Ligar o som'}
      className="fixed right-4 bottom-4 z-[62] flex items-center gap-2.5 rounded-full border border-branco/15 bg-asfalto/80 px-3 py-2 backdrop-blur-sm transition-colors duration-300 hover:border-neon/60 sm:right-6 sm:bottom-6"
    >
      <Semaphore fase={fase} size="sm" />
      <span className="text-pequeno text-cromo">{ligado ? 'ligado' : 'mudo'}</span>
    </button>
  )
}
