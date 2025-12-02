# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.77] - 2025-01-01

### Added .77

- **Design System - IGRPCardDetails**: Added new props and features
  - New prop `contentClassName` (string) to customize the content grid layout
  - New prop `id` (string) for component identification
  - Conditional rendering when items array is empty (returns null)
- **Design System - IGRPForm**: Added enhanced form handling capabilities
  - New prop `disabled` (boolean, default: `false`) to prevent form submission when disabled
  - New prop `formError` state management with visual error display
  - New prop `showToastOnError` (boolean, default: `false`) to show toast notifications on form submission errors
  - New prop `resetAfterSubmit` (boolean, default: `false`) to automatically reset form after successful submission
  - New prop `gridClassName` (string) to customize the grid layout of form fields
  - New prop `id` (string) for form identification
  - Global error handling methods: `setGlobalError` and `clearGlobalError` available via form ref

## [0.1.0-beta.76] - 2025-01-01

### Added in .76

- **Framework Next - Header Component**: Enhanced header component with customizable options
  - New prop `showIGRPSidebarTrigger` (boolean) to control sidebar trigger visibility
  - New prop `showIGRPHeaderLogo` (boolean) to control header logo visibility
  - New prop `showIGRPHeaderTitle` (boolean) to control header title visibility
  - New prop `headerLogo` (string, optional) to customize header logo image source

## [0.1.0-beta.75] - 2025-01-01

### Added in .75

- **Design System - IGRPTabs**: Added scroll buttons with customizable appearance
  - New prop `showScrollIndicators` (boolean, default: `true`) to control scroll button visibility
  - New prop `scrollButtonClassName` (string) to customize scroll button styling
  - Scroll buttons automatically appear when tabs overflow horizontally

### Changed in .75

- **Design System - IGRPStepperProcess**: Updated CSS styling for improved visual appearance
- **Framework Next**: Updated `@igrp/platform-access-management-client-ts` dependency from `0.1.0-beta.56` to `0.1.0-beta.57`

### Fixed

- **Design System - IGRPTabs**: Fixed content height calculation when tabs contain large amounts of content or multiple components
