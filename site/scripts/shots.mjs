#!/usr/bin/env node
/**
 * Tira screenshots do site em varios pontos da rolagem, para revisao visual.
 * Uso: node scripts/shots.mjs [url] [saida]
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const saida = process.argv[3] ?? '/tmp/shots'

await mkdir(saida, { recursive: true })

const nav = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: [
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
})

const erros = []

async function tira(nome, opts) {
  const page = await nav
    .newContext({
      viewport: opts.viewport ?? { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      hasTouch: Boolean(opts.toque),
      isMobile: Boolean(opts.toque),
    })
    .then((c) => c.newPage())

  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(`[${nome}] console: ${m.text()}`)
  })
  page.on('pageerror', (e) => erros.push(`[${nome}] pageerror: ${e.message}`))

  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })

  if (opts.reducedMotion) {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  }

  // Espera o preloader abrir.
  await page.waitForTimeout(opts.espera ?? 4200)

  if (opts.scroll) {
    await page.evaluate(async (y) => {
      const passos = 40
      for (let i = 0; i <= passos; i++) {
        window.scrollTo(0, (y * i) / passos)
        await new Promise((r) => setTimeout(r, 45))
      }
    }, opts.scroll)
    await page.waitForTimeout(opts.EsperaFinal ?? 1400)
  }

  await page.screenshot({ path: `${saida}/${nome}.png` })
  await page.context().close()
  console.log(`ok ${nome}`)
}

const alturaTotal = async () => {
  const page = await nav.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })
  const h = await page.evaluate(() => document.body.scrollHeight)
  await page.close()
  return h
}

const H = await alturaTotal()
console.log(`altura do documento: ${H}px`)

await tira('01-hero', {})
await tira('02-manifesto', { scroll: H * 0.13 })
await tira('03-caravan', { scroll: H * 0.3 })
await tira('04-timeline', { scroll: H * 0.48 })
await tira('05-galeria', { scroll: H * 0.66 })
await tira('06-mural', { scroll: H * 0.8 })
await tira('07-nitro-rodape', { scroll: H * 0.97 })
await tira('08-mobile', { toque: true, viewport: { width: 390, height: 844 } })
await tira('09-reduced', { reducedMotion: true, scroll: H * 0.3 })

await nav.close()

if (erros.length) {
  console.log('\n--- ERROS DE PAGINA ---')
  for (const e of [...new Set(erros)]) console.log(e)
  process.exitCode = 1
} else {
  console.log('\nsem erros de console')
}
