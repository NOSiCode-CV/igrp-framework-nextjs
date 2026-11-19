# 14: IGRPAddressField

**What to build:** A morada em Cabo Verde escolhe-se por ilha, concelho e freguesia, por esta ordem, com cada nível desativado até haver o anterior e o motivo à vista. As listas vêm da app.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Cada nível desativado com motivo até haver o anterior; uma opção única escolhe-se sozinha e diz isso
- [ ] Mudar um nível limpa os de baixo
- [ ] «A morada é fora de Cabo Verde» troca para país, cidade e morada livre
- [ ] Em só leitura, do mais próximo para o mais geral
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
