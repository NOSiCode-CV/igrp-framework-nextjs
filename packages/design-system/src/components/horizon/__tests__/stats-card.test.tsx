import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { IGRPStatsCard } from "../stats-card.js"
import { IGRPStatsCardMini } from "../../custom/stats-card-mini.js"

const iconBox = (container: HTMLElement) => container.querySelector("svg")?.parentElement as HTMLElement

describe("IGRPStatsCard icon appearance", () => {
  it.each([
    ["plain", ["text-success"], ["bg-success/10", "border"]],
    ["soft", ["text-success", "bg-success/10", "rounded-full"], ["border"]],
    ["outline", ["text-success", "border", "rounded-full"], ["bg-success/10"]],
  ] as const)("%s colours the icon by iconVariant", (appearance, has, hasNot) => {
    const { container } = render(<IGRPStatsCard title="T" iconAppearance={appearance} iconVariant="success" />)
    const box = iconBox(container)
    for (const c of has) expect(box).toHaveClass(c)
    for (const c of hasNot) expect(box).not.toHaveClass(c)
  })

  it("applies iconShape", () => {
    const { container } = render(<IGRPStatsCard title="T" iconAppearance="soft" iconShape="square" />)
    expect(iconBox(container)).toHaveClass("rounded-md")
  })

  // Regression: a shape without a background used to drop the iconVariant colour.
  it("keeps the iconVariant colour for the legacy border-only combination", () => {
    const { container } = render(
      <IGRPStatsCard title="T" iconVariant="warning" iconBackground="square" showIconBorder />
    )
    expect(iconBox(container)).toHaveClass("text-warning", "border", "rounded-md")
  })

  // Without the new props, every combination that used to be coloured keeps its legacy classes.
  it.each([
    ["defaults, secondary", { iconVariant: "secondary" }, ["text-secondary-foreground"]],
    ["defaults, indigo", { iconVariant: "indigo" }, ["text-info"]],
    ["border without background, secondary", { iconVariant: "secondary", showIconBorder: true }, ["border-secondary"]],
    [
      "background + shape, secondary",
      { iconVariant: "secondary", showIconBackground: true, iconBackground: "rounded" },
      ["bg-secondary", "text-secondary-foreground", "rounded-full"],
    ],
  ] as const)("keeps the legacy rendering for %s", (_, props, has) => {
    const { container } = render(<IGRPStatsCard title="T" {...props} />)
    for (const c of has) expect(iconBox(container)).toHaveClass(c)
  })

  it("colours a legacy background-without-shape icon (used to drop the colour)", () => {
    const { container } = render(<IGRPStatsCard title="T" iconVariant="success" showIconBackground />)
    expect(iconBox(container)).toHaveClass("text-success")
  })

  it("Mini colours its outlined icon by variant", () => {
    const { container } = render(<IGRPStatsCardMini title="T" variant="destructive" />)
    expect(iconBox(container)).toHaveClass("text-destructive", "border", "rounded-md")
  })

  it("Mini still accepts and ignores the deprecated icon props", () => {
    const { container } = render(
      <IGRPStatsCardMini title="T" variant="success" showIconBackground showIconBorder={false} iconPlacement="end" />
    )
    expect(iconBox(container)).toHaveClass("text-success", "border", "rounded-md")
    expect(iconBox(container)).not.toHaveClass("bg-success/10")
  })
})
