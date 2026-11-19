# 16: IGRPTimestamp

**What to build:** Datas relativas («há 12 min») ou absolutas, sempre na hora de Cabo Verde, com a data completa num tooltip que também abre com o foco e entra no nome acessível. Porta o Timestamp do Astryx.

**Blocked by:** 02 (Foco único em todos os primitivos)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Fuso `Atlantic/Cape_Verde` explícito: servidor e cliente mostram a mesma hora
- [ ] Relativa até 24 h; depois, data e hora
- [ ] Tooltip com a data completa ao focar; a data completa no nome acessível
- [ ] Aviso de licença MIT nos ficheiros que aproveitam lógica do Astryx
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
