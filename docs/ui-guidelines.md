# UI Guidelines

These guidelines define the core UI direction for the TODO application.

## 1. Component Library

Use components from Skeleton as the UI component library:
- Website: http://getskeleton.com/
- Apply Skeleton's grid and form conventions consistently across all screens.
- Prefer reusable component patterns for task list items, forms, buttons, and dialogs.

## 2. Color Palette

Use this Coolors palette as the foundational color system:
- Source: https://coolors.co/palette/edede9-d6ccc2-f5ebe0-e3d5ca-d5bdaf
- Palette values:
  - `#EDEDE9`
  - `#D6CCC2`
  - `#F5EBE0`
  - `#E3D5CA`
  - `#D5BDAF`

Recommended usage:
- Background: `#EDEDE9`
- Surface/cards: `#F5EBE0`
- Borders/dividers: `#D6CCC2`
- Secondary accents: `#E3D5CA`
- Primary accents/highlights: `#D5BDAF`

## 3. Responsive UI Best Practices

Build the UI mobile-first and scale up for larger screens.

Target resolutions:
- Laptop target resolution: `1366 x 768`
- Mobile target resolution: `390 x 844`

Responsive guidelines:
- Ensure all primary actions are reachable without horizontal scrolling.
- Use fluid layouts and relative units (%, rem) to adapt across viewport sizes.
- Keep touch targets at least 44 x 44 px on mobile.
- Use clear spacing and typography scales that remain readable on small screens.
- Validate layouts at both target resolutions before release.
