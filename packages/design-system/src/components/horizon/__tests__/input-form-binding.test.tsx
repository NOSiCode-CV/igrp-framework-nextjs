/**
 * Every Horizon input binds itself to react-hook-form when it finds a form
 * context. These tests pin the contract of that binding against caller props:
 *
 * - a caller `onChange` / `onBlur` runs *after* the field's, never instead of it
 *   (the field used to be bound first and the caller's props spread over it, so
 *   passing `onChange` silently disconnected the input from the form);
 * - a caller `value` cannot override the form's value;
 * - `field.ref` reaches a focusable element, so `shouldFocusError` moves focus
 *   to the first invalid field on submit.
 */
import { describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm, useWatch, type FieldValues, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Form } from "../../primitives/form.js"
import { IGRPCheckbox } from "../input/checkbox.js"
import { IGRPCombobox } from "../input/combobox.js"
import { IGRPDateTimeInput } from "../input/date-time.js"
import { IGRPDatePickerInputSingle } from "../input/date-picker/input-single.js"
import { IGRPDatePickerMultiple } from "../input/date-picker/multiple.js"
import { IGRPDatePickerRange } from "../input/date-picker/range.js"
import { IGRPDatePickerSingle } from "../input/date-picker/single.js"
import { IGRPInputColor } from "../input/color.js"
import { IGRPInputFile } from "../input/file.js"
import { IGRPInputNumber } from "../input/number.js"
import { IGRPInputPassword } from "../input/password.js"
import { IGRPInputPhone } from "../input/phone.js"
import { IGRPInputSearch } from "../input/search.js"
import { IGRPInputText } from "../input/text.js"
import { IGRPInputTime } from "../input/time.js"
import { IGRPInputUrl } from "../input/url.js"
import { IGRPMultiSelect } from "../input/multi-select.js"
import { IGRPRadioGroup } from "../input/radio-group.js"
import { IGRPSelect } from "../input/select.js"
import { IGRPSwitch } from "../input/switch.js"
import { IGRPTextarea } from "../input/textarea.js"

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
]

/** Renders `children` inside a real react-hook-form, and prints its values and touched fields. */
function Harness({
  children,
  defaultValues = {},
  alwaysInvalid = false,
}: {
  children: ReactNode
  defaultValues?: FieldValues
  alwaysInvalid?: boolean
}) {
  const form = useForm<FieldValues>({
    defaultValues,
    resolver: alwaysInvalid
      ? (zodResolver(z.object({ f: z.any().refine(() => false, "invalid") })) as unknown as Resolver<FieldValues>)
      : undefined,
  })
  const values = useWatch({ control: form.control })
  const touched = form.formState.touchedFields

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => {})}>
        <div data-testid="field">{children}</div>
        <button type="submit">submit</button>
        <output data-testid="values">{JSON.stringify(values)}</output>
        <output data-testid="touched">{JSON.stringify(touched)}</output>
      </form>
    </Form>
  )
}

const values = () => JSON.parse(screen.getByTestId("values").textContent || "{}")
const touched = () => JSON.parse(screen.getByTestId("touched").textContent || "{}")

describe("Horizon inputs keep the form binding when the caller passes onChange", () => {
  it.each([
    ["IGRPInputText", (onChange: () => void) => <IGRPInputText name="f" label="F" onChange={onChange} />],
    ["IGRPTextarea", (onChange: () => void) => <IGRPTextarea name="f" label="F" onChange={onChange} />],
  ])("%s", async (_name, renderInput) => {
    const onChange = vi.fn()
    render(<Harness defaultValues={{ f: "" }}>{renderInput(onChange)}</Harness>)

    await userEvent.type(screen.getByLabelText("F"), "abc")

    expect(values().f).toBe("abc")
    expect(screen.getByLabelText("F")).toHaveValue("abc")
    expect(onChange).toHaveBeenCalledTimes(3)
  })
})

describe("Horizon inputs keep the form binding when the caller passes onBlur", () => {
  it.each([
    ["IGRPInputText", (onBlur: () => void) => <IGRPInputText name="f" label="F" onBlur={onBlur} />],
    ["IGRPTextarea", (onBlur: () => void) => <IGRPTextarea name="f" label="F" onBlur={onBlur} />],
    ["IGRPInputPassword", (onBlur: () => void) => <IGRPInputPassword name="f" label="F" onBlur={onBlur} />],
    ["IGRPInputTime", (onBlur: () => void) => <IGRPInputTime name="f" label="F" onBlur={onBlur} />],
    ["IGRPInputUrl", (onBlur: () => void) => <IGRPInputUrl name="f" label="F" onBlur={onBlur} />],
    ["IGRPInputSearch", (onBlur: () => void) => <IGRPInputSearch name="f" label="F" onBlur={onBlur} />],
    ["IGRPInputNumber", (onBlur: () => void) => <IGRPInputNumber name="f" label="F" onBlur={onBlur} />],
    ["IGRPInputPhone", (onBlur: () => void) => <IGRPInputPhone name="f" label="F" onBlur={onBlur} />],
    ["IGRPCheckbox", (onBlur: () => void) => <IGRPCheckbox name="f" label="F" onBlur={onBlur} />],
    ["IGRPSwitch", (onBlur: () => void) => <IGRPSwitch name="f" label="F" onBlur={onBlur} />],
  ])("%s", async (_name, renderInput) => {
    const onBlur = vi.fn()
    render(<Harness defaultValues={{ f: "" }}>{renderInput(onBlur)}</Harness>)

    const control = screen.getByLabelText("F")
    act(() => control.focus())
    fireEvent.blur(control)

    expect(onBlur).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(touched().f).toBe(true))
  })
})

