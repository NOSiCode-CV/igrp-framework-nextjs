---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPMultiStepForm` now moves to the first step with a validation error when a submit fails, so an error on an earlier step is no longer hidden.
`IGRPPdfViewer` inline no longer lazy-loads its iframe, so a viewer below the fold does not show a false load error after the timeout.
`IGRPImageCropper` now calls `onError` when the image fails to load or the canvas cannot export it, instead of doing nothing.
