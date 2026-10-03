import { Howl } from 'howler'

/**
 * Som sintetizado, não gravado.
 *
 * O site não deve pesar por causa de um `.mp3`, e ninguém tem um motor de van
 * gravado em casa. então os quatro efeitos são montados em WebAudio e entregues
 * ao Howler já prontos. O Howler continua sendo o player: ele cuida de volume,
 * deUnlock no primeiro gesto e de não tocar antes do usuário pedir.
 */

const TAXA = 44100

export type Efeito = 'motor' | 'nitro' | 'cambio' | 'largada'

function ruido(ctx: OfflineAudioContext, segundos: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.ceil(TAXA * segundos), TAXA)
  const dados = buffer.getChannelData(0)
  for (let i = 0; i < dados.length; i++) {
    dados[i] = Math.random() * 2 - 1
  }
  return buffer
}

/** Ronco parado em ponto morto: duas ondas graves por dentro de um passa-baixa. */
function motor(ctx: OfflineAudioContext): void {
  const duracao = 2
  const grave = ctx.createOscillator()
  grave.type = 'sawtooth'
  grave.frequency.value = 58

  const sub = ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 29

  // Lento e irregular: um motor parado não é uma tom uniforme.
  const tremor = ctx.createOscillator()
  tremor.frequency.value = 3.4
  const tremorGanho = ctx.createGain()
  tremorGanho.gain.value = 6
  tremor.connect(tremorGanho).connect(grave.frequency)

  const passaBaixa = ctx.createBiquadFilter()
  passaBaixa.type = 'lowpass'
  passaBaixa.frequency.value = 220
  passaBaixa.Q.value = 3

  const ganho = ctx.createGain()
  ganho.gain.value = 0

  grave.connect(passaBaixa)
  sub.connect(passaBaixa)
  passaBaixa.connect(ganho).connect(ctx.destination)

  // Fade curto nas pontas para o loop não estalar ao repetir.
  ganho.gain.setValueAtTime(0, 0)
  ganho.gain.linearRampToValueAtTime(0.5, 0.05)
  ganho.gain.setValueAtTime(0.5, duracao - 0.05)
  ganho.gain.linearRampToValueAtTime(0, duracao)

  grave.start(0)
  sub.start(0)
  tremor.start(0)
  grave.stop(duracao)
  sub.stop(duracao)
  tremor.stop(duracao)
}

/** Nitrous: ar passando com pressão, e o baque no fim. */
function nitro(ctx: OfflineAudioContext): void {
  const duracao = 1.4
  const fonte = ctx.createBufferSource()
  fonte.buffer = ruido(ctx, duracao)

  const passaBanda = ctx.createBiquadFilter()
  passaBanda.type = 'bandpass'
  passaBanda.Q.value = 1.1
  passaBanda.frequency.setValueAtTime(400, 0)
  passaBanda.frequency.exponentialRampToValueAtTime(3800, 0.28)
  passaBanda.frequency.exponentialRampToValueAtTime(600, duracao)

  const sopro = ctx.createGain()
  sopro.gain.setValueAtTime(0, 0)
  sopro.gain.linearRampToValueAtTime(0.42, 0.06)
  sopro.gain.exponentialRampToValueAtTime(0.001, duracao)

  const baque = ctx.createOscillator()
  baque.type = 'sine'
  baque.frequency.setValueAtTime(140, 0)
  baque.frequency.exponentialRampToValueAtTime(38, 0.35)
  const baqueGanho = ctx.createGain()
  baqueGanho.gain.setValueAtTime(0.5, 0)
  baqueGanho.gain.exponentialRampToValueAtTime(0.001, 0.45)

  fonte.connect(passaBanda).connect(sopro).connect(ctx.destination)
  baque.connect(baqueGanho).connect(ctx.destination)

  fonte.start(0)
  baque.start(0)
  baque.stop(0.5)
}

/** Câmbio: o clique curto entre marcha. */
function cambio(ctx: OfflineAudioContext): void {
  const duracao = 0.28
  const fonte = ctx.createBufferSource()
  fonte.buffer = ruido(ctx, duracao)

  const passaAlta = ctx.createBiquadFilter()
  passaAlta.type = 'highpass'
  passaAlta.frequency.value = 1800

  const ganho = ctx.createGain()
  ganho.gain.setValueAtTime(0.34, 0)
  ganho.gain.exponentialRampToValueAtTime(0.001, duracao)

  fonte.connect(passaAlta).connect(ganho).connect(ctx.destination)
  fonte.start(0)
}

/** Largada: a agulha subindo e soltando. */
function largada(ctx: OfflineAudioContext): void {
  const duracao = 2.2
  const giro = ctx.createOscillator()
  giro.type = 'sawtooth'
  giro.frequency.setValueAtTime(70, 0)
  giro.frequency.exponentialRampToValueAtTime(320, 1.1)
  giro.frequency.exponentialRampToValueAtTime(120, duracao)

  const passaBaixa = ctx.createBiquadFilter()
  passaBaixa.type = 'lowpass'
  passaBaixa.frequency.value = 1400

  const ganho = ctx.createGain()
  ganho.gain.setValueAtTime(0, 0)
  ganho.gain.linearRampToValueAtTime(0.34, 0.12)
  ganho.gain.setValueAtTime(0.34, 1.2)
  ganho.gain.exponentialRampToValueAtTime(0.001, duracao)

  giro.connect(passaBaixa).connect(ganho).connect(ctx.destination)
  giro.start(0)
  giro.stop(duracao)
}

