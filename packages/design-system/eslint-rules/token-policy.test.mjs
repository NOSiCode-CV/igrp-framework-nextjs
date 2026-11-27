import { RuleTester } from "eslint"
import { afterAll, describe, it } from "vitest"

import { tokenPolicy } from "./token-policy.js"

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const tester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: "module" } })

tester.run("token-policy: space-utility", tokenPolicy, {
  valid: [
    'cn("flex flex-col gap-4")',
    'cn("whitespace-nowrap letter-space-2")',
    { code: 'cn("flex -space-x-2")', options: [{ allowSpaceUtility: true }] },
  ],
  invalid: [
    { code: 'cn("space-y-4")', errors: [{ messageId: "spaceUtility" }] },
    { code: 'cn("flex -space-x-2")', errors: [{ messageId: "spaceUtility" }] },
    { code: "cn(`p-2 md:space-x-reverse ${x}`)", errors: [{ messageId: "spaceUtility" }] },
  ],
})
