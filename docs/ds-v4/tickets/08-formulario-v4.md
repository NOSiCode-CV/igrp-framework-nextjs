# 08: Formulário v4

**What to build:** O `IGRPForm` valida ao sair do campo e, depois do primeiro erro, a cada alteração. Ao submeter com erros mostra no topo um resumo com o número de campos a corrigir, foca-o, e cada item leva o foco ao campo. A barra de ações fixa fica acima da área segura do telemóvel.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Validação no modo «tocado»: nada a vermelho enquanto se escreve pela primeira vez; o erro sai assim que o valor fica certo
- [ ] Resumo de erros com contagem, foco ao submeter e uma ligação por campo que foca o campo e o traz acima das barras fixas
- [ ] O resumo desaparece quando todos os campos ficam certos
- [ ] Barra fixa com `env(safe-area-inset-bottom)` e altura reservada no fim do conteúdo
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
