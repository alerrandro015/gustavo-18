/**
 * Fotos da galeria.
 *
 * Todos os arquivos vivem em `public/fotos/`. Cada foto existe em dois
 * tamanhos: `foto-NN.jpg` para o quadro da grade (900px) e
 * `foto-NN-cheia.jpg` (1600px) para quando a foto abre em tela cheia. O
 * clique em tela cheia é raro e a imagem ali é cara; a grade é o que todo
 * mundo vê, então é a que precisa ser leve.
 *
 * As imagens são quase todas retrato (21 de 25) e a grade usa
 * `aspect-3/4`. Com `aspect-4/3` uma foto de rosto em pé era cortada pelo
 * topo e pela base, e o corte caía justamente em cima dos olhos.
 *
 * Alt text: os textos abaixo são **provisórios**. Quem montou isto não
 * consegue ver as fotos, então não seria honesto inventar o que há em cada
 * uma. Troque por uma descrição curta e verdadeira antes de mandar o link
 * para gente — é o que o leitor de tela anuncia, e é a única forma de quem
 * não enxerga saber quem é quem nas fotos.
 */
export interface Foto {
  id: string
  /** Caminho do quadro na grade. */
  src: string
  /** Caminho da versão grande, usada ao abrir em tela cheia. */
  srcCheia: string
  /** Descrição da imagem para leitor de tela. Ver nota acima. */
  alt: string
}

/** A foto que abre a galeria: a camisa do Brasil. */
export const DESTAQUE = 'foto-18'

export const fotos: Foto[] = [
  {
    id: 'foto-01',
    src: '/fotos/foto-01.jpg',
    srcCheia: '/fotos/foto-01-cheia.jpg',
    alt: 'Foto 01',
  },
  {
    id: 'foto-02',
    src: '/fotos/foto-02.jpg',
    srcCheia: '/fotos/foto-02-cheia.jpg',
    alt: 'Foto 02',
  },
  {
    id: 'foto-03',
    src: '/fotos/foto-03.jpg',
    srcCheia: '/fotos/foto-03-cheia.jpg',
    alt: 'Foto 03',
  },
  {
    id: 'foto-04',
    src: '/fotos/foto-04.jpg',
    srcCheia: '/fotos/foto-04-cheia.jpg',
    alt: 'Foto 04',
  },
  {
    id: 'foto-05',
    src: '/fotos/foto-05.jpg',
    srcCheia: '/fotos/foto-05-cheia.jpg',
    alt: 'Foto 05',
  },
  {
    id: 'foto-06',
    src: '/fotos/foto-06.jpg',
    srcCheia: '/fotos/foto-06-cheia.jpg',
    alt: 'Foto 06',
  },
  {
    id: 'foto-07',
    src: '/fotos/foto-07.jpg',
    srcCheia: '/fotos/foto-07-cheia.jpg',
    alt: 'Foto 07',
  },
  {
    id: 'foto-08',
    src: '/fotos/foto-08.jpg',
    srcCheia: '/fotos/foto-08-cheia.jpg',
    alt: 'Foto 08',
  },
  {
    id: 'foto-09',
    src: '/fotos/foto-09.jpg',
    srcCheia: '/fotos/foto-09-cheia.jpg',
    alt: 'Foto 09',
  },
  {
    id: 'foto-10',
    src: '/fotos/foto-10.jpg',
    srcCheia: '/fotos/foto-10-cheia.jpg',
    alt: 'Foto 10',
  },
  {
    id: 'foto-11',
    src: '/fotos/foto-11.jpg',
    srcCheia: '/fotos/foto-11-cheia.jpg',
    alt: 'Foto 11',
  },
  {
    id: 'foto-12',
    src: '/fotos/foto-12.jpg',
    srcCheia: '/fotos/foto-12-cheia.jpg',
    alt: 'Foto 12',
  },
  {
    id: 'foto-13',
    src: '/fotos/foto-13.jpg',
    srcCheia: '/fotos/foto-13-cheia.jpg',
    alt: 'Foto 13',
  },
  {
    id: 'foto-14',
    src: '/fotos/foto-14.jpg',
    srcCheia: '/fotos/foto-14-cheia.jpg',
    alt: 'Foto 14',
  },
  {
    id: 'foto-15',
    src: '/fotos/foto-15.jpg',
    srcCheia: '/fotos/foto-15-cheia.jpg',
    alt: 'Foto 15',
  },
  {
    id: 'foto-16',
    src: '/fotos/foto-16.jpg',
    srcCheia: '/fotos/foto-16-cheia.jpg',
    alt: 'Foto 16',
  },
  {
    id: 'foto-17',
    src: '/fotos/foto-17.jpg',
    srcCheia: '/fotos/foto-17-cheia.jpg',
    alt: 'Foto 17',
  },
  {
    id: 'foto-18',
    src: '/fotos/foto-18.jpg',
    srcCheia: '/fotos/foto-18-cheia.jpg',
    alt: 'Foto 18',
  },
  {
    id: 'foto-19',
    src: '/fotos/foto-19.jpg',
    srcCheia: '/fotos/foto-19-cheia.jpg',
    alt: 'Foto 19',
  },
  {
    id: 'foto-20',
    src: '/fotos/foto-20.jpg',
    srcCheia: '/fotos/foto-20-cheia.jpg',
    alt: 'Foto 20',
  },
  {
    id: 'foto-21',
    src: '/fotos/foto-21.jpg',
    srcCheia: '/fotos/foto-21-cheia.jpg',
    alt: 'Foto 21',
  },
  {
    id: 'foto-22',
    src: '/fotos/foto-22.jpg',
    srcCheia: '/fotos/foto-22-cheia.jpg',
    alt: 'Foto 22',
  },
  {
    id: 'foto-23',
    src: '/fotos/foto-23.jpg',
    srcCheia: '/fotos/foto-23-cheia.jpg',
    alt: 'Foto 23',
  },
  {
    id: 'foto-24',
    src: '/fotos/foto-24.jpg',
    srcCheia: '/fotos/foto-24-cheia.jpg',
    alt: 'Foto 24',
  },
  {
    id: 'foto-25',
    src: '/fotos/foto-25.jpg',
    srcCheia: '/fotos/foto-25-cheia.jpg',
    alt: 'Foto 25',
  },
]
