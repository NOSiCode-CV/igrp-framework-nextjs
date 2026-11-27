# 15: IGRPInfoTip

**What to build:** Um botão «i» junto ao rótulo dá mais informação sem tirar a ajuda essencial de baixo do campo. Abre com hover ou foco, fixa-se com Enter ou Espaço e fecha com Escape.

**Blocked by:** 02 (Foco único em todos os primitivos)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Botão focável com o nome «Mais informação sobre {rótulo}»
- [ ] Abre com hover e com foco; Enter ou Espaço fixam; Escape fecha
- [ ] Nada essencial só no InfoTip (documentado nas stories)
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
