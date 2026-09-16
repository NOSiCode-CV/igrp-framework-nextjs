/**
 * `IGRPInputProps` / `IGRPBaseAttributes` union IGRP-only attributes with native
 * element props, so any component that forwards its rest props straight to the
 * element renders them as invalid DOM attributes (`iconname="User"`). JSX spread
 * skips excess-property checks, so TypeScript cannot catch it — only a render can.
 *
 * This list must cover **every** exported component whose props type includes
 * `IGRPBaseAttributes` or `IGRPInputProps`. A previous version covered only the
 * handful that had already been found leaking, which made a partial fix look
 * complete; thirteen more components were still leaking behind a green suite.
 * `covers every component that accepts IGRP base props` below keeps it honest by
 * diffing this list against the source tree.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

import { IGRPInputText } from "../input/text"
import { IGRPTextarea } from "../input/textarea"
import { IGRPInputTime } from "../input/time"
import { IGRPInputHidden } from "../input/hidden"
import { IGRPInputPassword } from "../input/password"
import { IGRPInputUrl } from "../input/url"
import { IGRPInputPhone } from "../input/phone"
import { IGRPInputNumber } from "../input/number"
import { IGRPInputSearch } from "../input/search"
import { IGRPInputFile } from "../input/file"
import { IGRPInputColor } from "../input/color"
import { IGRPDateTimeInput } from "../input/date-time"
import { IGRPSelect } from "../input/select"
import { IGRPCombobox } from "../input/combobox"
import { IGRPCheckbox } from "../input/checkbox"
import { IGRPSwitch } from "../input/switch"
import { IGRPRadioGroup } from "../input/radio-group"
import { IGRPInputAddOn } from "../input/with-addons"
import { IGRPButton } from "../button"
import { IGRPBadge } from "../badge"
import { IGRPAlert } from "../alert"
import { IGRPAvatar } from "../avatar"
import { IGRPStatsCard } from "../stats-card"
import { IGRPHeadline } from "../typography/headline"
import { IGRPLink } from "../typography/link"
import { IGRPPageHeader } from "../page-header"
import { IGRPAlertDialog } from "../alert-dialog"
import { IGRPFormList } from "../form/form-list"

/** Lowercased, because React lowercases unknown props on the way to the DOM. */
const IGRP_ONLY_ATTRS = [
  "labelclassname",
  "helpertext",
  "showicon",
  "iconname",
  "iconsize",
  "iconplacement",
  "iconclassname",
  "inputclassname",
]

const BAG = {
  labelClassName: "lc",
  inputClassName: "ic",
  helperText: "H",
  showIcon: true,
  iconName: "User",
  iconSize: 16,
  iconPlacement: "start" as const,
  iconClassName: "icn",
}

const OPTIONS = [{ label: "Um", value: "um" }]

/** source file -> element rendered with the full IGRP-only prop bag. */
const CASES: [string, string, React.ReactElement][] = [
  ["input/text.tsx", "IGRPInputText", <IGRPInputText name="a" {...BAG} />],
  ["input/textarea.tsx", "IGRPTextarea", <IGRPTextarea name="b" {...BAG} />],
  ["input/time.tsx", "IGRPInputTime", <IGRPInputTime name="c" {...BAG} />],
  ["input/hidden.tsx", "IGRPInputHidden", <IGRPInputHidden name="d" {...BAG} />],
  ["input/password.tsx", "IGRPInputPassword", <IGRPInputPassword name="e" {...BAG} />],
  ["input/url.tsx", "IGRPInputUrl", <IGRPInputUrl name="f" {...BAG} />],
  ["input/phone.tsx", "IGRPInputPhone", <IGRPInputPhone name="g" {...BAG} />],
  ["input/number.tsx", "IGRPInputNumber", <IGRPInputNumber name="h" {...BAG} />],
  ["input/search.tsx", "IGRPInputSearch", <IGRPInputSearch name="i" {...BAG} />],
  ["input/file.tsx", "IGRPInputFile", <IGRPInputFile name="j" {...BAG} />],
  ["input/color.tsx", "IGRPInputColor", <IGRPInputColor name="k" {...BAG} />],
  ["input/date-time.tsx", "IGRPDateTimeInput", <IGRPDateTimeInput name="l" {...BAG} />],
  ["input/select.tsx", "IGRPSelect", <IGRPSelect id="m" options={OPTIONS} {...BAG} />],
  ["input/combobox.tsx", "IGRPCombobox", <IGRPCombobox name="n" options={OPTIONS} {...BAG} />],
  ["input/checkbox.tsx", "IGRPCheckbox", <IGRPCheckbox name="o" label="x" {...BAG} />],
  ["input/switch.tsx", "IGRPSwitch", <IGRPSwitch name="p" label="x" {...BAG} />],
  ["input/radio-group.tsx", "IGRPRadioGroup", <IGRPRadioGroup name="q" options={OPTIONS} {...BAG} />],
  ["input/with-addons.tsx", "IGRPInputAddOn", <IGRPInputAddOn name="r" {...BAG} />],
  ["button.tsx", "IGRPButton", <IGRPButton {...BAG}>x</IGRPButton>],
  ["badge.tsx", "IGRPBadge", <IGRPBadge {...BAG}>x</IGRPBadge>],
  ["alert.tsx", "IGRPAlert", <IGRPAlert title="t" {...BAG} />],
  ["avatar.tsx", "IGRPAvatar", <IGRPAvatar {...BAG} />],
  ["stats-card.tsx", "IGRPStatsCard", <IGRPStatsCard title="t" value="1" {...BAG} />],
  ["typography/headline.tsx", "IGRPHeadline", <IGRPHeadline title="t" {...BAG} />],
  ["typography/link.tsx", "IGRPLink", <IGRPLink href="#" {...BAG} />],
  ["page-header/index.tsx", "IGRPPageHeader", <IGRPPageHeader title="t" {...BAG} />],
  ["alert-dialog.tsx", "IGRPAlertDialog", <IGRPAlertDialog title="t" {...BAG} />],
  ["form/form-list.tsx", "IGRPFormList", <IGRPFormList id="s" renderItem={() => null} defaultItem={{}} {...BAG} />],
]

describe("components never forward IGRP-only props to the DOM", () => {
  for (const [, label, element] of CASES) {
    it(label, () => {
      const { container } = render(element)
      const leaked: string[] = []

      for (const el of Array.from(container.querySelectorAll("*"))) {
        for (const attr of Array.from(el.attributes)) {
          if (IGRP_ONLY_ATTRS.includes(attr.name.toLowerCase())) {
            leaked.push(`${el.tagName.toLowerCase()}[${attr.name}]`)
          }
        }
      }

      expect(leaked).toEqual([])
    })
  }
})

describe("the sweep above is exhaustive", () => {
  it("covers every component that accepts IGRP base props", () => {
    const componentsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return entry.name === "__tests__" ? [] : walk(full)
        return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx") ? [full] : []
      })

    const accepting = walk(componentsRoot)
      .filter((file) => /IGRPBaseAttributes|IGRPInputProps/.test(readFileSync(file, "utf8")))
      .map((file) =>
        path
          .relative(componentsRoot, file)
          .split(path.sep)
          .join("/")
          .replace(/^horizon\//, "")
      )
      // `form-field` and `date-picker` re-export prop types without rendering an
      // element of their own.
      .filter((file) => !/form\/form-field\.tsx$|date-picker\/date-picker\.tsx$/.test(file))

    const covered = new Set(CASES.map(([file]) => file))
    const uncovered = accepting.filter((file) => !covered.has(file))

    expect(uncovered).toEqual([])
  })
})
