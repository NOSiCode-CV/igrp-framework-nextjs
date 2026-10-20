/**
 * Typography shared by the editor surface and the read-only view, so a body looks
 * the same while it is written and when it is read back.
 *
 * Owned here rather than borrowed from `@tailwindcss/typography`: the template
 * migrator cannot add a dependency to an upgraded app, and without the plugin
 * every `prose` class silently does nothing — Tailwind's preflight then leaves
 * lists without markers and headings at body size. These are plain descendant
 * variants on semantic tokens, so the app's existing `@source` over this
 * package's `dist` generates them and dark mode follows `.dark` with no `dark:`.
 */
const RICH_TEXT_PROSE_CLASS = [
  "text-sm leading-6 text-foreground focus:outline-none",
  "[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:mt-3 [&_h3]:mb-2",
  "[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:leading-tight [&_h2]:leading-tight",
  "[&_p]:my-2 [&_li>p]:my-0.5",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-6",
  "[&_li]:marker:text-muted-foreground",
  "[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-4 [&_blockquote]:italic",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
  "[&_hr]:my-4 [&_hr]:border-border",
  // The browser default is yellow under inherited text — white on yellow in dark mode.
  "[&_mark]:bg-highlight [&_mark]:text-highlight-foreground",
].join(" ")

/** Table looks — TipTap ships table behaviour, not appearance. */
const RICH_TEXT_TABLE_CLASS = [
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse",
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-start [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-border [&_td]:p-2 [&_:is(th,td)>p]:my-0",
  "[&_.selectedCell]:bg-primary/10 [&_.column-resize-handle]:w-0.5 [&_.column-resize-handle]:bg-primary",
].join(" ")

/**
 * The Placeholder extension only marks the empty paragraph (`is-editor-empty`,
 * `data-placeholder`); showing the text is left to CSS.
 */
const RICH_TEXT_PLACEHOLDER_CLASS = [
  "[&_.is-editor-empty:first-child]:before:pointer-events-none",
  "[&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0",
  "[&_.is-editor-empty:first-child]:before:text-muted-foreground",
  "[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
].join(" ")

export { RICH_TEXT_PLACEHOLDER_CLASS, RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS }
