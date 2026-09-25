/**
 * Contract tests for IGRPRichTextEditor — one per acceptance criterion in consumer
 * request §9 (`docs/design-system-requests/09-igrp-rich-text-editor.md`) and ADR 0003.
 */
import { useState } from "react"
import type { Editor } from "@tiptap/core"
import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form/index.js"
import { IGRPI18nProvider } from "../../../../i18n/index.js"
import { IGRPRichTextEditor, type IGRPRichTextEditorProps } from "../editor.js"

/** The contenteditable surface, once the (client-only) editor has mounted. */
async function surface() {
  return await screen.findByRole("textbox")
}

/** TipTap stamps its instance on the view's DOM node. */
async function editorOf(): Promise<Editor> {
  const dom = (await surface()) as HTMLElement & { editor?: Editor }
  await waitFor(() => expect(dom.editor).toBeDefined())
  return dom.editor!
}

/** Toolbar controls are Radix toggles/buttons named by their tooltip. */
const control = (name: string) => within(screen.getByRole("toolbar")).queryByRole("button", { name })

const schema = z.object({ corpo: z.string().min(1, "Obrigatório") })
type Handle = IGRPFormHandle<typeof schema>

function renderInForm(defaultValues: { corpo: string }, props: Partial<IGRPRichTextEditorProps> = {}) {
  const formRef = { current: null as Handle | null }
  const view = render(
    <IGRPForm
      schema={schema}
      formRef={formRef}
      onSubmit={() => {}}
      defaultValues={defaultValues}
      validationMode="onTouched"
    >
      <IGRPRichTextEditor name="corpo" label="Corpo" helperText="Texto do e-mail" required {...(props as object)} />
    </IGRPForm>
  )
  return { formRef, ...view }
}

describe("IGRPRichTextEditor — form-bound", () => {
  it("shows the form's initial value", async () => {
    renderInForm({ corpo: "<p>Olá</p>" })
    expect((await surface()).textContent).toBe("Olá")
  })

  it("writes edits back to the form and marks it dirty", async () => {
    const { formRef } = renderInForm({ corpo: "<p>Olá</p>" })
    const editor = await editorOf()
    act(() => {
      editor.chain().focus("end").insertContent(" mundo").run()
    })
    expect(formRef.current?.getValues("corpo")).toBe("<p>Olá mundo</p>")
    expect(formRef.current?.getFieldState("corpo").isDirty).toBe(true)
  })

  it("writes an empty string when cleared, so a required rule still fails", async () => {
    const { formRef } = renderInForm({ corpo: "<p>Olá</p>" })
    const editor = await editorOf()
    act(() => {
      editor.commands.clearContent(true)
    })
    expect(formRef.current?.getValues("corpo")).toBe("")
  })

  it("marks the field touched on blur", async () => {
    const { formRef } = renderInForm({ corpo: "<p>Olá</p>" })
    const editor = await editorOf()
    act(() => {
      editor.commands.focus()
      editor.commands.blur()
    })
    await waitFor(() => expect(formRef.current?.getFieldState("corpo").isTouched).toBe(true))
  })

  it("renders the schema error under the field and wires it to the textbox", async () => {
    const { formRef } = renderInForm({ corpo: "" })
    await surface()
    await act(async () => {
      await formRef.current?.trigger("corpo")
    })
    const error = await screen.findByText("Obrigatório")
    const box = await surface()
    expect(box).toHaveAttribute("aria-invalid", "true")
    expect(box.getAttribute("aria-describedby")).toContain(error.id)
  })
})

