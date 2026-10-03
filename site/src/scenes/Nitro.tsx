import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { palco } from '../lib/palco'
import { som } from '../lib/audio'

interface Faisca {
  x: number
  y: number
  vx: number
  vy: number
  vida: number
}

/**
 * Cena 8. O botão NITRO.
 *
 * Botão magnético, faíscas de canvas, tremor de tela, chamas azuis na cena 3D
 * e o som do nitro. Tudo disparado por um único handler, porque um botão que
 * faz cinco coisas por etapas é um botão que falha pela metade.
 */
export function BotaoNitro({ reduzido }: { reduzido: boolean }) {
  const botao = useRef<HTMLButtonElement>(null)
  const secao = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const faiscas = useRef<Faisca[]>([])
  const quadro = useRef(0)
  const [acionado, setAcionado] = useState(0)

  const mostrarFaiscas = useCallback(() => {
    if (reduzido) return
    const cv = canvas.current
    if (!cv) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const largura = cv.clientWidth
    const altura = cv.clientHeight
    cv.width = largura * dpr
    cv.height = altura * dpr

    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    faiscas.current = []
    for (let i = 0; i < 90; i++) {
      const ang = Math.random() * Math.PI * 2
      const forca = 2 + Math.random() * 7
      faiscas.current.push({
        x: largura / 2 + (Math.random() - 0.5) * largura * 0.5,
        y: altura / 2 + (Math.random() - 0.5) * 40,
        vx: Math.cos(ang) * forca,
        vy: Math.sin(ang) * forca - 2,
        vida: 1,
      })
    }

    const desenhar = () => {
      ctx.clearRect(0, 0, largura, altura)
      ctx.globalCompositeOperation = 'lighter'

      for (const f of faiscas.current) {
        f.x += f.vx
        f.y += f.vy
        f.vy += 0.12
        f.vx *= 0.985
        f.vida -= 0.022

        if (f.vida <= 0) continue

        // As faíscas saem laranja e esfriam para o vermelho do nitro.
        const alpha = Math.max(0, f.vida)
        ctx.fillStyle = `rgba(255, ${Math.round(90 * f.vida + 30)}, 0, ${alpha})`
        ctx.fillRect(f.x, f.y, 2.5, 2.5)
      }

      if (faiscas.current.some((f) => f.vida > 0)) {
        quadro.current = requestAnimationFrame(desenhar)
      } else {
        ctx.clearRect(0, 0, largura, altura)
      }
    }

    cancelAnimationFrame(quadro.current)
    quadro.current = requestAnimationFrame(desenhar)
  }, [reduzido])

  useEffect(() => () => cancelAnimationFrame(quadro.current), [])

  // A cena 3D precisa estar acesa aqui. A chama do nitro é um objeto dentro do
  // grupo da Caravan, então sem `visivel` o botão aciona, treme, faz barulho e
  // solta faísca, mas não sai fogo nenhum.
  //
  // Isto é um ScrollTrigger, e não um efeito de montagem, por causa de posse de
  // estado: a cena da Caravan também escreve em `palco.visivel` e o `onLeave`
  // dela roda depois que esta cena já montou, apagando o fogo. Como os gatilhos
  // são resolvidos por posição na rolagem, o deste vence e reasserta a posse.
  useEffect(() => {
    const el = secao.current
    if (!el) return

    if (reduzido) {
      palco.visivel = true
      palco.presenca = 1
      palco.van.x = 0
      palco.van.y = -1.9
      palco.van.z = -1
      palco.van.escala = 1.8
      palco.farois = 0.25
      Object.assign(palco.chama, { x: 0, y: 1.1, z: -0.6, rotX: 0 })
      return
    }

    // A pose entra por tween, e não por `onUpdate`. Esta cena não tem scrub: o
    // que importa é a chegada e a saída, não a posição a cada quadro. Com
    // `onUpdate` a van mudava de pose num único quadro, e o salto aparecia
    // no meio do mural.
    const pose = {
      van: { x: 0, y: -1.9, z: -1, rotY: 0.4, rotX: 0, escala: 1.8 },
      chama: { x: 0, y: 1.1, z: -0.6, rotX: 0 },
    }

    let entrada: gsap.core.Tween | null = null

    const gatilho = ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom top',
      onEnter: entrar,
      onEnterBack: entrar,
      onLeave: soltar,
      onLeaveBack: soltar,
    })

    function entrar() {
      palco.visivel = true
      palco.farois = 0.25
      entrada?.kill()
      entrada = gsap.to(palco.van, {
        ...pose.van,
        duration: 0.7,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      gsap.to(palco.chama, {
        ...pose.chama,
        duration: 0.7,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      gsap.to(palco, {
        presenca: 1,
        duration: 0.7,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    function soltar() {
      entrada?.kill()
      gsap.to(palco, {
        presenca: 0,
        duration: 0.5,
        ease: 'power2.in',
        overwrite: 'auto',
      })
      palco.nitro = 0
    }

    return () => {
      entrada?.kill()
      gatilho.kill()
      soltar()
      // Depois de sair da cena a van não pode continuar encolhendo ao fundo
      // de nada: o estado fica zerado para a próxima cena assumir limpo.
      palco.visivel = false
    }
  }, [reduzido])

  const acionar = () => {
    setAcionado((n) => n + 1)
    mostrarFaiscas()

    if (som.ativo) {
      void som.tocar('nitro')
      void som.tocar('largada', 0.5)
      window.setTimeout(() => void som.tocar('cambio', 0.4), 900)
    }

    if (reduzido) return

    // Chama na cena 3D. Sobe, segura e desce: o tempo do botão e o tempo do
    // fogo precisam casar, senão parece dois efeitos colados.
    gsap.killTweensOf(palco)
    gsap.to(document.body, { x: 0, duration: 0 })
    gsap
      .timeline()
      .to(palco, { nitro: 1, duration: 0.18, ease: 'power3.out' })
      .to(palco, { nitro: 0.35, duration: 0.7, ease: 'sine.inOut' })
      .to(palco, { nitro: 0, duration: 0.5, ease: 'power2.in' })

    // Tremor de tela. Curto e de baixa amplitude: tremor longo enjoa.
    gsap.fromTo(
      document.body,
      { x: -7 },
      { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.28)' },
    )
  }

  // Ímã: o botão puxa na direção do cursor. Calculado no movimento do
  // ponteiro, não em CSS, porque precisa deslocar o elemento de verdade.
  const aoMover = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reduzido) return
    const el = botao.current
    if (!el) return
    const caixa = el.getBoundingClientRect()
    const dx = e.clientX - (caixa.left + caixa.width / 2)
    const dy = e.clientY - (caixa.top + caixa.height / 2)
    gsap.to(el, {
      x: dx * 0.16,
      y: dy * 0.22,
      duration: 0.5,
      ease: 'power3.out',
    })
  }

  const aoSair = () => {
    gsap.to(botao.current, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.4)',
    })
  }

  return (
    <section
      ref={secao}
      className="relative flex min-h-[100svh] flex-col items-center justify-center gap-10 px-5 py-28"
      aria-label="Nitro"
    >
      <p className="max-w-[34ch] text-center text-cromo text-grande leading-tight">
        Todo mundo que dirigiu com ele já sabe como termina essa frase.
      </p>

      <div className="relative">
        <canvas
          ref={canvas}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-24 size-[calc(100%+12rem)]"
        />

        <button
          ref={botao}
          type="button"
          onClick={acionar}
          onPointerMove={aoMover}
          onPointerLeave={aoSair}
          className="display relative text-nitro text-[19vw] leading-[0.8] transition-colors duration-200 select-none hover:text-lanterna active:text-branco sm:text-[11rem]"
          style={{ textShadow: '0 0 40px rgb(255 90 0 / 0.35)' }}
        >
          NITRO
          <span className="sr-only">acionar nitro</span>
        </button>
      </div>

      <p aria-live="polite" className="text-pequeno text-branco/40">
        {acionado > 0
          ? `Acionado ${acionado} ${acionado === 1 ? 'vez' : 'vezes'}`
          : 'Aperta. Ninguém vai te impedir.'}
      </p>
    </section>
  )
}
