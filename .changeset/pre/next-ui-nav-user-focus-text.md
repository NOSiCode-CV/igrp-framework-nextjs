---
'@igrp/framework-next-ui': patch
---

Fix unreadable text on the highlighted user-menu item.

`IGRPNavUser` painted the hovered item `bg-primary`, but the design-system
dropdown item recolours every descendant on focus
(`focus:**:text-accent-foreground`), and Radix focuses items on pointer-over. So
the label and icon rendered dark on the dark primary fill. The override now keys
on `focus:` and reaches the descendants. This also covers keyboard navigation,
which the old `hover:` rule never styled.
