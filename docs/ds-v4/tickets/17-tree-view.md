# 17: IGRPTreeView

**What to build:** Uma árvore navegável com uma só paragem de Tab e as setas, que anuncia o nível e a posição de cada item. Porta o TreeList do Astryx.

**Blocked by:** 02 (Foco único em todos os primitivos)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] `tree`, `treeitem` e `group` com `aria-level`, `aria-posinset` e `aria-setsize`
- [ ] Setas movem o item realçado; direita abre, esquerda fecha; uma paragem de Tab
- [ ] Aviso de licença MIT nos ficheiros que aproveitam lógica do Astryx
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