describe("IGRPRichTextEditor — controlled", () => {
  it("works without a form, driven by value and onChange", async () => {
    function Harness() {
      const [html, setHtml] = useState("<p>a</p>")
      return (
        <>
          <IGRPRichTextEditor label="Corpo" value={html} onChange={setHtml} />
          <output data-testid="out">{html}</output>
        </>
      )
    }
    render(<Harness />)
    const editor = await editorOf()
    act(() => {
      editor.chain().focus("end").insertContent("b").run()
    })
    expect(screen.getByTestId("out").textContent).toBe("<p>ab</p>")
  })

  it("calls the latest onChange, not the one it was mounted with", async () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender } = render(<IGRPRichTextEditor label="Corpo" value="<p>a</p>" onChange={first} />)
    const editor = await editorOf()
    rerender(<IGRPRichTextEditor label="Corpo" value="<p>a</p>" onChange={latest} />)
    act(() => {
      editor.chain().focus("end").insertContent("b").run()
    })
    expect(latest).toHaveBeenCalledWith("<p>ab</p>")
    expect(first).not.toHaveBeenCalled()
  })

  it("follows an external value change without emitting onChange", async () => {
    const onChange = vi.fn()
    const { rerender } = render(<IGRPRichTextEditor label="Corpo" value="<p>a</p>" onChange={onChange} />)
    await editorOf()
    rerender(<IGRPRichTextEditor label="Corpo" value="<p>z</p>" onChange={onChange} />)
    await waitFor(async () => expect((await surface()).textContent).toBe("z"))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("IGRPRichTextEditor — accessibility lives on the contenteditable", () => {
  it("names the textbox and wires helper, error, invalid and required", async () => {
    render(<IGRPRichTextEditor label="Corpo" helperText="Ajuda" error="Mau" required value="" />)
    const box = await surface()
    expect(box).toHaveAccessibleName("Corpo")
    expect(box).toHaveAttribute("aria-multiline", "true")
    expect(box).toHaveAttribute("aria-invalid", "true")
    expect(box).toHaveAttribute("aria-required", "true")
    expect(box).toHaveAccessibleDescription("Mau")
  })

  it("describes the textbox with its helper text when there is no error", async () => {
    render(<IGRPRichTextEditor label="Corpo" helperText="Ajuda" value="" />)
    expect(await surface()).toHaveAccessibleDescription("Ajuda")
  })
})

describe("IGRPRichTextEditor — readOnly and disabled", () => {
  const VARIABLES = [{ value: "{{nome}}", label: "Nome" }]

  it("hides the toolbar and variables while read-only, without dirtying the form", async () => {
    function Harness() {
      const [readOnly, setReadOnly] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setReadOnly((v) => !v)}>
            alternar
          </button>
          <IGRPRichTextEditor name="corpo" label="Corpo" readOnly={readOnly} variables={VARIABLES} />
        </>
      )
    }
    const formRef = { current: null as Handle | null }
    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={{ corpo: "<p>Olá</p>" }}>
        <Harness />
      </IGRPForm>
    )
    await surface()
    expect(screen.getByRole("toolbar")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nome" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "alternar" }))
    await waitFor(async () => expect(await surface()).toHaveAttribute("contenteditable", "false"))
    expect(screen.queryByRole("toolbar")).toBeNull()
    expect(screen.queryByRole("button", { name: "Nome" })).toBeNull()
    expect(formRef.current?.getFieldState("corpo").isDirty).toBe(false)
    expect(formRef.current?.formState.isDirty).toBe(false)
  })

  it("is not editable and is marked disabled when disabled", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p>x</p>" disabled />)
    const box = await surface()
    await waitFor(() => expect(box).toHaveAttribute("contenteditable", "false"))
    expect(box).toHaveAttribute("aria-disabled", "true")
    expect(screen.queryByRole("toolbar")).toBeNull()
  })
})

describe("IGRPRichTextEditor — toolbar", () => {
  it("tracks the mark under the caret, not just document changes", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p><strong>forte</strong> fraco</p>" />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(3)
    })
    await waitFor(() => expect(control("Negrito")).toHaveAttribute("aria-pressed", "true"))
    act(() => {
      editor.commands.setTextSelection(10)
    })
    await waitFor(() => expect(control("Negrito")).toHaveAttribute("aria-pressed", "false"))
  })

  it("applies a mark from its control", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p>texto</p>" />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 6 })
    })
    fireEvent.click(control("Itálico")!)
    expect(editor.getHTML()).toBe("<p><em>texto</em></p>")
  })

  it("keeps the caret when a toolbar button is pressed", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p>x</p>" />)
    await editorOf()
    const event = fireEvent.mouseDown(control("Negrito")!)
    expect(event).toBe(false) // default prevented
  })

  it("offers the full toolbar by default", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" />)
    await surface()
    for (const name of [
      "Riscado",
      "Realce",
      "Linha horizontal",
      "Alinhar ao centro",
      "Cor do texto",
      "Tamanho do texto",
    ]) {
      expect(control(name), name).not.toBeNull()
    }
  })

  it("drops every style-based control under the email preset", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" preset="email" />)
    await surface()
    for (const name of [
      "Riscado",
      "Realce",
      "Linha horizontal",
      "Alinhar à esquerda",
      "Alinhar ao centro",
      "Alinhar à direita",
      "Justificar",
      "Cor do texto",
      "Tamanho do texto",
    ]) {
      expect(control(name), name).toBeNull()
    }
    for (const name of ["Negrito", "Título 1", "Inserir hiperligação", "Tabela", "Carácter especial"]) {
      expect(control(name), name).not.toBeNull()
    }
  })

  it("renders exactly the controls it is given", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" controls={["bold", "link"]} />)
    await surface()
    const names = within(screen.getByRole("toolbar"))
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"))
    expect(names).toEqual(["Negrito", "Inserir hiperligação"])
  })

  it("reads control names from the i18n catalog", async () => {
    render(
      <IGRPI18nProvider strings={{ richText: { bold: "Bold" } }}>
        <IGRPRichTextEditor label="Corpo" value="" />
      </IGRPI18nProvider>
    )
    await surface()
    expect(control("Bold")).not.toBeNull()
  })
})

