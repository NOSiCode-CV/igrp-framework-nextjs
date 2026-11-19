# Spec: Horizon DS v4 no design system

**Estado:** ready-for-agent · **Data:** 19/11/2026

**Fontes de verdade, por esta ordem:**

1. As regras R01 a R49 em `.interface-design/system.md`, no root do workspace.
2. `DESIGN.md`, no root do workspace.
3. O ADR 0002 sobre os componentes do Astryx a portar.
4. Os canvases publicados:
   - Horizon DS v4: fundações e componentes;
   - Templates v4;
   - Application Center v4.

Se o canvas e o código divergirem, ganha o canvas. Se o canvas for ambíguo, pergunta-se antes de decidir.

## Problem Statement

As equipas que fazem as apps do iGRP Horizon usam o `@igrp/igrp-framework-react-design-system`. Esse pacote ainda tem a paleta e os comportamentos anteriores ao DS v4, e isso cria três problemas.

**A identidade não chega aos ecrãs:**
- o `--primary` claro é quase preto e o escuro quase branco;
- não há anel de foco próprio, nem barra do item ativo, nem marca de selecionado;
- não há sombras com nome;
- o vermelho de erro do escuro serve para tudo, incluindo o fundo do botão destrutivo.

**Cada app resolve à sua maneira o que o DS v4 já decidiu:**
- quando validar um campo;
- onde fica o erro;
- o resumo de erros ao submeter;
- se uma lista de atribuições grava logo ou espera por Guardar;
- como se escrevem escudos, datas, NIF e CNI.

O resultado são ecrãs que se contradizem: por exemplo, switches ao lado de um botão Guardar.

**Faltam componentes que os canvases já usam:**
- lista de atribuições;
- campo de identificador com pesquisa;
- escudos;
- morada;
- árvore;
- data relativa;
- menu de ações adaptativo;
- InfoTip.

Há também componentes que existem mas não têm os estados pedidos:
- a checkbox não mostra o estado parcial;
- o switch não tem o estado «a guardar» nem reverte quando falha.

## Solution

O pacote do design system passa a implementar o DS v4. Uma app que atualize a versão do pacote recebe, sem trabalho extra:
- a paleta Atlântico nos dois temas;
- o foco, a seleção e as sombras com nome;
- os comportamentos de formulário decididos.

Os componentes novos ficam disponíveis com o prefixo `IGRP` e seguem a API das pranchetas. O que muda de valor ou de aparência sem mudar de API chega por tokens. O que muda de nome segue expand–contract:
- o nome novo é acrescentado ao lado do antigo;
- o antigo fica como alias até nenhum consumidor o usar.

## User Stories

### Identidade e tokens
1. Como utilizador de uma app do Horizon, quero ver o Atlântico como cor principal nos dois temas, para reconhecer a plataforma do governo de Cabo Verde.
2. Como utilizador que navega com o teclado, quero um anel de foco de 2 px com 2 px de folga, sempre com pelo menos 3:1, para nunca perder o sítio onde estou.
3. Como utilizador do tema escuro, quero o anel de foco em Névoa, para o ver sobre os cards escuros.
4. Como utilizador, quero que o anel de foco não mude com a cor de acento da entidade, para o foco ser igual em todas as apps.
5. Como utilizador de alto contraste ou de cores forçadas, quero que o foco continue visível, para conseguir usar a app.
6. Como utilizador, quero o item ativo da navegação marcado com uma barra lateral e um fundo de seleção, e não só pela cor do texto, para saber onde estou.
7. Como utilizador, quero que a linha selecionada de uma tabela tenha o tint de seleção e a mesma barra de 2 px, para a distinguir sem depender só da caixa marcada.
8. Como utilizador do tema escuro, quero o botão destrutivo vermelho sólido com texto branco, igual ao claro, para reconhecer a ação perigosa.
9. Como utilizador do tema escuro, quero texto, ícones e bordas de erro num vermelho claro legível, para ler a mensagem sem esforço.
10. Como utilizador do tema escuro, quero as ligações em Névoa sublinhada, para as distinguir do texto.
11. Como utilizador, quero sombras discretas só em camadas sobrepostas (diálogo, popover, toast), para perceber o que está por cima.
12. Como utilizador do tema escuro, quero um anel de 1 px no lugar das sombras, porque no escuro as sombras não se veem.
13. Como utilizador, quero o texto em Atkinson Hyperlegible, com quatro pesos apenas, para ler com baixa visão.
14. Como programador de uma app, quero tokens com nomes canónicos (`--focus-ring`, `--active-bar`, `--control-checked`, `--control-checked-border`, `--destructive-solid`, `--link`, `--shadow-raised`, `--shadow-overlay`), para não inventar valores.
15. Como programador, quero que os nomes antigos (`--ring` e outros) continuem a funcionar durante a transição, para a atualização não partir a minha app.
16. Como programador, quero que o build falhe se um par de tokens descer abaixo de 4,5:1 (texto) ou 3:1 (bordas e foco), para não regredir sem querer.

