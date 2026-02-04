# Variable Network Explorer

> Visualize how design tokens flow through alias chains to components.

> **⚠️ Experimental Status**: This is a highly experimental MVP exploring network visualization concepts. Many features are incomplete or don't work as intended. Use at your own risk.

> **🔒 Privacy**: This plugin operates entirely locally. No data is sent to external servers (`networkAccess: { allowedDomains: ["none"] }`).

## Use Case

Complex design systems with multi-layered variable architectures create cognitive overload. A simple foundation color might flow through 3-4 alias layers before reaching components, and tracking those relationships mentally is nearly impossible.

**This plugin visualizes those relationships:**
- How foundation tokens propagate through your alias network
- Which variables are actually used in components (direct vs. inherited usage)
- The complete chain from foundation -> alias -> component

## Features

- **Multi-Type Support** - Supports COLOR, NUMBER, STRING, and BOOLEAN variables
- **Type Pre-Filter** - Choose which variable types to load before scanning
- **Tree View** - Variables organized hierarchically by alias relationships, with color swatches for color variables
- **Usage Metrics** - Shows direct usage (★) and total usage including descendants (Σ)
- **Usage Breakdown** - Hover to see component-level, instance-level, and detached usage counts
- **Network Graph** - Force-directed graph visualization showing connections between variables
- **Component Selection** - Click to select and zoom to all components using a specific variable (works across pages)
- **Search** - Real-time search through variable names and collection names with highlighting
- **Resizable Window** - Drag the corner to resize; size persists between sessions
- **Collection Filters** - Filter variables by collection

## Installation

1. Clone or download this repository
2. In Figma Desktop: **Plugins -> Development -> Import plugin from manifest**
3. Select the `manifest.json` file from this folder

**Note:** The compiled `code.js` is included - no build step required.

## Usage

1. Open the plugin from **Plugins -> Development -> Variable Network Explorer**
2. Select which variable types to load (Color, Number, String, Boolean)
3. Click "Load Selected Types" to scan your variables
4. **Tree View:** Click to expand/collapse variable hierarchies
5. **Graph View:** Switch tabs to see network relationships visually
6. **Select components:** Click the usage button to select and navigate to nodes using that variable
7. **Refresh:** Click the refresh button to re-scan after making changes
8. **Change Types:** Go back to the type selection screen to load different variable types

### Understanding the Metrics

- **0★ | 15Σ** means: 0 nodes use this variable directly, but 15 nodes use it through descendant aliases
- **5★ | 20Σ** means: 5 nodes use it directly, and 20 total (including through descendants)

Hover over the usage count to see a breakdown:
- **Component level**: Usage in COMPONENT definitions
- **Instance level**: Usage in INSTANCE nodes
- **Detached**: Usage in other node types (frames, rectangles, etc.)

## Screenshots

<!-- Add screenshots here -->

## Recent Changes (v1.1.0)

- ✅ **Multi-type support**: Now handles Color, Number, String, and Boolean variables
- ✅ **Type pre-filter**: Choose which types to load for better performance
- ✅ **Usage breakdown**: See component/instance/detached usage on hover
- ✅ **Cross-page navigation**: Component selection now works across all pages
- ✅ **Resizable window**: Drag corner to resize, size persists
- ✅ **Fixed collection filters**: More intuitive checkbox behavior
- ✅ **Improved layout**: Header reorganized into horizontal rows

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for full details.

## Known Limitations

- **Performance issues** - Degrades with large variable systems (>500 variables)
- **Circular references** - Handling is incomplete
- **Mode visualization** - Shows all modes mixed, doesn't separate them clearly
- **Graph layout** - Can become messy with complex networks
- **Remote/library variables** - Not supported (local variables only)
- **No export** - Cannot save or export the visualization

## License

MIT

## Author

Created by [Márk Andrássy](https://github.com/amarkkk)

Part of a collection of Figma plugins for design token management.
