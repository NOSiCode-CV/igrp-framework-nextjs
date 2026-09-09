# Pedido ao design system — `IGRPDatePicker*` mostram datas ISO com um dia a menos

**Pacote:** `@igrp/igrp-framework-react-design-system`
**Componentes:** `IGRPDatePickerSingle`, `IGRPDatePickerInputSingle`, `IGRPDatePickerRange`,
`IGRPDatePickerMultiple`
**Versão observada:** `0.1.0-beta.144`
**Data:** 2026-09-06 (revisto 2026-09-09 — âmbito alargado após auditoria no design system)
**Severidade:** alta — afeta a leitura de qualquer data vinda de API em **todos**
os fusos a oeste de Greenwich, incluindo Cabo Verde (`Atlantic/Cape_Verde`, UTC−1),
que é o fuso de produção deste sistema.

> **Estado:** corrigido no design system. Ver §5.

---

## 1. Sintoma

Um campo de data preenchido a partir da API com a string ISO `"2026-08-26"` é
apresentado no formulário como **25-08-2026**.

Reproduzido no módulo Taxas (`Data início de vigência` / `Data fim de vigência`),
mas o defeito não é específico do módulo — é dos componentes de data.

**Há um caminho real de corrupção de dados.** Se o utilizador não tocar no campo, o
valor submetido é exatamente a string original e a divergência é só de apresentação.
Mas o calendário recebe a mesma data errada (`date={value}`) e **assinala o dia 25**:
o utilizador que abre o picker e clica no dia assinalado — o gesto natural de
confirmação — grava o dia 25 no formulário. Além disso, um gestor lê 25/08 no
formulário e 26/08 no ecrã de consulta, e a correção "natural" seria alterar o valor
guardado.

Escrever a data à mão é seguro: `parseStringToDate` usa
`parse(str, "dd-MM-yyyy", new Date())`, que constrói uma data local.

---

## 2. Causa

Em `src/components/horizon/input/date-picker/single.tsx`, no componente interno
`DatePickerSingleField`:

```tsx
const displayText = value ? format(value, dateFormat) : placeholder
```

`value` é `field.value`, tal como está no react-hook-form. A prop está **declarada**
como `Date | undefined`, mas o react-hook-form entrega o que a API lá pôs. Quando
esse valor é uma string ISO date-only (o caso normal ao carregar um registo), o
`format` do date-fns converte-a com `toDate()`, que delega em `new Date("2026-08-26")`.
Segundo a especificação de ECMAScript, uma string **date-only** é interpretada como
**UTC**:

```js
// TZ = Atlantic/Cape_Verde (UTC−1)
new Date("2026-08-26").toISOString(); // 2026-08-26T00:00:00.000Z
new Date("2026-08-26").getDate();     // 25   ← meia-noite UTC = 23:00 do dia 25 local
```

Em fusos a leste de Greenwich (e em UTC) o defeito não se manifesta, o que explica
não ter sido detetado antes.

### Componentes afetados

Auditados os quatro componentes de data. **Todos** partilham o padrão:

| Componente | Caminho | Afetado |
|---|---|---|
| `IGRPDatePickerSingle` | `format(value)` em `single.tsx` | sim |
| `IGRPDatePickerInputSingle` | `lightFormat` via `formatDateToString`, com `as Date \| undefined` sobre o valor observado | sim |
| `IGRPDatePickerRange` | `format(value.from / value.to)` em `range.tsx` | sim |
| `IGRPDatePickerMultiple` | `format(value[n])` em `multiple.tsx` | sim |

`IGRPDatePickerInputSingle` é o componente que o código gerado pelo iGRP Studio usa
por omissão — não é o `IGRPDatePickerSingle` do título original deste pedido.

---

## 3. Correção pedida

Normalizar para data **local** no ponto onde o valor do formulário entra no
componente (`value={field.value}`), e não na formatação. Corrigir na formatação
obriga a repetir o tratamento onde o valor é passado ao calendário (`date={value}`),
em quatro componentes, e o próximo componente que leia `field.value` reintroduz o
defeito.

Um único helper partilhado em `src/lib/calendar-utils.ts`, junto de
`parseStringToDate` / `formatDateToString`:

```ts
export function toLocalDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  if (typeof value !== "string" || value === "") return undefined

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    const parsed = new Date(value)          // datetime: um instante, não se desloca
    return isValidDate(parsed) ? parsed : undefined
  }
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return isValidDate(parsed) ? parsed : undefined
}
```

Strings **com hora** (`"2026-08-26T10:30:00"`, com ou sem offset) designam um instante
e não devem ser deslocadas — só as date-only são reconstruídas.

### Teste de regressão

Tem de correr num fuso **UTC−N** fixado pelo próprio teste: em UTC ou UTC+N as
asserções passam com ou sem correção, e o teste dá falsa confiança. Incluir uma
asserção que verifica que o fuso foi mesmo aplicado.

---

## 4. Workaround em vigor nesta aplicação

Enquanto a versão corrigida não for adotada, as datas vindas da API são convertidas
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

**Ao remover o workaround:** atualizar o design system para a versão com a correção,
apagar `isoToPickerDate`, remover as chamadas e confirmar num ambiente com `TZ` a
oeste de Greenwich que as datas continuam corretas — em UTC+N o teste passa sempre,
com ou sem correção.

---

## 5. Resolução no design system

Corrigido conforme §3:

- `src/lib/calendar-utils.ts` — `toLocalDate`, `toLocalDateRange`, `toLocalDates`.
- Os quatro componentes normalizam na fronteira `field.value`.
- `src/components/horizon/input/__tests__/date-picker-timezone.test.tsx` — 10 testes
  fixados em `Atlantic/Cape_Verde`, com guarda que falha se o fuso não for aplicado.
  Nove destes testes falham sem a correção.
