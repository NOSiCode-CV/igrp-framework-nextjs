/**
 * Props removed after 0.1.0-beta.126 that are kept as `@deprecated` shims so apps
 * written against 0.1.x keep compiling and rendering until the next release.
 * Delete each case together with its shim.
 */
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPAvatar } from "../avatar.js"
import { IGRPButton } from "../button.js"
import { IGRPDataTableCellDate } from "../data-table/cell.js"
import { IGRPStandaloneList } from "../form/form-list.js"
import { IGRPInputColor } from "../input/color.js"
import { IGRPRadioGroup } from "../input/radio-group.js"
import {
  IGRPModalDialog,
  IGRPModalDialogContent,
  IGRPModalDialogDescription,
  IGRPModalDialogTitle,
} from "../modal-dialog.js"

const avatarRequired = { status: "primary", badgeColor: "primary", iconColor: "#000" } as const

describe("deprecated props (0.1.x compatibility)", () => {
  it("IGRPRadioGroup accepts size / gridSize / old variants without leaking to the DOM", () => {
    const { container } = render(
      <IGRPRadioGroup options={[{ value: "a", label: "A" }]} size="lg" gridSize="1/2" variant="outline" />
    )
    expect(screen.getByRole("radio")).toBeTruthy()
    expect(container.innerHTML).not.toMatch(/gridsize|size="lg"/i)
  })

  it("IGRPAvatar size maps onto scale", () => {
    const { container } = render(<IGRPAvatar {...avatarRequired} size="xl" />)
    expect((container.firstChild as HTMLElement).className).toContain("size-24")
  })

  it("IGRPAvatar scale wins over size", () => {
    const { container } = render(<IGRPAvatar {...avatarRequired} size="xl" scale="sm" />)
    expect((container.firstChild as HTMLElement).className).toContain("size-8")
  })

  it("IGRPButton accepts iconSize without leaking it to the DOM", () => {
    render(<IGRPButton iconSize={20}>Go</IGRPButton>)
    expect(screen.getByRole("button").hasAttribute("iconsize")).toBe(false)
  })

  it("IGRPInputColor showHexValue={false} hides the value field", () => {
    render(<IGRPInputColor name="c" showHexValue={false} />)
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("IGRPDataTableCellDate honours dateFormat and defaults to pt-PT", () => {
    const date = new Date(2026, 0, 31)
    const { rerender } = render(<IGRPDataTableCellDate date={date} dateFormat="yyyy-MM-dd" />)
    expect(screen.getByText("2026-01-31")).toBeTruthy()
    rerender(<IGRPDataTableCellDate date={date} />)
    expect(screen.getByText("31/01/2026")).toBeTruthy()
  })

  it("IGRPModalDialogDescription renders name when there are no children", () => {
    render(
      <IGRPModalDialog open>
        <IGRPModalDialogContent showCloseButtonClassName="custom-close">
          <IGRPModalDialogTitle>T</IGRPModalDialogTitle>
          <IGRPModalDialogDescription name="Old description" />
        </IGRPModalDialogContent>
      </IGRPModalDialog>
    )
    expect(screen.getByText("Old description")).toBeTruthy()
    expect(document.querySelector("[data-slot=dialog-close]")?.className).toContain("custom-close")
  })

  it("IGRPStandaloneList renders and passes a non-optional onChange", () => {
    render(
      <IGRPStandaloneList
        id="list"
        defaultItem={{ v: "x" }}
        renderItem={(item, _i, onChange) => (
          <button type="button" onClick={() => onChange({ v: "y" })}>
            item-{item.v}
          </button>
        )}
      />
    )
    expect(screen.getByText("item-x")).toBeTruthy()
  })
})
