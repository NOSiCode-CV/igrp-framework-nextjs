# 04: Item ativo e linha selecionada

**What to build:** O item ativo da navegação lateral e a linha selecionada da tabela marcam-se da mesma forma: tint de seleção e barra de 2 px em `--active-bar`, além do estado ARIA.

**Blocked by:** 01 (Tokens Atlântico)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Item ativo da navegação com barra lateral, fundo de seleção e `aria-current="page"`
- [ ] Linha selecionada da tabela com tint `--accent` e a barra em `inset`, além da caixa marcada
- [ ] No escuro a barra de lote fica em `--muted`, distinta das linhas selecionadas
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
