# Re: `isAuthBypass()` sem guarda `NODE_ENV` — resposta do frontend

> Para: equipa de QA.
> De: framework frontend IGRP.
> Assunto: achado "Alto" sobre `isAuthBypass()` em `templates/demo-v1/src/lib/utilities.ts`.

## 1. Resumo

Obrigado pelo achado. A descrição técnica está correta: `isAuthBypass()` não verifica `NODE_ENV`. A nossa conclusão é outra:

- **Não é uma vulnerabilidade.** O modo preview funciona como foi desenhado: sem login, sem Access Management (AM) e com um utilizador de dados mock com acesso total. Serve para desenvolvimento e demos sem backend.
- **Reclassificamos a severidade para Baixo.** O risco real é de configuração: alguém ativar o modo por engano num deploy real.
- **Não vamos aplicar a correção proposta** (`NODE_ENV === 'production'` em `isAuthBypass()`). Os motivos estão na secção 3.
- **Implementámos um endurecimento diferente**, descrito na secção 4: em produção com o bypass ligado, a aplicação responde 500 a todos os pedidos e regista o erro no log, a não ser que alguém confirme o bypass de forma explícita.

## 2. O que o modo preview faz

O bypass só se ativa com um valor explícito numa de duas variáveis:

| Variável | Valor que ativa | Por omissão |
|---|---|---|
| `IGRP_PREVIEW_MODE` | `true` | vazio no `.env.example`, ou seja, desligado |
| `AUTH_PROVIDER` | `none` | `igrp-auth` |

Com o bypass ligado:

- O middleware deixa passar todos os pedidos sem login (`templates/demo-v1/src/middleware.ts`).
- O layout usa uma sessão stub, e menus e aplicações vêm dos mocks em `src/temp`.
- `igrpGetClaims` devolve claims de super-admin (`packages/framework/next/src/lib/permissions.ts`).
- O AM não é contactado, e o sync com o AM é ignorado com um aviso no log.

É exatamente este o comportamento pretendido, e está documentado em `templates/demo-v1/docs/ENVIRONMENT.md` e `templates/demo-v1/docs/DOCKER-RUN.md`.

Sobre a frase "Permissions have NO default-deny", citada no achado: diz respeito à **autorização** de utilizadores já autenticados (cada página tem de declarar a sua permissão), não ao bypass de **autenticação**. São temas separados.

## 3. Porque não aplicamos a correção proposta

### 3.1 Parte um uso legítimo

`NODE_ENV` vale `production` em qualquer `next build` / `next start`, e não apenas em produção. A imagem oficial `templates/demo-v1/docker/development` corre com `NODE_ENV=production` e com o modo preview ligado de propósito, para dar uma demo sem IdP nem AM. Com a guarda proposta, essa imagem deixava de funcionar.

### 3.2 Cria uma escalada de privilégios

O predicado de bypass existe em quatro sítios: no template e em três pontos dos pacotes `@igrp/framework-next` e `@igrp/framework-next-auth`. Uma guarda só no template põe-nos em desacordo. Num deploy real com `IGRP_PREVIEW_MODE=true` esquecido e o IdP configurado:

1. O template deixa de estar em bypass e o login volta a ser exigido.
2. Os utilizadores autenticam-se normalmente no IdP.
3. O framework continua em bypass e dá **super-admin a todos os utilizadores autenticados**, ignorando as permissões reais do token.

Este resultado é pior do que a situação atual, em que um deploy mal configurado se nota logo porque não há ecrã de login.

## 4. Solução que vamos implementar

### 4.1 Verificação ao arranque

A verificação é a função `igrpAssertAuthBypassAllowed()` do `@igrp/framework-next`, chamada em `register()` de `templates/demo-v1/src/instrumentation.ts` (corre uma vez, antes do primeiro pedido). A função lança um erro quando estas três condições se verificam ao mesmo tempo:

- o bypass está ligado (`IGRP_PREVIEW_MODE=true` ou `AUTH_PROVIDER=none`);
- o `NODE_ENV` não é `development` nem `test` (qualquer outro valor, incluindo `staging` ou ausente, conta como produção);
- `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION` não vale `true`.

Com o erro, o Next escreve no log `[igrp-auth-bypass]: <variável> desliga a autenticação num build de produção...`, com o nome de todas as variáveis que estão a ativar o bypass, e **responde 500 a todos os pedidos**. O processo não termina, mas ninguém entra na aplicação.

O efeito é este:

| Situação | Hoje | Depois |
|---|---|---|
| `pnpm dev` com preview | funciona | funciona (não é produção) |
| Imagem `docker/development` | funciona | funciona (o opt-in vem definido em `.env.development`) |
| Deploy real com preview esquecido | aberto a todos, sem aviso | **500 em todos os pedidos**, com erro claro no log |

A imagem `docker/development` traz o opt-in definido de propósito, para continuar a servir de demo sem IdP. Isso também quer dizer que a verificação não atua nessa imagem: não deve ser usada num deploy real sem sobrepor `IGRP_PREVIEW_MODE=false` e `AUTH_PROVIDER=igrp-auth` (está documentado em `DOCKER-RUN.md`).

A verificação fica no arranque e não dentro do predicado por três razões: corre uma única vez, fica num só sítio em vez de quatro, e não muda o comportamento a meio de um pedido. Falhar todos os pedidos, em vez de desligar o bypass, evita o estado intermédio descrito em 3.2.

### 4.2 Alinhamento dos predicados

`isIgrpAuthBypass()` (`@igrp/framework-next`) não remove as aspas de `AUTH_PROVIDER`, ao contrário das outras três implementações. Com `docker --env AUTH_PROVIDER="none"` (aspas preservadas), o template entra em bypass e o framework não, e a aplicação nega todas as permissões. Isto não é uma falha de segurança (falha fechada), mas vamos corrigi-lo e acrescentar um teste.

### 4.3 Entrega

- `@igrp/framework-next` `0.2.0-beta.13`: `igrpAssertAuthBypassAllowed()` (4.1) e a correção das aspas (4.2).
- `@igrp/template-migrator` `0.2.0-beta.12`, migração 71 (`71-auth-bypass-production-guard`): atualiza `instrumentation.ts` e `.env.example`, acrescenta o opt-in à imagem `docker/development` e sobe `@igrp/framework-next` para `0.2.0-beta.13`. As aplicações existentes recebem-na com `igrp-migrate`.
- Documentação da nova variável em `templates/demo-v1/docs/ENVIRONMENT.md`, `DOCKER-RUN.md` e `.env.example`.

## 5. Aplicações já geradas a partir do template

As aplicações que já existem recebem a verificação ao aplicar a migração. Até lá, recomendamos que as equipas confirmem nos seus deploys reais (pipelines, Kubernetes, ficheiros `.env`) que:

- `IGRP_PREVIEW_MODE` está ausente ou vale `false`;
- `AUTH_PROVIDER` vale `igrp-auth`.

As aplicações a jusante não estão neste repositório, por isso esta verificação tem de ser feita por cada equipa.
