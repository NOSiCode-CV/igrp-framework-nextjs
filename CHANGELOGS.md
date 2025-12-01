# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.75] - 2025-01-01

### Added

- **Design System - IGRPTabs**: Added scroll buttons with customizable appearance
  - New prop `showScrollIndicators` (boolean, default: `true`) to control scroll button visibility
  - New prop `scrollButtonClassName` (string) to customize scroll button styling
  - Scroll buttons automatically appear when tabs overflow horizontally

### Changed

- **Design System - IGRPStepperProcess**: Updated CSS styling for improved visual appearance
- **Framework Next**: Updated `@igrp/platform-access-management-client-ts` dependency from `0.1.0-beta.56` to `0.1.0-beta.57`

### Fixed

- **Design System - IGRPTabs**: Fixed content height calculation when tabs contain large amounts of content or multiple components
