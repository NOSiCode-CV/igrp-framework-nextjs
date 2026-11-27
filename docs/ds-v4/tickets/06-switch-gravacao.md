# 06: Switch que grava ao mudar

**What to build:** O switch aceita uma gravação assíncrona. Enquanto grava, a linha diz «A guardar…»; se falhar, volta ao estado anterior e diz porquê junto da linha.

**Blocked by:** 01 (Tokens Atlântico)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Durante a gravação a linha fica `aria-busy` e o estado vai para um `role="status"`
- [ ] Falha: o switch reverte e mostra a mensagem de erro na linha
- [ ] Sucesso: «Preferência guardada.» no `role="status"`
- [ ] A documentação do componente diz que nunca se usa com um botão Guardar
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
