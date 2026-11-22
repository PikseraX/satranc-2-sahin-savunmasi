const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const searchPaths = [
  path.join(root, 'package.json'),
  path.resolve(root, '..', 'Devre Mimarı', 'package.json'),
];

function resolveDep(id) {
  for (const pkgPath of searchPaths) {
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const req = createRequire(pkgPath);
      return req(id);
    } catch (_) {}
  }
  throw new Error(`Could not resolve dependency: ${id}`);
}

function resolveDepPath(id) {
  for (const pkgPath of searchPaths) {
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const req = createRequire(pkgPath);
      return req.resolve(id);
    } catch (_) {}
  }
  throw new Error(`Could not resolve path: ${id}`);
}

async function main() {
  const postcss = resolveDep('postcss');
  const tailwind = resolveDep('tailwindcss');

  let html = fs.readFileSync(path.join(root, 'satran_2_tam_s_r_m_3d_webgl_s_r_m.html'), 'utf8');
  const i18nJs = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8');
  const threeJs = fs.readFileSync(path.join(root, 'vendor', 'three.min.js'), 'utf8')
    .replace(/<\/script>/gi, '<\\/script>');

  const { css } = await postcss([
    tailwind({
      content: [
        { raw: html, extension: 'html' },
        { raw: i18nJs, extension: 'js' },
      ],
    }),
  ]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });

  let fonts = '';
  const interDir = path.dirname(resolveDepPath('@fontsource/inter/package.json'));
  for (const weight of [400, 600, 700, 800, 900]) {
    for (const subset of ['latin', 'latin-ext']) {
      const cssFile = path.join(interDir, `${subset}-${weight}.css`);
      if (!fs.existsSync(cssFile)) continue;
      fonts += fs.readFileSync(cssFile, 'utf8')
        .replace(/,\s*url\([^)]+\.woff\) format\('woff'\)/g, '')
        .replace(/url\(([^)]+)\)/g, (_, url) => {
          const file = path.resolve(interDir, url.replace(/['"]/g, ''));
          return `url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')})`;
        });
    }
  }

  html = html
    .replace(/\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '')
    .replace(/\s*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js"><\/script>/, `\n    <script>${threeJs}</script>`)
    .replace(/\s*<link href="https:\/\/fonts\.googleapis\.com[^>]+>/, '')
    .replace('<style>', `<style>${fonts}\n${css}</style>\n    <style>`)
    .replace(/<script src="\.\/i18n\.js"><\/script>/, () => `<script>${i18nJs}</script>`);

  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    new vm.Script(match[1]);
  }
  if (/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html)) {
    throw new Error('External runtime dependency remains in offline bundle');
  }

  fs.mkdirSync(path.join(root, 'generated'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'generated', 'game-html.js'),
    `// Generated from satran_2_tam_s_r_m_3d_webgl_s_r_m.html; do not edit.\nexport default ${JSON.stringify(html)};\n`
  );
  console.log(`Offline Satranc 2 bundle prepared (${Math.round(Buffer.byteLength(html) / 1024)} KB, 0 external deps).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
