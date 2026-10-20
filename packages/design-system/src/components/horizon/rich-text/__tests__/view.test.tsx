/**
 * Contract tests for IGRPRichTextView — one per acceptance criterion in consumer
 * request §10 (`docs/design-system-requests/10-igrp-rich-text-view.md`) and ADR 0003.
 */
import { afterEach, describe, expect, it } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"

import { IGRPI18nProvider } from "../../../../i18n/index.js"
import { IGRPRichTextView } from "../view.js"

/** The rendered ProseMirror root, once the (client-only) editor has mounted. */
async function document_(container: HTMLElement) {
  await waitFor(() => expect(container.querySelector(".ProseMirror")).not.toBeNull())
  return container.querySelector(".ProseMirror") as HTMLElement
}

describe("IGRPRichTextView — empty input", () => {
  it.each([[""], ["   "], ["<p></p>"], ["<p>  </p><p><br></p>"]])(
    "renders the empty label for %j and never mounts an editor",
    async (html) => {
      const { container } = render(<IGRPRichTextView html={html} />)
      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.getByText("—")).toBeInTheDocument()
      expect(container.querySelector(".ProseMirror")).toBeNull()
    }
  )

  it("renders a custom empty label", () => {
    render(<IGRPRichTextView html="" emptyLabel="Sem conteúdo" />)
    expect(screen.getByText("Sem conteúdo")).toBeInTheDocument()
  })

  it("treats a horizontal rule as content", async () => {
    const { container } = render(<IGRPRichTextView html="<hr>" />)
    expect((await document_(container)).querySelector("hr")).not.toBeNull()
  })
})

describe("IGRPRichTextView — the schema is the allow-list", () => {
  it("drops script elements", async () => {
    const { container } = render(<IGRPRichTextView html={"<p>ok</p><script>window.__pwned = 1</script>"} />)
    const root = await document_(container)
    expect(root.textContent).toBe("ok")
    expect(container.querySelector("script")).toBeNull()
  })

  it("drops images and their inline handlers", async () => {
    const { container } = render(<IGRPRichTextView html={'<p>ok<img src="x" onerror="alert(1)"></p>'} />)
    await document_(container)
    expect(container.querySelector("img")).toBeNull()
    expect(container.innerHTML).not.toMatch(/onerror/i)
  })

  it("drops iframes", async () => {
    const { container } = render(<IGRPRichTextView html={'<p>ok</p><iframe src="https://example.com"></iframe>'} />)
    await document_(container)
    expect(container.querySelector("iframe")).toBeNull()
  })

  it("never renders a javascript: link", async () => {
    const { container } = render(<IGRPRichTextView html={'<p><a href="javascript:alert(1)">clique</a></p>'} />)
    const root = await document_(container)
    expect(root.textContent).toBe("clique")
    expect(container.innerHTML).not.toMatch(/javascript:/i)
  })

  it("drops undeclared inline handlers on allowed elements", async () => {
    const { container } = render(
      <IGRPRichTextView html={'<p onclick="alert(1)"><strong onmouseover="x()">a</strong></p>'} />
    )
    await document_(container)
    expect(container.innerHTML).not.toMatch(/onclick|onmouseover/i)
  })
})

describe("IGRPRichTextView — round-trip", () => {
  it("keeps every node and mark the editor can produce", async () => {
    const html = [
      "<h1>T1</h1><h2>T2</h2><h3>T3</h3>",
      '<p style="text-align: center">centro</p>',
      "<p><strong>b</strong><em>i</em><u>u</u><s>s</s><mark>m</mark><sub>2</sub><sup>3</sup></p>",
      '<p><span style="color: #b91c1c">cor</span><span style="font-size: 24px">grande</span></p>',
      '<p><a href="https://igrp.cv">ligação</a></p>',
      "<ul><li><p>a</p></li></ul><ol><li><p>1</p></li></ol>",
      "<blockquote><p>citação</p></blockquote><hr>",
      "<table><tbody><tr><th><p>H</p></th></tr><tr><td><p>C</p></td></tr></tbody></table>",
    ].join("")
    const { container } = render(<IGRPRichTextView html={html} />)
    const root = await document_(container)

    for (const selector of [
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "mark",
      "sub",
      "sup",
      "ul",
      "ol",
      "blockquote",
      "hr",
      "table",
      "th",
      "td",
    ]) {
      expect(root.querySelector(selector), selector).not.toBeNull()
    }
    expect(root.querySelector('p[style*="text-align: center"]')).not.toBeNull()
    expect(root.querySelector('span[style*="color"]')).not.toBeNull()
    expect(root.querySelector('span[style*="font-size: 24px"]')).not.toBeNull()
    expect(root.querySelector('a[href="https://igrp.cv"]')).not.toBeNull()
  })

  it("is not editable", async () => {
    const { container } = render(<IGRPRichTextView html="<p>x</p>" />)
    expect((await document_(container)).getAttribute("contenteditable")).toBe("false")
  })

  it("re-renders when html changes", async () => {
    const { container, rerender } = render(<IGRPRichTextView html="<p>antes</p>" />)
    await document_(container)
    rerender(<IGRPRichTextView html="<p>depois</p>" />)
    await waitFor(() => expect(container.querySelector(".ProseMirror")?.textContent).toBe("depois"))
  })
})

describe("IGRPRichTextView — maxHeight", () => {
  afterEach(() => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
  })

  /** jsdom has no layout: fake an overflowing body. */
  function overflowing(on: boolean) {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => (on ? 900 : 10) })
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 100 })
  }

  it("offers no toggle when the content fits", async () => {
    overflowing(false)
    const { container } = render(<IGRPRichTextView html="<p>curto</p>" maxHeight={100} />)
    await document_(container)
    expect(screen.queryByRole("button", { name: "Ver mais" })).toBeNull()
  })

  it("clips overflowing content and expands on demand", async () => {
    overflowing(true)
    const { container } = render(<IGRPRichTextView html="<p>longo</p>" maxHeight={100} />)
    await document_(container)
    const more = await screen.findByRole("button", { name: "Ver mais" })
    expect(more).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(more)
    expect(screen.getByRole("button", { name: "Ver menos" })).toHaveAttribute("aria-expanded", "true")
  })

  it("expands when keyboard focus enters the clipped content", async () => {
    overflowing(true)
    const { container } = render(
      <IGRPRichTextView html={'<p><a href="https://igrp.cv">ligação</a></p>'} maxHeight={100} />
    )
    await document_(container)
    await screen.findByRole("button", { name: "Ver mais" })
    fireEvent.focusIn(container.querySelector("a")!)
    expect(screen.getByRole("button", { name: "Ver menos" })).toBeInTheDocument()
  })

  it("reads its toggle labels from the i18n catalog", async () => {
    overflowing(true)
    const { container } = render(
      <IGRPI18nProvider strings={{ richText: { showMore: "Show more" } }}>
        <IGRPRichTextView html="<p>longo</p>" maxHeight={100} />
      </IGRPI18nProvider>
    )
    await document_(container)
    expect(await screen.findByRole("button", { name: "Show more" })).toBeInTheDocument()
  })
})
