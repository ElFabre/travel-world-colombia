import { chromium } from 'playwright'

const URL = 'http://localhost:3100'
const browser = await chromium.launch()

// Desktop — navbar (top)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: 'scripts/shot-navbar-desktop.png' })

// Desktop — footer (scroll to bottom)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(600)
await page.screenshot({ path: 'scripts/shot-footer-desktop.png' })

// Full page desktop
await page.screenshot({ path: 'scripts/shot-full-desktop.png', fullPage: true })
await ctx.close()

// Mobile — navbar + hamburger open
const mctx = await browser.newContext({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 })
const mpage = await mctx.newPage()
await mpage.goto(URL, { waitUntil: 'networkidle' })
await mpage.waitForTimeout(600)
await mpage.screenshot({ path: 'scripts/shot-navbar-mobile.png' })
// abrir menú hamburger
await mpage.getByRole('button', { name: /menú/i }).click().catch(() => {})
await mpage.waitForTimeout(400)
await mpage.screenshot({ path: 'scripts/shot-menu-mobile.png' })
await mctx.close()

await browser.close()
console.log('OK screenshots')
