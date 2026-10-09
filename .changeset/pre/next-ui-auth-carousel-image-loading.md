---
"@igrp/framework-next-ui": patch
---

`IGRPAuthCarousel`: stop preloading the first slide on viewports where the carousel is hidden, and size slide images for the half-width auth layout. The first slide now uses `fetchPriority="high"` instead of `priority`, and a new optional `sizes` prop (default `(min-width: 768px) 50vw, 100vw`) replaces the hard-coded `33vw` value that served undersized images on wide screens.
