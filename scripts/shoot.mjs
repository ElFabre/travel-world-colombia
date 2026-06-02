import { chromium } from 'playwright'

const URL = 'http://localhost:3100'
const browser = await chromium.launch()

// ── Desktop ──
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'load' })
await page.waitForTimeout(3500) // dejar cargar imágenes picsum + slowZoom

const titleBefore = (await page.locator('h1').first().textContent())?.trim()
console.log('Título inicial:', titleBefore)
await page.screenshot({ path: 'scripts/shot-hero-desktop.png' })

// Cambiar de destino: clic en thumbnail de Japón
await page.getByRole('button', { name: 'Ver destino: Japón' }).click()
await page.waitForTimeout(1500) // crossfade 0.9s + fadeUp
const titleAfter = (await page.locator('h1').first().textContent())?.trim()
console.log('Título tras clic Japón:', titleAfter)
await page.screenshot({ path: 'scripts/shot-hero-switched.png' })

console.log(titleBefore !== titleAfter ? 'OK: el destino cambió' : 'FALLO: no cambió')
await ctx.close()

// ── Mobile (iPhone 14 ~390px) ──
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
const mpage = await mctx.newPage()
await mpage.goto(URL, { waitUntil: 'load' })
await mpage.waitForTimeout(3500)
await mpage.screenshot({ path: 'scripts/shot-hero-mobile.png' })
await mctx.close()

await browser.close()
console.log('OK screenshots')
