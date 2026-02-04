# Release Notes

## v1.1.0 - Multi-Type Support & UX Improvements

### New Features

#### Multi-Variable Type Support
- **Extended beyond colors**: Now supports all Figma variable types:
  - COLOR variables (with hex color swatches)
  - NUMBER (FLOAT) variables
  - STRING variables
  - BOOLEAN variables
- **Type Pre-Filter Screen**: Choose which variable types to load before scanning, improving performance for large design systems

#### Usage Breakdown
- **Detailed usage metrics**: Hover over usage counts to see breakdown:
  - Component level usage (in COMPONENT definitions)
  - Instance level usage (in INSTANCE nodes)
  - Detached usage (frames, rectangles, and other node types)
- **Node information**: See the names and types of nodes using each variable

#### Resizable Window
- **Drag to resize**: Resize the plugin window by dragging the bottom-right corner
- **Persistent size**: Window size is saved and restored between sessions

### Improvements

#### Cross-Page Navigation
- **Fixed component selection**: Navigation now works correctly across all pages in your Figma file
- **Automatic page switching**: When selecting components, the plugin automatically switches to the correct page
- **Better feedback**: Shows which page you've been navigated to and the names of selected nodes

#### UI/UX Enhancements
- **Reorganized header layout**: Changed from vertical columns to horizontal rows for better readability
- **Type indicator chips**: Visual chips showing which variable types are currently loaded
- **Improved collection filters**: Fixed filter logic for more intuitive behavior

### Bug Fixes

- Fixed: Collection filters had inverted/broken behavior where unchecking didn't work as expected
- Fixed: Type selection checkboxes on pre-filter screen weren't responding to clicks on Number, String, or Boolean
- Fixed: Navigation button would fail for nodes on pages other than the current page
- Fixed: Removed unintended auto-select behavior on hover (selection now only happens on explicit button click)

### Technical Changes

- Added `VarType` type for variable type classification
- Added `UsageBreakdown` and `NodeUsageInfo` interfaces
- Renamed internal `resolvedType` to `varType` to avoid TypeScript conflicts
- Uses `figma.clientStorage` for persistent window size
- Uses `figma.setCurrentPageAsync()` for cross-page navigation
