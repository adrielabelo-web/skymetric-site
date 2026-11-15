// Prepara os arquivos do site da SkyMetric a partir da identidade visual e da textura da NASA.
// Rodar com: set NODE_PATH=<pasta com sharp>\node_modules  &&  node build-assets.cjs
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ID = "C:/Users/Adriel/Downloads/skymetric-identidade/SkyMetric";
const SRC = __dirname;
const OUT = path.resolve(__dirname, "..", "skymetric-site");
const mk = (p) => fs.mkdirSync(p, { recursive: true });
mk(path.join(OUT, "fonts")); mk(path.join(OUT, "assets"));

// 1) fontes da marca (Magistral), só WOFF2 e só os pesos usados
for (const w of ["Light", "Book", "Medium", "Bold", "ExtraBold"]) {
  fs.copyFileSync(`${ID}/ID VISUAL ABERTA/Magistral Font/Magistral-${w}.woff2`, path.join(OUT, "fonts", `Magistral-${w}.woff2`));
}
// 2) logos e elementos em SVG
const svg = `${ID}/LOGOTIPO - ELEMENTOS/SVG/`;
for (const f of ["logo-p-branco", "logo-p-color", "aguia-branca", "aguia-azul", "aguia-branca2", "logo-let-branco",
  "elemento1", "elemento2", "elemento3", "elemento4", "elemento5", "elemento6", "elemento7", "elemento8", "elemento9", "elemento10", "elemento11"]) {
  fs.copyFileSync(svg + f + ".svg", path.join(OUT, "assets", f + ".svg"));
}

(async () => {
  // 3) textura da Terra à noite (NASA Black Marble), 4096x2048, embutida num .js como data URI
  //    para o WebGL conseguir ler também quando a página é aberta por duplo clique (file://).
  const tex = await sharp(path.join(SRC, "nasa", "night_three.jpg")).resize(4096, 2048).webp({ quality: 80 }).toBuffer();
  fs.writeFileSync(path.join(OUT, "earth-tex.js"), `/* Terra à noite: NASA Earth Observatory, Black Marble (domínio público). */\nwindow.SKY_EARTH_TEX="data:image/webp;base64,${tex.toString("base64")}";\n`);
  console.log("earth-tex.js", (tex.length * 1.34 / 1024).toFixed(0), "KB");

  // 4) ícones: favicon a partir da águia azul, apple-touch e og-image simples
  const aguia = fs.readFileSync(svg + "aguia-branca.svg");
  const mark = await sharp(aguia, { density: 600 }).resize({ width: 120 }).png().toBuffer();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: "#0A0C10" } }).composite([{ input: mark, gravity: "center" }]).png().toFile(path.join(OUT, "assets", "apple-touch-icon.png"));
  const logo = await sharp(fs.readFileSync(svg + "logo-p-branco.svg"), { density: 400 }).resize({ width: 620 }).png().toBuffer();
  const night = await sharp(path.join(SRC, "nasa", "night_three.jpg")).extract({ left: 600, top: 500, width: 2400, height: 1260 }).resize(1200, 630).modulate({ brightness: 1.5 }).toBuffer();
  await sharp(night).composite([{ input: Buffer.from(`<svg width="1200" height="630"><rect width="1200" height="630" fill="#0A0C10" opacity=".55"/></svg>`) }, { input: logo, gravity: "center" }]).png({ compressionLevel: 9 }).toFile(path.join(OUT, "assets", "og-image.png"));

  // prévia dos elementos gráficos, para escolher quais usar
  const cells = [];
  for (let i = 1; i <= 11; i++) {
    const b = await sharp(fs.readFileSync(svg + `elemento${i}.svg`), { density: 200 }).resize(220, 220, { fit: "contain", background: "#2A68D8" }).flatten({ background: "#2A68D8" }).png().toBuffer();
    cells.push({ input: b, left: ((i - 1) % 6) * 230 + 10, top: Math.floor((i - 1) / 6) * 230 + 10 });
  }
  await sharp({ create: { width: 1390, height: 470, channels: 3, background: "#1b1b1b" } }).composite(cells).jpeg().toFile(path.join(SRC, "elementos-prev.jpg"));
  console.log("ok");
})();
