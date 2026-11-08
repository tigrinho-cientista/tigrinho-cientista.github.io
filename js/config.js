// Conexão com o Supabase para o "termômetro" de palpites.
//
// A chave abaixo é a chave PÚBLICA (publishable/anon). Ela foi feita para ficar
// no navegador: com ela só dá para chamar enviar_bilhete() e contagem_palpites(),
// que o banco valida (veja supabase/setup.sql). NUNCA coloque aqui a chave
// secreta (service_role / sb_secret_...).
//
// Deixe vazio para desligar o contador; o resto do site funciona normalmente.
window.BOLAO_SUPABASE = {
  url: "",
  chave: "",
};
