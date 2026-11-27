# 19: Tabela virtualizada

**What to build:** Listas longas na tabela de dados ficam virtualizadas sem perder o cabeçalho fixo, a contagem da seleção nem a leitura da posição de cada linha.

**Blocked by:** 04 (Item ativo e linha selecionada)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Virtualização opcional com a biblioteca de virtualização do TanStack
- [ ] `aria-rowcount` com o total e `aria-rowindex` em cada linha
- [ ] Cabeçalho fixo e contagem da seleção sem regressão
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
