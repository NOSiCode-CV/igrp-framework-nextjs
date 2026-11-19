# 03: Botão destrutivo sólido

**What to build:** O botão destrutivo é vermelho sólido com texto branco nos dois temas. No escuro, o vermelho claro fica só para texto, ícones e bordas de erro.

**Blocked by:** 01 (Tokens Atlântico)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] A variante destrutiva usa `--destructive-solid` e `--destructive-foreground` nos dois temas
- [ ] Mensagens de erro, ícones e bordas `aria-invalid` usam `--destructive`
- [ ] Hover e ativo do destrutivo continuam ≥ 4,5:1 com o texto branco
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
