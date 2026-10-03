/**
 * O semáforo da arrancada: vermelho, amarelo, verde.
 *
 * É o único momento do site em que a interface usa a metáfora do carro de
 * verdade, e é o que segura a pessoa na tela antes do site aparecer.
 */
export function Semaphore({
  fase,
  size = 'md',
}: {
  fase: 'vermelho' | 'amarelo' | 'verde'
  size?: 'sm' | 'md'
}) {
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5'
  const lampada = size === 'sm' ? 'size-2' : 'size-3'

  const acesa = (cor: 'vermelho' | 'amarelo' | 'verde') =>
    fase === cor
      ? {
          vermelho: 'bg-lanterna shadow-[0_0_12px_rgb(255_30_30/0.9)]',
          amarelo: 'bg-nitro shadow-[0_0_12px_rgb(255_90_0/0.9)]',
          verde: 'bg-neon shadow-[0_0_12px_rgb(0_208_255/0.9)]',
        }[cor]
      : 'bg-[#141416]'

  return (
    <div className={`flex flex-col ${gap}`} role="img" aria-label="Semáforo">
      <span
        className={`${lampada} rounded-full transition-all duration-500 ${acesa('vermelho')}`}
      />
      <span
        className={`${lampada} rounded-full transition-all duration-500 ${acesa('amarelo')}`}
      />
      <span
        className={`${lampada} rounded-full transition-all duration-500 ${acesa('verde')}`}
      />
    </div>
  )
}
