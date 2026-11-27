# 11: IGRPIdentifierField

**What to build:** Campo para NIF, CNI, passaporte e título de residência, escrito à mão, com um botão «Pesquisar» que só fica ativo no mínimo de algarismos do documento. O resultado aparece por baixo; a pesquisa é uma função passada pela app.

**Blocked by:** 07 (Campo v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Mínimos: NIF 9, CNI 13, passaporte 9, título de residência 9
- [ ] A pesquisar: «A pesquisar…»; resultado com os dados confirmados, «Por verificar» ou o erro
- [ ] Sem permissão não há botão; o componente não conhece o serviço
- [ ] A 375 px o botão passa para baixo, a toda a largura
- [ ] Testes Vitest com Testing Library da API pública (papel e estado ARIA, foco, texto anunciado), sem testar classes
- [ ] Stories com os estados das pranchetas, nos dois temas e a 375 px, sem violações do axe do Storybook
- [ ] Textos de interface vindos das traduções do framework (passa `lint:i18n:framework`)
- [ ] Changeset `patch` no pacote do design system
