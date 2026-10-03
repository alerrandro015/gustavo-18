import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fotos, DESTAQUE, type Foto } from '../content/fotos'

function Quadro({
  foto,
  indice,
  destaque,
  onAbrir,
}: {
  foto: Foto
  indice: number
  destaque: boolean
  onAbrir: () => void
}) {
  const [falhou, setFalhou] = useState(false)
  const [ondulado, setOndulado] = useState(false)

  return (
    <motion.figure
      className="group relative aspect-3/4 cursor-zoom-in overflow-hidden border border-branco/10 bg-carbono"
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
        {falhou ? (
          <div className="flex size-full items-center justify-center bg-carbono">
            <span className="font-display text-branco/25 text-sm">{foto.alt}</span>
          </div>
        ) : (
          <img
            src={foto.src}
            alt={foto.alt}
            loading="lazy"
            decoding="async"
            onError={() => setFalhou(true)}
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
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
        <span className="text-pequeno text-branco/85">
          {destaque && (
            <span className="mr-2 bg-nitro px-1.5 py-0.5 font-display text-asfalto text-xs">
              a favorita
            </span>
          )}
          {foto.alt}
        </span>
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
            <Quadro
              key={foto.id}
              foto={foto}
              indice={i}
              destaque={foto.id === DESTAQUE}
              onAbrir={() => setAberta(i)}
            />
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
            {/* `object-contain` aqui, e não `cover`: em tela cheia o objetivo é
                ver a foto inteira. Cortar para preencher a moldura seria
                perder justamente o que a pessoa abriu para ver. */}
            <div className="relative flex max-h-[76svh] w-full justify-center border border-branco/15">
              <img
                src={fotoAberta.srcCheia}
                alt={fotoAberta.alt}
                decoding="async"
                className="max-h-[76svh] w-auto object-contain"
              />
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
