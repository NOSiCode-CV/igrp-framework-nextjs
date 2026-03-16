# AI-Native Architecture for the IGRP Framework

This document describes a recommended architecture to make the **IGRP
Framework** fully compatible with modern AI coding tools such as IDE
copilots, coding agents, and autonomous development assistants.

The goal is to allow AI systems to **read, understand, and generate code
that correctly uses the IGRP Design System**.

------------------------------------------------------------------------

# Overview

To make a framework AI-friendly, combine the following layers:

1.  LLM-readable documentation (`llms.txt`)
2.  Structured component specifications
3.  Agent skills / task definitions
4.  Example implementations
5.  Component registry for programmatic access
6.  Optional MCP server for tool-based AI interaction
7.  Optional CLI code generators

This architecture allows AI tools to:

-   Understand your framework rules
-   Discover available components
-   Generate valid code using your design system
-   Follow framework patterns automatically

------------------------------------------------------------------------

# 1. llms.txt (AI Rules File)

Place a file named **llms.txt** in the root of the repository.

Purpose: - Tell AI agents how the framework works - Define coding
rules - Explain which components must be used

Example:

    # IGRP React Framework

    IGRP is a React framework using:

    - React 19
    - Next.js 15
    - react-hook-form
    - zod
    - TailwindCSS
    - ShadCN UI

    ## Component Rules

    Always use IGRP components instead of raw HTML.

    ❌ Do not use:
    <input />
    <button />

    ✅ Use:
    <IGRPInput />
    <IGRPButton />

    ## Forms

    Forms must use:

    - IGRPForm
    - react-hook-form
    - zod schema

    Example:

    <IGRPForm schema={schema}>
      <IGRPInput name="name" label="Name" />
    </IGRPForm>

    ## Tables

    Tables must use:

    <IGRPDataTable />

------------------------------------------------------------------------

# 2. AI Component Documentation

Create documentation that AI agents can parse.

Recommended folder:

    docs/
      ai/
        components/

Example:

    docs/ai/components/button.md

Example structure:

    Component: IGRPButton

    Description:
    Primary button component.

    Props:

    - variant: "primary" | "secondary" | "ghost"
    - size: "sm" | "md" | "lg"

    Example:

    <IGRPButton variant="primary">
      Save
    </IGRPButton>

Structured format:

    component: IGRPButton

    props:
      variant:
        type: enum
        values: [primary, secondary, ghost]

      size:
        type: enum
        values: [sm, md, lg]

------------------------------------------------------------------------

# 3. Agent Skills

Create reusable instructions for AI agents.

Recommended folder:

    .ai/
      skills/

Example skill:

    create-form.md

Example content:

    Skill: Create Form

    Use when user requests:

    - forms
    - inputs
    - validation

    Rules:

    1. Use IGRPForm
    2. Use react-hook-form
    3. Use zod schema
    4. Use IGRPInput components

    Example:

    const schema = z.object({
      name: z.string()
    })

    <IGRPForm schema={schema}>
      <IGRPInput name="name" label="Name" />
    </IGRPForm>

------------------------------------------------------------------------

# 4. Component Registry

Create a machine-readable component catalog.

Recommended location:

    packages/ui/ai/components.json

Example:

``` json
{
  "components": [
    {
      "name": "IGRPButton",
      "category": "actions",
      "props": {
        "variant": ["primary", "secondary", "ghost"],
        "size": ["sm", "md", "lg"]
      },
      "example": "<IGRPButton>Save</IGRPButton>"
    }
  ]
}
```

This allows AI systems to discover components programmatically.

------------------------------------------------------------------------

# 5. Examples

Examples are extremely important for AI systems.

Recommended folder:

    examples/

Example files:

    examples/form-basic.tsx
    examples/form-validation.tsx
    examples/datatable-basic.tsx
    examples/crud-page.tsx

AI systems often learn from patterns in real examples.

------------------------------------------------------------------------

# 6. CLI Code Generators

Add a CLI to generate common patterns.

Example commands:

    igrp generate form
    igrp generate crud
    igrp generate datatable

Example:

    pnpm igrp generate form user

Output:

    UserForm.tsx
    user.schema.ts

This allows AI agents to use tooling instead of generating everything
manually.

------------------------------------------------------------------------

# 7. MCP Server (Model Context Protocol)

Modern AI agents can interact with frameworks using **MCP servers**.

An MCP server can expose tools such as:

-   get_components
-   get_component_props
-   generate_form
-   generate_table

This allows AI agents to request structured information about your
design system.

------------------------------------------------------------------------

# Recommended Project Structure

    igrp-framework/

    llms.txt

    .ai/
      skills/
        create-form.md
        create-table.md
        create-crud.md

    docs/
      ai/
        components/
          button.md
          form.md
          datatable.md

    examples/
      form-basic.tsx
      crud-page.tsx

    packages/
      ui/
        ai/
          components.json
          patterns.json

------------------------------------------------------------------------

# Benefits

Implementing this system enables:

-   AI-native framework support
-   Automatic code generation using your design system
-   Better compatibility with AI coding agents
-   Reduced incorrect component usage
-   Faster development workflows

------------------------------------------------------------------------

# Next Step

The next stage is implementing:

1.  `llms.txt`
2.  Component registry
3.  MCP server
4.  CLI code generator
5.  AI-friendly folder structure

This will transform the **IGRP Framework** into a **fully AI-ready
development platform**.

Supported: Claude Code, Cursor, Windsurf, Antigravity, Codex CLI, Continue, Gemini CLI, OpenCode, Qoder, CodeBuddy, Droid (Factory)
