-- =====================================================================
-- Bolão JCC 2026 · contador de palpites
-- Cole tudo no Supabase: SQL Editor → New query → Run.
--
-- Segurança:
--  * Os bilhetes ficam no schema privado "bolao", que a API pública
--    não expõe. A chave pública (anon/publishable) não lê nem altera
--    nada diretamente.
--  * A chave pública só pode chamar duas funções:
--      enviar_bilhete(p_device, p_palpites)  -> valida e grava 1 bilhete por aparelho
--      contagem_palpites()                   -> devolve só os totais por cientista
--  * O prazo vale no servidor, e há limite de bilhetes por rede (o IP vira hash com sal).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists bolao;
revoke all on schema bolao from public, anon, authenticated;

-- Cientistas válidos (ids do site). Quem saiu da Mostra não está aqui.
create table if not exists bolao.cientistas (
  id    text primary key,
  bloco int  not null check (bloco between 1 and 6)
);

insert into bolao.cientistas (id, bloco) values
  ('b1-0', 1),
  ('b1-1', 1),
  ('b1-2', 1),
  ('b1-3', 1),
  ('b1-4', 1),
  ('b1-5', 1),
  ('b1-6', 1),
  ('b1-7', 1),
  ('b1-8', 1),
  ('b1-9', 1),
  ('b1-10', 1),
  ('b1-11', 1),
  ('b1-12', 1),
  ('b1-13', 1),
  ('b2-0', 2),
  ('b2-1', 2),
  ('b2-2', 2),
  ('b2-3', 2),
  ('b2-4', 2),
  ('b2-5', 2),
  ('b2-6', 2),
  ('b2-7', 2),
  ('b2-8', 2),
  ('b2-9', 2),
  ('b2-10', 2),
  ('b2-11', 2),
  ('b2-12', 2),
  ('b2-15', 2),
  ('b2-16', 2),
  ('b2-17', 2),
  ('b3-0', 3),
  ('b3-2', 3),
  ('b3-3', 3),
  ('b3-4', 3),
  ('b3-5', 3),
  ('b3-6', 3),
  ('b3-7', 3),
  ('b3-8', 3),
  ('b3-9', 3),
  ('b3-10', 3),
  ('b3-11', 3),
  ('b3-12', 3),
  ('b3-13', 3),
  ('b3-14', 3),
  ('b3-15', 3),
  ('b3-16', 3),
  ('b4-0', 4),
  ('b4-1', 4),
  ('b4-2', 4),
  ('b4-3', 4),
  ('b4-4', 4),
  ('b4-5', 4),
  ('b4-6', 4),
  ('b4-7', 4),
  ('b4-8', 4),
  ('b4-9', 4),
  ('b4-10', 4),
  ('b4-11', 4),
  ('b4-12', 4),
  ('b4-13', 4),
  ('b4-14', 4),
  ('b4-15', 4),
  ('b4-16', 4),
  ('b4-17', 4),
  ('b5-0', 5),
  ('b5-1', 5),
  ('b5-2', 5),
  ('b5-3', 5),
  ('b5-4', 5),
  ('b5-5', 5),
  ('b5-6', 5),
  ('b5-7', 5),
  ('b5-8', 5),
  ('b5-9', 5),
  ('b5-10', 5),
  ('b5-11', 5),
  ('b6-0', 6),
  ('b6-1', 6),
  ('b6-2', 6),
  ('b6-3', 6),
  ('b6-4', 6),
  ('b6-5', 6),
  ('b6-6', 6),
  ('b6-7', 6),
  ('b6-8', 6),
  ('b6-9', 6),
  ('b6-10', 6),
  ('b6-12', 6),
  ('b6-13', 6),
  ('b6-14', 6)
on conflict (id) do nothing;

-- Um bilhete por aparelho (código aleatório, sem nome de ninguém).
create table if not exists bolao.bilhetes (
  device        uuid primary key,
  palpites      text[]      not null,
  ip_hash       text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists bilhetes_ip_hash_idx on bolao.bilhetes (ip_hash);

-- Configurações (o sal é gerado aqui e nunca sai do banco).
create table if not exists bolao.config (
  chave text primary key,
  valor text not null
);
insert into bolao.config (chave, valor) values
  ('salt',       encode(extensions.gen_random_bytes(16), 'hex')),
  ('prazo',      '2026-11-23 23:59:59-03'),
  ('max_por_ip', '12')
on conflict (chave) do nothing;

alter table bolao.cientistas enable row level security;
alter table bolao.bilhetes   enable row level security;
alter table bolao.config     enable row level security;
revoke all on all tables in schema bolao from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Enviar (ou atualizar) o bilhete deste aparelho
-- ---------------------------------------------------------------------
create or replace function public.enviar_bilhete(p_device uuid, p_palpites text[])
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prazo  timestamptz;
  v_salt   text;
  v_max    int;
  v_ip     text;
  v_hash   text;
  v_qtd    int;
begin
  select valor::timestamptz into v_prazo from bolao.config where chave = 'prazo';
  if now() > v_prazo then
    raise exception 'bolao_encerrado';
  end if;

  if p_device is null or p_palpites is null or cardinality(p_palpites) <> 30 then
    raise exception 'bilhete_invalido';
  end if;

  -- 30 cientistas diferentes, todos válidos, 5 em cada um dos 6 blocos
  if (select count(distinct x) from unnest(p_palpites) as x) <> 30
     or (select count(*) from bolao.cientistas c where c.id = any (p_palpites)) <> 30
     or exists (
          select 1 from bolao.cientistas c
          where c.id = any (p_palpites)
          group by c.bloco
          having count(*) <> 5)
  then
    raise exception 'bilhete_invalido';
  end if;

  -- limite de bilhetes novos por rede
  v_ip := trim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1));
  if v_ip <> '' then
    select valor into v_salt from bolao.config where chave = 'salt';
    v_hash := encode(extensions.digest(v_salt || v_ip, 'sha256'), 'hex');
    if not exists (select 1 from bolao.bilhetes where device = p_device) then
      select valor::int into v_max from bolao.config where chave = 'max_por_ip';
      select count(*) into v_qtd from bolao.bilhetes where ip_hash = v_hash;
      if v_qtd >= v_max then
        raise exception 'limite_atingido';
      end if;
    end if;
  end if;

  insert into bolao.bilhetes (device, palpites, ip_hash)
  values (p_device, p_palpites, v_hash)
  on conflict (device) do update
    set palpites = excluded.palpites,
        atualizado_em = now();

  return json_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Totais por cientista (nunca devolve bilhetes individuais)
-- ---------------------------------------------------------------------
create or replace function public.contagem_palpites()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'bilhetes', (select count(*) from bolao.bilhetes),
    'votos', coalesce((
      select json_object_agg(t.id, t.n)
      from (
        select p.id, count(*) as n
        from bolao.bilhetes b
        cross join lateral unnest(b.palpites) as p(id)
        group by p.id
      ) t
    ), '{}'::json)
  );
$$;

revoke all on function public.enviar_bilhete(uuid, text[]) from public;
revoke all on function public.contagem_palpites() from public;
grant execute on function public.enviar_bilhete(uuid, text[]) to anon, authenticated;
grant execute on function public.contagem_palpites() to anon, authenticated;
