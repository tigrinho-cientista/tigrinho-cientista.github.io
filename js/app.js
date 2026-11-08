(function () {
  "use strict";

  const STORE_KEY = "bolao-jcc-2026";
  const $ = (s) => document.querySelector(s);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- dados ----------
  const PESSOAS = {}; // id -> {id, nome, eixo, nave, bloco, turno}
  const REMOVIDOS = {}; // id -> {nome, bloco} de quem saiu da Mostra
  BLOCOS.forEach((b) => {
    let i = 0;
    b.turnos.forEach(([turno, lista]) => {
      lista.forEach(([nome, eixo, nave]) => {
        const id = `b${b.n}-${i++}`; // o índice conta todo mundo, para os ids antigos continuarem valendo
        if (FORA_DA_MOSTRA.has(nome)) { REMOVIDOS[id] = { nome, bloco: b.n }; return; }
        PESSOAS[id] = { id, nome, eixo, nave, bloco: b.n, turno };
      });
    });
    b.ids = Object.keys(PESSOAS).filter((id) => PESSOAS[id].bloco === b.n);
    b.naves = [...new Set(b.ids.map((id) => PESSOAS[id].nave))];
  });
  const PIN = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.1 7-12.2A7 7 0 0 0 5 9.8C5 14.9 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.8" r="2.6" fill="var(--pin-hole)"/></svg>`;

  const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const PART = new Set(["da", "de", "do", "das", "dos", "e"]);
  function iniciais(nome) {
    const p = nome.split(/\s+/).filter((w) => !PART.has(w.toLowerCase()));
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function curto(nome) {
    const p = nome.split(/\s+/).filter((w) => !PART.has(w.toLowerCase()));
    return p.length > 1 ? `${p[0]} ${p[p.length - 1]}` : p[0];
  }
  const primeiro = (nome) => nome.split(/\s+/)[0];

  // ---------- estado ----------
  const saiuDoBolao = []; // palpites salvos que apontavam para quem saiu
  let state = { nome: "", step: 0, picks: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.picks) {
        state.nome = typeof s.nome === "string" ? s.nome : "";
        state.step = Number.isInteger(s.step) && s.step >= 0 && s.step <= 7 ? s.step : 0;
        for (let n = 1; n <= 6; n++) {
          const arr = Array.isArray(s.picks[n]) ? s.picks[n] : [];
          arr.forEach((id) => { if (REMOVIDOS[id]) saiuDoBolao.push(REMOVIDOS[id]); });
          state.picks[n] = arr.filter((id) => PESSOAS[id] && PESSOAS[id].bloco === n).slice(0, POR_BLOCO);
        }
      }
    }
  } catch (e) { /* sem armazenamento: começa do zero */ }

  function salvar() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
    agendarEnvio();
  }

  // ---------- termômetro da galera (Supabase) ----------
  const FOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fogo-ext" d="M12 1.8c1.2 4.1 6.4 6.3 6.4 12.4A6.4 6.4 0 0 1 5.6 14.4c0-3.3 1.8-5.1 3.1-6.8.3 2 1.1 3.1 2.1 3.7-.6-3.1-.1-6.4 1.2-9.5z"/><path class="fogo-int" d="M12 10.6c.7 2.2 3.3 3.3 3.3 5.8a3.3 3.3 0 0 1-6.6 0c0-1.8 1.1-2.7 1.8-3.5.2 1 .6 1.6 1.2 1.9-.2-1.4 0-2.8.3-4.2z"/></svg>`;
  const votosDe = (id) => (VOTOS.dados && VOTOS.dados.votos && VOTOS.dados.votos[id]) || 0;

  // Em chamas: os 3 mais votados do bloco (empates entram), com pelo menos 2 votos.
  function calorDoBloco(b) {
    const ordem = b.ids.map((id) => votosDe(id)).filter((v) => v > 0).sort((x, y) => y - x);
    const corte = Math.max(2, ordem[Math.min(2, ordem.length - 1)] || 0);
    const topo = ordem[0] || 0;
    const calor = {};
    b.ids.forEach((id) => {
      const v = votosDe(id);
      calor[id] = v >= corte ? (v === topo ? 2 : 1) : 0;
    });
    return calor;
  }

  // 0..1: votos do cientista em relação ao mais votado do bloco
  function intensidade(id) {
    const p = PESSOAS[id];
    if (!p || !VOTOS.dados || !VOTOS.dados.bilhetes) return 0;
    const v = votosDe(id);
    if (!v) return 0;
    const max = Math.max(...BLOCOS[p.bloco - 1].ids.map(votosDe));
    return max ? v / max : 0;
  }

  function soltarFogo(id, el) {
    const k = intensidade(id);
    if (k <= 0) return;
    FX.fogoAt(el, k);
    FX.sfx.fogo(k);
  }

  let envioTimer;
  function agendarEnvio() {
    if (!VOTOS.ativo || fechado() || !completo()) return;
    clearTimeout(envioTimer);
    envioTimer = setTimeout(() => {
      const palpites = BLOCOS.flatMap((b) => state.picks[b.n]);
      VOTOS.enviar(palpites);
    }, 1200);
  }

  const totalPicks = () => Object.values(state.picks).reduce((a, p) => a + p.length, 0);
  const completo = () => BLOCOS.every((b) => state.picks[b.n].length === POR_BLOCO);

  // ---------- prazo ----------
  const fechado = () => Date.now() > PRAZO.getTime();
  function bloqueado() {
    if (!fechado()) return false;
    toast(`Apostas encerradas! O bolão fechou ${PRAZO_TEXTO}.`);
    FX.sfx.nope();
    return true;
  }

  // ---------- mascote ----------
  document.querySelectorAll("[data-tiger]").forEach((el, i) => { el.innerHTML = tigerSVG("t" + i); });

  // ---------- toast ----------
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  // ---------- navegação ----------
  let lastStepScrolled = -1;
  function renderSteps() {
    const nav = $("#steps");
    let html = "";
    BLOCOS.forEach((b) => {
      const c = state.picks[b.n].length;
      const cls = ["step"];
      if (state.step === b.n) cls.push("on");
      if (c === POR_BLOCO) cls.push("done");
      html += `<button type="button" class="${cls.join(" ")}" data-step="${b.n}" aria-label="Bloco ${b.n}, ${c} de 5">
        <span class="step-n">B${b.n}</span><span class="step-c">${c}/5</span></button>`;
    });
    const cls = ["step", "step-ticket"];
    if (state.step === 7) cls.push("on");
    if (completo()) cls.push("done");
    html += `<button type="button" class="${cls.join(" ")}" data-step="7"><span class="step-n">Bilhete</span><span class="step-c">${completo() ? "pronto" : "—"}</span></button>`;
    nav.innerHTML = html;
    const on = nav.querySelector(".on");
    if (on && lastStepScrolled !== state.step) {
      lastStepScrolled = state.step;
      nav.scrollTo({ left: on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
    }
    $("#total").textContent = totalPicks();
  }

  $("#steps").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (b && !spinning) { FX.sfx.tap(); go(Number(b.dataset.step)); }
  });
  $("#brand").addEventListener("click", () => { if (!spinning) { FX.sfx.tap(); go(0); } });

  // Som liga/desliga
  const somBtn = $("#som");
  function syncSom() {
    somBtn.setAttribute("aria-pressed", FX.muted ? "false" : "true");
    somBtn.setAttribute("aria-label", FX.muted ? "Ligar sons" : "Desligar sons");
  }
  somBtn.addEventListener("click", () => {
    FX.setMuted(!FX.muted);
    syncSom();
    if (!FX.muted) FX.sfx.pick();
  });
  syncSom();

  // Easter egg: tocar no tigrinho da capa
  document.querySelector(".hero-tiger").addEventListener("click", (e) => {
    const t = e.currentTarget;
    FX.sfx.roar();
    FX.burstAt(t, { n: 18, speed: 7, kinds: ["coin", "spark", "spark"], gravity: 0.25 });
    t.classList.remove("boop"); void t.offsetWidth; t.classList.add("boop");
  });

  function go(step) {
    state.step = step;
    salvar();
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // ---------- tela de bloco ----------
  let blocoAtual = null;

  function renderBloco(n) {
    const b = BLOCOS[n - 1];
    blocoAtual = b;
    $("#blk-eyebrow").textContent = `Rodada ${n} de 6 · ${b.data}`;
    $("#blk-title").textContent = `Bloco ${n}`;
    $("#blk-local").textContent = `${b.local} · ${b.ids.length} cientistas`;
    $("#busca").value = "";
    naveFiltro = null;

    const contaNave = (nv) => b.ids.filter((id) => PESSOAS[id].nave === nv).length;
    $("#naves").innerHTML =
      `<span class="naves-label">Nave</span>` +
      `<button type="button" class="nave-opt" data-nave="" aria-pressed="true">Todas <i>${b.ids.length}</i></button>` +
      b.naves.map((nv) => `<button type="button" class="nave-opt" data-nave="${nv}" aria-pressed="false">${nv} <i>${contaNave(nv)}</i></button>`).join("");

    let html = "";
    b.turnos.forEach(([turno, lista]) => {
      const ids = b.ids.filter((id) => PESSOAS[id].turno === turno);
      html += `<div class="turno" data-turno><h3 class="turno-title">${turno}<span>${ids.length}</span></h3><div class="picks">`;
      ids.forEach((id) => {
        const p = PESSOAS[id];
        const ex = EIXOS[p.eixo];
        html += `<button type="button" class="pick" data-id="${id}" data-nave="${p.nave}" data-busca="${semAcento(p.nome + " " + p.nave)}" aria-pressed="false">
          <span class="pick-coin" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <span class="pick-body"><span class="pick-name">${p.nome}</span>
          <span class="pick-tags"><span class="nave" title="Nave de referência">${PIN}Nave ${p.nave}</span>
          <span class="chip" style="--chip:${ex.cor}" title="${ex.nome}">${ex.curto}</span></span></span>
          <span class="pick-votos" hidden></span>
        </button>`;
      });
      html += `</div></div>`;
    });
    $("#lista").innerHTML = html;
    $("#vazio").hidden = true;
    atualizarBloco();
    aplicarVotos();
  }

  function aplicarVotos() {
    const b = blocoAtual;
    const tem = VOTOS.ativo && VOTOS.dados && VOTOS.dados.bilhetes > 0;
    if (!b) return;
    const calor = tem ? calorDoBloco(b) : {};
    document.querySelectorAll("#lista .pick").forEach((el) => {
      const id = el.dataset.id;
      const v = tem ? votosDe(id) : 0;
      const c = calor[id] || 0;
      const box = el.querySelector(".pick-votos");
      box.hidden = c === 0;
      box.innerHTML = c ? FOGO : "";
      box.setAttribute("aria-label", c === 2 ? "Mais votado do bloco" : "Entre os mais votados");
      // foguinho ao lado do nome: todo mundo que tem voto; mais forte quanto mais votado
      const nomeEl = el.querySelector(".pick-name");
      let mini = nomeEl.querySelector(".nome-fogo");
      if (v > 0) {
        if (!mini) {
          mini = document.createElement("span");
          mini.className = "nome-fogo";
          mini.innerHTML = FOGO;
          nomeEl.append(" ", mini);
        }
        mini.style.setProperty("--k", intensidade(id).toFixed(2));
        mini.title = "Votado pela galera";
      } else if (mini) {
        mini.remove();
      }
      el.classList.toggle("votado", v > 0);
      el.classList.toggle("em-chamas", c > 0);
      el.classList.toggle("chama-forte", c === 2);
      let brasas = el.querySelector(".brasas");
      if (c > 0 && !brasas) {
        brasas = document.createElement("span");
        brasas.className = "brasas";
        brasas.setAttribute("aria-hidden", "true");
        brasas.innerHTML = "<i></i><i></i><i></i><i></i><i></i><i></i>";
        el.prepend(brasas);
      } else if (c === 0 && brasas) brasas.remove();
    });
  }

  VOTOS.onChange(() => {
    if (state.step >= 1 && state.step <= 6) aplicarVotos();
    if (state.step === 0) aplicarVotos();
    if (state.step === 7 && completo() && blobAtual) gerarBilhete();
  });

  function atualizarBloco() {
    const b = blocoAtual;
    if (!b) return;
    const picks = state.picks[b.n];
    const cheio = picks.length >= POR_BLOCO;
    document.querySelectorAll("#lista .pick").forEach((el) => {
      const sel = picks.includes(el.dataset.id);
      el.setAttribute("aria-pressed", sel ? "true" : "false");
      el.classList.toggle("locked", cheio && !sel);
    });
    renderReels();
    const hint = $("#machine-hint");
    if (picks.length === 0) hint.textContent = "Toque nos nomes para escolher seus 5 destaques.";
    else if (!cheio) hint.textContent = `Falta${POR_BLOCO - picks.length > 1 ? "m" : ""} ${POR_BLOCO - picks.length}. Toque numa vaga para tirar alguém.`;
    else hint.textContent = "Bloco fechado! Toque numa vaga para trocar.";
    renderSteps();
    renderDock();
  }

  function renderReels() {
    const picks = state.picks[blocoAtual.n];
    let html = "";
    for (let i = 0; i < POR_BLOCO; i++) {
      const id = picks[i];
      if (id) {
        const p = PESSOAS[id];
        html += `<button type="button" class="reel filled" data-remove="${id}" aria-label="Tirar ${p.nome}">
          <span class="reel-ini">${iniciais(p.nome)}</span><span class="reel-name">${primeiro(p.nome)}</span></button>`;
      } else {
        html += `<div class="reel" data-slot="${i}"><span class="reel-ini">?</span><span class="reel-name">vaga ${i + 1}</span></div>`;
      }
    }
    $("#reels").innerHTML = html;
  }

  $("#reels").addEventListener("click", (e) => {
    const r = e.target.closest("[data-remove]");
    if (!r || spinning || bloqueado()) return;
    const arr = state.picks[blocoAtual.n];
    state.picks[blocoAtual.n] = arr.filter((id) => id !== r.dataset.remove);
    FX.sfx.unpick();
    FX.burstAt(r, { n: 6, speed: 2.5, colors: ["#fff1d0", "#ffe08a"], gravity: 0.08 });
    salvar();
    atualizarBloco();
  });

  $("#lista").addEventListener("click", (e) => {
    const el = e.target.closest(".pick");
    if (!el || spinning) return;
    if (bloqueado()) { el.classList.remove("nope"); void el.offsetWidth; el.classList.add("nope"); return; }
    const id = el.dataset.id;
    const arr = state.picks[blocoAtual.n];
    if (arr.includes(id)) {
      state.picks[blocoAtual.n] = arr.filter((x) => x !== id);
      FX.sfx.unpick();
    } else if (arr.length >= POR_BLOCO) {
      toast("Já tem 5 nesse bloco! Tire alguém para trocar.");
      FX.sfx.nope();
      FX.buzz([18, 40, 18]);
      el.classList.remove("nope"); void el.offsetWidth; el.classList.add("nope");
      return;
    } else {
      arr.push(id);
      FX.sfx.pick();
      FX.buzz(8);
      FX.burstAt(el.querySelector(".pick-coin"), { n: 14, speed: 4.5, kinds: ["spark", "spark", "coin"] });
      soltarFogo(id, el.querySelector(".pick-votos:not([hidden])") || el);
      salvar();
      atualizarBloco();
      const slot = document.querySelectorAll("#reels .reel")[arr.length - 1];
      if (slot) {
        slot.classList.add("landed");
        FX.burstAt(slot, { n: 8, speed: 3, gravity: 0.1 });
      }
      if (arr.length === POR_BLOCO) setTimeout(celebrarBloco, 140);
      return;
    }
    salvar();
    atualizarBloco();
  });

  let naveFiltro = null;

  $("#naves").addEventListener("click", (e) => {
    const b = e.target.closest("[data-nave]");
    if (!b) return;
    naveFiltro = b.dataset.nave || null;
    document.querySelectorAll("#naves .nave-opt").forEach((el) => {
      el.setAttribute("aria-pressed", el === b ? "true" : "false");
    });
    aplicarFiltro();
  });

  $("#busca").addEventListener("input", aplicarFiltro);

  function aplicarFiltro() {
    const q = semAcento($("#busca").value.trim());
    let vis = 0;
    document.querySelectorAll("#lista .turno").forEach((t) => {
      let n = 0;
      t.querySelectorAll(".pick").forEach((el) => {
        const ok = (!q || el.dataset.busca.includes(q)) && (!naveFiltro || el.dataset.nave === naveFiltro);
        el.hidden = !ok;
        if (ok) n++;
      });
      t.hidden = n === 0;
      vis += n;
    });
    $("#vazio").hidden = vis > 0;
  }

  function celebrarBloco() {
    const m = document.querySelector(".machine");
    if (m && !reduceMotion) { m.classList.remove("win"); void m.offsetWidth; m.classList.add("win"); }
    FX.sfx.win();
    FX.buzz([10, 50, 10, 50, 30]);
    FX.confetti(m);
    const n = blocoAtual.n;
    toast(n < 6 ? `Bloco ${n} fechado! Bora pro próximo.` : "Último bloco fechado! Seu bilhete tá pronto.");
  }

  // ---------- girar (escolha aleatória) ----------
  let spinning = false;

  function girar() {
    if (spinning || !blocoAtual || bloqueado()) return;
    const b = blocoAtual;
    const arr = state.picks[b.n];
    const falta = POR_BLOCO - arr.length;
    if (falta <= 0) { FX.sfx.nope(); toast("Bloco cheio! Tire alguém para girar de novo."); return; }

    const livres = b.ids.filter((id) => !arr.includes(id));
    for (let i = livres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [livres[i], livres[j]] = [livres[j], livres[i]];
    }
    const ganhadores = livres.slice(0, falta);

    if (reduceMotion) {
      ganhadores.forEach((id) => arr.push(id));
      salvar(); atualizarBloco(); celebrarBloco();
      return;
    }

    spinning = true;
    FX.sfx.start();
    document.body.classList.add("is-spinning");
    renderDock();
    const slots = [...document.querySelectorAll("#reels .reel:not(.filled)")];
    const timers = [];
    slots.forEach((slot, k) => {
      slot.classList.add("spinning");
      const ini = slot.querySelector(".reel-ini");
      const nm = slot.querySelector(".reel-name");
      const iv = setInterval(() => {
        const r = PESSOAS[b.ids[Math.floor(Math.random() * b.ids.length)]];
        ini.textContent = iniciais(r.nome);
        nm.textContent = primeiro(r.nome);
        FX.sfx.tick();
      }, 70);
      timers.push(iv);
      setTimeout(() => {
        clearInterval(iv);
        const p = PESSOAS[ganhadores[k]];
        ini.textContent = iniciais(p.nome);
        nm.textContent = primeiro(p.nome);
        slot.classList.remove("spinning");
        slot.classList.add("filled", "landed");
        FX.sfx.land(k);
        FX.buzz(12);
        FX.burstAt(slot, { n: 12, speed: 4, kinds: ["spark", "spark", "coin"] });
        soltarFogo(p.id, slot);
        const el = document.querySelector(`.pick[data-id="${p.id}"]`);
        if (el) el.setAttribute("aria-pressed", "true");
      }, 700 + k * 320);
    });

    setTimeout(() => {
      ganhadores.forEach((id) => arr.push(id));
      spinning = false;
      document.body.classList.remove("is-spinning");
      salvar();
      atualizarBloco();
      celebrarBloco();
    }, 700 + (slots.length - 1) * 320 + 450);
  }

  // ---------- nome ----------
  function setNome(v) {
    state.nome = v.slice(0, 32);
    salvar();
  }
  $("#nome-intro").addEventListener("input", (e) => setNome(e.target.value));
  let nomeTimer;
  $("#nome-bilhete").addEventListener("input", (e) => {
    setNome(e.target.value);
    clearTimeout(nomeTimer);
    nomeTimer = setTimeout(gerarBilhete, 450);
  });

  // ---------- bilhete ----------
  let blobAtual = null, urlAtual = null, gerando = 0;

  function escolhasParaBilhete() {
    return BLOCOS.map((b) => ({
      bloco: b.n,
      local: b.local,
      nomes: state.picks[b.n].map((id) => PESSOAS[id].nome),
      votos: state.picks[b.n].map((id) => votosDe(id)),
      calor: (() => { const c = VOTOS.dados && VOTOS.dados.bilhetes > 0 ? calorDoBloco(b) : {}; return state.picks[b.n].map((id) => c[id] || 0); })(),
    }));
  }

  async function gerarBilhete() {
    if (!completo()) return;
    const meu = ++gerando;
    $("#bilhete-loading").hidden = false;
    const blob = await drawTicket($("#canvas"), state.nome, escolhasParaBilhete());
    if (meu !== gerando || !blob) return;
    blobAtual = blob;
    if (urlAtual) URL.revokeObjectURL(urlAtual);
    urlAtual = URL.createObjectURL(blob);
    $("#bilhete-img").src = urlAtual;
    $("#bilhete-loading").hidden = true;
    renderDock();
  }

  function nomeArquivo() {
    const slug = semAcento(state.nome || "meu").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "meu";
    return `bolao-jcc-2026-${slug}.png`;
  }

  function baixar() {
    if (!blobAtual) { toast("Calma, o bilhete ainda está sendo impresso…"); return; }
    const a = document.createElement("a");
    a.href = urlAtual;
    a.download = nomeArquivo();
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Bilhete baixado! Agora é mandar no grupo.");
    FX.sfx.win();
    chuvaDeMoedas();
  }

  function podeCompartilhar() {
    if (!navigator.canShare || !blobAtual) return false;
    try {
      return navigator.canShare({ files: [new File([blobAtual], nomeArquivo(), { type: "image/png" })] });
    } catch (e) { return false; }
  }

  async function compartilhar() {
    if (!blobAtual) return;
    try {
      await navigator.share({
        files: [new File([blobAtual], nomeArquivo(), { type: "image/png" })],
        title: "Meu bolão JCC 2026",
        text: "Fiz meu bolão dos destaques do Jovens Cientistas Cariocas! Faz o seu também.",
      });
    } catch (e) {
      if (e && e.name !== "AbortError") toast("Não deu para compartilhar daqui. Use o botão de baixar.");
    }
  }

  function renderBilhete() {
    const ok = completo();
    $("#pendente").hidden = ok;
    $("#pronto").hidden = !ok;
    $("#recomecar").hidden = fechado();
    $("#nome-bilhete").disabled = fechado();
    $("#pendente-msg").textContent = fechado()
      ? "As apostas fecharam e esse bilhete ficou incompleto. Fica pra próxima!"
      : "Faltam palpites para fechar o bilhete:";
    if (!ok) {
      $("#pendente-lista").innerHTML = BLOCOS.map((b) => {
        const c = state.picks[b.n].length;
        return `<button type="button" class="pending-item ${c === POR_BLOCO ? "ok" : ""}" data-step="${b.n}">
          <span>Bloco ${b.n} · ${b.local}</span><b>${c}/5</b></button>`;
      }).join("");
      return;
    }
    $("#nome-bilhete").value = state.nome;
    const festa = !primeiraCarga;
    const frame = $(".ticket-frame");
    frame.classList.remove("print");
    gerarBilhete().then(() => {
      if (!festa) return;
      if (!reduceMotion) { void frame.offsetWidth; frame.classList.add("print"); }
      FX.sfx.jackpot();
      FX.buzz([20, 60, 20, 60, 40]);
      FX.confetti(frame);
      setTimeout(chuvaDeMoedas, 450);
    });
  }

  $("#pendente-lista").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (b) { FX.sfx.tap(); go(Number(b.dataset.step)); }
  });

  // Recomeçar com confirmação em dois toques
  let confirmTimer;
  $("#recomecar").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (bloqueado()) return;
    if (!btn.classList.contains("confirm")) {
      btn.classList.add("confirm");
      btn.textContent = "Toque de novo para apagar tudo";
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => { btn.classList.remove("confirm"); btn.textContent = "Recomeçar bolão"; }, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    btn.classList.remove("confirm");
    btn.textContent = "Recomeçar bolão";
    for (let n = 1; n <= 6; n++) state.picks[n] = [];
    blobAtual = null;
    go(1);
    toast("Bolão zerado. Boa sorte na nova rodada!");
  });

  let primeiraCarga = true;

  // ---------- moedas ----------
  function chuvaDeMoedas() { FX.rain(36); }

  // ---------- barra inferior ----------
  function renderDock() {
    const d = $("#dock");
    const s = state.step;
    const encerrado = `<button type="button" class="btn btn-gold wide" disabled>Apostas encerradas</button>`;
    const verBilhete = `<button type="button" class="btn btn-gold grow" data-act="goto" data-n="7">Ver meu bilhete</button>`;
    if (fechado() && s !== 7) {
      const c = s >= 1 && s <= 6 ? `<div class="dock-count ${state.picks[s].length === POR_BLOCO ? "full" : ""}"><b>${state.picks[s].length}</b><span>/5</span></div>` : "";
      d.innerHTML = c + (completo() ? verBilhete : encerrado);
    } else if (s === 0) {
      const inicio = totalPicks() > 0 ? "Continuar bolão" : "Bora apostar";
      d.innerHTML = `<button type="button" class="btn btn-gold wide" data-act="start">${inicio}</button>`;
    } else if (s >= 1 && s <= 6) {
      const c = state.picks[s].length;
      const ult = s === 6;
      d.innerHTML = `
        <div class="dock-count ${c === POR_BLOCO ? "full" : ""}"><b>${c}</b><span>/5</span></div>
        <button type="button" class="btn btn-jade" data-act="spin" ${spinning ? "disabled" : ""}>Girar</button>
        <button type="button" class="btn btn-gold grow" data-act="next" ${c < POR_BLOCO || spinning ? "disabled" : ""}>${ult ? "Ver bilhete" : "Próximo bloco"}</button>`;
    } else {
      if (!completo() && fechado()) {
        d.innerHTML = encerrado;
      } else if (!completo()) {
        const prox = BLOCOS.find((b) => state.picks[b.n].length < POR_BLOCO);
        d.innerHTML = `<button type="button" class="btn btn-gold wide" data-act="goto" data-n="${prox.n}">Completar bloco ${prox.n}</button>`;
      } else {
        const share = podeCompartilhar()
          ? `<button type="button" class="btn btn-jade" data-act="share">Compartilhar</button>` : "";
        d.innerHTML = `${share}<button type="button" class="btn btn-gold grow" data-act="download" ${blobAtual ? "" : "disabled"}>Baixar imagem</button>`;
      }
    }
  }

  $("#dock").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    if (act === "start") {
      FX.sfx.start();
      const prox = BLOCOS.find((x) => state.picks[x.n].length < POR_BLOCO);
      go(prox ? prox.n : 7);
    } else if (act === "spin") girar();
    else if (act === "next") { FX.sfx.tap(); go(state.step + 1); }
    else if (act === "goto") { FX.sfx.tap(); go(Number(b.dataset.n)); }
    else if (act === "download") baixar();
    else if (act === "share") compartilhar();
  });

  // ---------- render principal ----------
  function render() {
    const s = state.step;
    $("#view-intro").hidden = s !== 0;
    $("#view-bloco").hidden = !(s >= 1 && s <= 6);
    $("#view-bilhete").hidden = s !== 7;
    document.body.dataset.step = String(s);
    document.body.classList.toggle("is-closed", fechado());
    $("#nome-intro").disabled = fechado();
    $("#fechado-bloco").hidden = !fechado();
    if (s === 0) $("#nome-intro").value = state.nome;
    if (s >= 1 && s <= 6) renderBloco(s);
    else blocoAtual = null;
    if (s === 7) renderBilhete();
    renderSteps();
    renderDock();
  }

  const pad = (n) => String(n).padStart(2, "0");
  let estavaAberto = !fechado();
  function tickPrazo() {
    const falta = PRAZO.getTime() - Date.now();
    let txt, urgente = false;
    if (falta <= 0) {
      txt = `Apostas encerradas em ${PRAZO_TEXTO}`;
    } else {
      const seg = Math.floor(falta / 1000);
      const d = Math.floor(seg / 86400), h = Math.floor((seg % 86400) / 3600), m = Math.floor((seg % 3600) / 60), x = seg % 60;
      if (d >= 1) txt = `Fecha em ${d}d ${pad(h)}h ${pad(m)}min`;
      else { txt = `Fecha em ${pad(h)}:${pad(m)}:${pad(x)}`; urgente = true; }
    }
    document.querySelectorAll("[data-prazo]").forEach((el) => {
      el.querySelector(".prazo-txt").textContent = txt;
      el.classList.toggle("urgente", urgente);
      el.classList.toggle("fechado", falta <= 0);
    });
    if (estavaAberto && falta <= 0 && !spinning) {
      estavaAberto = false;
      render();
      toast("Apito final! As apostas foram encerradas.");
      FX.sfx.win();
    }
  }
  $("#prazo-data").textContent = PRAZO_TEXTO;
  tickPrazo();
  setInterval(tickPrazo, 1000);

  $("#qtd-cientistas").textContent = Object.keys(PESSOAS).length;

  if (VOTOS.ativo) {
    VOTOS.carregar();
    setInterval(() => { if (!document.hidden) VOTOS.carregar(); }, 45000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) VOTOS.carregar(); });
    agendarEnvio(); // reenvia se ficou pendente
  }

  render();
  primeiraCarga = false;

  if (saiuDoBolao.length) {
    salvar();
    const blocos = [...new Set(saiuDoBolao.map((x) => x.bloco))].sort().map((n) => `Bloco ${n}`).join(", ");
    const msg = saiuDoBolao.length === 1
      ? `${saiuDoBolao[0].nome} não vai para a Mostra e saiu do seu bolão. Escolha outro nome no ${blocos}.`
      : `${saiuDoBolao.length} palpites seus não vão para a Mostra e saíram do bolão. Escolha outros nomes (${blocos}).`;
    setTimeout(() => toast(msg, 7000), 700);
  }
})();
