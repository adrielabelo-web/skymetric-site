// Abre o site por file:// (como no duplo clique), tira screenshots e roda overflow + axe.
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const path = require("path");
const { pathToFileURL } = require("url");
const fs = require("fs");

const site = path.resolve(__dirname, "..", "skymetric-site", "index.html");
const out = path.join(__dirname, "shots"); fs.mkdirSync(out, { recursive: true });
const only = process.argv[2] || "all";

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const rep = { errors: [], overflow: {}, axe: {}, gl: {} };
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 600 ? 2 : 1 });
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error") rep.errors.push(w + ": " + m.text()); });
    page.on("pageerror", e => rep.errors.push(w + ": " + e.message));
    await page.goto(pathToFileURL(site).href, { waitUntil: "load" });
    await page.waitForTimeout(2200);
    rep.gl[w] = await page.evaluate(() => document.querySelector(".hero").className);
    await page.screenshot({ path: path.join(out, `hero-${w}.png`) });
    if (only === "all") {
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: "instant" }); await new Promise(r => setTimeout(r, 110)); } window.scrollTo({ top: 0, behavior: "instant" }); });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(out, `full-${w}.png`), fullPage: true });
      rep.overflow[w] = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (w !== 768) rep.axe[w] = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.map(v => v.id + ": " + v.nodes.map(n => n.target.join(" ")).slice(0, 6).join(" | "));
    }
    await ctx.close();
  }
  console.log(JSON.stringify(rep, null, 1));
  await browser.close();
})();
