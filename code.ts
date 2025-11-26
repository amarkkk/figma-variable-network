// Figma Plugin: Color Variable Network Explorer
// Main plugin logic - scans variables and sends data to UI

interface VariableData {
  id: string;
  name: string;
  collection: string;
  collectionId: string;
  modes: string[];
  valuesHSBA: { [mode: string]: string };
  valuesHEX: { [mode: string]: string };
  references: { [mode: string]: string | null };
  directUsage: number; // Direct usage in components
  totalUsage: number; // Total usage including all descendants
  componentIds: string[]; // IDs of components using this variable
}

interface NetworkData {
  variables: VariableData[];
  relationships: Array<{ from: string; to: string; mode: string }>;
}

// Show the plugin UI (resizable by default in Figma)
figma.showUI(__html__, { 
  width: 800, 
  height: 600,
  themeColors: true
});

// Allow the plugin UI to be resized
figma.ui.resize(800, 600);

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

// Determine variable type based on collection name
function getVariableType(collectionName: string): string {
  // Return the collection name as-is for display
  return collectionName;
}

// Main scanning function
async function scanColorVariables(): Promise<NetworkData> {
  const localVariables = await figma.variables.getLocalVariablesAsync();
  const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
  
  const variables: VariableData[] = [];
  const relationships: Array<{ from: string; to: string; mode: string }> = [];
  
  // Create a map of collection IDs to names
  const collectionMap = new Map<string, VariableCollection>();
  for (const collection of localCollections) {
    collectionMap.set(collection.id, collection);
  }

  // Count usage across the file
  const directUsageMap = new Map<string, number>();
  const componentIdsMap = new Map<string, Set<string>>();
  
  // Scan all nodes in the document to count variable usage
  function countVariableUsage(node: BaseNode) {
    if ('boundVariables' in node && node.boundVariables) {
      const boundVars = node.boundVariables as any;
      for (const key in boundVars) {
        const binding = boundVars[key];
        if (binding && typeof binding === 'object') {
          if ('id' in binding) {
            const varId = binding.id;
            directUsageMap.set(varId, (directUsageMap.get(varId) || 0) + 1);
            if (!componentIdsMap.has(varId)) {
              componentIdsMap.set(varId, new Set());
            }
            componentIdsMap.get(varId)!.add(node.id);
          } else if (Array.isArray(binding)) {
            binding.forEach((b: any) => {
              if (b && 'id' in b) {
                directUsageMap.set(b.id, (directUsageMap.get(b.id) || 0) + 1);
                if (!componentIdsMap.has(b.id)) {
                  componentIdsMap.set(b.id, new Set());
                }
                componentIdsMap.get(b.id)!.add(node.id);
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
  
  for (const variable of localVariables) {
    if (variable.resolvedType !== 'COLOR') continue;
    
    // For each mode, check if it references another variable
    for (const modeId in variable.valuesByMode) {
      const value = variable.valuesByMode[modeId];
      if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
        const referencedId = value.id;
        if (!descendantsMap.has(referencedId)) {
          descendantsMap.set(referencedId, new Set());
        }
        descendantsMap.get(referencedId)!.add(variable.id);
      }
    }
  }

  // Process each variable
  for (const variable of localVariables) {
    // Only process color variables
    if (variable.resolvedType !== 'COLOR') continue;

    const collection = collectionMap.get(variable.variableCollectionId);
    if (!collection) continue;

    const collectionName = collection.name;
    const modes = collection.modes.map(m => m.name);

    const valuesHSBA: { [mode: string]: string } = {};
    const valuesHEX: { [mode: string]: string } = {};
    const references: { [mode: string]: string | null } = {};

    // Process each mode
    for (const mode of collection.modes) {
      const modeId = mode.modeId;
      const modeName = mode.name;
      const value = variable.valuesByMode[modeId];

      if (value && typeof value === 'object') {
        if ('type' in value && value.type === 'VARIABLE_ALIAS') {
          // This is an alias reference
          const aliasedVariable = await figma.variables.getVariableByIdAsync(value.id);
          if (aliasedVariable) {
            references[modeName] = aliasedVariable.id;
            
            // Add relationship
            relationships.push({
              from: aliasedVariable.id,
              to: variable.id,
              mode: modeName
            });

            // Get the resolved color value
            const resolvedValue = aliasedVariable.valuesByMode[Object.keys(aliasedVariable.valuesByMode)[0]];
            if (resolvedValue && typeof resolvedValue === 'object' && 'r' in resolvedValue) {
              valuesHSBA[modeName] = colorToHSBA(resolvedValue as RGBA);
              valuesHEX[modeName] = colorToHEX(resolvedValue as RGBA);
            } else {
              valuesHSBA[modeName] = 'alias';
              valuesHEX[modeName] = 'alias';
            }
          }
        } else if ('r' in value) {
          // Direct color value
          references[modeName] = null;
          valuesHSBA[modeName] = colorToHSBA(value as RGBA);
          valuesHEX[modeName] = colorToHEX(value as RGBA);
        }
      }
    }

    const componentIds = componentIdsMap.get(variable.id) 
      ? Array.from(componentIdsMap.get(variable.id)!) 
      : [];

    variables.push({
      id: variable.id,
      name: variable.name,
      collection: collectionName,
      collectionId: collection.id,
      modes,
      valuesHSBA,
      valuesHEX,
      references,
      directUsage: directUsageMap.get(variable.id) || 0,
      totalUsage: 0, // Will be calculated after
      componentIds
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

  return { variables, relationships };
}

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'scan') {
    try {
      const data = await scanColorVariables();
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
      for (const nodeId of msg.componentIds) {
        const node = await figma.getNodeByIdAsync(nodeId);
        if (node && 'type' in node) {
          nodes.push(node as SceneNode);
        }
      }
      
      if (nodes.length > 0) {
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        
        figma.ui.postMessage({
          type: 'selection-complete',
          count: nodes.length
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

// Auto-scan on startup
(async () => {
  try {
    const data = await scanColorVariables();
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
})();