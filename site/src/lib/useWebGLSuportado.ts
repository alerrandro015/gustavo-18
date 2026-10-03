import { useState } from 'react'

/**
 * Boa parte do público chega por link de WhatsApp, em aparelho simples e com GPU
 * integrada. Descobrir isso na hora que o WebGL estoura é tarde demais, então a
 * checagem acontece antes de montar qualquer canvas.
 */
export interface WebGLResultado {
  suportado: boolean
  motivo?: string
}

function detectar(): WebGLResultado {
  if (typeof window === 'undefined') {
    return { suportado: false, motivo: 'sem window' }
  }

  if (!('WebGLRenderingContext' in window)) {
    return { suportado: false, motivo: 'WebGL indisponível' }
  }

  // O patamar de CPU mais fraco que ainda aparece em celular. Abaixo disso a
  // cena 3D engasga, e a leitura fica pior do que a imagem estática.
  const nucleos = navigator.hardwareConcurrency ?? 8
  if (nucleos <= 2) {
    return { suportado: false, motivo: 'CPU fraca' }
  }

  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memoria !== undefined && memoria <= 2) {
    return { suportado: false, motivo: 'memória insuficiente' }
  }

  const toque = window.matchMedia('(pointer: coarse)').matches
  if (toque && nucleos <= 4) {
    return { suportado: false, motivo: 'celular modesto' }
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) {
      return { suportado: false, motivo: 'contexto não abriu' }
    }
    // Descarta o contexto de teste; só queria saber se ele abria.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { suportado: true }
  } catch {
    return { suportado: false, motivo: 'erro ao criar contexto' }
  }
}

export function useWebGLSuportado(): boolean {
  const [resultado] = useState(detectar)
  return resultado.suportado
}
