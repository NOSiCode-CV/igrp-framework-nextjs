/**
 * Configuration registry for custom elements categorized by UI context.
 *
 * This file serves as the central declaration point for registering:
 * - **Types**: TypeScript interfaces/type aliases for structured data models
 * - **Actions**: Actions logic for operations
 * - **Functions**: Custom functions logic for application
 * - **Components**: Custom React components for application
 *
 * ### Registration Rules
 * 1. All entries must be arrays of importable paths (no extensions)
 * 2. Paths are relative to `src/app/[locale]/(myapp)`
 * 3. Categories are optional but must contain at least one valid entry
 *
 * ✅ **Examples**:
 * ```ts
 * {
 *   types: ['types/User'],
 *   actions: ['server/actions/saveUser'],
 *   functions: ['client/forms/useUserForm'],
 *   components: ['components/userInfoCard']
 * }
 * ```
 *
 * ❌ **Invalid**:
 * - `'./types/User.ts'` → do not use relative paths or file extensions.
 * - `'src/app/[locale]/(myapp)/types/User'` → the `src/app/[locale]/(myapp)` prefix is implied.
 *
 * ### Location Requirement
 * All registered files must exist **under `src/app/[locale]/(myapp)`**. Files outside of this folder
 * will not be parsed or loaded.
 *
 * ### Path Resolution
 * - Paths resolve to `@/app/[locale]/(myapp)/[your-path]`
 * - Files must exist under `src/app/[locale]/(myapp)`
 * - Missing files will trigger build warnings
 *
 * ### Purpose
 * This registry allows code automation and analysis tools to locate, extract, and expose metadata
 * such as type definitions, function signatures, and input/output schemas in a structured format (e.g., JSON).
 *
 */

export default {
  types: ['types/declaracao', 'types/index'],
  actions: ['actions/common', 'actions/declaracao'],
  functions: [],
  components: []
};