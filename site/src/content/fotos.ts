/**
 * Fotos da galeria.
 *
 * Não existe nenhuma imagem no repositório, e placeholders de retângulo cinza
 * estragam a única cena do site que depende de olhar. Então o lugar de cada foto
 * é desenhado: asfalto, o número da cena e uma silhueta. Placeholder que tem
 * intenção lê como parte do desenho; placeholder genérico lê como erro.
 *
 * Para usar fotos de verdade: ponha os arquivos em `public/fotos/` e ajuste o
 * `src` de cada entrada, por exemplo `/fotos/van.jpg`. O `onError` do componente
 * já cai para o desenho quando o arquivo não está lá.
 */
export interface Foto {
  id: string
  /** Caminho real, opcional. Vazio desenha o lugar. */
  src?: string
  alt: string
}

export const fotos: Foto[] = [
  { id: 'van', src: '/fotos/van.jpg', alt: 'A Caravan estacionada à noite' },
  { id: 'rota', src: '/fotos/rota.jpg', alt: 'A estrada de madrugada, antes de tudo' },
  { id: 'rolagem', src: '/fotos/rolagem.jpg', alt: 'Rolagem no pátio da escola' },
  {
    id: 'graxa',
    src: '/fotos/graxa.jpg',
    alt: 'Mãos sujas de graxa depois da oficina',
  },
  { id: 'praia', src: '/fotos/praia.jpg', alt: 'O ano que todo mundo lembra' },
  { id: 'família', src: '/fotos/familia.jpg', alt: 'A família reunida' },
]
