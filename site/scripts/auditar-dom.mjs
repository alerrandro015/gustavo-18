#!/usr/bin/env node
/**
 * Auditoria de DOM: mede o que esta de fato na tela.
 *
 * Screenshots dizem se a pagina parece boa, mas nao dizem por que um botao
 * sumiu. Aqui cada cena e rolada ate o centro e conferida: caixa visivel,
 * cor computada, transbordo horizontal e tamanho de alvo de toque.
 *
 * Uso: node scripts/auditar-dom.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const problemas = []

const nav = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})

async function abrir(opts = {}) {
  const ctx = await nav.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 900 },
    hasTouch: Boolean(opts.toque),
    isMobile: Boolean(opts.toque),
  })
  const page = await ctx.newPage()
  if (opts.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' })
  const erros = []
  page.on('pageerror', (e) => erros.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text())
  })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(opts.espera ?? 4000)
  return { ctx, page, erros }
}

/** Rola um elemento ate o centro da viewport e devolve a caixa medida. */
async function centralizar(page, seletor) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { erro: 'nao encontrado' }
    el.scrollIntoView({ block: 'center', behavior: 'instant' })
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        resolve({
          texto: (el.textContent ?? '').trim().slice(0, 60),
          x: Math.round(r.x),
          y: Math.round(r.y),
          w: Math.round(r.width),
          h: Math.round(r.height),
          cor: cs.color,
          fonte: cs.fontFamily.split(',')[0].replace(/"/g, ''),
          display: cs.display,
          visivel: r.width > 0 && r.height > 0,
          naTela:
            r.bottom > 0 &&
            r.top < window.innerHeight &&
            r.right > 0 &&
            r.left < window.innerWidth,
          centroNaTela:
            r.top < window.innerHeight / 2 && r.bottom > window.innerHeight / 2,
        })
      })
    })
  }, seletor)
}

function checar(nome, r, expectativas = {}) {
  if (r.erro) {
    problemas.push(`${nome}: ${r.erro}`)
    return
  }
  const marca = r.visivel && r.naTela ? 'ok  ' : 'FALHA'
  if (!r.visivel) problemas.push(`${nome}: elemento sem caixa (display ${r.display})`)
  else if (!r.naTela) problemas.push(`${nome}: fora da viewport apos centralizar`)

  console.log(
    `${marca} ${nome.padEnd(22)} ${String(r.w).padStart(5)}x${String(r.h).padStart(4)}` +
      `  cor=${r.cor}  fonte=${r.fonte}  "${r.texto}"`,
  )

  if (expectativas.cor && !r.cor.includes(expectativas.cor)) {
    problemas.push(`${nome}: cor ${r.cor} diferente do esperado ${expectativas.cor}`)
  }
  if (expectativas.fonte && r.fonte !== expectativas.fonte) {
    problemas.push(
      `${nome}: fonte ${r.fonte} diferente do esperado ${expectativas.fonte}`,
    )
  }
}

