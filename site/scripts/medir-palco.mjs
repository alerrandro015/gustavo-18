#!/usr/bin/env node
/**
 * Mede o estado do palco 3D em cada cena, para achar por que a cena nao
 * aparece. Roda contra o servidor de dev, porque o gancho de depuracao do
 * palco so existe no bundle de desenvolvimento.
 *
 * Uso: node scripts/medir-palco.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'

const nav = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } })

// O WebGL e desligado de proposito: sob SwiftShader (rasterizacao por
// software) o canvas derruba a pagina para uns 3 quadros por segundo, e
// medir a curva do nitro nesse regime mede o rasterizador, nao a animacao.
// Com o canvas fora, sobra medir a linha do tempo, que e o que interessa.
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 })
})

const page = await ctx.newPage()

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(5000)

// O GSAP anexa um cache `_gsap` no objeto, o que torna JSON.stringify
// circular. Por isso os campos sao lidos um a um.
const ler = () =>
  page.evaluate(() => {
    const p = globalThis.__palco
    if (!p) return { erro: 'gancho __palco ausente (rode contra dev)' }
    return {
      visivel: p.visivel,
      nitro: p.nitro,
      farois: p.farois,
      van: { ...p.van },
      camera: { ...p.camera },
    }
  })

async function medir(nome, ir) {
  await ir()
  await page.waitForTimeout(900)
  const p = await ler()
  console.log(
    `${nome.padEnd(24)} visivel=${p.visivel} nitro=${Number(p.nitro).toFixed(2)} ` +
      `farois=${Number(p.farois).toFixed(2)} ` +
      `van=(${p.van.x.toFixed(1)},${p.van.y.toFixed(1)},${p.van.z.toFixed(1)}) ` +
      `rotY=${p.van.rotY.toFixed(2)} esc=${p.van.escala.toFixed(2)}`,
  )
  return p
}

const para =
  (sel, mult = 0) =>
  async () => {
    await page.evaluate(
      ([s, m]) => {
        const el = document.querySelector(s)
        const base = window.scrollY + el.getBoundingClientRect().top
        window.scrollTo(0, base + window.innerHeight * m)
      },
      [sel, mult],
    )
  }

console.log('--- estado do palco por cena ---')
await medir('hero (topo)', async () => page.evaluate(() => window.scrollTo(0, 0)))
await medir('manifesto', para('section[aria-label="Manifesto"]', 0.5))
await medir('caravan 25%', para('section[aria-label="A Caravan"]', 0.7))
await medir('caravan 50%', para('section[aria-label="A Caravan"]', 1.5))
await medir('caravan 80%', para('section[aria-label="A Caravan"]', 2.4))
await medir('timeline', para('section[aria-label="Linha do tempo"]', 0.5))
await medir('galeria', para('section[aria-label="Galeria"]', 0.5))
await medir('mural', para('section[aria-label="Mural da galera"]', 0.5))
await medir('nitro parado', para('section[aria-label="Nitro"]', 0.5))

console.log('\n--- presenca: a transicao e suave no tempo? ---')
// A varredura por scroll gave um salto de 0.38, mas isso nao prova corte: com
// scroll saltando e amostras a 90ms, um tween de 0.7s com power2 tem
// deslocamento legitimo nessa escala. O que separa corte de transicao e o
// tempo: entao aqui o gatilho e deixado disparar sozinho e cada quadro e lido.
const transicao = await page.evaluate(async () => {
  const conta = document.documentElement.scrollHeight - window.innerHeight
  // Posiciona logo antes do fim da cena da Caravan, sem saltar o gatilho.
  const alvo = document.querySelector('section[aria-label="A Caravan"]')
  const rect = alvo.getBoundingClientRect()
  const base = window.scrollY + rect.top
  window.scrollTo(0, Math.max(0, base + window.innerHeight * 2.2))

  const amostras = []
  const t0 = performance.now()
  let lido = false
  await new Promise((resolve) => {
    const passo = () => {
      const p = globalThis.__palco.presenca
      if (!lido && p < 0.999) lido = true
      if (lido) amostras.push([Math.round(performance.now() - t0), p])
      if (performance.now() - t0 < 2600) requestAnimationFrame(passo)
      else resolve()
    }
    requestAnimationFrame(passo)
  })
  return { amostras, conta }
})

const tr = transicao.amostras
if (tr.length < 10) {
  console.log(`  FALHA: a presenca nao saiu de 1 em ${tr.length} amostras`)
} else {
  let maiorPasso = 0
  let em = 0
  for (let i = 1; i < tr.length; i++) {
    const passo = Math.abs(tr[i][1] - tr[i - 1][1])
    if (passo > maiorPasso) {
      maiorPasso = passo
      em = tr[i][0]
    }
  }
  const durou = tr.at(-1)[0]
  console.log(
    `  ${tr.length} quadros, de ${tr[0][1].toFixed(2)} a ${tr.at(-1)[1].toFixed(2)} em ${durou}ms`,
  )
  console.log(`  maior salto por quadro: ${maiorPasso.toFixed(3)} em ${em}ms`)

  // Corte de verdade e um degrau de 1 inteiro num unico quadro. Um tween
  // nunca faz isso: no maximo anda a duracao total divido pelos quadros.
  if (maiorPasso > 0.35) {
    console.log(
      `  FALHA: presenca pulou ${maiorPasso.toFixed(2)} num so quadro, isso e corte`,
    )
  } else if (durou < 200) {
    console.log(
      `  FALHA: a transicao durou ${durou}ms, rapido demais para ser animacao`,
    )
  } else {
    console.log('  ok: a presenca sai de cena por interpolacao, sem degrau')
  }
}

console.log('\n--- nitro amostrado dentro da pagina, quadro a quadro ---')
// Amostrar de fora depende do tempo de ida e volta do Playwright e dá leitura
// errada. Aqui o rAF da própria página guarda a curva do tempo do nitro.
await page.evaluate(() => {
  globalThis.__amostra = []
  const t0 = performance.now()
  const passo = () => {
    globalThis.__amostra.push([
      Math.round(performance.now() - t0),
      globalThis.__palco.nitro,
    ])
    if (performance.now() - t0 < 2000) requestAnimationFrame(passo)
  }
  requestAnimationFrame(passo)
})

await page.click('section[aria-label="Nitro"] button')
await page.waitForTimeout(2100)

const curva = await page.evaluate(() => globalThis.__amostra)
const pico = Math.max(...curva.map((c) => c[1]))
const picoEm = curva.find((c) => c[1] >= pico - 0.001)?.[0]
// O primeiro zero só conta DEPOIS do pico. Antes dele, as amostras valem zero
// porque o clique ainda não tinha acontecido.
const primeiroZero = curva.find((c) => c[0] > picoEm && c[1] < 0.02)?.[0]
console.log(
  `  amostras: ${curva.length}, pico nitro=${pico.toFixed(3)} em ${picoEm}ms, ` +
    `volta a zero em ${primeiroZero}ms`,
)

const marcos = [0, 100, 200, 300, 500, 700, 900, 1100, 1300, 1500, 1800]
const linha = marcos.map((ms) => {
  const prox = curva.find((c) => c[0] >= ms)
  return `${ms}:${prox ? prox[1].toFixed(2) : '--'}`
})
console.log('  curva ' + linha.join('  '))

if (pico < 0.95)
  console.log(`  FALHA: o nitro chegou so a ${pico.toFixed(2)}, deveria chegar a 1`)
if (primeiroZero === undefined) console.log('  FALHA: o nitro nunca voltou a zero')
else if (primeiroZero - picoEm < 600) {
  console.log(
    `  FALHA: o nitro durou so ${primeiroZero - picoEm}ms, a timeline pede ~1200ms`,
  )
}

await nav.close()
