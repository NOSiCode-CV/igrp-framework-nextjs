# 07: Campo v4

**What to build:** Os campos de texto e a família reservam a linha do erro, para nada saltar quando ele aparece; o preenchimento automático mantém as cores do tema; um campo desativado com motivo continua focável e diz porquê.

**Blocked by:** 01 (Tokens Atlântico)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Linha do erro reservada por baixo de cada campo; o erro tem ícone e liga-se por `aria-describedby`
- [ ] `:-webkit-autofill` pinta com `--card` e `--fg` nos dois temas
- [ ] Motivo de desativação: `aria-disabled`, focável, motivo ligado por `aria-describedby`
- [ ] Identificadores e códigos usam `inputmode="numeric"`, nunca `type="number"`
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
