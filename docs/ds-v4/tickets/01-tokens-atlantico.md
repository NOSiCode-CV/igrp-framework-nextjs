# 01: Tokens Atlântico

**What to build:** As apps passam a ver a paleta do DS v4 nos dois temas só por atualizarem o pacote: Atlântico como primária com texto branco, Basalto e Névoa no texto, Névoa e Marian na seleção, e os tokens com nome para foco, barra ativa, marca de selecionado, destrutivo sólido, ligação e sombras. Os nomes antigos continuam a funcionar.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Spec:** ../spec.md

- [ ] Valores claro e escuro iguais aos do DESIGN.md (em OKLCH equivalente), incluindo `--destructive` #FF9585 no escuro
- [ ] Tokens novos: `--focus-ring`, `--active-bar`, `--control-checked`, `--control-checked-border`, `--destructive-solid`, `--link`, `--shadow-raised`, `--shadow-overlay` (anel de 1 px no escuro)
- [ ] `--ring` passa a alias de `--focus-ring`; nenhum token existente desaparece
- [ ] Raios (6, 12, 10 e 4 px fixos na checkbox) e a família Atkinson Hyperlegible Next e Mono com os pesos 400 a 700 nos tokens de letra (`--font-sans`, `--font-mono`)
- [ ] O template `demo-v1` carrega a Atkinson Hyperlegible Next e Mono (pesos 400 a 700) no lugar da Geist e da Geist Mono, sem mudar o nome das variáveis de letra; as apps copiam depois o mesmo `fonts.ts`
- [ ] O Storybook carrega a mesma letra, para as stories mostrarem o que as apps vão ver
- [ ] Changeset `patch` no pacote do design system
- [ ] O teste de contraste cobre os tokens novos: foco ≥ 3:1 sobre fundo e card (e contra `--input` no claro), `--destructive` do escuro ≥ 4,5:1 sobre o card, branco ≥ 4,5:1 sobre `--primary` e `--destructive-solid`
- [ ] O Céu não aparece em nenhum token de interface, só na rampa dos gráficos
