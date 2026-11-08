// Desenha o bilhete (1080x1920, formato story) num <canvas> e devolve um Blob PNG.

const PARTICULAS = new Set(["da", "de", "do", "das", "dos", "e"]);

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Encaixa um nome na largura: tira "de/da/dos", abrevia sobrenomes do meio,
// depois fica só com primeiro + último, e por fim diminui a fonte.
function fitName(ctx, nome, maxW, size, weight, family, minSize) {
  const font = (s) => `${weight} ${s}px ${family}`;
  ctx.font = font(size);
  if (ctx.measureText(nome).width <= maxW) return { text: nome, size };

  const parts = nome.split(/\s+/);
  const core = parts.filter((p, i) => i === 0 || i === parts.length - 1 || !PARTICULAS.has(p.toLowerCase()));
  const first = core[0], last = core[core.length - 1], mid = core.slice(1, -1);
  const tries = [
    core.join(" "),
    [first, mid[0], ...mid.slice(1).map((m) => m[0] + "."), last].filter(Boolean).join(" "),
    [first, ...mid.map((m) => m[0] + "."), last].join(" "),
    [first, last].join(" "),
  ];
  for (const t of tries) {
    if (ctx.measureText(t).width <= maxW) return { text: t, size };
  }
  const short = tries[tries.length - 1];
  for (let s = size - 1; s >= minSize; s--) {
    ctx.font = font(s);
    if (ctx.measureText(short).width <= maxW) return { text: short, size: s };
  }
  return { text: short, size: minSize };
}

// Foguinho: chama laranja com miolo amarelo, centrada em (cx, cy), altura ~2*s
function drawFlame(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = "rgba(255,120,30,0.9)";
  ctx.shadowBlur = s * 0.9;
  const ext = ctx.createLinearGradient(0, -s, 0, s);
  ext.addColorStop(0, "#ffd04a");
  ext.addColorStop(0.55, "#ff7a1f");
  ext.addColorStop(1, "#e2341b");
  ctx.fillStyle = ext;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.35, -s * 0.45, s * 0.85, -s * 0.1, s * 0.62, s * 0.5);
  ctx.bezierCurveTo(s * 0.45, s * 1.02, -s * 0.45, s * 1.02, -s * 0.62, s * 0.5);
  ctx.bezierCurveTo(-s * 0.8, s * 0.05, -s * 0.45, -s * 0.15, -s * 0.2, -s * 0.5);
  ctx.bezierCurveTo(-s * 0.05, -s * 0.2, s * 0.05, -s * 0.45, 0, -s);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff3a0";
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.05);
  ctx.bezierCurveTo(s * 0.25, s * 0.2, s * 0.42, s * 0.4, s * 0.3, s * 0.65);
  ctx.bezierCurveTo(s * 0.2, s * 0.88, -s * 0.2, s * 0.88, -s * 0.3, s * 0.65);
  ctx.bezierCurveTo(-s * 0.4, s * 0.42, -s * 0.15, s * 0.25, 0, -s * 0.05);
  ctx.fill();
  ctx.restore();
}

function goldGrad(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "#fff6c2");
  g.addColorStop(0.45, "#ffd04a");
  g.addColorStop(0.55, "#e0950f");
  g.addColorStop(1, "#ffe48a");
  return g;
}

function serialFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
  return hex.slice(0, 4) + "-" + hex.slice(4);
}

let tigerImgPromise = null;
function loadTiger() {
  if (!tigerImgPromise) {
    tigerImgPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(tigerSVG("tc"));
    });
  }
  return tigerImgPromise;
}

