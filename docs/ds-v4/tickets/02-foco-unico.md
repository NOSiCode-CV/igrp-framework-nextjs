# 02: Foco único em todos os primitivos

**What to build:** Quem navega com o teclado vê o mesmo anel em todo o lado: 2 px com 2 px de folga, em `--focus-ring`, que não muda com o acento da entidade e continua visível em cores forçadas. Nos controlos compostos o anel envolve o grupo.

**Blocked by:** 01 (Tokens Atlântico)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Todos os primitivos focáveis usam `--focus-ring` e não `--primary` nem `--ring` direto
- [ ] O anel leva o contorno transparente que aparece em cores forçadas
- [ ] Campo com prefixo e controlos compostos mostram um só anel à volta do grupo
- [ ] Mudar o acento da entidade não muda o anel (teste ou story que o prova)
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