describe("Horizon inputs keep the form value when the caller passes value", () => {
  it.each([
    ["IGRPInputText", <IGRPInputText key="t" name="f" label="F" value="caller" />],
    ["IGRPTextarea", <IGRPTextarea key="a" name="f" label="F" value="caller" />],
    ["IGRPCheckbox", <IGRPCheckbox key="c" name="f" label="F" checked={false} />],
    ["IGRPSwitch", <IGRPSwitch key="s" name="f" label="F" checked={false} />],
  ])("%s", (_name, input) => {
    const isToggle = _name === "IGRPCheckbox" || _name === "IGRPSwitch"
    render(<Harness defaultValues={{ f: isToggle ? true : "from-form" }}>{input}</Harness>)

    const control = screen.getByLabelText("F")
    if (isToggle) expect(control).toHaveAttribute("aria-checked", "true")
    else expect(control).toHaveValue("from-form")
  })
})

describe("IGRPDatePickerMultiple", () => {
  // Its trigger used to drop the props `PopoverTrigger asChild` passes it, so the
  // click handler never reached the button and the calendar could not be opened.
  it("opens the calendar when the trigger is clicked", async () => {
    render(<IGRPDatePickerMultiple name="d" label="D" onDateChange={() => {}} />)

    const trigger = screen.getByRole("button")
    await userEvent.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})

describe("Horizon inputs hand field.ref to a focusable element (focus on first invalid field)", () => {
  it.each([
    ["IGRPInputText", <IGRPInputText key="1" name="f" label="F" />],
    ["IGRPTextarea", <IGRPTextarea key="2" name="f" label="F" />],
    ["IGRPInputPassword", <IGRPInputPassword key="3" name="f" label="F" />],
    ["IGRPInputTime", <IGRPInputTime key="4" name="f" label="F" />],
    ["IGRPInputUrl", <IGRPInputUrl key="5" name="f" label="F" />],
    ["IGRPInputSearch", <IGRPInputSearch key="6" name="f" label="F" />],
    ["IGRPInputNumber", <IGRPInputNumber key="7" name="f" label="F" />],
    ["IGRPInputPhone", <IGRPInputPhone key="8" name="f" label="F" />],
    ["IGRPDateTimeInput", <IGRPDateTimeInput key="9" name="f" label="F" />],
    ["IGRPInputColor", <IGRPInputColor key="10" name="f" label="F" />],
    ["IGRPCheckbox", <IGRPCheckbox key="11" name="f" label="F" />],
    ["IGRPSwitch", <IGRPSwitch key="12" name="f" label="F" />],
    ["IGRPSelect", <IGRPSelect key="13" name="f" label="F" options={OPTIONS} />],
    ["IGRPCombobox", <IGRPCombobox key="14" name="f" label="F" options={OPTIONS} />],
    ["IGRPMultiSelect", <IGRPMultiSelect key="15" name="f" label="F" options={OPTIONS} />],
    ["IGRPRadioGroup", <IGRPRadioGroup key="16" name="f" label="F" options={OPTIONS} />],
    ["IGRPDatePickerSingle", <IGRPDatePickerSingle key="17" name="f" label="F" />],
    ["IGRPDatePickerMultiple", <IGRPDatePickerMultiple key="18" name="f" label="F" />],
    ["IGRPDatePickerRange", <IGRPDatePickerRange key="19" name="f" label="F" />],
    ["IGRPDatePickerInputSingle", <IGRPDatePickerInputSingle key="20" name="f" label="F" />],
    ["IGRPInputFile", <IGRPInputFile key="21" name="f" label="F" />],
  ])("%s", async (_name, input) => {
    render(<Harness alwaysInvalid>{input}</Harness>)

    await userEvent.click(screen.getByRole("button", { name: "submit" }))

    await waitFor(() => {
      const active = document.activeElement
      expect(active).not.toBe(document.body)
      expect(screen.getByTestId("field").contains(active)).toBe(true)
    })
  })
})