// ---------- desktop ----------
{
  const { ctx, page, erros } = await abrir()

  console.log('--- cenas centralizadas (1440x900) ---')
  checar('hero nome', await centralizar(page, 'section[aria-label*="anos"] .display'), {
    fonte: 'Anton',
  })
  checar(
    'manifesto',
    await centralizar(page, 'section[aria-label="Manifesto"] .display'),
    {
      fonte: 'Anton',
    },
  )
  checar(
    'caravan placa',
    await centralizar(page, 'section[aria-label="A Caravan"] span.border-2'),
  )
  checar(
    'timeline marco',
    await centralizar(page, 'section[aria-label="Linha do tempo"] article h3'),
  )
  checar('galeria', await centralizar(page, 'section[aria-label="Galeria"] figure'))
  checar(
    'mural secao',
    await centralizar(page, 'section[aria-label="Mural da galera"]'),
  )
  checar(
    'mural titulo',
    await centralizar(page, 'section[aria-label="Mural da galera"] h2'),
  )
  checar('nitro botao', await centralizar(page, 'section[aria-label="Nitro"] button'), {
    cor: '255, 90, 0',
    fonte: 'Anton',
  })
  checar('rodape', await centralizar(page, 'footer p.display'))

  // Transbordo horizontal: a causa mais comum de scroll lateral no celular.
  const transbordo = await page.evaluate(() => {
    const d = document.documentElement
    const vazando = []
    for (const el of document.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      // Um elemento que sai da tela so causa rolagem lateral se nenhum
      // ancestral cortar o transbordo. Faixas de marquee e trilhos pinos sao
      // deslocados de proposito dentro de um container com overflow hidden.
      let cortado = false
      for (let a = el.parentElement; a; a = a.parentElement) {
        const ov = getComputedStyle(a).overflowX
        if (ov === 'hidden' || ov === 'clip' || ov === 'auto' || ov === 'scroll') {
          cortado = true
          break
        }
      }
      if (cortado) continue
      if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2)) {
        vazando.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} ` +
            `[${Math.round(r.left)}..${Math.round(r.right)}]`,
        )
      }
    }
    return {
      scrollWidth: d.scrollWidth,
      clientWidth: d.clientWidth,
      amostra: vazando.slice(0, 6),
      total: vazando.length,
    }
  })
  console.log(
    `\ntransbordo horizontal: scrollWidth ${transbordo.scrollWidth} vs client ${transbordo.clientWidth}` +
      ` (${transbordo.total} elementos fora)`,
  )
  for (const a of transbordo.amostra) console.log('   ', a)
  if (transbordo.scrollWidth > transbordo.clientWidth + 2) {
    problemas.push(
      `transbordo horizontal: ${transbordo.scrollWidth} > ${transbordo.clientWidth}`,
    )
  }

  // O canvas 3D realmente desenhou alguma coisa?
  const canvas = await page.evaluate(() => {
    const cv = document.querySelector('canvas')
    if (!cv) return { erro: 'sem canvas' }
    return { w: cv.width, h: cv.height }
  })
  console.log(`canvas 3D: ${canvas.w}x${canvas.h}`)

  // Alvos de toque pequenos demais.
  const pequenos = await page.evaluate(() => {
    const maus = []
    for (const el of document.querySelectorAll('a, button')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.height < 32 || r.width < 32) {
        maus.push(
          `${el.tagName.toLowerCase()} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent ?? '').trim().slice(0, 30)}"`,
        )
      }
    }
    return maus
  })
  if (pequenos.length) {
    console.log('\nalvos pequenos:')
    for (const p of pequenos.slice(0, 8)) console.log('   ', p)
    problemas.push(`${pequenos.length} alvos de toque abaixo de 32px`)
  }

  if (erros.length)
    problemas.push(`erros de console: ${[...new Set(erros)].join(' | ')}`)
  await ctx.close()
}

// ---------- mobile ----------
{
  const { ctx, page, erros } = await abrir({
    toque: true,
    viewport: { width: 390, height: 844 },
  })
  console.log('\n--- mobile (390x844) ---')
  checar('hero nome', await centralizar(page, 'section[aria-label*="anos"] .display'), {
    fonte: 'Anton',
  })
  checar('nitro botao', await centralizar(page, 'section[aria-label="Nitro"] button'), {
    cor: '255, 90, 0',
  })
  checar('rodape', await centralizar(page, 'footer p.display'))

  const t = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  console.log(`transbordo mobile: ${t.scrollWidth} vs ${t.clientWidth}`)
  if (t.scrollWidth > t.clientWidth + 2) {
    problemas.push(`transbordo mobile: ${t.scrollWidth} > ${t.clientWidth}`)
  }
  if (erros.length) problemas.push(`erros mobile: ${[...new Set(erros)].join(' | ')}`)
  await ctx.close()
}

// ---------- movimento reduzido ----------
{
  const { ctx, page, erros } = await abrir({ reducedMotion: true })
  console.log('\n--- movimento reduzido ---')
  checar(
    'timeline marco',
    await centralizar(page, 'section[aria-label="Linha do tempo"] article h3'),
  )
  checar('nitro botao', await centralizar(page, 'section[aria-label="Nitro"] button'))
  checar('rodape numero', await centralizar(page, 'footer p.display'))

  // Sem movimento, nada pode depender de animação para aparecer.
  const invisiveis = await page.evaluate(() => {
    const maus = []
    for (const el of document.querySelectorAll('h2, h3, p, button')) {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && Number(cs.opacity) < 0.05) {
        maus.push(
          `${el.tagName.toLowerCase()} opacity=${cs.opacity} "${(el.textContent ?? '').trim().slice(0, 40)}"`,
        )
      }
    }
    return maus
  })
  if (invisiveis.length) {
    console.log('\nconteudo invisivel sem movimento:')
    for (const i of invisiveis.slice(0, 8)) console.log('   ', i)
    problemas.push(`${invisiveis.length} elementos com opacity 0 em movimento reduzido`)
  }
  if (erros.length) problemas.push(`erros reduced: ${[...new Set(erros)].join(' | ')}`)
  await ctx.close()
}

await nav.close()

console.log('\n================')
if (problemas.length) {
  console.log('PROBLEMAS:')
  for (const p of problemas) console.log('  -', p)
  process.exitCode = 1
} else {
  console.log('nenhum problema encontrado')
}