async function drawTicket(canvas, apostador, escolhas) {
  // escolhas: [{bloco, local, nomes: [..5]}] x6
  try {
    await Promise.all([
      document.fonts.load('104px "Bungee"'),
      document.fonts.load('800 40px "Baloo 2"'),
      document.fonts.load('700 30px "Baloo 2"'),
    ]);
  } catch (e) { /* segue com a fonte reserva */ }
  const tiger = await loadTiger();

  const W = 1080, H = 1920;
  const ctx = canvas.getContext("2d");
  const BUNGEE = '"Bungee", "Arial Black", sans-serif';
  const BALOO = '"Baloo 2", "Trebuchet MS", sans-serif';

  // Fundo vermelho com brilho central
  const bg = ctx.createRadialGradient(540, 360, 40, 540, 700, 1300);
  bg.addColorStop(0, "#e0262c");
  bg.addColorStop(0.35, "#9c0c13");
  bg.addColorStop(1, "#2e0204");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Raios dourados atrás do tigre
  ctx.save();
  ctx.translate(540, 200);
  for (let i = 0; i < 28; i++) {
    ctx.rotate((Math.PI * 2) / 28);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-60, -1100);
    ctx.lineTo(60, -1100);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? "rgba(255,210,90,0.07)" : "rgba(255,210,90,0.02)";
    ctx.fill();
  }
  ctx.restore();

  // Moedinhas de fundo
  ctx.save();
  ctx.strokeStyle = "rgba(255,200,80,0.07)";
  ctx.lineWidth = 3;
  for (let y = 40; y < H; y += 110) {
    for (let x = (y / 110) % 2 ? 40 : 95; x < W; x += 110) {
      ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();

  // Moldura dourada
  ctx.lineJoin = "round";
  rrect(ctx, 22, 22, W - 44, H - 44, 46);
  ctx.lineWidth = 10;
  ctx.strokeStyle = goldGrad(ctx, 0, H);
  ctx.stroke();
  rrect(ctx, 42, 42, W - 84, H - 84, 32);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,214,110,0.55)";
  ctx.stroke();

  // Tigre
  if (tiger) {
    ctx.save();
    ctx.shadowColor = "rgba(255,200,60,0.55)";
    ctx.shadowBlur = 50;
    ctx.drawImage(tiger, 540 - 130, 62, 260, 260);
    ctx.restore();
  }

  // Título
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `104px ${BUNGEE}`;
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#3a0306";
  ctx.strokeText("MEU BOLÃO", 540, 418);
  ctx.fillStyle = goldGrad(ctx, 330, 420);
  ctx.fillText("MEU BOLÃO", 540, 418);

  ctx.font = `800 31px ${BALOO}`;
  ctx.fillStyle = "#fff1d0";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "3px";
  ctx.fillText("DESTAQUES · JOVENS CIENTISTAS CARIOCAS 2026", 540, 466);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  // Nome do apostador num selo dourado
  const nome = (apostador || "").trim() || "Apostador(a) misterioso(a)";
  const fitted = fitName(ctx, nome, 760, 44, 800, BALOO, 28);
  ctx.font = `800 ${fitted.size}px ${BALOO}`;
  const label = "BILHETE DE ";
  ctx.font = `20px ${BUNGEE}`;
  const lw = ctx.measureText(label).width;
  ctx.font = `800 ${fitted.size}px ${BALOO}`;
  const nw = ctx.measureText(fitted.text).width;
  const pw = Math.min(980, lw + nw + 90);
  const px = 540 - pw / 2, py = 494, ph = 70;
  rrect(ctx, px, py + 6, pw, ph, 35);
  ctx.fillStyle = "#7a3f02";
  ctx.fill();
  rrect(ctx, px, py, pw, ph, 35);
  ctx.fillStyle = goldGrad(ctx, py, py + ph);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = "#6b1a00";
  ctx.font = `20px ${BUNGEE}`;
  const tx = px + 45;
  ctx.fillText(label, tx, py + 44);
  ctx.fillStyle = "#3a0a00";
  ctx.font = `800 ${fitted.size}px ${BALOO}`;
  ctx.fillText(fitted.text, tx + lw, py + 49);

  // Painéis dos blocos (2 colunas x 3 linhas)
  const top = 600, pW = 483, pH = 370, gx = 24, gy = 22, x0 = 45;
  escolhas.forEach((b, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (pW + gx), y = top + row * (pH + gy);

    rrect(ctx, x, y, pW, pH, 28);
    ctx.fillStyle = "rgba(36,2,4,0.78)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,206,90,0.85)";
    ctx.stroke();

    // faixa do bloco
    rrect(ctx, x + 14, y + 14, pW - 28, 60, 30);
    ctx.fillStyle = goldGrad(ctx, y + 14, y + 74);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#3a0a00";
    ctx.font = `28px ${BUNGEE}`;
    ctx.fillText(`BLOCO ${b.bloco}`, x + 36, y + 55);
    // "BANCA <nave onde aconteceu>", diminuindo a letra se não couber ao lado do bloco
    const blocoW = ctx.measureText(`BLOCO ${b.bloco}`).width;
    const banca = `BANCA ${b.local.toUpperCase()}`;
    const maxW = pW - 72 - blocoW - 18;
    let fs = 25;
    ctx.font = `800 ${fs}px ${BALOO}`;
    while (fs > 17 && ctx.measureText(banca).width > maxW) { fs--; ctx.font = `800 ${fs}px ${BALOO}`; }
    ctx.textAlign = "right";
    ctx.fillStyle = "#6b1a00";
    ctx.fillText(banca, x + pW - 36, y + 54);

    // nomes
    b.nomes.forEach((n, k) => {
      const ly = y + 120 + k * 52;
      ctx.beginPath();
      ctx.arc(x + 44, ly - 10, 17, 0, Math.PI * 2);
      ctx.fillStyle = goldGrad(ctx, ly - 27, ly + 7);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#8a4f05";
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#3a0a00";
      ctx.font = `17px ${BUNGEE}`;
      ctx.fillText(String(k + 1), x + 44, ly - 3);

      // foguinho para os mais votados do bloco
      const calor = (b.calor && b.calor[k]) || 0;
      let reserva = 0;
      if (calor > 0) {
        drawFlame(ctx, x + pW - 36, ly - 11, calor === 2 ? 16 : 13);
        reserva = 34;
      }

      const f = fitName(ctx, n, pW - 94 - reserva, 30, 700, BALOO, 22);
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff1d0";
      ctx.font = `700 ${f.size}px ${BALOO}`;
      ctx.fillText(f.text, x + 74, ly);
    });
  });

  // Rodapé
  const serial = serialFrom(nome + escolhas.map((b) => b.nomes.join("|")).join("#"));
  ctx.textAlign = "center";
  ctx.font = `30px ${BUNGEE}`;
  ctx.fillStyle = goldGrad(ctx, 1770, 1810);
  ctx.fillText(`BILHETE Nº ${serial}`, 540, 1808);
  ctx.font = `600 26px ${BALOO}`;
  ctx.fillStyle = "rgba(255,241,208,0.82)";
  ctx.fillText("Não vale ponto! Prêmio: glória eterna x30.", 540, 1852);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
