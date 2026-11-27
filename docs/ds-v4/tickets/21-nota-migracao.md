# 21: Nota de migração

**What to build:** As equipas das apps sabem o que muda ao atualizar o pacote: tokens novos e alterados, comportamentos por omissão (validação, foco, destrutivo, switch), e os aliases que vão ser retirados mais tarde.

**Blocked by:** 01 (Tokens Atlântico), 02 (Foco único em todos os primitivos), 03 (Botão destrutivo sólido), 04 (Item ativo e linha selecionada), 05 (Checkbox com estado parcial), 06 (Switch que grava ao mudar), 07 (Campo v4), 08 (Formulário v4)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Nota no CHANGELOG do pacote com a lista de mudanças visíveis e o que cada app tem de verificar
- [ ] Lista dos aliases (`--ring` e outros) com a indicação de que serão retirados depois da migração das apps
- [ ] Changeset `patch`
