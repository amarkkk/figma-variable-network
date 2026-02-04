// Figma Plugin: Variable Network Explorer
// Main plugin logic - scans variables and sends data to UI

type VarType = 'COLOR' | 'STRING' | 'FLOAT' | 'BOOLEAN';

interface UsageBreakdown {
  total: number;
  componentLevel: number;    // Usage in COMPONENT definitions
  instanceLevel: number;     // Usage in INSTANCE nodes
  detached: number;          // Usage in other node types (frames, rectangles, etc.)
}

interface NodeUsageInfo {
  id: string;
  type: string;
  name: string;
}

interface VariableData {
  id: string;
  name: string;
  varType: VarType; // The type of this variable
  collection: string;
  collectionId: string;
  modes: string[];
  values: { [mode: string]: string }; // Formatted value for display
  rawValues: { [mode: string]: any }; // Raw value for colors (HEX), numbers, strings, booleans
  references: { [mode: string]: string | null };
  directUsage: number;
  totalUsage: number;
  componentIds: string[];
  usageBreakdown: UsageBreakdown;
  nodeUsageInfo: NodeUsageInfo[];
}

interface NetworkData {
  variables: VariableData[];
  relationships: Array<{ from: string; to: string; mode: string }>;
  typeCounts: { [key: string]: number }; // Count of variables per type
}

interface ScanOptions {
  types: VarType[];
}

// Show the plugin UI
figma.showUI(__html__, {
  width: 800,
  height: 600,
  themeColors: true
});

// Restore saved window size
figma.clientStorage.getAsync('windowSize').then((size: any) => {
  if (size) figma.ui.resize(size.w, size.h);
}).catch(() => {});

