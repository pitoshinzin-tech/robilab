// ページごとに読む JS(gzip)を測る。`npm run build` のあとに PowerShell で: node scripts/page-js.mjs / /terms /mouse
// 数え方は docs/design/js-budget.md と同じ(client reference manifest の entryJSFiles + rootMainFiles・polyfill の gzip の合計)。
// 1 行目の「合計」は .next/static/chunks の .js をすべて gzip した合計(js-budget.md の「合計」の列)。
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const NEXT = path.resolve(".next");
const build = JSON.parse(fs.readFileSync(path.join(NEXT, "build-manifest.json"), "utf8"));
const gz = (file) => zlib.gzipSync(fs.readFileSync(path.join(NEXT, file))).length;

let total = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".js")) total += zlib.gzipSync(fs.readFileSync(p)).length;
  }
})(path.join(NEXT, "static", "chunks"));
console.log(`合計(gzip)\t${(total / 1024).toFixed(1)} KB`);

for (const route of process.argv.slice(2)) {
  const file = path.join(NEXT, "server", "app", route === "/" ? "" : route, "page_client-reference-manifest.js");
  if (!fs.existsSync(file)) {
    console.log(`${route}\t(ページなし)`);
    continue;
  }
  globalThis.__RSC_MANIFEST = {};
  new Function(fs.readFileSync(file, "utf8"))();
  const manifest = Object.values(globalThis.__RSC_MANIFEST)[0];
  const files = new Set([...build.rootMainFiles, ...build.polyfillFiles, ...Object.values(manifest.entryJSFiles).flat()]);
  const kb = [...files].reduce((sum, f) => sum + gz(f), 0) / 1024;
  console.log(`${route}\t${kb.toFixed(1)} KB`);
}