const CONSTRUTORES: Record<Efeito, (ctx: OfflineAudioContext) => void> = {
  motor,
  nitro,
  cambio,
  largada,
}

const cache = new Map<Efeito, string>()

/**
 * O Howler só sabe carregar de URL: ele faz o XHR e chama `decodeAudioData`.
 * Então o buffer sintetizado precisa virar um WAV de verdade para ser entregue
 * a ele. 16 bits mono é mais do que suficiente para ronco e sopro, e mantém o
 * arquivo temporário minúsculo.
 */
function audioBufferParaWav(buffer: AudioBuffer): Blob {
  const canal = buffer.getChannelData(0)
  const bytesPorAmostra = 2
  const cabecalho = 44
  const tamanho = 36 + canal.length * bytesPorAmostra
  const vista = new DataView(new ArrayBuffer(tamanho))

  const escreverTexto = (offset: number, texto: string) => {
    for (let i = 0; i < texto.length; i++) {
      vista.setUint8(offset + i, texto.charCodeAt(i))
    }
  }

  escreverTexto(0, 'RIFF')
  vista.setUint32(4, tamanho - 8, true)
  escreverTexto(8, 'WAVE')
  escreverTexto(12, 'fmt ')
  vista.setUint32(16, 16, true) // tamanho do bloco fmt
  vista.setUint16(20, 1, true) // PCM
  vista.setUint16(22, 1, true) // mono
  vista.setUint32(24, buffer.sampleRate, true)
  vista.setUint32(28, buffer.sampleRate * bytesPorAmostra, true)
  vista.setUint16(32, bytesPorAmostra, true)
  vista.setUint16(34, 16, true)
  escreverTexto(36, 'data')
  vista.setUint32(40, canal.length * bytesPorAmostra, true)

  let offset = cabecalho
  for (let i = 0; i < canal.length; i++) {
    const limitado = Math.max(-1, Math.min(1, canal[i]!))
    vista.setInt16(offset, limitado < 0 ? limitado * 0x8000 : limitado * 0x7fff, true)
    offset += bytesPorAmostra
  }

  return new Blob([vista], { type: 'audio/wav' })
}

async function render(efeito: Efeito): Promise<string | null> {
  const pronto = cache.get(efeito)
  if (pronto) return pronto

  // Safari antigo não expõe `OfflineAudioContext` no namespace global, só o
  // prefixo `webkit`. Sem esse fallback o site fica sem som no iPhone.
  const Construtor: typeof OfflineAudioContext =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext

  if (!Construtor) return null

  const duracoes: Record<Efeito, number> = {
    motor: 2,
    nitro: 1.4,
    cambio: 0.28,
    largada: 2.2,
  }

  try {
    const ctx = new Construtor(1, Math.ceil(TAXA * duracoes[efeito]), TAXA)
    CONSTRUTORES[efeito](ctx)
    const buffer = await ctx.startRendering()
    const url = URL.createObjectURL(audioBufferParaWav(buffer))
    cache.set(efeito, url)
    return url
  } catch {
    return null
  }
}

/** O ronco entra no loop e roda enquanto o site estiver com som ligado. */
class Som {
  private instancias = new Map<Efeito, Howl>()
  private carregando = new Map<Efeito, Promise<Howl | null>>()
  private ligado = false

  async carregar(efeito: Efeito, loop = false): Promise<Howl | null> {
    const jaExiste = this.instancias.get(efeito)
    if (jaExiste) return jaExiste

    const pendente = this.carregando.get(efeito)
    if (pendente) return pendente

    const trabalho = (async () => {
      const url = await render(efeito)
      if (!url) return null
      const howl = new Howl({
        src: [url],
        format: ['wav'],
        loop,
        volume: efeito === 'motor' ? 0.22 : 0.7,
        html5: false,
      })
      this.instancias.set(efeito, howl)
      return howl
    })()

    this.carregando.set(efeito, trabalho)
    return trabalho
  }

  async tocar(efeito: Efeito, volume?: number): Promise<void> {
    const howl = await this.carregar(efeito)
    if (!howl || !this.ligado) return
    howl.volume(volume ?? howl.volume())
    howl.play()
  }

  async ligar(): Promise<void> {
    this.ligado = true
    const motor = await this.carregar('motor', true)
    if (motor && !motor.playing()) motor.play()
  }

  desligar(): void {
    this.ligado = false
    this.instancias.forEach((howl) => howl.stop())
  }

  get ativo(): boolean {
    return this.ligado
  }

  setVolume(valor: number): void {
    this.instancias.forEach((howl) => howl.volume(valor))
  }
}

export const som = new Som()