### Campos e formulários
17. Como utilizador que preenche um formulário, quero que o campo só diga que está errado quando eu sair dele, para não ver vermelho enquanto escrevo.
18. Como utilizador que errou um campo, quero que o erro desapareça assim que o valor fica certo, para saber logo que corrigi.
19. Como utilizador, quero que o botão Guardar não salte quando aparece um erro, para não carregar no sítio errado.
20. Como utilizador que submete com erros, quero um resumo no topo com o número de campos a corrigir e uma ligação para cada um, para chegar a eles depressa.
21. Como utilizador de leitor de ecrã, quero que o resumo de erros receba o foco ao submeter, para ouvir o que falhou.
22. Como utilizador, quero que, ao seguir uma ligação do resumo, o foco vá para o campo e a página role até ele, acima de qualquer barra fixa.
23. Como utilizador que usa o preenchimento automático do browser, quero que os campos preenchidos mantenham as cores do tema, para não aparecer um bloco azul-claro no escuro.
24. Como utilizador no telemóvel, quero que a barra de ações fixa fique acima da área segura do ecrã, para os botões não ficarem debaixo do gesto do sistema.
25. Como utilizador no telemóvel, quero que a última linha do formulário nunca fique tapada pela barra fixa.
26. Como utilizador, quero que um campo desativado diga porquê e continue focável, para perceber o que tenho de fazer.
27. Como utilizador, quero um botão «i» junto ao rótulo com mais informação, que abre com hover ou foco e se fixa com Enter ou Espaço, para ter ajuda sem a perder.
28. Como utilizador de teclado, quero fechar o InfoTip com Escape.

### Controlos de escolha
29. Como utilizador, quero que o estado parcial de uma checkbox mostre um traço e seja anunciado como «misto», para saber que só alguns filhos estão marcados.
30. Como utilizador, quero que clicar numa checkbox pai em estado parcial marque todos os filhos e que clicar outra vez os desmarque.
31. Como programador, quero que uma checkbox ligada a um formulário mantenha o estado parcial, para não o perder.
32. Como utilizador, quero que um switch grave no momento em que muda, com o estado «a guardar» visível, para saber que a preferência ficou registada.
33. Como utilizador, quero que um switch que não conseguiu gravar volte ao estado anterior e diga porquê junto da linha.
34. Como utilizador, quero nunca ver switches num formulário com botão Guardar, para saber o que já está ativo e o que espera por Guardar.
35. Como programador, quero orientação clara de que controlo usar (switch, checkbox, rádio, lista, segmentado), para escolher sem discutir.

### Atribuições
36. Como administrador que gere os perfis de um utilizador, quero marcar e desmarcar com checkboxes e guardar no fim, para rever antes de dar ou tirar acesso.
37. Como administrador, quero ver quantas alterações tenho por guardar, para não sair sem gravar.
38. Como administrador, quero indicar um motivo opcional ao guardar, que entra na auditoria, para justificar a alteração.
39. Como administrador, quero que, sem alterações, o botão Guardar diga porquê em vez de só ficar desativado.
40. Como administrador, quero no fim um toast com o resumo («1 ativada, 1 desativada»), para confirmar o que mudou.
41. Como utilizador que gere as suas preferências, quero uma lista de switches que gravam logo (modo imediato), para preferências sem impacto em acessos.
42. Como utilizador, quero que a contagem («4 de 12 ativas») não apareça enquanto a lista carrega, para não ver um número errado.
43. Como utilizador a 375 px, quero que um nome longo parta em várias linhas em vez de esconder o controlo.

