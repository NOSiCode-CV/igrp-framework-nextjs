# 18: Menu de ações adaptativo

**What to build:** O menu ⋯ de uma linha abre como bottom sheet num ecrã tátil e como popover com rato, com o mesmo nome e a mesma ordem de Tab.

**Blocked by:** 02 (Foco único em todos os primitivos)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Toque: bottom sheet (vaul); rato: popover (dropdown)
- [ ] O botão chama-se «Ações para {nome}» nas duas apresentações
- [ ] A escolha da apresentação vem do tipo de ponteiro, não da largura
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
