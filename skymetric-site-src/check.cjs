// Checagem de publicação: serve a pasta por HTTP (como o GitHub Pages) e confere 404, console, overflow, axe, Pixel e formulário.
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..", "skymetric-site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webp": "image/webp" };
const notFound = [];
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(root, p.endsWith("/") ? p + "index.html" : p);
  fs.readFile(file, (e, b) => { if (e) { notFound.push(p); res.writeHead(404); res.end(); } else { res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }); res.end(b); } });
}).listen(4195);

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const rep = { errors: [], overflow: {}, axe: {}, pixel: [], lead: null };
  for (const w of [360, 390, 768, 1280, 1920]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 800 : 900 } });
    await ctx.route(/facebook\.(net|com)/, r => { rep.pixel.push(r.request().url().split("?")[0]); r.abort(); });
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error" && !/facebook|ERR_FAILED/.test(m.text())) rep.errors.push(w + ": " + m.text()); });
    page.on("pageerror", e => rep.errors.push(w + ": " + e.message));
    for (const pg of ["", "privacidade.html"]) {
      await page.goto("http://localhost:4195/" + pg, { waitUntil: "load" });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload({ waitUntil: "load" });
      await page.waitForTimeout(900);
      rep.overflow[(pg || "index") + "-" + w] = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (w === 390 || w === 1280) rep.axe[(pg || "index") + "-" + w] = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations.map(v => v.id + ": " + v.nodes.map(n => n.target.join(" ")).slice(0, 5).join(" | "));
    }
    if (w === 1280) {
      await page.goto("http://localhost:4195/", { waitUntil: "load" });
      await page.evaluate(() => { window.__ev = []; const o = window.fbq; window.fbq = function () { window.__ev.push([].slice.call(arguments)); }; window.open = function (u) { window.__open = u; }; });
      await page.fill("[name=nome]", "Teste"); await page.fill("[name=empresa]", "Empresa"); await page.selectOption("[name=verba]", { index: 3 });
      await page.click("[data-form] button");
      rep.lead = await page.evaluate(() => ({ ev: window.__ev, open: (window.__open || "").slice(0, 60) }));
      rep.links = await page.evaluate(() => [].map.call(document.querySelectorAll(".foot a"), a => a.getAttribute("href")));
    }
    await ctx.close();
  }
  rep.pixel = [...new Set(rep.pixel)];
  rep.notFound = notFound;
  console.log(JSON.stringify(rep, null, 1));
  await browser.close(); server.close();
})();
