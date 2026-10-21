# Re: `isAuthBypass()` sem guarda `NODE_ENV` — resposta do frontend

> Para: equipa de QA.
> De: framework frontend IGRP.
> Assunto: achado "Alto" sobre `isAuthBypass()` em `templates/demo-v1/src/lib/utilities.ts`.

## 1. Resumo

Obrigado pelo achado. A descrição técnica está correta: `isAuthBypass()` não verifica `NODE_ENV`. A nossa conclusão é outra:

- **Não é uma vulnerabilidade.** O modo preview funciona como foi desenhado: sem login, sem Access Management (AM) e com um utilizador de dados mock com acesso total. Serve para desenvolvimento e demos sem backend.
- **Reclassificamos a severidade para Baixo.** O risco real é de configuração: alguém ativar o modo por engano num deploy real.
- **Não vamos aplicar a correção proposta** (`NODE_ENV === 'production'` em `isAuthBypass()`). Os motivos estão na secção 3.
- **Vamos implementar um endurecimento diferente**, descrito na secção 4: a aplicação recusa arrancar em produção com o bypass ligado, a não ser que alguém o confirme de forma explícita.

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

Em `templates/demo-v1/src/instrumentation.ts` (`register()`, que corre uma vez antes do primeiro pedido), a aplicação **recusa arrancar** quando estas três condições se verificam ao mesmo tempo:

- o bypass está ligado (`IGRP_PREVIEW_MODE=true` ou `AUTH_PROVIDER=none`);
- `NODE_ENV=production`;
- `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION` não vale `true`.

O erro aparece no log do pod e diz que variável está a ativar o bypass. A imagem `docker/development` passa a definir `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION=true` em `.env.development` e continua a funcionar.

O efeito é este:

| Situação | Hoje | Depois |
|---|---|---|
| `pnpm dev` com preview | funciona | funciona (não é produção) |
| Imagem `docker/development` | funciona | funciona (confirmação explícita) |
| Deploy real com preview esquecido | aberto a todos, sem aviso | **não arranca**, com erro claro no log |

A verificação fica no arranque e não dentro do predicado por três razões: corre uma única vez, fica num só sítio em vez de quatro, e não muda o comportamento a meio de um pedido. Recusar arrancar, em vez de desligar o bypass, evita o estado intermédio descrito em 3.2.

### 4.2 Alinhamento dos predicados

`isIgrpAuthBypass()` (`@igrp/framework-next`) não remove as aspas de `AUTH_PROVIDER`, ao contrário das outras três implementações. Com `docker --env AUTH_PROVIDER="none"` (aspas preservadas), o template entra em bypass e o framework não, e a aplicação nega todas as permissões. Isto não é uma falha de segurança (falha fechada), mas vamos corrigi-lo e acrescentar um teste.

### 4.3 Entrega

- Changeset `patch` para `@igrp/framework-next` (4.2).
- Migração do `@igrp/template-migrator` para as alterações ao template (4.1), para que as aplicações existentes as recebam com `igrp-migrate`.
- Documentação da nova variável em `templates/demo-v1/docs/ENVIRONMENT.md` e `DOCKER-RUN.md`.

## 5. Aplicações já geradas a partir do template

As aplicações que já existem recebem a verificação ao aplicar a migração. Até lá, recomendamos que as equipas confirmem nos seus deploys reais (pipelines, Kubernetes, ficheiros `.env`) que:

- `IGRP_PREVIEW_MODE` está ausente ou vale `false`;
- `AUTH_PROVIDER` vale `igrp-auth`.

As aplicações a jusante não estão neste repositório, por isso esta verificação tem de ser feita por cada equipa.
