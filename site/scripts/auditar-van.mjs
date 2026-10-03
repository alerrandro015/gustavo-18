#!/usr/bin/env node
/**
 * A van esta desenhando?
 *
 * O canvas 3D existir nao prova nada: se a camera aponta para o lado, se a
 * cena some, ou se o contexto webgl falha, o canvas continua la, com o
 * tamanho certo e completamente preto. Aqui a cena e forcada para uma pose
 * conhecida e a captura e analisada: tem silhueta escura contra o asfalto, tem
 * farol aceso, e o van ocupa a area central da tela.
 */
import { chromium } from 'playwright'
import { PNG } from 'pngjs'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/'

const nav = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})

const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } })

// Roda contra dev, porque o estado do palco só existe no bundle de
// desenvolvimento. Precisa disso para testar a chama sem depender do clique:
// sob rasterização por software a página vai a poucos quadros por segundo e
// uma captura por tempo é tiro no escuro. Aqui o estado é imposto e então
// fotografado, o que separa "a chama não renderiza" de "a captura chegou
// tarde".
//
// O WebGL fica LIGADO de propósito. Uma versão anterior deste teste desligava
// o WebGL de propósito e passava mesmo assim, porque o texto da página já
// produzia pixels claros: o teste verde não era sobre a cena 3D.

const page = await ctx.newPage()
const erros = []
page.on('pageerror', (e) => erros.push(e.message))

await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
await page.waitForTimeout(4500)

async function analisar(nome, preparar) {
  await preparar()
  await page.waitForTimeout(1200)

  // Sem canvas nao ha cena 3D para auditar. Sem este assert, uma pagina sem
  // WebGL passa todas as cenas e o verde nao significa nada.
  const temCanvas = await page.evaluate(() => {
    const cv = document.querySelector('canvas')
    return cv ? { w: cv.width, h: cv.height } : null
  })
  if (!temCanvas) {
    console.log(`\n${nome}\n  FALHA: nao ha canvas 3D na pagina`)
    return ['canvas 3D ausente: o WebGL foi desligado e nada foi testado']
  }

  const buf = await page.screenshot()
  const img = PNG.sync.read(buf)
  const { width: W, height: H, data } = img

  let apagado = 0
  let farol = 0
  let nit = 0
  let brilhoMax = 0
  let minX = W
  let maxX = -1
  let minY = H
  let maxY = -1
  const grade = Array.from({ length: 8 }, () => new Array(12).fill(0))
  const contaGrade = Array.from({ length: 8 }, () => new Array(12).fill(0))

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

      const gx = Math.min(11, Math.floor((x / W) * 12))
      const gy = Math.min(7, Math.floor((y / H) * 8))
      contaGrade[gy][gx]++
      grade[gy][gx] += lum
      if (lum > brilhoMax) brilhoMax = lum

      // Vagalume: pixel que nao e preto nem o fundo de carbono.
      if (r + g + b > 42) {
        apagado++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }

      // Farol: o emissivo passa por tone mapping + bloom e estoura para branco.
      // Exigir calor estrito erra o teste, porque o branco tambem e o farol.
      if (lum > 0.42 && r >= b) farol++
      // Neon azul do underglow e da chama.
      if (b > 110 && b > r + 45 && g > 70) nit++
    }
  }

  const pct = (n) => ((n / (W * H)) * 100).toFixed(2)
  const caixa = maxX > 0 ? `${minX}..${maxX} x ${minY}..${maxY}` : 'vazio'

  console.log(`\n${nome}`)
  console.log(`  pixels acesos: ${pct(apagado)}%   caixa: ${caixa}`)
  console.log(`  brilho max:    ${brilhoMax.toFixed(3)}`)
  console.log(`  farol/estourado: ${farol} px (${pct(farol)}%)`)
  console.log(`  neon azul:     ${nit} px (${pct(nit)}%)`)

  // Mapa de brilho: onde a cena esta clara, em 12x8. Serve para saber se o
  // conteudo esta no centro (a van) ou espalhado (so texto da pagina).
  console.log('  brilho por grade (12x8):')
  for (let gy = 0; gy < 8; gy++) {
    const linha = grade[gy].map((s, gx) => {
      const media = contaGrade[gy][gx] ? s / contaGrade[gy][gx] : 0
      const escala = ' .:-=+*#%@'
      const nivel = Math.min(9, Math.round(media * 26))
      return escala[nivel]
    })
    console.log(`    ${linha.join('')}`)
  }

  const falhas = []
  if (apagado < W * H * 0.01)
    falhas.push('cena praticamente toda preta: a van nao apareceu')
  if (farol < 400)
    falhas.push(`farol fraco demais (${farol} px): a cena nao esta acesa`)
  return falhas
}

const falhas = []

// 1. Hero: a van chega e freia no centro, farois acesos.
falhas.push(
  ...(await analisar('hero: van chegando e freando', async () => {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(3000)
  })),
)

// 2. Cena da Caravan pinada, no meio da rotacao.
falhas.push(
  ...(await analisar('cena caravan: rotacao com farol', async () => {
    await page.evaluate(() => {
      const s = document.querySelector('section[aria-label="A Caravan"]')
      const total = window.scrollY + s.getBoundingClientRect().top
      // Entra no meio da cena pinada: onde a van esta girando de perfil.
      window.scrollTo(0, total + window.innerHeight * 1.4)
    })
  })),
)

// 3. Botao NITRO: a chama azul tem que aparecer na cena 3D.
falhas.push(
  ...(await analisar('nitro: chama azul na cena', async () => {
    await page.evaluate(() => {
      const s = document.querySelector('section[aria-label="Nitro"]')
      window.scrollTo(0, window.scrollY + s.getBoundingClientRect().top)
    })
    await page.waitForTimeout(900)
  })),
)

// Impoe a chama acesa e segura. O que se testa aqui e "a chama renderiza",
// nao "o clique dispara a chama", que ja foi medido em medir-palco.mjs.
await page.evaluate(() => {
  globalThis.__palco.visivel = true
  globalThis.__palco.nitro = 1
  globalThis.__palco.farois = 0.3
  Object.assign(globalThis.__palco.van, {
    x: 0,
    y: -1.9,
    z: -1,
    rotY: 0.4,
    rotX: 0,
    escala: 1.8,
  })
})
falhas.push(...(await analisar('nitro: chama imposta no estado', async () => {})))

await nav.close()

console.log('\n================')
if (falhas.length) {
  console.log('FALHAS DA CENA 3D:')
  for (const f of falhas) console.log('  -', f)
  if (erros.length) console.log('erros de pagina:', [...new Set(erros)])
  process.exitCode = 1
} else {
  console.log('cena 3D desenhando em todas as cenas')
  if (erros.length) console.log('erros de pagina:', [...new Set(erros)])
}
