# Plano de execução: DS v4 no design system

Executa o [spec](spec.md) por ondas. Cada ticket é feito numa sessão própria do Claude Code, com uma branch própria. Este plano diz a ordem, o que cada sessão faz e que skills usa.

## Regras para todas as sessões

- **Pasta de arranque:** a raiz do workspace (`igrp-horizon-workspace`). As skills do fluxo estão em `.agents/skills/` da raiz; as skills técnicas do design system estão em `shared/frontend/nextjs/.agents/skills/`. O código muda só dentro de `shared/frontend/nextjs`.
- **Antes de mexer em código, ler:**
  - o `CLAUDE.md` e as regras em `.claude/shared/hard-rules.md` do submódulo;
  - o `packages/design-system/CLAUDE.md`;
  - o `KNOWN-ISSUES.md` do pacote, se existir;
  - o spec e o ticket.
- **Branches:**
  - uma branch de integração, `feature/ds-v4`, criada a partir do `development` na onda 0;
  - cada ticket numa branch `feature/ds-v4-NN-<slug>` (o slug é o do nome do ficheiro do ticket), criada a partir da `feature/ds-v4` atualizada;
  - o ticket entra na `feature/ds-v4` por merge request. A `feature/ds-v4` só entra no `development` no fim, na onda 5.
- **Versões:** um changeset `patch` por ticket, nunca `major` nem `minor`. Não se publica no registo durante o plano.
- **Commits:** sem trailers `Co-Authored-By`. Commit e push só quando a pessoa pedir.
- **Textos de interface:** todos através das traduções do framework. O `lint:i18n:framework` tem de passar.
- **Ambiguidade:** se o canvas e o spec divergirem, pergunta-se à pessoa antes de decidir.
- **Ticket fechado:**
  - o ticket é marcado `done` no seu ficheiro, com os critérios assinalados;
  - os comandos de verificação passam (secção «Verificação»);
  - a revisão foi feita.

## Skills por fase de cada ticket

Cada sessão de ticket segue estas fases.

| Fase | Skill | Para quê |
|---|---|---|
| Começar | `implement` (`.agents/skills/implement`) | Ler o ticket, dizer o título e seguir o fluxo |
| Construir | `tdd` (`.agents/skills/tdd`) | Teste a falhar primeiro, nos três pontos de teste do spec; depois o código mínimo; depois refactor |
| Código mínimo | `ponytail` | A menor alteração completa; reaproveitar primitivos e utilitários que já existem |
| Componentes | `shadcn` (skill do submódulo) | Mexer em primitivos vindos do shadcn sem perder o registo de drift (`drift:shadcn`) |
| React | `vercel-react-best-practices` e `vercel-composition-patterns` (skills do submódulo) | Composição e desempenho dos componentes novos |
| Erro difícil | `diagnosing-bugs` | Só quando um teste falha sem causa óbvia |
| Rever | `code-review` e `ponytail-review` | Contra os padrões do repositório e contra o spec, antes do merge request |
| Textos | `unslop` | Changeset, mensagem de commit e notas do merge request |
| Merge request | `pr` | Corpo do merge request para a `feature/ds-v4` |
| Fim de sessão | `handoff` | Só se a sessão parar a meio: deixa o estado para a sessão seguinte |

Skills específicas de cada ticket estão na coluna «Skills extra» das ondas.

## Ondas

Uma onda só começa quando os tickets de que depende já entraram na `feature/ds-v4`. Dentro de cada onda, os tickets correm em paralelo, uma sessão por ticket.

### Onda 0: preparar (1 sessão)

- Criar a `feature/ds-v4` a partir do `development` e enviá-la.
- Correr `pnpm install:deps` e `pnpm build:framework` uma vez, para confirmar que o ponto de partida passa (`test`, `lint`, `typecheck` do design system).
- Se algo falhar já no ponto de partida, registar no `KNOWN-ISSUES.md` e avisar a pessoa antes da onda 1.

### Onda 1: fundação (1 sessão)

| Ticket | Bloqueado por | Skills extra | Notas |
|---|---|---|---|
| [01 Tokens Atlântico](tickets/01-tokens-atlantico.md) | — | `ui-ux-pro-max` (verificação de contraste) | Mudar o `fonts.ts` do template obriga a uma migração no `template-migrator` e a correr `sync:template-lock`; sem isso o `check:drift` falha |

### Onda 2: primitivos (até 6 sessões em paralelo)