### Formatos de Cabo Verde
44. Como funcionário, quero escrever o NIF, o CNI ou o número de passaporte à mão, com um botão «Pesquisar» que só fica ativo quando o número tem o tamanho mínimo, para não fazer pesquisas inválidas.
45. Como funcionário, quero ver por baixo os dados devolvidos pelo serviço, «Por verificar» ou o erro, para saber se o documento existe.
46. Como titular dos dados, quero que cada pesquisa fique na auditoria e que só quem tem permissão veja o botão.
47. Como funcionário, quero escrever valores em escudos como número e vê-los formatados ao sair do campo (12.500$50), para os ler como se escrevem em Cabo Verde.
48. Como utilizador de leitor de ecrã, quero ouvir «escudos» e não «dólar».
49. Como utilizador, quero que um montante nunca parta de linha e que as figuras grandes encolham no telemóvel.
50. Como utilizador, quero os milhares separados por ponto em todos os números (1.284), exceto em NIF e telefones.
51. Como funcionário, quero escrever datas como dd/mm/aaaa, com o calendário só como ajuda e o dia por extenso por baixo, para confirmar a data.
52. Como funcionário, quero escolher a morada por ilha, concelho e freguesia, por esta ordem, com cada nível bloqueado até haver o anterior e o motivo à vista.
53. Como funcionário, quero o telefone com o indicativo à parte (+238 primeiro) e o número em grupos.

### Componentes do ADR 0002
54. Como utilizador de teclado, quero navegar uma árvore com uma só paragem de Tab e as setas, para percorrer departamentos sem cansaço.
55. Como utilizador de leitor de ecrã, quero ouvir o nível e a posição de cada item da árvore.
56. Como utilizador, quero datas relativas («há 12 min») com a data completa num tooltip que também abre com o foco, sempre na hora de Cabo Verde.
57. Como utilizador num ecrã tátil, quero que o menu de ações ⋯ abra como bottom sheet; com rato, como popover.
58. Como programador, quero que listas muito longas da tabela sejam virtualizadas sem perder a contagem nem o cabeçalho fixo.

### Envio de ficheiros
59. Como utilizador, quero que a zona de envio dê três sinais quando arrasto um ficheiro (borda contínua, tint e «Largue para enviar»).
60. Como utilizador, quero a miniatura, o tipo e o tamanho de cada ficheiro, para ver que escolhi o certo.
61. Como utilizador, quero o progresso com a percentagem e o tempo que falta, também para o leitor de ecrã.
62. Como utilizador, quero repetir um envio que falhou sem escolher o ficheiro outra vez, e que uma falha não trave os outros ficheiros.

## Implementation Decisions

### Tokens
- O ficheiro de tokens do pacote é a única origem dos valores. Os componentes usam só tokens, nunca valores soltos.
- Os valores vêm do DESIGN.md e das pranchetas.
  - **Claro:** fundo #F7F9FC, card #FFFFFF, texto Basalto #0F2236, texto secundário #4B5D72, muted #EEF3F8, accent Névoa #E8EDF7, borda #DCE4EE, input #7E8FA4, primary Atlântico #023E8A com texto branco.
  - **Escuro:** fundo #040F20, card #0C2240, texto Névoa #E8EDF7, secundário #A3B1C2, muted #13315C, accent Marian #1D3E85, borda #2A4A78, input #6F8DB8, primary Atlântico com texto branco.