describe("IGRPRichTextEditor — inserting at the caret", () => {
  it("inserts a template variable where the caret is", async () => {
    const onChange = vi.fn()
    render(
      <IGRPRichTextEditor
        label="Corpo"
        value="<p>Caro , bem-vindo</p>"
        onChange={onChange}
        variables={[{ value: "{{nome}}", label: "Nome" }]}
      />
    )
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(6)
    })
    fireEvent.click(screen.getByRole("button", { name: "Nome" }))
    expect(editor.getHTML()).toBe("<p>Caro {{nome}}, bem-vindo</p>")
    expect(onChange).toHaveBeenLastCalledWith("<p>Caro {{nome}}, bem-vindo</p>")
  })

  it("keeps the caret when a variable chip is pressed", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" variables={[{ value: "{{a}}", label: "A" }]} />)
    await surface()
    expect(fireEvent.mouseDown(screen.getByRole("button", { name: "A" }))).toBe(false)
  })

  it("shows the variables hint from the catalog, overridable by prop", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" variables={[{ value: "{{a}}" }]} variablesLabel="Variáveis" />)
    await surface()
    expect(screen.getByText("Variáveis")).toBeInTheDocument()
  })

  it("inserts a special character where the caret is", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p>10</p>" />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(3)
    })
    fireEvent.click(control("Carácter especial")!)
    fireEvent.click(await screen.findByRole("button", { name: "€" }))
    expect(editor.getHTML()).toBe("<p>10€</p>")
  })
})

describe("IGRPRichTextEditor — link popover", () => {
  async function openLink() {
    fireEvent.click(control("Inserir hiperligação")!)
    return (await screen.findByLabelText("URL")) as HTMLInputElement
  }

  it("opens seeded with the link under the caret", async () => {
    render(<IGRPRichTextEditor label="Corpo" value='<p><a href="https://igrp.cv">site</a></p>' />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(2)
    })
    expect((await openLink()).value).toBe("https://igrp.cv")
  })

  it("does not delete the link when saved empty", async () => {
    render(<IGRPRichTextEditor label="Corpo" value='<p><a href="https://igrp.cv">site</a></p>' />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(2)
    })
    const input = await openLink()
    fireEvent.change(input, { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }))
    expect(editor.getHTML()).toContain('href="https://igrp.cv"')
  })

  it("removes the link from the explicit Remover button", async () => {
    render(<IGRPRichTextEditor label="Corpo" value='<p><a href="https://igrp.cv">site</a></p>' />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(2)
    })
    await openLink()
    fireEvent.click(screen.getByRole("button", { name: "Remover" }))
    expect(editor.getHTML()).toBe("<p>site</p>")
  })

  it("inserts the URL as its own linked text when nothing is selected", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p>ver </p>" />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection(5)
    })
    const input = await openLink()
    fireEvent.change(input, { target: { value: "https://igrp.cv" } })
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }))
    expect(editor.getHTML()).toMatch(/<a [^>]*href="https:\/\/igrp\.cv"[^>]*>https:\/\/igrp\.cv<\/a>/)
  })
})

describe("IGRPRichTextEditor — placeholder", () => {
  const placeholderOf = (box: HTMLElement) => box.querySelector("[data-placeholder]")?.getAttribute("data-placeholder")

  it("defaults to the catalog placeholder", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" />)
    await waitFor(async () => expect(placeholderOf(await surface())).toBe("Comece a escrever aqui…"))
  })

  it("follows a placeholder change at runtime", async () => {
    const { rerender } = render(<IGRPRichTextEditor label="Corpo" value="" placeholder="Um" />)
    await waitFor(async () => expect(placeholderOf(await surface())).toBe("Um"))
    rerender(<IGRPRichTextEditor label="Corpo" value="" placeholder="Dois" />)
    await waitFor(async () => expect(placeholderOf(await surface())).toBe("Dois"))
  })
})

describe("IGRPRichTextEditor — colours and font sizes", () => {
  it("offers a caller palette in place of the default", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="" colors={[{ label: "Marca", value: "#123456" }]} />)
    await surface()
    fireEvent.click(control("Cor do texto")!)
    expect(await screen.findByRole("button", { name: "Marca" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Vermelho" })).toBeNull()
  })

  it("applies a caller font size", async () => {
    render(<IGRPRichTextEditor label="Corpo" value="<p>abc</p>" fontSizes={["20px"]} />)
    const editor = await editorOf()
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 4 })
    })
    fireEvent.click(control("Tamanho do texto")!)
    fireEvent.click(await screen.findByRole("button", { name: "20px" }))
    expect(editor.getHTML()).toContain("font-size: 20px")
  })
})
