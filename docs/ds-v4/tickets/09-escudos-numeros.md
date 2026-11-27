# 09: Escudos e números

**What to build:** Os números leem-se como em Cabo Verde: ponto nos milhares em todos os números (exceto NIF e telefones), e os escudos com o cifrão antes dos centavos. O `IGRPCurrencyField` escreve-se como número, formata ao sair e guarda em centavos; o `IGRPMoney` mostra o valor numa só linha.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Um só utilitário de formatação com ponto nos milhares, usado pelos componentes existentes que mostram números
- [ ] 1250050 centavos aparece como 12.500$50 e é anunciado como escudos, nunca dólar
- [ ] Negativos com sinal de menos; o montante nunca parte de linha; figuras grandes descem de 32 para 24 px abaixo de 768 px
- [ ] O valor em euros só como informação, ao câmbio fixo
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