| Ticket | Bloqueado por | Skills extra |
|---|---|---|
| [02 Foco único](tickets/02-foco-unico.md) | 01 | `shadcn` |
| [03 Destrutivo sólido](tickets/03-destrutivo-solido.md) | 01 | `shadcn` |
| [04 Item ativo e linha selecionada](tickets/04-item-ativo-linha-selecionada.md) | 01 | `tanstack-table` |
| [05 Checkbox parcial](tickets/05-checkbox-parcial.md) | 01 | `shadcn` |
| [06 Switch que grava](tickets/06-switch-gravacao.md) | 01 | `shadcn` |
| [07 Campo v4](tickets/07-campo-v4.md) | 01 | `shadcn` |

O 02 e o 07 tocam nos mesmos primitivos de campo. Fazê-los em sessões diferentes, com merge do 02 primeiro; o 07 faz rebase a seguir.

### Onda 3: compostos e componentes novos (até 8 sessões em paralelo)

| Ticket | Bloqueado por | Skills extra |
|---|---|---|
| [08 Formulário v4](tickets/08-formulario-v4.md) | 07 | — |
| [09 Escudos e números](tickets/09-escudos-numeros.md) | 07 | — |
| [10 IGRPAssignmentList](tickets/10-assignment-list.md) | 05, 06 | `codebase-design` (forma da API) |
| [11 IGRPIdentifierField](tickets/11-identifier-field.md) | 07 | — |
| [12 IGRPDateField](tickets/12-date-field.md) | 07 | — |
| [13 IGRPPhoneField](tickets/13-phone-field.md) | 07 | — |
| [14 IGRPAddressField](tickets/14-address-field.md) | 07 | `codebase-design` |
| [20 Envio de ficheiros v4](tickets/20-envio-ficheiros-v4.md) | 07 | — |

### Onda 4: ADR 0002 (até 5 sessões em paralelo; pode sobrepor-se à onda 3)

| Ticket | Bloqueado por | Skills extra |
|---|---|---|
| [15 IGRPInfoTip](tickets/15-info-tip.md) | 02 | `shadcn` |
| [16 IGRPTimestamp](tickets/16-timestamp.md) | 02 | `research` (Timestamp do Astryx) |
| [17 IGRPTreeView](tickets/17-tree-view.md) | 02 | `research` (TreeList do Astryx), `codebase-design` |
| [18 Menu de ações adaptativo](tickets/18-menu-acoes-adaptativo.md) | 02 | `shadcn` |
| [19 Tabela virtualizada](tickets/19-tabela-virtualizada.md) | 04 | `tanstack-table` |

Nos tickets que portam código do Astryx (16 e 17), o aviso de licença MIT da Meta fica nos ficheiros que aproveitam lógica dele.

### Onda 5: fechar (1 sessão)

| Ticket | Bloqueado por | Skills |
|---|---|---|
| [21 Nota de migração](tickets/21-nota-migracao.md) | 01 a 08 | `unslop` (nota), `pr` |

A seguir ao 21:

- **Revisão:** `code-review` de toda a `feature/ds-v4` contra o `development`, e `ponytail-review`.
- **Verificação completa:** `pnpm ci:local`.
- **Merge request:** da `feature/ds-v4` para o `development`, com o corpo escrito com a skill `pr`. Só se abre quando a pessoa pedir.
- **Workspace:** no root, um commit só com a atualização do ponteiro do submódulo, depois do merge.

## Verificação (em cada ticket)

Dentro de `shared/frontend/nextjs`:

- `pnpm --filter @igrp/igrp-framework-react-design-system test`
- `pnpm --filter @igrp/igrp-framework-react-design-system lint`
- `pnpm --filter @igrp/igrp-framework-react-design-system typecheck`
- `pnpm lint:i18n:framework` (precisa de `pnpm build:i18n-tools` uma vez)
- Storybook: `pnpm storybook` e `pnpm test:storybook`, sem violações do axe nos estados novos, nos dois temas e a 375 px.
- Só no ticket 01: `pnpm --filter @igrp/template-migrator test` e `check:drift`.

## Como arrancar uma sessão de ticket

Mensagem para abrir a sessão, trocando o número:

> Implementa o ticket `shared/frontend/nextjs/docs/ds-v4/tickets/NN-<slug>.md` seguindo o plano `shared/frontend/nextjs/docs/ds-v4/plano.md`. Usa as skills `implement` e `tdd`, e as skills extra que o plano indica para este ticket. Trabalha na branch `feature/ds-v4-NN-<slug>`, criada a partir da `feature/ds-v4`. No fim, corre a verificação e a revisão, e pergunta antes de fazer commit, push ou merge request.

## Estado

| Onda | Tickets | Estado |
|---|---|---|
| 0 | preparar | por fazer |
| 1 | 01 | por fazer |
| 2 | 02 a 07 | por fazer |
| 3 | 08 a 14, 20 | por fazer |
| 4 | 15 a 19 | por fazer |
| 5 | 21, revisão, MR final | por fazer |

Cada sessão atualiza esta tabela e o estado do seu ticket quando termina.
