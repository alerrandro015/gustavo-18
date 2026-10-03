/**
 * Fonte única de verdade do site. O que muda de um aniversário pro outro
 * mora aqui e em mais nenhum lugar.
 */
export const config = {
  nome: 'Gustavo',
  idade: 18,

  /** A única coisa que precisa trocar a cada ano. */
  nascimento: '2008-10-03',

  /** Frase do manifesto, uma entrada por verso. */
  manifesto: ['18 anos.', 'Zero freio.', 'Família em primeiro lugar.'],

  assinatura: 'Você é foda, Gustavo.',
  de: 'Alerrandro e a galera',

  /** Frase curta que fica sob a data. */
  dedicatoria: 'Para o Gustavo que ainda não freou.',
} as const

export type Config = typeof config

/**
 * Dias vividos até agora. Calcula a partir da data real, então o número do
 * site nunca mente e não precisa ser atualizado à mão.
 */
export function diasVividos(agora: Date = new Date()): number {
  const nasceu = new Date(`${config.nascimento}T00:00:00`)
  const msPorDia = 1000 * 60 * 60 * 24
  return Math.floor((agora.getTime() - nasceu.getTime()) / msPorDia)
}

/** Aniversários por cima. 6574 dias ≈ 18 anos. */
export function formatarDias(dias: number): string {
  return new Intl.NumberFormat('pt-BR').format(dias)
}
