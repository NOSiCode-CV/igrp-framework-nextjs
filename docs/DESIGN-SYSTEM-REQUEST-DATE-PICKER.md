# Pedido ao design system — `IGRPDatePickerSingle` mostra datas ISO com um dia a menos

**Pacote:** `@igrp/igrp-framework-react-design-system`
**Componente:** `IGRPDatePickerSingle` (`dist/components/horizon/input/date-picker/single.js`)
**Versão observada:** ver `package.json` deste projeto
**Data:** 2026-09-06
**Severidade:** alta — afeta a leitura de qualquer data vinda de API em **todos**
os fusos a oeste de Greenwich, incluindo Cabo Verde (`Atlantic/Cape_Verde`, UTC−1),
que é o fuso de produção deste sistema.

---

## 1. Sintoma

Um campo de data preenchido a partir da API com a string ISO `"2026-08-26"` é
apresentado no formulário como **25-08-2026**.

Reproduzido no módulo Taxas (`Data início de vigência` / `Data fim de vigência`),
mas o defeito não é específico do módulo — é do componente.

**Os dados não são corrompidos.** Se o utilizador não tocar no campo, o valor
submetido é exatamente a string original; a divergência é apenas de apresentação.
O risco real é de interpretação: um gestor lê 25/08 no formulário e 26/08 no ecrã
de consulta, e a correção "natural" seria alterar o valor guardado — corrompendo-o.

---

## 2. Causa

`single.js`, no componente interno `DatePickerSingleField`:

```js
const displayText = value ? format(value, dateFormat) : placeholder;
```

`value` é `field.value`, tal como está no react-hook-form. Quando esse valor é uma
string ISO (o caso normal ao carregar um registo da API), o `format` do date-fns
converte-a com `toDate()`, que delega em `new Date("2026-08-26")`. Segundo a
especificação de ECMAScript, uma string **date-only** é interpretada como **UTC**:

```js
// TZ = Atlantic/Cape_Verde (UTC−1)
new Date("2026-08-26").toISOString(); // 2026-08-26T00:00:00.000Z
new Date("2026-08-26").getDate();     // 25   ← meia-noite UTC = 23:00 do dia 25 local
```

Em fusos a leste de Greenwich o defeito não se manifesta, o que explica não ter
sido detetado antes.

---

## 3. Correção pedida

Normalizar a string para uma data **local** antes de formatar — apenas para
valores date-only, preservando o comportamento atual para `Date` e para strings
com hora:

```js
function toLocalDate(value) {
  if (value instanceof Date) return value;
  if (typeof value !== "string") return value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  if (!m) return value;                       // deixa datetimes para o date-fns
  return new Date(+m[1], +m[2] - 1, +m[3]);   // meia-noite local
}

const displayText = value ? format(toLocalDate(value), dateFormat) : placeholder;
```

Aplicar o mesmo tratamento onde `value` é passado ao calendário
(`date: value`), para que o dia assinalado coincida com o apresentado.

Verificar se `IGRPDatePickerRange` e os restantes componentes de data têm o mesmo
padrão.

### Teste de regressão sugerido

Com `TZ=Atlantic/Cape_Verde` (ou qualquer UTC−N):

```js
render(<IGRPDatePickerSingle name="d" />, { defaultValues: { d: "2026-08-26" } });
expect(screen.getByRole("button")).toHaveTextContent("26-08-2026");
```

---

## 4. Workaround em vigor nesta aplicação

Enquanto o componente não for corrigido, as datas vindas da API são convertidas
para `Date` local **antes** de chegarem ao picker, através de:

`src/app/(myapp)/_lib/utils.ts` → `isoToPickerDate(iso)`

```ts
dataInicioVigencia: isoToPickerDate(selected.dataInicioVigencia),
```

A submissão já era segura: os campos Zod (`dateFieldIso` / `optionalDateFieldIso`
em `src/app/(myapp)/_lib/zod-validations.ts`) passam valores `Date` por
`toLocalYmd`, que usa os componentes locais da data e não `toISOString()`.

### Estado da adoção

| Módulo | Estado |
|---|---|
| Taxas | ✅ aplicado |
| Categorias de ocupação, Localizações, Documentos exigidos, Notificações, Pedidos, Licenças, Fiscalizações | ⬜ por aplicar — a fazer na revisão de cada módulo |

Os filtros de lista **não** são afetados: guardam `Date` em estado e convertem com
`dateFilterToIso()` / `formatDateToYYYYMMDD()`, que já são seguros.

**Ao remover o workaround:** apagar `isoToPickerDate`, remover as chamadas e
confirmar num ambiente com `TZ` a oeste de Greenwich que as datas continuam
corretas — em UTC+N o teste passa sempre, com ou sem correção.