// Helper function to convert color to HSBA string
function colorToHSBA(color: RGBA | RGB): string {
  const r = color.r;
  const g = color.g;
  const b = color.b;
  const a = 'a' in color ? color.a : 1;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const v = max;

  if (delta !== 0) {
    s = delta / max;

    if (r === max) {
      h = ((g - b) / delta) % 6;
    } else if (g === max) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const sPercent = Math.round(s * 100);
  const vPercent = Math.round(v * 100);

  return `hsba(${h}, ${sPercent}%, ${vPercent}%, ${a})`;
}

// Helper function to convert color to HEX string
function colorToHEX(color: RGBA | RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = 'a' in color ? color.a : 1;

  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();

  if (a < 1) {
    const alphaHex = Math.round(a * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alphaHex)}`;
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Format a value based on its type for display
function formatValue(value: any, resolvedType: VarType): { display: string; raw: any } {
  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    return { display: 'alias', raw: 'alias' };
  }

  switch (resolvedType) {
    case 'COLOR':
      if (value && typeof value === 'object' && 'r' in value) {
        return {
          display: colorToHEX(value as RGBA),
          raw: colorToHEX(value as RGBA)
        };
      }
      return { display: 'N/A', raw: null };

    case 'FLOAT':
      if (typeof value === 'number') {
        // Format number nicely (remove unnecessary decimals)
        const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
        return { display: formatted, raw: value };
      }
      return { display: 'N/A', raw: null };

    case 'STRING':
      if (typeof value === 'string') {
        // Truncate long strings for display
        const display = value.length > 30 ? value.substring(0, 27) + '...' : value;
        return { display: `"${display}"`, raw: value };
      }
      return { display: 'N/A', raw: null };

    case 'BOOLEAN':
      if (typeof value === 'boolean') {
        return { display: value ? 'true' : 'false', raw: value };
      }
      return { display: 'N/A', raw: null };

    default:
      return { display: String(value), raw: value };
  }
}

// Get type counts for all variables (for the pre-filter)
async function getVariableTypeCounts(): Promise<{ [key: string]: number }> {
  const localVariables = await figma.variables.getLocalVariablesAsync();
  const counts: { [key: string]: number } = {
    'COLOR': 0,
    'FLOAT': 0,
    'STRING': 0,
    'BOOLEAN': 0
  };

  for (const variable of localVariables) {
    if (counts.hasOwnProperty(variable.resolvedType)) {
      counts[variable.resolvedType]++;
    }
  }

  return counts;
}

// Main scanning function
async function scanVariables(options: ScanOptions): Promise<NetworkData> {
  const localVariables = await figma.variables.getLocalVariablesAsync();
  const localCollections = await figma.variables.getLocalVariableCollectionsAsync();

  const variables: VariableData[] = [];
  const relationships: Array<{ from: string; to: string; mode: string }> = [];

  // Create a map of collection IDs to collections
  const collectionMap = new Map<string, VariableCollection>();
  for (const collection of localCollections) {
    collectionMap.set(collection.id, collection);
  }

  // Filter variables by selected types
  const filteredVariables = localVariables.filter(v =>
    options.types.includes(v.resolvedType as VarType)
  );

  // Create a set of filtered variable IDs for quick lookup
  const filteredVarIds = new Set(filteredVariables.map(v => v.id));

  // Count usage across the file
  const directUsageMap = new Map<string, number>();
  const componentIdsMap = new Map<string, Set<string>>();
  const usageBreakdownMap = new Map<string, UsageBreakdown>();
  const nodeUsageInfoMap = new Map<string, NodeUsageInfo[]>();

  // Helper to classify node type for usage breakdown
  function classifyNodeType(node: BaseNode): 'component' | 'instance' | 'detached' {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      return 'component';
    } else if (node.type === 'INSTANCE') {
      return 'instance';
    }
    return 'detached';
  }

  // Helper to register variable usage
  function registerUsage(varId: string, node: BaseNode) {
    // Only count usage for filtered variables
    if (!filteredVarIds.has(varId)) return;

    directUsageMap.set(varId, (directUsageMap.get(varId) || 0) + 1);

    if (!componentIdsMap.has(varId)) {
      componentIdsMap.set(varId, new Set());
    }
    componentIdsMap.get(varId)!.add(node.id);

    // Initialize usage breakdown if needed
    if (!usageBreakdownMap.has(varId)) {
      usageBreakdownMap.set(varId, {
        total: 0,
        componentLevel: 0,
        instanceLevel: 0,
        detached: 0
      });
    }

    // Initialize node usage info if needed
    if (!nodeUsageInfoMap.has(varId)) {
      nodeUsageInfoMap.set(varId, []);
    }

    const breakdown = usageBreakdownMap.get(varId)!;
    const classification = classifyNodeType(node);

    breakdown.total++;
    if (classification === 'component') {
      breakdown.componentLevel++;
    } else if (classification === 'instance') {
      breakdown.instanceLevel++;
    } else {
      breakdown.detached++;
    }

    // Store node info
    nodeUsageInfoMap.get(varId)!.push({
      id: node.id,
      type: node.type,
      name: 'name' in node ? (node as SceneNode).name : 'Unknown'
    });
  }

  // Scan all nodes in the document to count variable usage
  function countVariableUsage(node: BaseNode) {
    if ('boundVariables' in node && node.boundVariables) {
      const boundVars = node.boundVariables as any;
      for (const key in boundVars) {
        const binding = boundVars[key];
        if (binding && typeof binding === 'object') {
          if ('id' in binding) {
            registerUsage(binding.id, node);
          } else if (Array.isArray(binding)) {
            binding.forEach((b: any) => {
              if (b && 'id' in b) {
                registerUsage(b.id, node);
              }
            });
          }
        }
      }
    }

    if ('children' in node) {
      for (const child of node.children) {
        countVariableUsage(child);
      }
    }
  }

  // Count usage in all pages
  for (const page of figma.root.children) {
    countVariableUsage(page);
  }

  // Count descendants (how many variables reference each variable)
  const descendantsMap = new Map<string, Set<string>>();

  for (const variable of filteredVariables) {
    // For each mode, check if it references another variable
    for (const modeId in variable.valuesByMode) {
      const value = variable.valuesByMode[modeId];
      if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
        const referencedId = value.id;
        // Only track if the referenced variable is also in our filtered set
        if (filteredVarIds.has(referencedId)) {
          if (!descendantsMap.has(referencedId)) {
            descendantsMap.set(referencedId, new Set());
          }
          descendantsMap.get(referencedId)!.add(variable.id);
        }
      }
    }
  }

  // Process each filtered variable
  for (const variable of filteredVariables) {
    const collection = collectionMap.get(variable.variableCollectionId);
    if (!collection) continue;

    const collectionName = collection.name;
    const modes = collection.modes.map(m => m.name);
    const resolvedType = variable.resolvedType as VarType;

    const values: { [mode: string]: string } = {};
    const rawValues: { [mode: string]: any } = {};
    const references: { [mode: string]: string | null } = {};

    // Process each mode
    for (const mode of collection.modes) {
      const modeId = mode.modeId;
      const modeName = mode.name;
      const value = variable.valuesByMode[modeId];

      if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
        // This is an alias reference
        const aliasedVariable = await figma.variables.getVariableByIdAsync(value.id);
        if (aliasedVariable) {
          references[modeName] = aliasedVariable.id;

          // Add relationship (only if referenced variable is in filtered set)
          if (filteredVarIds.has(aliasedVariable.id)) {
            relationships.push({
              from: aliasedVariable.id,
              to: variable.id,
              mode: modeName
            });
          }

          // Get the resolved value from the aliased variable
          const resolvedValue = aliasedVariable.valuesByMode[Object.keys(aliasedVariable.valuesByMode)[0]];
          const formatted = formatValue(resolvedValue, resolvedType);
          values[modeName] = formatted.display;
          rawValues[modeName] = formatted.raw;
        } else {
          values[modeName] = 'alias';
          rawValues[modeName] = 'alias';
        }
      } else {
        // Direct value
        references[modeName] = null;
        const formatted = formatValue(value, resolvedType);
        values[modeName] = formatted.display;
        rawValues[modeName] = formatted.raw;
      }
    }

    const componentIds = componentIdsMap.get(variable.id)
      ? Array.from(componentIdsMap.get(variable.id)!)
      : [];

    const usageBreakdown = usageBreakdownMap.get(variable.id) || {
      total: 0,
      componentLevel: 0,
      instanceLevel: 0,
      detached: 0
    };

    const nodeUsageInfo = nodeUsageInfoMap.get(variable.id) || [];

    variables.push({
      id: variable.id,
      name: variable.name,
      varType: resolvedType,
      collection: collectionName,
      collectionId: collection.id,
      modes,
      values,
      rawValues,
      references,
      directUsage: directUsageMap.get(variable.id) || 0,
      totalUsage: 0, // Will be calculated after
      componentIds,
      usageBreakdown,
      nodeUsageInfo
    });
  }

  // Calculate total usage (including all descendants)
  function calculateTotalUsage(varId: string, visited = new Set<string>()): number {
    if (visited.has(varId)) return 0;
    visited.add(varId);

    let total = directUsageMap.get(varId) || 0;
    const descendants = descendantsMap.get(varId);

    if (descendants) {
      for (const descendantId of descendants) {
        total += calculateTotalUsage(descendantId, visited);
      }
    }

    return total;
  }

  // Update total usage for each variable
  variables.forEach(v => {
    v.totalUsage = calculateTotalUsage(v.id);
  });

  // Get type counts for the response
  const typeCounts = await getVariableTypeCounts();

  return { variables, relationships, typeCounts };
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  // Handle resize
  if (msg.type === 'resize') {
    const w = Math.max(600, msg.size.w);
    const h = Math.max(400, msg.size.h);
    figma.ui.resize(w, h);
    figma.clientStorage.setAsync('windowSize', { w, h });
    return;
  }

  if (msg.type === 'get-type-counts') {
    // Return just the type counts for the pre-filter
    try {
      const typeCounts = await getVariableTypeCounts();
      figma.ui.postMessage({
        type: 'type-counts',
        typeCounts
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'scan-error',
        error: String(error)
      });
    }
  } else if (msg.type === 'scan') {
    try {
      const options: ScanOptions = {
        types: msg.types || ['COLOR']
      };
      const data = await scanVariables(options);
      figma.ui.postMessage({
        type: 'scan-complete',
        data
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'scan-error',
        error: String(error)
      });
    }
  } else if (msg.type === 'select-components') {
    try {
      const nodes: SceneNode[] = [];
      let targetPage: PageNode | null = null;

      for (const nodeId of msg.componentIds) {
        const node = await figma.getNodeByIdAsync(nodeId);
        if (node && 'type' in node) {
          const sceneNode = node as SceneNode;
          nodes.push(sceneNode);

          // Find the page this node belongs to
          let parent = sceneNode.parent;
          while (parent && parent.type !== 'PAGE') {
            parent = parent.parent;
          }
          if (parent && parent.type === 'PAGE') {
            targetPage = parent as PageNode;
          }
        }
      }

      if (nodes.length > 0) {
        // Switch to the correct page if needed
        if (targetPage && figma.currentPage.id !== targetPage.id) {
          await figma.setCurrentPageAsync(targetPage);
        }

        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);

        // Get node info for feedback
        const nodeInfo = nodes.map(n => ({
          name: n.name,
          type: n.type,
          id: n.id
        }));

        figma.ui.postMessage({
          type: 'selection-complete',
          count: nodes.length,
          nodeInfo: nodeInfo,
          pageName: targetPage?.name || figma.currentPage.name
        });
      } else {
        figma.ui.postMessage({
          type: 'selection-error',
          error: 'Node not found - it may have been deleted'
        });
      }
    } catch (error) {
      figma.ui.postMessage({
        type: 'selection-error',
        error: String(error)
      });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

// On startup, just get the type counts for the pre-filter
(async () => {
  try {
    const typeCounts = await getVariableTypeCounts();
    figma.ui.postMessage({
      type: 'type-counts',
      typeCounts
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'scan-error',
      error: String(error)
    });
  }
})();
