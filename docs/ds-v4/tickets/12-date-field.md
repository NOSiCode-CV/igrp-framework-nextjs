# 12: IGRPDateField

**What to build:** A data escreve-se como dd/mm/aaaa, com o calendário só como ajuda por botão e o dia por extenso por baixo para confirmar. Datas impossíveis e fora do intervalo dizem porquê. Evolui o seletor de datas existente.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Escrita à mão com as barras a entrarem sozinhas; o calendário abre pelo botão «Escolher data, {data atual}»
- [ ] Semana a começar à segunda; teclado do calendário como na prancheta
- [ ] «Novembro tem 30 dias.» e mensagens de intervalo com o limite
- [ ] Guardada em ISO 8601
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
