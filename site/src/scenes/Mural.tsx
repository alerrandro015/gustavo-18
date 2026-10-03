import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import mensagens from '../content/messages.json'

interface Mensagem {
  id: string
  autor: string
  relacao: string
  texto: string
}

const lista = mensagens as Mensagem[]

function Faixa({
  itens,
  direcao,
  velocidade,
  parado,
  onSelecionar,
}: {
  itens: Mensagem[]
  direcao: 1 | -1
  velocidade: number
  parado: boolean
  onSelecionar: (indice: number) => void
}) {
  return (
    <div className="flex w-max gap-4 py-2">
      <motion.div
        className="flex shrink-0 gap-4"
        initial={false}
        animate={
          parado ? undefined : { x: direcao === 1 ? ['0%', '-50%'] : ['-50%', '0%'] }
        }
        transition={{ duration: velocidade, repeat: Infinity, ease: 'linear' }}
      >
        {/* O conteúdo aparece duas vezes para o laço ser contínuo: no fim da
            volta o bloco reaparece exatamente onde a animação começou. */}
        {[0, 1].map((copia) =>
          itens.map((m, i) => (
            <button
              key={`${copia}-${m.id}`}
              type="button"
              onClick={() => onSelecionar(i)}
              aria-label={`Ler mensagem de ${m.autor}`}
              className="flex w-[78vw] shrink-0 flex-col gap-1 border-l-2 border-nitro/50 bg-carbono p-5 text-left transition-colors duration-300 hover:border-nitro hover:bg-[#16161a] sm:w-[26rem]"
            >
              <span className="text-pequeno text-cromo">
                {m.autor} · {m.relacao}
              </span>
              <span className="text-corpo text-branco/90">{m.texto}</span>
            </button>
          )),
        )}
      </motion.div>
    </div>
  )
}

/**
 * Cena 7. O mural da galera: as mensagens correm em faixas, cada uma numa
 * direção, e abrem inteiras ao clicar.
 *
 * São duas faixas em direções opostas porque uma só parece letreiro de
 * farmácia. E as faixas param quando o ponteiro entra nelas: letreiro rodando
 * com o dedo em cima é a coisa mais irritante que existe.
 */
export function Mural({ reduzido }: { reduzido: boolean }) {
  const [aberta, setAberta] = useState<number | null>(null)
  const [parado, setParado] = useState(false)

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

  const mensagemAberta = aberta !== null ? lista[aberta] : undefined
  const primeira = lista.slice(0, Math.ceil(lista.length / 2))
  const segunda = lista.slice(Math.ceil(lista.length / 2))

  return (
    <section
      className="relative overflow-hidden border-y border-branco/10 py-24"
      aria-label="Mural da galera"
      onPointerEnter={() => setParado(true)}
      onPointerLeave={() => setParado(false)}
    >
      <h2 className="display text-grande mb-12 px-5 text-branco sm:px-8">
        O que a galera fala
      </h2>

      <div className="flex flex-col gap-4">
        <Faixa
          itens={primeira}
          direcao={1}
          velocidade={78}
          parado={parado || reduzido}
          onSelecionar={(i) => setAberta(i)}
        />
        <Faixa
          itens={segunda}
          direcao={-1}
          velocidade={92}
          parado={parado || reduzido}
          onSelecionar={(i) => setAberta(primeira.length + i)}
        />
      </div>

      {mensagemAberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Mensagem de ${mensagemAberta.autor}`}
          className="fixed inset-0 z-[68] flex items-center justify-center bg-asfalto/92 p-4 backdrop-blur-sm"
          onClick={() => setAberta(null)}
        >
          <blockquote
            className="relative w-full max-w-xl border-l-2 border-nitro bg-carbono p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-grande text-branco leading-tight">
              {mensagemAberta.texto}
            </p>
            <footer className="mt-6 text-corpo text-cromo">
              {mensagemAberta.autor}, {mensagemAberta.relacao}
            </footer>
            <button
              type="button"
              onClick={() => setAberta(null)}
              autoFocus
              className="absolute top-4 right-4 border border-branco/20 px-3 py-1.5 text-pequeno text-cromo transition-colors hover:border-nitro hover:text-branco"
            >
              Fechar
            </button>
          </blockquote>
        </div>
      )}
    </section>
  )
}
