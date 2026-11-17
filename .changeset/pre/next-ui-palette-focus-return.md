---
'@igrp/framework-next-ui': patch
---

Closing the command palette returns focus to whatever had it when the palette opened (the search button, or the element focused before ⌘K). It used to drop focus on the page body, because Radix only restores focus to a `DialogTrigger`.
