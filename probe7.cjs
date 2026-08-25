const { chromium } = require('@playwright/test');
async function browserGoto(i) {
  const b = await chromium.launch();
  const p = await (await b.newContext()).newPage();
  const t = Date.now();
  let res = 'ok';
  try { await p.goto('http://127.0.0.1:3100/login', { timeout: 25000 }); }
  catch { res = 'TIMEOUT'; }
  console.log(`  browser#${i} ${res} ${Date.now()-t}ms`);
  await b.close();
}
(async () => {
  for (let i=0;i<60;i++){ try{ await fetch('http://127.0.0.1:3100/'); break }catch{ await new Promise(r=>setTimeout(r,250)) } }
  for (let it = 1; it <= 4; it++) {
    console.log(`--- 3 navegadores (threadpool 64), iteración ${it}`);
    await Promise.all([browserGoto(1), browserGoto(2), browserGoto(3)]);
  }
})();