- O Céu (#BCD3F5) existe só como passo da rampa dos gráficos, nunca na interface.
- Tokens novos:
  - `--focus-ring`: Atlântico no claro, Névoa no escuro.
  - `--active-bar`: igual ao `--primary` no claro, Névoa no escuro.
  - `--control-checked`: Atlântico no claro, Névoa no escuro.
  - `--control-checked-border`: #5F86C6 na checkbox marcada do escuro.
  - `--destructive-solid`: #B42318 com texto branco nos dois temas.
  - `--link`: Atlântico no claro, Névoa sublinhada no escuro.
  - `--shadow-raised` e `--shadow-overlay`.
- No escuro, `--destructive` passa a #FF9585 e serve só para texto, ícones e bordas.
- Os valores escrevem-se no formato que o teste de contraste já lê (OKLCH), equivalentes aos hex do DESIGN.md. O hex documentado é a referência.
- O `--ring` antigo passa a ser alias de `--focus-ring` (expand). O utilitário de foco dos primitivos passa a usar `--focus-ring`, sempre com o contorno transparente que garante o foco em cores forçadas.
- Raios: controlo 6 px, superfície 12 px, interior 10 px, checkbox 4 px fixos.
- Tipografia: Atkinson Hyperlegible Next e Mono, pesos 400, 500, 600 e 700 (o 700 só no Display).
- Tints: estado 10 %, alerta 8 %, realce 8 %.

### Primitivos e wrappers
- As alterações visuais aos primitivos vindos do shadcn ficam no wrapper `IGRP` ou em tokens sempre que possível. O que tiver de mudar no primitivo atualiza o registo de drift, para o diff com o shadcn continuar legível.
- **Checkbox:**
  - estado parcial com ícone de traço e `aria-checked="mixed"`;
  - a versão ligada ao formulário aceita e mantém o estado parcial;
  - um grupo com pai calcula o estado do pai a partir dos filhos, e clicar no pai parcial marca todos.
- **Switch:**
  - aceita uma gravação assíncrona; enquanto grava, a linha fica `aria-busy` com «A guardar…» num `role="status"`;
  - se falha, reverte e mostra o erro na linha.
- **Botão destrutivo:** passa a `--destructive-solid`.
- **Campos (InputText e família):**
  - linha de erro reservada;
  - erro com ícone, ligado por `aria-describedby`;
  - estilo de `:-webkit-autofill` com `--card` e `--fg`;
  - os identificadores e códigos usam `inputmode="numeric"` e nunca `type="number"`.
- **Desativado com motivo:** os campos aceitam um motivo de desativação. Com motivo, o campo usa `aria-disabled`, continua focável e mostra o motivo ligado por `aria-describedby`.
- **IGRPForm:**
  - validação ao sair do campo, e a cada alteração depois do primeiro erro (modo «tocado» do motor de formulários);
  - ao submeter com erros, mostra o resumo de erros, foca-o e liga cada item ao campo;
  - a barra de ações fixa soma a área segura e reserva a sua altura no fim do conteúdo.
- **Tabela de dados:** linha selecionada com `--accent` e a barra `--active-bar` em `inset`; virtualização opcional para listas longas, com `aria-rowcount` e `aria-rowindex`.
- **Navegação lateral:** item ativo com a barra de 2–3 px, o fundo de seleção e `aria-current="page"`.

### Componentes novos (prefixo `IGRP`)
- **`IGRPAssignmentList`**
  - Modos `batch` e `immediate`.
  - **batch:** checkboxes, contador de alterações por guardar, motivo opcional, Guardar que diz porquê quando não há alterações, e toast com o resumo.
  - **immediate:** switches com gravação por linha e reversão em caso de erro.
  - Pesquisa e contagem; a contagem não aparece enquanto a lista carrega.
- **`IGRPIdentifierField`**
  - Para NIF, CNI, passaporte e título de residência.
  - Escrito à mão, em Mono.
  - O botão «Pesquisar» fica ativo no mínimo do documento: NIF 9, CNI 13, passaporte 9, título de residência 9.
  - O resultado aparece por baixo: os dados confirmados, «Por verificar» ou o erro.
  - A pesquisa é uma função que a app passa ao componente; o componente não conhece o serviço.
  - Sem permissão, não há botão.
- **`IGRPCurrencyField` e `IGRPMoney`**
  - Ponto nos milhares e cifrão antes dos centavos.
  - O valor é guardado em centavos, como inteiro.
  - Formata-se ao sair do campo.
  - O nome acessível diz «escudos».
  - Um montante nunca parte de linha.
- **Formatação numérica:** um único utilitário para números com ponto nos milhares, usado por todos os componentes. NIF e telefones ficam de fora.
- **`IGRPDateField`**
  - Ajusta o `IGRPDatePicker` existente: dd/mm/aaaa escrito à mão, o calendário como ajuda, a semana a começar à segunda e o dia por extenso por baixo.
  - Datas impossíveis dizem porquê.
  - As datas são guardadas em ISO 8601.
- **`IGRPAddressField`**
  - Cascata ilha, concelho, freguesia, com as listas fornecidas pela app.
  - Uma opção única escolhe-se sozinha.
  - Mudar um nível limpa os níveis de baixo.
  - Há uma alternativa para moradas fora de Cabo Verde.
- **`IGRPPhoneField`**
  - Evolui o `IGRPInputPhone`: indicativo à parte, com +238 primeiro, e o número em grupos.
  - Guardado em E.164.
- **`IGRPTreeView`**
  - Porta o TreeList do Astryx: papéis `tree`, `treeitem` e `group`, nível e posição, uma só paragem de Tab e setas.
  - Mantém o aviso de licença MIT nos ficheiros que aproveitam lógica dele.
- **`IGRPTimestamp`**
  - Data relativa ou absoluta com fuso `Atlantic/Cape_Verde`.
  - A data completa aparece num tooltip que também abre com o foco.
- **Menu de ações adaptativo**
  - Bottom sheet (vaul) em toque, popover com rato.
  - O botão ⋯ chama-se «Ações para {nome}».
- **`IGRPInfoTip`**
  - Botão «i» focável, chamado «Mais informação sobre {rótulo}».
  - Abre com hover ou foco, fixa-se com Enter ou Espaço e fecha com Escape.
- **Envio de ficheiros**
  - O `IGRPInputFile` ganha três sinais ao arrastar, miniatura e tipo, progresso com tempo restante (também no `aria-valuetext`) e «Tentar novamente» por ficheiro.
  - «Retomar» só aparece quando o serviço aceita envios por partes.

### Textos de interface
- Nenhum texto de interface fica escrito no código, porque o `lint:i18n:framework` não o permite. «A guardar…», «Pesquisar», «Largue para enviar», «Corrija n campos para continuar», «Ações para {nome}» e os outros textos vêm das traduções do framework, com PT-PT como língua de referência.

### Compatibilidade e versões
- O repositório está em pré-lançamento (`0.2.0-beta.*`). Cada alteração visível leva um changeset do tipo `patch`, nunca `major` nem `minor`. As mudanças de tokens e de comportamento por omissão saem nessas versões beta, com uma nota de migração no CHANGELOG.
- Os aliases dos nomes antigos são retirados numa versão posterior, depois de as apps migrarem.
- Um defeito diagnosticado e deixado para depois fica no `KNOWN-ISSUES.md` do pacote.

## Testing Decisions

- Um bom teste verifica o comportamento externo: o que o utilizador vê, ouve e faz. Testa o papel e o estado ARIA, o foco e o texto anunciado, nunca as classes nem a estrutura interna.
- Há três pontos de teste e nenhum novo.
  1. **Teste de contraste dos tokens**, já existente. Passa a cobrir:
     - os tokens novos nos dois temas;
     - `--focus-ring` ≥ 3:1 sobre o fundo e o card (R02);
     - `--focus-ring` ≥ 3:1 contra `--input` no claro;
     - `--destructive` do escuro ≥ 4,5:1 sobre o card;
     - texto branco ≥ 4,5:1 sobre `--destructive-solid` e sobre `--primary`.
  2. **Testes Vitest com Testing Library da API pública dos componentes `IGRP`**, ao lado dos existentes (por exemplo, os testes de acessibilidade dos componentes horizon). Exemplos:
     - a checkbox pai parcial marca todos os filhos;
     - o resumo de erros recebe o foco e as ligações levam o foco ao campo;
     - o switch reverte quando a gravação falha;
     - o botão «Pesquisar» fica ativo só no mínimo de algarismos;
     - 1250050 centavos aparece como 12.500$50 e é anunciado como escudos;
     - a árvore responde às setas com uma só paragem de Tab.
  3. **O axe do Storybook**, que já falha o CI em violações. Cada componente novo ou alterado tem stories com os estados das pranchetas, nos dois temas e a 375 px.
- O Chromatic continua só informativo e não bloqueia.

## Out of Scope

- A migração das apps: application-center, process-management-ui, process-studio-ui, notifications-ui e portal. Cada uma terá o seu spec, depois de sair a versão do pacote com os tokens novos.
- Os templates de página do canvas Templates v4, como a caixa de trabalho, o dossiê, o comprovativo, as tarefas de processo e o dashboard. Cada template terá um spec à parte, construído sobre estes componentes.
- O PowerSearch, o ComplexSelector e o Timer do Astryx, que o ADR 0002 deixa para mais tarde.
- Tornar o Chromatic bloqueante.
- O backend dos serviços de identificação, de divisão territorial e de feriados. Os componentes recebem funções e listas da app.

## Further Notes

- **Ordem recomendada:**
  1. tokens e foco;
  2. primitivos (checkbox, switch, campos, botão destrutivo);
  3. formulário;
  4. componentes novos;
  5. componentes do ADR 0002;
  6. a nota de migração.
- **Decisões que este spec não reabre:** o anel de foco nunca usa o acento da entidade; as sombras nunca são tingidas; o design system tem só quatro pesos de letra.
- **Ambiguidade:** quando o canvas e este spec divergirem, pergunta-se antes de decidir.
