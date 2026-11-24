// Gera os ícones PNG a partir de icons/logo-source.html
// uso: node scripts/gerar-icones.js  (com o app servido em http://localhost:8765)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = path.join(__dirname, '..', 'icons');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  await p.goto('http://localhost:8765/icons/logo-source.html');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  // logo transparente (usado dentro do app)
  await p.screenshot({ path: `${out}/logo-512.png`, omitBackground: true });
  // ícone do app (fundo preto, escudo com margem p/ "maskable")
  await p.evaluate(() => { document.body.classList.add('bg'); document.getElementById('shield').style.transform = 'scale(0.8)'; });
  await p.screenshot({ path: `${out}/icon-512.png` });
  // versão 192 px: mesma página renderizada em escala menor
  const p2 = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 0.375 });
  await p2.goto('http://localhost:8765/icons/logo-source.html');
  await p2.evaluate(() => document.fonts.ready);
  await p2.evaluate(() => { document.body.classList.add('bg'); document.getElementById('shield').style.transform = 'scale(0.8)'; });
  await p2.waitForTimeout(300);
  await p2.screenshot({ path: `${out}/icon-192.png` });
  await b.close();
  console.log('ícones gerados em', out);
})();
