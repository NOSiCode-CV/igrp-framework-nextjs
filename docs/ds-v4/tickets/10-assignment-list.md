# 10: IGRPAssignmentList

**What to build:** Uma lista para atribuir perfis, aplicações ou permissões. Em `batch` usa checkboxes, conta as alterações por guardar, aceita um motivo opcional e termina com um toast com o resumo. Em `immediate` usa switches que gravam por linha e revertem se falharem.

**Blocked by:** 05 (Checkbox com estado parcial), 06 (Switch que grava ao mudar)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] `batch`: checkboxes, «n alterações por guardar», motivo opcional, Guardar que diz porquê quando não há alterações
- [ ] `batch`: toast final com o resumo («1 ativada, 1 desativada»), nunca «não pode ser desfeita»
- [ ] `immediate`: switches com gravação por linha, `aria-busy` e reversão com erro na linha
- [ ] Pesquisa e contagem; a contagem não aparece a carregar; estado sem resultados
- [ ] A 375 px o nome parte em várias linhas e o controlo mantém a área de toque de 44 px
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
