# 13: IGRPPhoneField

**What to build:** O telefone tem o indicativo à parte, com +238 primeiro, e o número em grupos. Ao colar com indicativo, o indicativo passa para o seletor. Evolui o campo de telefone existente.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Seletor de indicativo com +238 primeiro
- [ ] Número em grupos («991 23 45»); 7 algarismos para Cabo Verde
- [ ] Guardado em E.164
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
