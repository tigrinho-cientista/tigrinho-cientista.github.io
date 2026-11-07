// Efeitos: sons sintetizados (Web Audio, sem arquivos) e partículas em canvas.
// Tudo bem baixinho, com botão de mudo, e sem partículas para quem prefere menos movimento.
(function () {
  "use strict";

  const SOUND_KEY = "bolao-jcc-2026-som";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ================= SOM =================
  let actx = null, master = null;
  let muted = false;
  try { muted = localStorage.getItem(SOUND_KEY) === "off"; } catch (e) { /* ignora */ }

  function ensureAudio() {
    if (actx) { if (actx.state === "suspended") actx.resume(); return actx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    master = actx.createGain();
    master.gain.value = 0.22;
    const comp = actx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp).connect(actx.destination);
    return actx;
  }
  // O navegador só libera áudio depois de um toque.
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, ensureAudio, { once: true, passive: true }));

  function tone(freq, { at = 0, dur = 0.12, type = "triangle", vol = 0.5, slide = null, attack = 0.004 } = {}) {
    if (muted || !ensureAudio()) return;
    const t0 = actx.currentTime + at;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ at = 0, dur = 0.06, vol = 0.15, freq = 3000 } = {}) {
    if (muted || !ensureAudio()) return;
    const t0 = actx.currentTime + at;
    const len = Math.max(1, Math.floor(actx.sampleRate * dur));
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = actx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(master);
    src.start(t0);
  }

  // moedinha: dois parciais agudos, como metal batendo
  function coin(at = 0, base = 1975, vol = 0.32) {
    tone(base, { at, dur: 0.09, type: "square", vol: vol * 0.35 });
    tone(base * 1.335, { at: at + 0.055, dur: 0.32, type: "triangle", vol });
    tone(base * 2.67, { at: at + 0.055, dur: 0.18, type: "sine", vol: vol * 0.25 });
  }

  let lastTick = 0;
  const sfx = {
    pick() { coin(0, 1760, 0.3); },
    unpick() { tone(740, { dur: 0.13, type: "triangle", vol: 0.28, slide: 392 }); },
    tap() { tone(1200, { dur: 0.04, type: "sine", vol: 0.16 }); },
    nope() {
      tone(196, { dur: 0.09, type: "square", vol: 0.12 });
      tone(185, { at: 0.11, dur: 0.12, type: "square", vol: 0.12 });
    },
    tick() {
      const now = performance.now();
      if (now - lastTick < 55) return;
      lastTick = now;
      noise({ dur: 0.025, vol: 0.22, freq: 2400 + Math.random() * 800 });
      tone(1400 + Math.random() * 300, { dur: 0.018, type: "square", vol: 0.05 });
    },
    land(i = 0) {
      tone(170, { dur: 0.1, type: "sine", vol: 0.5, slide: 80 });
      noise({ dur: 0.05, vol: 0.18, freq: 900 });
      tone([1318, 1480, 1568, 1760, 1976][i % 5], { at: 0.03, dur: 0.22, type: "triangle", vol: 0.28 });
    },
    win() {
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, { at: i * 0.075, dur: 0.22, type: "triangle", vol: 0.3 }));
      tone(2093, { at: 0.3, dur: 0.5, type: "sine", vol: 0.18 });
      tone(2637, { at: 0.34, dur: 0.45, type: "sine", vol: 0.12 });
    },
    start() {
      tone(523, { dur: 0.1, type: "triangle", vol: 0.25 });
      tone(784, { at: 0.08, dur: 0.18, type: "triangle", vol: 0.28 });
    },
    jackpot() {
      const notes = [784, 988, 1175, 1568, 1319, 1568, 2093];
      notes.forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.25, type: "triangle", vol: 0.28 }));
      tone(523, { at: 0, dur: 0.7, type: "sine", vol: 0.16 });
      tone(1047, { at: 0.63, dur: 0.8, type: "sine", vol: 0.14 });
      for (let i = 0; i < 9; i++) coin(0.55 + i * 0.09 + Math.random() * 0.05, 1600 + Math.random() * 900, 0.16);
    },
    roar() {
      // ronronado fofo do tigrinho
      tone(140, { dur: 0.35, type: "sawtooth", vol: 0.07, slide: 95, attack: 0.03 });
      tone(660, { at: 0.05, dur: 0.18, type: "triangle", vol: 0.2, slide: 990 });
      coin(0.18, 2093, 0.2);
    },
  };

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(SOUND_KEY, m ? "off" : "on"); } catch (e) { /* ignora */ }
  }

  // ================= PARTÍCULAS =================
  const canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const GOLDS = ["#fff6c2", "#ffe08a", "#ffd04a", "#f5b82e"];
  const CONFETTI = ["#ffd04a", "#fff1d0", "#ff4d55", "#36d68f", "#f5b82e", "#ff93b6"];
  const parts = [];
  let raf = 0, last = 0;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function add(p) {
    if (parts.length > 260) return;
    parts.push(p);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }

  function burst(x, y, { n = 14, speed = 4, kinds = ["spark"], spread = Math.PI * 2, angle = -Math.PI / 2, gravity = 0.12, colors = GOLDS, size = 1 } = {}) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = angle + rnd(-spread / 2, spread / 2);
      const v = rnd(speed * 0.35, speed);
      const kind = pick(kinds);
      add({
        kind, x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        g: kind === "confetti" ? gravity * 0.6 : gravity,
        drag: kind === "confetti" ? 0.965 : 0.975,
        life: 0, max: kind === "confetti" ? rnd(70, 120) : kind === "coin" ? rnd(60, 95) : rnd(28, 50),
        r: (kind === "coin" ? rnd(6, 10) : kind === "confetti" ? rnd(4, 7) : rnd(2.5, 5)) * size,
        rot: rnd(0, Math.PI * 2), vr: rnd(-0.25, 0.25),
        flip: rnd(0, Math.PI * 2), vflip: rnd(0.12, 0.3),
        color: pick(colors),
      });
    }
  }

  function burstAt(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }

  function confetti(el) {
    let x = W / 2, y = H * 0.3;
    if (el) { const r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    burst(x, y, { n: 46, speed: 9, kinds: ["confetti", "confetti", "spark"], colors: CONFETTI, gravity: 0.2 });
  }

  function rain(n = 34) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      add({
        kind: "coin", x: rnd(0, W), y: rnd(-H * 0.5, -20),
        vx: rnd(-0.6, 0.6), vy: rnd(2, 5), g: 0.12, drag: 0.995,
        life: 0, max: 200, r: rnd(7, 12),
        rot: 0, vr: 0, flip: rnd(0, 6), vflip: rnd(0.12, 0.28), color: pick(GOLDS),
      });
    }
  }

  function star(x, y, r, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.28 : r;
      const a = (i * Math.PI) / 4;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(2.5, (now - last) / 16.67);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      p.vx *= Math.pow(p.drag, dt);
      p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vflip * dt;
      const t = p.life / p.max;
      if (t >= 1 || p.y > H + 40) { parts.splice(i, 1); continue; }
      const alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
      ctx.globalAlpha = alpha;

      if (p.kind === "spark") {
        ctx.fillStyle = p.color;
        ctx.shadowColor = "rgba(255,210,90,0.9)";
        ctx.shadowBlur = 8;
        star(p.x, p.y, p.r * (1 - t * 0.5), p.rot);
        ctx.shadowBlur = 0;
      } else if (p.kind === "coin") {
        const sx = Math.abs(Math.cos(p.flip)) * 0.85 + 0.15;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(sx, 1);
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(-p.r * 0.35, -p.r * 0.35, 1, 0, 0, p.r);
        g.addColorStop(0, "#fff8c8");
        g.addColorStop(0.45, "#ffd04a");
        g.addColorStop(1, "#c98510");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(122,63,2,0.7)";
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.flip));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }

  function buzz(pattern) {
    if (muted) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignora */ }
  }

  window.FX = {
    sfx, burst, burstAt, confetti, rain, buzz,
    get muted() { return muted; },
    setMuted,
  };
})();
