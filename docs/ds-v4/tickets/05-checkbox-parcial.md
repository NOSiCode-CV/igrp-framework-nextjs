# 05: Checkbox com estado parcial

**What to build:** A checkbox mostra o estado parcial com um traço e anuncia-o como misto. Um pai de grupo calcula o seu estado a partir dos filhos, e clicar no pai parcial marca todos os filhos; clicar outra vez desmarca-os. O estado parcial não se perde dentro de um formulário.

**Blocked by:** 01 (Tokens Atlântico)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Estado parcial com ícone de traço e `aria-checked="mixed"`
- [ ] A versão ligada ao formulário aceita e mantém o estado parcial
- [ ] Pai de grupo: parcial → todos marcados → todos desmarcados
- [ ] O cabeçalho da tabela continua a usar o estado parcial sem regressão
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
