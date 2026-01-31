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

**Current scope:** Color variables only.

## Features

- **Tree View** - Variables organized hierarchically by alias relationships, with expandable nodes and color swatches *(pre-alpha: not yet informative enough to be truly helpful)*
- **Usage Metrics** - Shows direct usage (★) and total usage including descendants (Σ)
- **Network Graph** - Force-directed graph visualization showing connections between variables
- **Component Selection** - Click to select and zoom to all components using a specific variable *(buggy: may fail for certain node types)*
- **Search** - Real-time search through variable names and collection names with highlighting
- **Auto-scan** - Automatically scans all color variables on launch

## Installation

1. Clone or download this repository
2. In Figma Desktop: **Plugins -> Development -> Import plugin from manifest**
3. Select the `manifest.json` file from this folder

## Usage

1. Open the plugin from **Plugins -> Development -> Variable Network Explorer**
2. The plugin automatically scans all color variables
3. **Tree View:** Click to expand/collapse variable hierarchies
4. **Graph View:** Switch tabs to see network relationships visually
5. **Select components:** Hover over variables with usage and click "Select X"
6. **Refresh:** Click the refresh button to re-scan after making changes

### Understanding the Metrics

- **0★ | 15Σ** means: 0 components use this variable directly, but 15 components use it through descendant aliases
- **5★ | 20Σ** means: 5 components use it directly, and 20 total (including through descendants)

## Screenshots

<!-- Add screenshots here -->

## Known Limitations

- **Color variables only** - Numbers, strings, and booleans are not supported
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
