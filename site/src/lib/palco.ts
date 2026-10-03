/**
 * Estado da cena 3D, fora do React de propósito.
 *
 * O ScrollTrigger precisa mandar a Caravan andar, girar e acender farol a 60
 * quadros por segundo. Se isso passasse por estado do React, cada quadro seria
 * um render da árvore inteira. Aqui é um objeto mutável: o GSAP escreve, o
 * `useFrame` lê. Nenhum dos dois re-renderiza nada.
 */
export interface EstadoPalco {
  /** Posição e atitude da Caravan, em unidades de cena. */
  van: {
    x: number
    y: number
    z: number
    rotY: number
    rotX: number
    escala: number
  }
  /** A cena está no ar? Fora do ar, a van some em vez de ficar parada à toa. */
  visivel: boolean
  /** 0 = faróis apagados, 1 = faróis acesos. */
  farois: number
  /** 0 = sem chamas, 1 = nitro em chamas. */
  nitro: number
  /**
   * De 0 a 1: o quanto o van está presente na cena.
   *
   * Isto não é visibilidade liga/desliga. Com um booleano a van some e
   * reaparece no meio da rolagem, e o corte aparece justamente quando a cena
   * está girando mais rápido. Aqui a van encolhe e afunda no asfalto, que é o
   * que um carro fazendo manobra está de fato fazendo.
   */
  presenca: number
  /**
   * Onde a chama nasce, em coordenadas locais da Caravan.
   *
   * A chama é filha do grupo da van, e por isso a carroceria a esconde quando
   * ela fica atrás do para-choque: a câmera olha de frente, o van está no
   * meio, e a chama some. Por isso cada cena diz onde a chama deve nascer em
   * vez de deixar um único lugar fixo que só funciona em um dos lados.
   */
  chama: {
    x: number
    y: number
    z: number
    rotX: number
  }
  /** Deslocamento de câmara ligado ao cursor. */
  camera: {
    x: number
    y: number
  }
}

export const palco: EstadoPalco = {
  van: { x: 0, y: 0, z: 0, rotY: 0, rotX: 0, escala: 1 },
  visivel: false,
  farois: 0,
  nitro: 0,
  presenca: 1,
  chama: { x: 0, y: 0.1, z: -3.4, rotX: -Math.PI / 2 },
  camera: { x: 0, y: 0 },
}

/** Devolve o palco ao estado de repouso, sem recriar o objeto. */
export function resetarPalco(): void {
  palco.van.x = 0
  palco.van.y = 0
  palco.van.z = 0
  palco.van.rotY = 0
  palco.van.rotX = 0
  palco.van.escala = 1
  palco.visivel = false
  palco.farois = 0
  palco.nitro = 0
  palco.presenca = 0
  palco.chama.x = 0
  palco.chama.y = 0.1
  palco.chama.z = -3.4
  palco.chama.rotX = -Math.PI / 2
  palco.camera.x = 0
  palco.camera.y = 0
}

// Gancho de depuração. `import.meta.env.DEV` é substituído por `false` no
// build, então esta linha não existe no bundle de produção. Sem ela, descobrir
// por que a cena 3D não aparece vira adivinhação: o sintoma é sempre "não vi
// o fogo", e a causa pode estar em seis arquivos diferentes.
if (import.meta.env.DEV) {
  ;(globalThis as unknown as { __palco?: EstadoPalco }).__palco = palco
}
