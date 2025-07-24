const fs   = require("fs-extra");
const path = require("path");

async function render(filePath, templatesDir) {
  let content = await fs.readFile(filePath, "utf8");
  const includeRE = /@@include\(["'](.+?)["']\)/g;
  let match;

  while ((match = includeRE.exec(content))) {
    const [ fullTag, tplName ] = match;
    const tplPath = path.join(templatesDir, tplName);
    // renderizar la plantilla incluida
    const rendered = await render(tplPath, templatesDir);
    // reemplazar la marca por el HTML resultante
    content = 
      content.slice(0, match.index) +
      rendered +
      content.slice(match.index + fullTag.length);
    // reubicar el cursor del regex
    includeRE.lastIndex = match.index + rendered.length;
  }

  return content;
}

async function build() {
  const tplDir = path.join(__dirname, "website", "templates");
  const outDir = path.join(__dirname, "dist");

  // limpia y prepara dist/
  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  // renderiza index.html completo
  const html = await render(path.join(tplDir, "index.html"), tplDir);
  await fs.writeFile(path.join(outDir, "index.html"), html, "utf8");

  // copia assets (css, imágenes…)
  await fs.copy(path.join(__dirname, "website", "assets"), path.join(outDir, "assets"));

  console.log("✅ Build completado en ./dist");
}

build().catch(err => {
  console.error("❌ Error en build:", err);
  process.exit(1);
});
