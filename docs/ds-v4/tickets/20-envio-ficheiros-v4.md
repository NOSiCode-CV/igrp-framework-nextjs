# 20: Envio de ficheiros v4

**What to build:** A zona de envio dá três sinais ao arrastar, cada ficheiro mostra miniatura, tipo e tamanho, o progresso diz o tempo que falta, e um envio que falhou repete-se sem escolher o ficheiro outra vez, sem travar os outros.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] A arrastar: borda contínua, tint de seleção e «Largue para enviar»
- [ ] Miniatura (imagem ou primeira página do PDF), tipo e tamanho
- [ ] Progresso «64 % · faltam 12 s», também no `aria-valuetext`
- [ ] «Tentar novamente» por ficheiro; uma falha não trava os outros; «Retomar» só com envios por partes
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
