---
"@igrp/igrp-framework-react-design-system": patch
---

fix(stepper): render `IGRPStepperProcess` separators as a single-apex chevron

The arrow between steps was drawn with two skewed pseudo-elements, each `h-4.25` (17px) and
skewed about its own centre (y=8.5 and y=15.5) rather than the row's middle. On the `h-6`
(24px) row this put the widest points at y=7 and y=17 with a dip at y=12, and pulled the top
and bottom corners ~4.5px inward — a blunt, jogged, asymmetric separator (the mismatched
`28deg`/`30deg` angles added to it). Any row taller than 34px also left a bald band across
the middle, since two 17px halves cannot cover it.

The shape is now a single `clip-path` polygon with its apex at `50%`, painted on a dedicated
background layer inside each step, so it is symmetric, correct at any row height, and
identical in light and dark. Rounded end caps moved to that layer; keeping the shape off the
step itself means a focus ring on the step trigger is no longer clipped by the chevron.

Step title behaviour is unchanged.
