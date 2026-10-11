const { chromium } = require('playwright'); const { spawn } = require('child_process');
(async () => {
  const [,, url, out] = process.argv; const FPS=30;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1200, height: 2000 } });
  await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  const dur = await p.evaluate(() => window.DUR); const st = await p.$('#stage');
  const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','png','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',out], { stdio: ['pipe','inherit','inherit'] });
  const N = Math.round(dur*FPS);
  for (let i=0;i<N;i++){
    await p.evaluate(t => window.renderAt(t), i/FPS);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const buf = await st.screenshot({ type:'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i%120===0) console.log('frame', i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
