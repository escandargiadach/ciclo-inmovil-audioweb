/* Efectos elementales al cambiar de Casa. Un solo disparo por cambio; el canvas
   se limpia y no consume nada al terminar. */
(() => {
  "use strict";

  const canvas = document.getElementById("fxCanvas");
  const veil = document.getElementById("fxVeil");
  if (!canvas || !veil) return;
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W, H, DPR, raf = 0, endAt = 0, drawFn = null;

  function sizeCanvas() {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function runFx(duration, fn) {
    cancelAnimationFrame(raf);
    sizeCanvas();
    endAt = performance.now() + duration;
    drawFn = fn;
    const loop = now => {
      ctx.clearRect(0, 0, W, H);
      if (now < endAt && drawFn) { drawFn(now); raf = requestAnimationFrame(loop); }
      else { drawFn = null; ctx.clearRect(0, 0, W, H); }
    };
    raf = requestAnimationFrame(loop);
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const center = () => [W / 2, H * 0.42];
  const mobile = () => Math.min(W, H) < 700;

  /* ---- Fulgur: rayos ramificados ---- */
  function makeBolt(x0, y0, x1, y1, jitter, depth) {
    const pts = [[x0, y0]];
    const segs = 14;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push([
        x0 + (x1 - x0) * t + rnd(-jitter, jitter) * Math.sin(t * Math.PI),
        y0 + (y1 - y0) * t + rnd(-jitter * .4, jitter * .4)
      ]);
    }
    pts.push([x1, y1]);
    const branches = [];
    if (depth > 0) {
      const n = 2 + (Math.random() * 2 | 0);
      for (let b = 0; b < n; b++) {
        const i = 3 + (Math.random() * (pts.length - 6) | 0);
        const [bx, by] = pts[i];
        const ang = Math.atan2(y1 - y0, x1 - x0) + rnd(-1.1, 1.1);
        const len = rnd(30, 80);
        branches.push(makeBolt(bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, jitter * .5, depth - 1));
      }
    }
    return { pts, branches };
  }

  function drawBolt(b, alpha, width) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#eaf3ff";
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.shadowColor = "#2f7bff";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    b.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
    ctx.strokeStyle = "rgba(120,180,255,.5)";
    ctx.lineWidth = width * 2.6;
    ctx.shadowBlur = 26;
    ctx.stroke();
    ctx.restore();
    b.branches.forEach(br => drawBolt(br, alpha * .7, Math.max(1, width * .6)));
  }

  function fxFulgur() {
    const [cx, cy] = center();
    const M = mobile() ? 1.45 : 1;
    const R = Math.min(W, H) * 0.2;
    const strikes = [];
    const nStrikes = mobile() ? 8 : 6;
    for (let i = 0; i < nStrikes; i++) {
      const edge = Math.random();
      const sx = edge < .5 ? rnd(10, W - 10) : (edge < .75 ? 6 : W - 6);
      const sy = edge < .5 ? (Math.random() < .5 ? 6 : H * .55) : rnd(10, H * .6);
      const ang = rnd(0, Math.PI * 2);
      const tx = cx + Math.cos(ang) * R, ty = cy + Math.sin(ang) * R;
      strikes.push({ t0: i * 130 + rnd(0, 50), bolt: makeBolt(sx, sy, tx, ty, 34, 2), impact: [tx, ty] });
    }
    const start = performance.now();
    veil.style.background = "radial-gradient(circle at 50% 42%, rgba(140,190,255,.25), transparent 70%)";
    runFx(1150, now => {
      const t = now - start;
      strikes.forEach(s => {
        const dt = t - s.t0;
        if (dt < 0 || dt > 200) return;
        const a = dt < 60 ? 1 : 1 - (dt - 60) / 140;
        drawBolt(s.bolt, Math.max(0, a), 2.4 * M);
        ctx.save();
        ctx.globalAlpha = Math.max(0, a) * .9;
        const ir = 40 * M;
        const g = ctx.createRadialGradient(s.impact[0], s.impact[1], 0, s.impact[0], s.impact[1], ir);
        g.addColorStop(0, "rgba(200,225,255,.95)");
        g.addColorStop(1, "rgba(47,123,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.impact[0], s.impact[1], ir, 0, 7); ctx.fill();
        ctx.restore();
        if (dt < 50) veil.style.opacity = String((mobile() ? .68 : .5) * (1 - dt / 50));
      });
    });
    setTimeout(() => { veil.style.opacity = "0"; }, 1200);
  }

  /* ---- Gelido: cristalizacion ---- */
  function fxGelida() {
    const ferns = [];
    const L0 = Math.min(W, H) * (mobile() ? 0.38 : 0.28);
    const nFerns = mobile() ? 14 : 12;
    for (let i = 0; i < nFerns; i++) {
      const side = i % 4;
      let x, y, ang;
      if (side === 0) { x = rnd(0, W); y = -4; ang = Math.PI / 2; }
      else if (side === 1) { x = rnd(0, W); y = H + 4; ang = -Math.PI / 2; }
      else if (side === 2) { x = -4; y = rnd(0, H); ang = 0; }
      else { x = W + 4; y = rnd(0, H); ang = Math.PI; }
      ferns.push({ x, y, ang: ang + rnd(-.4, .4), len: L0 * rnd(.7, 1.25), t0: rnd(0, 300) });
    }
    const sparks = Array.from({ length: 60 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(.6, 2.2), t0: rnd(0, 900) }));
    const start = performance.now();
    runFx(1700, now => {
      const t = now - start;
      const fade = t > 1350 ? 1 - (t - 1350) / 350 : 1;
      ctx.save();
      ctx.globalAlpha = .85 * fade;
      ctx.strokeStyle = "rgba(215,242,252,.9)";
      ctx.shadowColor = "#9fd8ea";
      ctx.shadowBlur = 8;
      ferns.forEach(f => {
        const gt = Math.min(1, Math.max(0, (t - f.t0) / 800));
        if (gt <= 0) return;
        const L = f.len * gt;
        ctx.lineWidth = mobile() ? 2.2 : 1.6;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(f.ang) * L, f.y + Math.sin(f.ang) * L);
        ctx.stroke();
        const step = 15;
        const nTw = Math.floor(L / step);
        ctx.lineWidth = 1;
        for (let k = 1; k <= nTw; k++) {
          const px = f.x + Math.cos(f.ang) * k * step, py = f.y + Math.sin(f.ang) * k * step;
          const tl = 11 * (1 - k / (nTw + 3)) * gt;
          for (const s of [-.62, .62]) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(f.ang + s) * tl * 1.8, py + Math.sin(f.ang + s) * tl * 1.8);
            ctx.stroke();
          }
        }
      });
      sparks.forEach(s => {
        const st = t - s.t0;
        if (st < 0 || st > 700) return;
        const a = st < 120 ? st / 120 : 1 - (st - 120) / 580;
        ctx.globalAlpha = a * .9 * fade;
        ctx.fillStyle = "#eef9ff";
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      });
      ctx.restore();
      veil.style.background = "radial-gradient(circle at 50% 50%, transparent 34%, rgba(215,242,252,.24) 80%, rgba(235,250,255,.44) 100%)";
      veil.style.opacity = String(.9 * Math.min(1, t / 300) * fade);
    });
    setTimeout(() => { veil.style.opacity = "0"; }, 1750);
  }

  /* ---- Assum: fuego de particulas ---- */
  function fxAssum() {
    const parts = [];
    const start = performance.now();
    let lastSpawn = start;
    veil.style.background = "linear-gradient(0deg, rgba(255,70,10,.28), transparent 50%)";
    runFx(1500, now => {
      const t = now - start;
      const spread = mobile() ? .46 : .3;
      const sizeMul = mobile() ? 1.4 : 1;
      if (t < 850 && now - lastSpawn > 12) {
        lastSpawn = now;
        for (let i = 0; i < (mobile() ? 10 : 8); i++) {
          parts.push({
            x: W / 2 + rnd(-W * spread, W * spread),
            y: H - rnd(4, 30),
            vx: rnd(-.4, .4),
            vy: rnd(-3.2, -1.4) * (mobile() ? 1.25 : 1),
            r: rnd(2.5, 7.5) * sizeMul,
            born: now,
            life: rnd(520, 1000),
            wob: rnd(0, 7)
          });
        }
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const age = (now - p.born) / p.life;
        if (age >= 1) { parts.splice(i, 1); continue; }
        p.x += p.vx + Math.sin((now / 90) + p.wob) * .55;
        p.y += p.vy;
        p.vy *= .992;
        const r = p.r * (1 - age * .75);
        let c0, c1;
        if (age < .25) { c0 = "rgba(255,240,200,"; c1 = "rgba(255,170,60,"; }
        else if (age < .6) { c0 = "rgba(255,170,60,"; c1 = "rgba(255,70,10,"; }
        else { c0 = "rgba(255,70,10,"; c1 = "rgba(120,20,0,"; }
        const a = (1 - age) * .95;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.4);
        g.addColorStop(0, c0 + a + ")");
        g.addColorStop(.55, c1 + a * .55 + ")");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, 7); ctx.fill();
      }
      ctx.restore();
      const vfade = t < 300 ? t / 300 : (t > 1100 ? Math.max(0, 1 - (t - 1100) / 400) : 1);
      veil.style.opacity = String(.8 * vfade);
    });
    setTimeout(() => { veil.style.opacity = "0"; }, 1550);
  }

  const FX = { fulgur: fxFulgur, gelida: fxGelida, assum: fxAssum };

  window.ECI_FX = {
    play(house) {
      if (reduced || !FX[house]) return;
      sizeCanvas();
      FX[house]();
      ["brandSeal", "heroSeal"].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove("seal-anim-fulgur", "seal-anim-gelida", "seal-anim-assum");
        void el.offsetWidth;
        el.classList.add("seal-anim-" + house);
      });
    }
  };
})();
