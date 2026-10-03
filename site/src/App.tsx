import { Suspense, lazy, useEffect, useState } from 'react'
import { Preloader } from './components/Preloader'
import { Cursor } from './components/Cursor'
import { BotaoSom } from './components/BotaoSom'
import { Hero } from './scenes/Hero'
import { Manifesto } from './scenes/Manifesto'
import { CenaCaravan } from './scenes/CenaCaravan'
import { LinhaDoTempo } from './scenes/LinhaDoTempo'
import { Galeria } from './scenes/Galeria'
import { Mural } from './scenes/Mural'
import { BotaoNitro } from './scenes/Nitro'
import { Rodape } from './scenes/Rodape'
import { useLenis } from './lib/useLenis'
import { useReducedMotion } from './lib/useReducedMotion'
import { useWebGLSuportado } from './lib/useWebGLSuportado'
import { palco } from './lib/palco'

// three.js pesa centenas de KB. Carregar ele só quando a cena 3D entra em
// cena deixa a primeira pintura na tela em ms, e quem abriu pelo WhatsApp num
// aparelho simples vê o site antes de a GPU existir.
const Stage = lazy(() => import('./three/Stage').then((m) => ({ default: m.Stage })))

export function App() {
  const reduzido = useReducedMotion()
  const webgl = useWebGLSuportado()
  const [pronto, setPronto] = useState(false)

  useLenis()

  // O preloader só solta quando as fontes carregaram. Se o site aparecesse com
  // a fonte de sistema e depois trocasse, o título daria um salto feio
  // exatamente no primeiro segundo, que é o que a pessoa está olhando.
  useEffect(() => {
    const fontes = document.fonts as FontFaceSet & {
      ready: Promise<unknown>
    }
    let cancelado = false

    fontes.ready
      .catch(() => undefined)
      .finally(() => {
        if (!cancelado) setPronto(true)
      })

    // Rede lenta ou fonte presa não pode segurar o site inteiro.
    const limite = window.setTimeout(() => setPronto(true), 4000)

    return () => {
      cancelado = true
      window.clearTimeout(limite)
    }
  }, [])

  // A cena 3D precisa estar acesa quando o site já abriu, senão o primeiro
  // elemento visível é um fundo vazio.
  useEffect(() => {
    if (reduzido) {
      palco.visivel = true
      palco.farois = 1
    }
  }, [reduzido])

  return (
    <>
      <Preloader pronto={pronto} />

      {/* O canvas 3D fica fixo atrás de tudo e é um só para a página inteira.
          Duas cenas WebGL ao mesmo tempo é o que derruba o site em GPU
          integrada, que é justamente quem mais vai abrir. */}
      {webgl && (
        <Suspense fallback={null}>
          <Stage reduzido={reduzido} />
        </Suspense>
      )}

      <SemWebGLFallback mostrar={!webgl} />

      <Cursor reduzido={reduzido} />
      <BotaoSom />

      <div className="grain relative z-10">
        <main className="relative">
          <Hero reduzido={reduzido} />
          <Manifesto reduzido={reduzido} />
          <CenaCaravan reduzido={reduzido} />
          <LinhaDoTempo reduzido={reduzido} />
          <Galeria />
          <Mural reduzido={reduzido} />
          <BotaoNitro reduzido={reduzido} />
          <Rodape reduzido={reduzido} />
        </main>
      </div>

      <div aria-hidden="true" className="vinheta" />
    </>
  )
}

/**
 * O que aparece no lugar da cena 3D quando o WebGL não abre.
 *
 * Muita gente vai abrir este site pelo WhatsApp, num aparelho que não aguenta.
 * A versão alternativa não é um aviso de erro: é a mesma noite, em imagem
 * estática, com a aura de neon e a tipografia intactas.
 */
function SemWebGLFallback({ mostrar }: { mostrar: boolean }) {
  if (!mostrar) return null

  return (
    <div
      aria-hidden="true"
      className="carbono-fundo pointer-events-none fixed inset-0 z-0"
    >
      {/* As duas manchas de neon no asfalto. Nenhum movimento, nenhuma
          distância percorrida: uma imagem parada é sempre mais leve que uma
          cena queimando bateria. */}
      <div className="absolute top-1/3 left-1/2 h-[42vh] w-[80vw] -translate-x-1/2 rounded-[50%] bg-nitro/12 blur-[90px]" />
      <div className="absolute bottom-1/4 left-1/2 h-[30vh] w-[60vw] -translate-x-1/2 rounded-[50%] bg-neon/10 blur-[80px]" />
    </div>
  )
}
