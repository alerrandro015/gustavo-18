import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fotos, type Foto } from '../content/fotos'

/**
 * O desenho que ocupa o lugar de cada foto: asfalto, o número da cena e a
 * silhueta do van. Também é o que aparece se a foto real não carregar.
 */
function Lugar({ indice, alt }: { indice: number; alt: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className="absolute inset-0 size-full"
      role="img"
      aria-label={alt}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`ceu-${indice}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#101013" />
          <stop offset="60%" stopColor="#0a0a0d" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <radialGradient id={`halo-${indice}`} cx="50%" cy="72%" r="46%">
          <stop offset="0%" stopColor="#ff5a00" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ff5a00" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#ceu-${indice})`} />
      <ellipse cx="200" cy="216" rx="150" ry="70" fill={`url(#halo-${indice})`} />

      {/* Silhueta do van, no mesmo espírito da cena 3D: só a forma importa. */}
      <g fill="#05050a" opacity="0.92">
        <rect x="120" y="176" width="160" height="46" rx="14" />
        <rect x="140" y="140" width="112" height="40" rx="12" />
        <circle cx="152" cy="226" r="17" />
        <circle cx="250" cy="226" r="17" />
      </g>

      {/* Faróis. São os dois únicos pontos claros da cena. */}
      <circle cx="272" cy="188" r="4.5" fill="#fff2d8" />
      <circle cx="272" cy="188" r="12" fill="#ffe9c4" opacity="0.22" />
      <circle cx="288" cy="188" r="4.5" fill="#fff2d8" />
      <circle cx="288" cy="188" r="12" fill="#ffe9c4" opacity="0.22" />

      <text
        x="200"
        y="278"
        textAnchor="middle"
        fontFamily="'Anton', sans-serif"
        fontSize="15"
        fill="#b8bcc4"
        opacity="0.5"
        letterSpacing="3"
      >
        {String(indice + 1).padStart(2, '0')}
      </text>
    </svg>
  )
}

function Quadro({
  foto,
  indice,
  onAbrir,
}: {
  foto: Foto
  indice: number
  onAbrir: () => void
}) {
  const [falhou, setFalhou] = useState(false)
  const [ondulado, setOndulado] = useState(false)

  const mostraFoto = foto.src && !falhou

  return (
    <motion.figure
      className="group relative aspect-4/3 cursor-zoom-in overflow-hidden border border-branco/10 bg-carbono"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      onClick={onAbrir}
      onPointerEnter={() => setOndulado(true)}
      onPointerLeave={() => setOndulado(false)}
    >
      {/* A distorção ondulada entra pelo filtro SVG `ondula`, definido no fim
          da seção. É a mesma conta do shader de deslocamento, feita pela GPU
          sem abrir um segundo contexto WebGL. */}
      <div
        className={`absolute inset-0 transition-[filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          ondulado ? 'seta-som [filter:url(#ondula)]' : ''
        }`}
      >
        {mostraFoto ? (
          <img
            src={foto.src}
            alt={foto.alt}
            loading="lazy"
            decoding="async"
            onError={() => setFalhou(true)}
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <Lugar indice={indice} alt={foto.alt} />
        )}
      </div>

      {/* Duotone: a foto perde a cor original e ganha o nitro. Isso amarra a
          galeria à paleta e faz fotos de anos diferentes lerem como um
          conjunto só. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-nitro/15 mix-blend-color"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-asfalto via-transparent to-transparent opacity-70"
      />

      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="text-pequeno text-branco/85">{foto.alt}</span>
        <span className="font-display text-branco/40 text-sm">
          {String(indice + 1).padStart(2, '0')}
        </span>
      </figcaption>
    </motion.figure>
  )
}

/**
 * Cena 6. Fotos que ondulam ao passar o mouse e abrem em tela cheia.
 *
 * Sem um segundo contexto WebGL: a distorção é um filtro SVG na própria imagem.
 * Em GPU integrada, dois canvases WebGL ao mesmo tempo é o que derruba o site
 * justamente na cena que ele deveria impressionar.
 */
export function Galeria() {
  const [aberta, setAberta] = useState<number | null>(null)

  useEffect(() => {
    if (aberta === null) return

    const aoTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(null)
    }

    document.addEventListener('keydown', aoTecla)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', aoTecla)
      document.body.style.overflow = anterior
    }
  }, [aberta])

  const fotoAberta = aberta !== null ? fotos[aberta] : undefined

  return (
    <section className="relative px-5 py-28 sm:px-8" aria-label="Galeria">
      <div className="relative mx-auto max-w-6xl">
        <h2 className="display text-grande mb-10 text-branco">O que sobrou</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto, i) => (
            <Quadro key={foto.id} foto={foto} indice={i} onAbrir={() => setAberta(i)} />
          ))}
        </div>
      </div>

      {fotoAberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fotoAberta.alt}
          className="fixed inset-0 z-[68] flex items-center justify-center bg-asfalto/92 p-4 backdrop-blur-sm"
          onClick={() => setAberta(null)}
        >
          <figure
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-4/3 w-full overflow-hidden border border-branco/15">
              <Lugar indice={aberta as number} alt={fotoAberta.alt} />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <span className="text-corpo text-branco">{fotoAberta.alt}</span>
              <button
                type="button"
                onClick={() => setAberta(null)}
                autoFocus
                className="border border-branco/20 px-4 py-2 text-pequeno text-cromo transition-colors hover:border-nitro hover:text-branco"
              >
                Fechar
              </button>
            </figcaption>
          </figure>
        </div>
      )}

      <svg aria-hidden="true" className="pointer-events-none absolute size-0">
        <filter id="ondula">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.014"
            numOctaves="2"
            seed="7"
            result="ruido"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="ruido"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </section>
  )
}
