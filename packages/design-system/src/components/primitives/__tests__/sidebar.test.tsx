import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRP_I18N_DEFAULTS_PT } from "../../../i18n/strings.js"
import { SidebarProvider, SidebarTrigger, useSidebar } from "../sidebar.js"

function State() {
  return <output>{useSidebar().state}</output>
}

const toggle = () => screen.getByRole("button", { name: IGRP_I18N_DEFAULTS_PT.sidebar.toggle })

describe("SidebarProvider", () => {
  afterEach(() => {
    document.cookie = "sidebar_state=; max-age=0; path=/"
  })

  it("toggles from the trigger and persists the state in a cookie", async () => {
    const user = userEvent.setup()
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <State />
      </SidebarProvider>
    )
    expect(screen.getByRole("status")).toHaveTextContent("expanded")
    await user.click(toggle())
    expect(screen.getByRole("status")).toHaveTextContent("collapsed")
    expect(document.cookie).toContain("sidebar_state=false")
  })

  it("toggles with Ctrl+B and Meta+B but not a bare B", async () => {
    const user = userEvent.setup()
    render(
      <SidebarProvider defaultOpen={false}>
        <State />
      </SidebarProvider>
    )
    await user.keyboard("{Control>}b{/Control}")
    expect(screen.getByRole("status")).toHaveTextContent("expanded")
    await user.keyboard("{Meta>}b{/Meta}")
    expect(screen.getByRole("status")).toHaveTextContent("collapsed")
    await user.keyboard("b")
    expect(screen.getByRole("status")).toHaveTextContent("collapsed")
  })

  it("defers to onOpenChange when controlled", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <SidebarProvider open onOpenChange={onOpenChange}>
        <SidebarTrigger />
        <State />
      </SidebarProvider>
    )
    await user.click(toggle())
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole("status")).toHaveTextContent("expanded")
  })

  it("runs the trigger's own onClick as well", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <SidebarProvider>
        <SidebarTrigger onClick={onClick} />
      </SidebarProvider>
    )
    await user.click(toggle())
    expect(onClick).toHaveBeenCalledOnce()
  })
})
