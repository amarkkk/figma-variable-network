# Variable Network Explorer

A Figma plugin for visualizing complex variable alias chains and usage relationships. Helps you understand how foundation tokens propagate through multiple layers of aliases to components.

> **⚠️ Experimental Status**: This is a highly experimental MVP exploring network visualization concepts. Many features are incomplete or don't work as intended. Use at your own risk.

## Why This Plugin Exists

Complex design systems need better tools for understanding variable relationships. Figma's native variable panel shows variables but not their interconnections. This plugin is an experiment in making those invisible relationships visible.

It's rough, unfinished, and might not work for your use case - but it represents a step toward better tooling for complex design systems.

## Screenshots

<p align="center">
<img width="817" height="658" alt="Screenshot 2025-12-02 at 14 13 24" src="https://github.com/user-attachments/assets/00701b2a-1b3d-476f-a1ce-35a4f04f0821" />
</p>

<p align="center">
  <img width="817" height="658" alt="Screenshot 2025-12-02 at 14 13 59" src="https://github.com/user-attachments/assets/407aed14-93b9-4653-97de-aa1641362a2b" />
</p>
<p align="center">
    <img width="817" height="658" alt="Screenshot 2025-12-02 at 14 14 56" src="https://github.com/user-attachments/assets/cf6098b0-b33b-4d0b-b9d4-aa37ebad391e" />
</p>

## Use Case

Building design systems with multi-layered variable architectures creates cognitive overload. When you have:

- **Foundation layer**: Base color tokens (primitives)
- **Alias layer**: Semantic mappings (e.g., brand, accent colors)
- **Mode-specific aliases**: Light/dark variants that change both tone AND accent colors
- **Component mappings**: Component-scoped variables

...it becomes daunting to see what connects to what. A simple foundation color might flow through 3-4 alias layers before reaching components, and tracking those relationships mentally is nearly impossible.

**This plugin attempts to visualize those relationships** - showing you:
- How foundation tokens propagate through your alias network
- Which variables are actually used in components
- The complete chain from foundation → alias → component

**Current scope:** Color variables only (expansion to numbers, strings, and other types is planned but not implemented)

## What This Plugin Does (and Doesn't Do)

✅ **Does (mostly):**
- Scans all color variables and their alias relationships
- Shows direct usage (components using this variable)
- Shows total usage (including all descendants in alias chains)
- Displays variables in a tree view with color swatches
- Provides network graph visualization
- Allows selecting components using a specific variable
- Supports search with highlighting

❌ **Doesn't (yet/at all):**
- Support non-color variable types (numbers, strings, booleans)
- Reliably handle complex circular references
- Provide editing capabilities (read-only visualization)
- Scale well with very large variable systems (performance untested)
- Work with remote/library variables
- Handle mode-specific visualization (shows all modes but doesn't separate them clearly)

## Features

### Tree View
- **Hierarchical display**: Variables organized by alias relationships
- **Usage metrics**: 
  - `★` Direct usage - components using this variable
  - `Σ` Total usage - all usage including descendants
- **Visual indicators**: Blue borders for variables in use, gray for unused
- **Expandable nodes**: Click to reveal descendant aliases
- **Color swatches**: Visual preview of each variable's color

### Network Graph
- Force-directed graph visualization showing connections
- Nodes sized by usage (larger = more usage)
- Shows collection names for context
- Interactive: drag nodes, zoom, pan

### Component Selection
- "Select X" button appears on hover for variables with usage
- Clicking selects all components using that variable in Figma
- Automatically zooms viewport to show selections

### Search & Filter
- Real-time search through all variables
- Highlights matching terms in results
- Searches both variable names and collection names

## Installation

Since this plugin is experimental and not published:

1. **Download or clone this repository** to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the plugin**:
   ```bash
   npm run build
   ```

4. **Open Figma Desktop** (required for development plugins)

5. **Import the plugin**:
   - Go to `Menu → Plugins → Development → Import plugin from manifest...`
   - Select the `manifest.json` file from this repository

6. **Run the plugin**:
   - Go to `Menu → Plugins → Development → Variable Network Explorer`

## Usage

1. **Open the plugin** - it automatically scans on launch
2. **Explore the tree view** - click to expand/collapse variable hierarchies
3. **Use the search** - filter variables by name or collection
4. **Switch to graph view** - see network relationships visually
5. **Select components** - hover over variables with usage and click "Select X"
6. **Refresh** - click the ↻ button to re-scan after making changes

### Understanding the Metrics

- **0★ | 15Σ** means:
  - 0 components use this variable directly
  - 15 components use it through descendant aliases
- **Example flow**:
  - Foundation color → used by 3 aliases → used in 15 components
  - Foundation shows: `0★ | 15Σ`
  - Each alias shows its direct usage + descendants

## Known Limitations

**Functionality Issues:**
- Only works with color variables (numbers, strings, booleans not supported)
- Performance degrades with large variable systems (>500 variables)
- Circular reference handling is incomplete
- Mode-specific logic doesn't work well (shows all modes mixed)
- Graph layout can be messy with complex networks
- Component selection might fail for certain node types

**Visualization Issues:**
- Graph view becomes cluttered with many variables
- No grouping by collection in graph view
- Color contrast in dark mode needs work
- No way to export or save the visualization

**UX Issues:**
- No loading indicators for long scans
- Refresh doesn't preserve UI state (search, expanded nodes)
- No way to filter by collection
- No keyboard shortcuts
- Tree view doesn't show mode information clearly

**Experimental Features (may not work):**
- Graph physics simulation can cause nodes to fly off screen
- Component selection across multiple pages is unreliable
- Search highlighting sometimes breaks with special characters

## Development

This plugin is built with:
- TypeScript
- Figma Plugin API
- HTML/CSS with custom tree and graph rendering
- Force-directed graph using D3.js concepts

### File Structure

```
variable_network/
├── manifest.json              # Plugin configuration
├── code.ts                   # Main plugin logic (TypeScript)
├── ui.html                   # UI with tree and graph views
├── implementation-summary.md # Feature documentation
└── README.md                 # This file
```

### Building

```bash
npm install
npm run build
```

## Future Vision (Not Committed)

- [ ] Support all variable types (not just colors)
- [ ] Better mode-specific visualization
- [ ] Collection-based filtering and grouping
- [ ] Export network data (JSON, SVG)
- [ ] Performance optimization for large systems
- [ ] Circular reference detection and warnings
- [ ] Edit variables directly from the plugin
- [ ] Compare networks across files/versions
- [ ] Template systems for common alias patterns

## Contributing

This is a personal experiment. If you find it useful or want to build on these ideas, feel free to fork it. I make no guarantees about maintenance or updates.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

This is experimental software. If you encounter issues, you can [open an issue](../../issues), but expect limited support. The plugin is provided as-is for exploration and learning.
