// Termômetro da galera: envia o bilhete completo (sem nome) e lê os totais por cientista.
(function () {
  "use strict";

  const cfg = window.BOLAO_SUPABASE || {};
  const ativo = !!(cfg.url && cfg.chave);

  const DEV_KEY = "bolao-jcc-2026-aparelho";
  const SENT_KEY = "bolao-jcc-2026-enviado";
  const CACHE_KEY = "bolao-jcc-2026-votos";

  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch (e) { /* sem armazenamento */ }
    return null;
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  let aparelho = ls(DEV_KEY);
  if (!aparelho) { aparelho = uuid(); ls(DEV_KEY, aparelho); }

  function headers() {
    const h = { "Content-Type": "application/json", apikey: cfg.chave };
    if (cfg.chave.startsWith("eyJ")) h.Authorization = "Bearer " + cfg.chave; // chave anon antiga (JWT)
    return h;
  }

  async function rpc(fn, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const r = await fetch(`${cfg.url.replace(/\/+$/, "")}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body || {}),
        signal: ctrl.signal,
      });
      const txt = await r.text();
      let data = null;
      try { data = JSON.parse(txt); } catch (e) { /* resposta sem JSON */ }
      if (!r.ok) {
        const err = new Error((data && data.message) || txt || String(r.status));
        err.code = (data && data.message) || String(r.status);
        throw err;
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  let dados = null;
  try { dados = JSON.parse(ls(CACHE_KEY) || "null"); } catch (e) { dados = null; }
  const ouvintes = [];
  const avisar = () => ouvintes.forEach((f) => { try { f(dados); } catch (e) { /* ignora */ } });

  let carregando = null;
  function carregar() {
    if (!ativo) return Promise.resolve(null);
    if (carregando) return carregando;
    carregando = rpc("contagem_palpites")
      .then((d) => {
        dados = { bilhetes: (d && d.bilhetes) || 0, votos: (d && d.votos) || {}, em: Date.now() };
        ls(CACHE_KEY, JSON.stringify(dados));
        avisar();
        return dados;
      })
      .catch(() => dados)
      .finally(() => { carregando = null; });
    return carregando;
  }

  async function enviar(palpites) {
    if (!ativo) return { ok: false, motivo: "desligado" };
    const assinatura = [...palpites].sort().join(",");
    if (ls(SENT_KEY) === assinatura) return { ok: true, repetido: true };
    try {
      await rpc("enviar_bilhete", { p_device: aparelho, p_palpites: palpites });
      ls(SENT_KEY, assinatura);
      carregar();
      return { ok: true };
    } catch (e) {
      return { ok: false, motivo: e.code || "erro" };
    }
  }

  window.VOTOS = {
    ativo,
    get dados() { return dados; },
    carregar,
    enviar,
    onChange(f) { ouvintes.push(f); },
  };
})();
