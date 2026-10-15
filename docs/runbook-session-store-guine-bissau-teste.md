# Runbook — Session store (Redis) em `guine-bissau-teste`

> Âmbito: app-center (`/`), demo (`/apps/demo`) e app-b (`/apps/app-b`) em
> `demoigrp.nosi.cv`, namespace `demo-igrp-stack`.
> Objetivo: sessões no Redis (cookie de ~6,5 KB → ~0,4 KB), validar o cenário do
> incidente de 2026-10-13 e repor os buffers do ingress em `4 8k`.

## 0. Pré-requisitos

| # | O quê | Quem | Estado |
|---|---|---|---|
| 0.1 | URL do Redis em Secret (`redis://igrp-frontend:<pw>@<host>:<porta>/<db>`) | Infra | pedido enviado |
| 0.2 | Topologia do Redis = **nó único** (Sentinel/Cluster exigem alteração no template) | Infra | por confirmar |
| 0.3 | Acesso de rede dos pods dos frontends ao Redis | Infra | por confirmar |
| 0.4 | Access Management implantado a partir de **`deploy/pre-release`** (contém `0444154d` … `fcea6d27`) — **não** `deploy/0.2.0-beta` | Equipa AM | por confirmar |
| 0.5 | Imagens dos frontends construídas com `@igrp/framework-next@0.2.0-beta.7`, `@igrp/framework-next-auth@0.2.0-beta.6` (ou posterior) | Frontend | por fazer |

Sem 0.1–0.5 não avançar.

## 1. Atualizar as três aplicações

Em cada repositório (app-center, demo, app-b):

```bash
pnpm dlx @igrp/template-migrator@latest apply --yes
pnpm install
pnpm build
```

Confirmar com `igrp-migrate check` que estão aplicadas, no mínimo, as migrações
**55, 56 e 57** (e 59). O app-center já está em 57 localmente.

Para o **app-center** (aplicação na raiz `/`), no `src/middleware.ts`:

```ts
staleAuthCookies(BASE_PATH, names, { sweepStockNames: true })
```

Só a app na raiz deve usar `sweepStockNames: true` — remove o cookie antigo
`next-auth.session-token` (nome sem sufixo) que, de outra forma, é enviado a
todas as apps em todos os pedidos.

## 2. Variáveis de ambiente (as três apps, todas as réplicas)

| Variável | Valor | Onde |
|---|---|---|
| `IGRP_SESSION_STORE_URL` | URL do passo 0.1 | **Secret** |
| `IGRP_SESSION_MAX_AGE` | `28800` | ConfigMap |
| `NEXTAUTH_SECRET` | o mesmo em todas as réplicas de cada app | Secret (já existe) |

Todas as réplicas da mesma app têm de apontar para o mesmo Redis. As três apps
podem partilhar o mesmo Redis e a mesma base de dados (as chaves são ids
aleatórios em `igrp:session:*`).

## 3. Implantar e verificar o arranque

Depois do rollout, em cada app:

```bash
kubectl -n demo-igrp-stack exec deploy/<app> -- sh -c 'redis-cli -u "$IGRP_SESSION_STORE_URL" PING'
```

→ `PONG`. Nos logs da app **não** pode aparecer:

- `[session-store] Redis error:` — ligação ao Redis falhou;
- `[igrp session-store] no session store is registered` — a variável não chegou à app.

## 4. Validação funcional (browser limpo — apagar os cookies de `demoigrp.nosi.cv`)

| # | Passo | Esperado |
|---|---|---|
| 1 | Login no app-center | Entra; no AM: `SESSION_CREATED` |
| 2 | Abrir `/apps/demo` | Entra **sem pedir credenciais**; no AM: só `SESSION_CREATED`, **nenhum** `SESSION_REPLACED` |
| 3 | Voltar ao app-center e navegar | Sem `401`, sem novo login |
| 4 | Abrir `/apps/app-b` e alternar entre as três várias vezes | Nenhuma pede login; nenhum `SESSION_REPLACED` |
| 5 | Esperar a expiração do access token (ou forçar refresh) e continuar a navegar | O refresh de uma app não afeta as outras |

Cookies no browser (DevTools → Application → Cookies), com o store ativo:

- `__Secure-next-auth.session-token~` — app-center, `Path=/`, **< 1 KB**;
- `__Secure-next-auth.session-token.apps-demo_p~` — `Path=/apps/demo`, **< 1 KB**;
- `__Secure-next-auth.session-token.apps-app-b.45112ec6_p~` — `Path=/apps/app-b`,
  **< 1 KB** (o `-` em `app-b` acrescenta um hash ao nome, para nunca colidir
  com `/apps/app/b`);
- nenhum cookie terminado em `.0` / `.1` (sinal de cookie fragmentado = sem store).

No Redis:

```bash
redis-cli -u "$IGRP_SESSION_STORE_URL" --scan --pattern 'igrp:session:*' | head
redis-cli -u "$IGRP_SESSION_STORE_URL" TTL igrp:session:<id>
```

→ uma chave por app com sessão; TTL ≤ 28800.

O passo 6 (logout único entre apps) **não** se valida ainda — depende do §3.4 do AM.

## 5. Tamanho do cabeçalho e reposição do ingress

1. No log do ingress-nginx, o `req_len` dos pedidos às três apps deve ficar
   **abaixo de ~5 KB**.
2. Se sim, repor os valores por omissão:

   ```bash
   kubectl -n kube-system patch cm ingress-nginx-4-1734430934-controller --type json -p '[{"op":"remove","path":"/data/client-header-buffer-size"},{"op":"remove","path":"/data/large-client-header-buffers"}]'
   ```

3. Repetir o passo 4 com o browser limpo: nenhum `400` / `431`.

## 6. Rollback

| Problema | Ação |
|---|---|
| Redis indisponível | As apps continuam a funcionar: novas sessões vão para o cookie (maior); sessões já no Redis pedem login. Repor o Redis. |
| Desativar o store | Remover `IGRP_SESSION_STORE_URL` e reiniciar. As sessões no Redis pedem login **uma vez**. Manter os buffers do ingress altos enquanto o store estiver desativado. |
| Regressão nas apps | Voltar à imagem anterior; os cookies antigos continuam válidos (sem mudança de nome nesta versão). |

## 7. Pontos em aberto (não bloqueiam este runbook)

- AM: logout único (§3.4), sessões pai/filho (§3.5), cookie de dispositivo,
  `/api/session/rotate` (ainda termina a sessão da app que o chama), cap de
  sessões (recomendado 9).
- Frontend: hydration mismatch na página de login do demo (tarefa separada).
