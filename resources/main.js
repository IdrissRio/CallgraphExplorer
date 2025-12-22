/**
 * Callgraph Explorer - Main Application
 * A futuristic, feature-rich callgraph visualization
 */

// ===== Constants =====
// Standard node types
const NODE_TYPES = [
    { type: 'entry-point', label: 'Entry Point', color: '#ff006e', icon: 'fa-play' },
    { type: 'method', label: 'Method', color: '#ffffff', icon: 'fa-code' },
    { type: 'circular', label: 'Circular', color: '#ff4444', icon: 'fa-sync' }
];

// Experimental RAG-related node types
const RAG_NODE_TYPES = [
    { type: 'syn', label: 'Synthesized', color: '#00d4ff', icon: 'fa-arrow-up' },
    { type: 'inh', label: 'Inherited', color: '#ffbe0b', icon: 'fa-arrow-down' },
    { type: 'collection', label: 'Collection', color: '#7b2cbf', icon: 'fa-layer-group' }
];

// Combined for internal use
const ALL_NODE_TYPES = [...NODE_TYPES, ...RAG_NODE_TYPES];

const LAYOUTS = [
    { id: 'cose', name: 'Force', icon: 'fa-atom' },
    { id: 'concentric', name: 'Radial', icon: 'fa-bullseye' },
    { id: 'breadthfirst', name: 'Tree', icon: 'fa-sitemap' },
    { id: 'circle', name: 'Circle', icon: 'fa-circle-notch' },
    { id: 'grid', name: 'Grid', icon: 'fa-th' },
    { id: 'cola', name: 'Cola', icon: 'fa-project-diagram' }
];

const GRANULARITY_LEVELS = [
    { id: 'method', name: 'Method', icon: 'fa-code', desc: 'Individual methods' },
    { id: 'class', name: 'Class', icon: 'fa-cube', desc: 'Group by class' },
    { id: 'compilation-unit', name: 'File', icon: 'fa-file-code', desc: 'Group by file' },
    { id: 'package', name: 'Package', icon: 'fa-folder', desc: 'Group by package' }
];

const KEYBOARD_SHORTCUTS = [
    { keys: ['⌘', 'F'], desc: 'Focus search' },
    { keys: ['⌘', 'B'], desc: 'Toggle sidebar' },
    { keys: ['⌘', 'M'], desc: 'Toggle minimap' },
    { keys: ['⌘', '0'], desc: 'Reset zoom' },
    { keys: ['⌘', '+'], desc: 'Zoom in' },
    { keys: ['⌘', '-'], desc: 'Zoom out' },
    { keys: ['Esc'], desc: 'Clear selection' },
    { keys: ['?'], desc: 'Show shortcuts' }
];

const CYTOSCAPE_STYLES = [
    {
        selector: 'node',
        style: {
            'background-color': '#ffffff',
            'width': '24px',
            'height': '24px',
            'label': 'data(label)',
            'font-family': 'Inter, sans-serif',
            'font-size': '10px',
            'color': '#ffffff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': '8px',
            'text-background-color': 'rgba(10, 10, 15, 0.9)',
            'text-background-opacity': 1,
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'border-width': '2px',
            'border-color': 'rgba(255, 255, 255, 0.2)',
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '0.2s'
        }
    },
    {
        selector: 'node:selected',
        style: {
            'border-width': '3px',
            'border-color': '#00d4ff',
            'width': '32px',
            'height': '32px'
        }
    },
    {
        selector: '.syn',
        style: {
            'background-color': '#00d4ff',
            'border-color': 'rgba(0, 212, 255, 0.4)'
        }
    },
    {
        selector: '.inh',
        style: {
            'background-color': '#ffbe0b',
            'border-color': 'rgba(255, 190, 11, 0.4)'
        }
    },
    {
        selector: '.entry-point',
        style: {
            'background-color': '#ff006e',
            'border-color': 'rgba(255, 0, 110, 0.4)',
            'width': '32px',
            'height': '32px'
        }
    },
    {
        selector: '.collection',
        style: {
            'background-color': '#7b2cbf',
            'border-color': 'rgba(123, 44, 191, 0.4)'
        }
    },
    {
        selector: '.circular',
        style: {
            'background-color': '#ff4444',
            'border-color': 'rgba(255, 68, 68, 0.4)'
        }
    },
    {
        selector: 'edge',
        style: {
            'line-color': 'rgba(255, 255, 255, 0.15)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.3)',
            'target-arrow-shape': 'triangle',
            'width': 1,
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            'transition-property': 'line-color, target-arrow-color, width',
            'transition-duration': '0.2s'
        }
    },
    {
        selector: 'edge:selected',
        style: {
            'line-color': '#00d4ff',
            'target-arrow-color': '#00d4ff',
            'width': 2
        }
    },
    {
        selector: '.highlighted',
        style: {
            'background-color': '#00d4ff',
            'border-color': '#00d4ff',
            'border-width': '3px'
        }
    },
    {
        selector: '.path-node',
        style: {
            'background-color': '#00ff88',
            'border-color': '#00ff88',
            'border-width': '3px'
        }
    },
    {
        selector: '.path-edge',
        style: {
            'line-color': '#00ff88',
            'target-arrow-color': '#00ff88',
            'width': 2
        }
    },
    {
        selector: '.dimmed',
        style: {
            'opacity': 0.2
        }
    },
    {
        selector: '.hidden',
        style: {
            'display': 'none'
        }
    },
    // Compound node styles (for granularity grouping)
    {
        selector: ':parent',
        style: {
            'background-opacity': 0.15,
            'border-width': '2px',
            'border-style': 'dashed',
            'padding': '20px',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': '-10px',
            'font-size': '12px',
            'font-weight': '600'
        }
    },
    {
        selector: '.package-node',
        style: {
            'background-color': 'rgba(123, 44, 191, 0.2)',
            'border-color': '#7b2cbf',
            'color': '#7b2cbf'
        }
    },
    {
        selector: '.compilation-unit-node',
        style: {
            'background-color': 'rgba(0, 212, 255, 0.2)',
            'border-color': '#00d4ff',
            'color': '#00d4ff'
        }
    },
    {
        selector: '.class-node',
        style: {
            'background-color': 'rgba(255, 190, 11, 0.2)',
            'border-color': '#ffbe0b',
            'color': '#ffbe0b'
        }
    }
];

// ===== State =====
const state = {
    sccNodesMap: new Map(),
    selectedNode: null,
    mode: 'reachability', // 'reachability' or 'scc'
    currentLayout: 'cose',
    granularity: 'method', // 'method', 'class', 'compilation-unit', 'package'
    rawData: null, // Store original graph data for re-aggregation
    showRagFilters: false, // Toggle for experimental RAG filters
    filters: {
        syn: true,
        inh: true,
        'entry-point': true,
        collection: true,
        method: true,
        circular: true
    },
    // Node type counts
    counts: {
        nodes: 0,
        edges: 0,
        syn: 0,
        inh: 0,
        circular: 0,
        collection: 0,
        method: 0,
        'entry-point': 0
    },
    // Program structure statistics
    stats: {
        packages: 0,
        compilationUnits: 0,
        classes: 0,
        methods: 0,
        edges: 0,
        sccs: 0,
        maxSccSize: 0,
        avgDegree: 0,
        maxInDegree: 0,
        maxOutDegree: 0,
        density: 0,
        entryPoints: 0,
        leafNodes: 0,
        rootNodes: 0
    },
    sidebarOpen: false,
    minimapVisible: false,
    pathMode: false
};

// ===== Cytoscape Instance =====
let cy = null;
let minimap = null;

// ===== VS Code API =====
let vscode = null;
try {
    vscode = acquireVsCodeApi();
} catch (e) {
    console.log('Running outside VS Code context');
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initCytoscape();
    initUI();
    initEventListeners();
    initKeyboardShortcuts();
    initVSCodeMessageHandler();
    loadInitialData();
});

function initCytoscape() {
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: [],
        style: CYTOSCAPE_STYLES,
        minZoom: 0.1,
        maxZoom: 5,
        wheelSensitivity: 0.3
    });

    // Node events
    cy.on('tap', 'node', handleNodeTap);
    cy.on('cxttap', 'node', handleNodeContextMenu);
    cy.on('mouseover', 'node', handleNodeHover);
    cy.on('mouseout', 'node', handleNodeHoverEnd);
    
    // Canvas events
    cy.on('tap', (e) => {
        if (e.target === cy) {
            clearSelection();
            hideContextMenu();
        }
    });
    
    cy.on('cxttap', (e) => {
        if (e.target === cy) {
            handleCanvasContextMenu(e);
        }
    });

    // Viewport events
    cy.on('viewport', updateMinimap);
}

function initUI() {
    renderLayoutOptions();
    renderGranularityOptions();
    renderFilterList();
    renderLegend();
    updateStats();
}

function initEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
        if (e.key === 'Escape') {
            searchInput.value = '';
            clearSearch();
        }
    });
    
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => cy.zoom(cy.zoom() * 1.2));
    document.getElementById('zoomOut').addEventListener('click', () => cy.zoom(cy.zoom() / 1.2));
    document.getElementById('zoomFit').addEventListener('click', () => cy.fit(50));
    document.getElementById('zoomReset').addEventListener('click', resetView);
    
    // Minimap toggle
    document.getElementById('minimapToggle').addEventListener('click', toggleMinimap);
    
    // Fullscreen
    document.getElementById('fullscreenToggle').addEventListener('click', toggleFullscreen);
    
    // Export
    document.getElementById('exportBtn').addEventListener('click', showExportOptions);
    
    // Help
    document.getElementById('helpBtn').addEventListener('click', showKeyboardShortcuts);
    
    // Mode selector
    document.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', () => setMode(option.dataset.mode));
    });
    
    // Modal close
    document.querySelector('.modal-close')?.addEventListener('click', hideModal);
    document.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) hideModal();
    });
    
    // Close context menu on click outside
    document.addEventListener('click', () => hideContextMenu());
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.includes('Mac');
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        
        if (modifier && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        } else if (modifier && e.key === 'b') {
            e.preventDefault();
            toggleSidebar();
        } else if (modifier && e.key === 'm') {
            e.preventDefault();
            toggleMinimap();
        } else if (modifier && e.key === '0') {
            e.preventDefault();
            resetView();
        } else if (modifier && (e.key === '=' || e.key === '+')) {
            e.preventDefault();
            cy.zoom(cy.zoom() * 1.2);
        } else if (modifier && e.key === '-') {
            e.preventDefault();
            cy.zoom(cy.zoom() / 1.2);
        } else if (e.key === 'Escape') {
            clearSelection();
            hideContextMenu();
            hideModal();
        } else if (e.key === '?') {
            showKeyboardShortcuts();
        }
    });
}

function initVSCodeMessageHandler() {
    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.command === 'updateCallgraph' || message.command === 'showCallgraph') {
            hideLoading();
            const callgraphData = JSON.parse(message.data);
            const isFullRefresh = message.command === 'showCallgraph';
            updateGraph(callgraphData, isFullRefresh);
        }
    });
}

function loadInitialData() {
    fetch('/getCallgraphData')
        .then(response => response.json())
        .then(callgraphData => {
            hideLoading();
            loadGraph(callgraphData);
        })
        .catch(error => {
            console.log('No initial data available:', error);
            hideLoading();
        });
}

// ===== Graph Operations =====
function loadGraph(data) {
    // Store raw data for re-aggregation when granularity changes
    state.rawData = JSON.parse(JSON.stringify(data));
    state.sccNodesMap.clear();
    
    // Build the graph with current granularity
    buildGraphWithGranularity(data);
    
    // Apply layout
    applyLayout('cose');
    
    // Update stats
    updateStatsFromData(data);
}

function buildGraphWithGranularity(data) {
    cy.elements().remove();
    
    if (state.granularity === 'method') {
        // Original behavior: individual method nodes
        buildMethodLevelGraph(data);
    } else {
        // Aggregated view with compound nodes
        buildAggregatedGraph(data, state.granularity);
    }
}

function buildMethodLevelGraph(data) {
    cy.batch(() => {
        // Add nodes
        data.nodes.forEach(node => {
            const sccId = node.sccId;
            if (!state.sccNodesMap.has(sccId)) {
                state.sccNodesMap.set(sccId, []);
            }
            state.sccNodesMap.get(sccId).push(node.methodName);

            cy.add({
                data: {
                    id: node.methodName,
                    label: getShortName(node.methodName),
                    fullName: node.methodName,
                    sccId: node.sccId,
                    kind: node.kind,
                    path: node.path,
                    evaluation: 0
                }
            });
            
            // Apply node type classes
            if (Array.isArray(node.kind)) {
                node.kind.forEach(k => cy.$id(node.methodName).addClass(k));
            } else if (node.kind) {
                cy.$id(node.methodName).addClass(node.kind);
            }
        });

        // Add edges
        data.edges.forEach(edge => {
            cy.add({
                data: {
                    id: `${edge.source}->${edge.target}`,
                    source: edge.source,
                    target: edge.target
                }
            });
        });
    });
}

function buildAggregatedGraph(data, granularity) {
    cy.batch(() => {
        // Maps to track parent nodes and aggregated edges
        const parentNodes = new Map();
        const nodeToParent = new Map();
        const aggregatedEdges = new Map();
        
        // First pass: determine parent for each node
        data.nodes.forEach(node => {
            const parentId = getParentId(node.methodName, granularity);
            nodeToParent.set(node.methodName, parentId);
            
            if (!parentNodes.has(parentId)) {
                parentNodes.set(parentId, {
                    id: parentId,
                    label: getParentLabel(parentId, granularity),
                    children: [],
                    granularity: granularity
                });
            }
            parentNodes.get(parentId).children.push(node);
        });
        
        // Add parent (compound) nodes first
        parentNodes.forEach((parent, parentId) => {
            const nodeClass = getGranularityClass(granularity);
            cy.add({
                data: {
                    id: parentId,
                    label: parent.label,
                    isParent: true,
                    childCount: parent.children.length,
                    granularity: granularity
                },
                classes: nodeClass
            });
        });
        
        // Add child nodes with parent reference
        data.nodes.forEach(node => {
            const sccId = node.sccId;
            if (!state.sccNodesMap.has(sccId)) {
                state.sccNodesMap.set(sccId, []);
            }
            state.sccNodesMap.get(sccId).push(node.methodName);
            
            const parentId = nodeToParent.get(node.methodName);
            
            cy.add({
                data: {
                    id: node.methodName,
                    label: getShortName(node.methodName),
                    fullName: node.methodName,
                    sccId: node.sccId,
                    kind: node.kind,
                    path: node.path,
                    parent: parentId,
                    evaluation: 0
                }
            });
            
            // Apply node type classes
            if (Array.isArray(node.kind)) {
                node.kind.forEach(k => cy.$id(node.methodName).addClass(k));
            } else if (node.kind) {
                cy.$id(node.methodName).addClass(node.kind);
            }
        });
        
        // Add edges (both intra-cluster and inter-cluster)
        data.edges.forEach(edge => {
            cy.add({
                data: {
                    id: `${edge.source}->${edge.target}`,
                    source: edge.source,
                    target: edge.target
                }
            });
        });
    });
}

// Parse a method name to extract package, compilation unit, class, and method
function parseMethodName(methodName) {
    // Typical format: com.package.ClassName.methodName(params)
    // or: com.package.OuterClass$InnerClass.methodName(params)
    
    const parenIdx = methodName.indexOf('(');
    const nameWithoutParams = parenIdx > 0 ? methodName.substring(0, parenIdx) : methodName;
    const parts = nameWithoutParams.split('.');
    
    if (parts.length < 2) {
        return {
            package: 'default',
            compilationUnit: methodName,
            className: methodName,
            methodName: methodName
        };
    }
    
    const methodPart = parts.pop();
    const classOrInner = parts.pop();
    
    // Handle inner classes (ClassName$InnerClass)
    const classMatch = classOrInner.match(/^([^$]+)/);
    const outerClassName = classMatch ? classMatch[1] : classOrInner;
    
    const packageParts = parts;
    const packageName = packageParts.length > 0 ? packageParts.join('.') : 'default';
    const compilationUnit = packageName + '.' + outerClassName;
    
    return {
        package: packageName,
        compilationUnit: compilationUnit,
        className: packageName + '.' + classOrInner,
        methodName: methodName
    };
}

function getParentId(methodName, granularity) {
    const parsed = parseMethodName(methodName);
    
    switch (granularity) {
        case 'package':
            return `pkg:${parsed.package}`;
        case 'compilation-unit':
            return `cu:${parsed.compilationUnit}`;
        case 'class':
            return `cls:${parsed.className}`;
        default:
            return methodName;
    }
}

function getParentLabel(parentId, granularity) {
    // Remove the prefix (pkg:, cu:, cls:)
    const colonIdx = parentId.indexOf(':');
    const name = colonIdx > 0 ? parentId.substring(colonIdx + 1) : parentId;
    
    // For display, show just the last meaningful part
    const parts = name.split('.');
    switch (granularity) {
        case 'package':
            return name === 'default' ? 'default' : parts.slice(-2).join('.');
        case 'compilation-unit':
        case 'class':
            return parts[parts.length - 1];
        default:
            return name;
    }
}

function getGranularityClass(granularity) {
    switch (granularity) {
        case 'package':
            return 'package-node';
        case 'compilation-unit':
            return 'compilation-unit-node';
        case 'class':
            return 'class-node';
        default:
            return '';
    }
}

function setGranularity(granularity) {
    if (state.granularity === granularity) return;
    
    state.granularity = granularity;
    updateActiveGranularity();
    
    if (state.rawData) {
        console.log('Changing granularity to:', granularity, 'with', state.rawData.nodes.length, 'nodes');
        state.sccNodesMap.clear();
        buildGraphWithGranularity(state.rawData);
        applyLayout(state.currentLayout);
        showNotification(`View: ${GRANULARITY_LEVELS.find(l => l.id === granularity)?.name || granularity}`, 'info');
    } else {
        console.log('No rawData available for granularity change');
    }
}

function updateGraph(data, isFullRefresh) {
    // Store raw data for re-aggregation when granularity changes
    state.rawData = JSON.parse(JSON.stringify(data));
    state.sccNodesMap.clear();
    
    if (isFullRefresh) {
        // Full refresh: rebuild with current granularity
        buildGraphWithGranularity(data);
        applyLayout('cose');
        updateStatsFromData(data);
        return;
    }
    
    // Incremental update (only for method-level granularity)
    if (state.granularity !== 'method') {
        // For aggregated views, do a full rebuild
        buildGraphWithGranularity(data);
        applyLayout(state.currentLayout);
        updateStatsFromData(data);
        return;
    }
    
    cy.batch(() => {
        const newNodeIds = new Set(data.nodes.map(n => n.methodName));
        const newEdgeIds = new Set(data.edges.map(e => `${e.source}->${e.target}`));

        // Remove old elements
        cy.nodes().forEach(node => {
            if (!newNodeIds.has(node.id())) cy.remove(node);
        });
        cy.edges().forEach(edge => {
            if (!newEdgeIds.has(edge.id())) cy.remove(edge);
        });

        const extent = cy.extent();

        // Add new nodes
        data.nodes.forEach(node => {
            if (cy.$id(node.methodName).length === 0) {
                const position = {
                    x: Math.random() * (extent.x2 - extent.x1) + extent.x1,
                    y: Math.random() * (extent.y2 - extent.y1) + extent.y1
                };
                cy.add({
                    data: {
                        id: node.methodName,
                        label: getShortName(node.methodName),
                        fullName: node.methodName,
                        sccId: node.sccId,
                        kind: node.kind,
                        path: node.path,
                        evaluation: 0
                    },
                    position
                });
                
                if (Array.isArray(node.kind)) {
                    node.kind.forEach(k => cy.$id(node.methodName).addClass(k));
                }
            }
        });

        // Add new edges
        data.edges.forEach(edge => {
            const edgeId = `${edge.source}->${edge.target}`;
            if (cy.$id(edgeId).length === 0) {
                cy.add({
                    data: { id: edgeId, source: edge.source, target: edge.target }
                });
            }
        });
    });

    updateStatsFromData(data);
}

function getShortName(fullName) {
    // Extract just the method name from full qualified name
    const parts = fullName.split('.');
    return parts[parts.length - 1] || fullName;
}

// ===== Layout =====
function applyLayout(layoutName) {
    state.currentLayout = layoutName;
    updateActiveLayout();

    const options = getLayoutOptions(layoutName);
    const layout = cy.layout(options);
    
    layout.run();
    
    if (layoutName !== 'preset') {
        layout.on('layoutstop', () => {
            cy.fit(50);
            initMinimap();
            updateMinimap();
        });
    }
}

function getLayoutOptions(name) {
    const common = { animate: true, animationDuration: 500 };
    
    switch (name) {
        case 'cose':
            return {
                ...common,
                name: 'cose',
                nodeRepulsion: 400000,
                idealEdgeLength: 80,
                edgeElasticity: 100,
                gravity: 50,
                numIter: 1000
            };
        case 'cola':
            return {
                ...common,
                name: 'cola',
                nodeSpacing: 50,
                edgeLength: 100,
                animate: true
            };
        case 'concentric':
            return {
                ...common,
                name: 'concentric',
                concentric: node => node.degree(),
                levelWidth: () => 2,
                minNodeSpacing: 50
            };
        case 'breadthfirst':
            return {
                ...common,
                name: 'breadthfirst',
                directed: true,
                spacingFactor: 1.5
            };
        case 'circle':
            return { ...common, name: 'circle' };
        case 'grid':
            return { ...common, name: 'grid', rows: Math.ceil(Math.sqrt(cy.nodes().length)) };
        default:
            return { ...common, name: 'cose' };
    }
}

// ===== UI Rendering =====
function renderLayoutOptions() {
    const container = document.getElementById('layoutGrid');
    if (!container) return;

    container.innerHTML = LAYOUTS.map(layout => `
        <div class="layout-option ${layout.id === state.currentLayout ? 'active' : ''}" 
             data-layout="${layout.id}">
            <i class="fas ${layout.icon}"></i>
            <span>${layout.name}</span>
        </div>
    `).join('');

    container.querySelectorAll('.layout-option').forEach(option => {
        option.addEventListener('click', () => applyLayout(option.dataset.layout));
    });
}

function renderGranularityOptions() {
    const container = document.getElementById('granularitySelector');
    if (!container) return;

    container.innerHTML = GRANULARITY_LEVELS.map(level => `
        <div class="granularity-option ${level.id === state.granularity ? 'active' : ''}" 
             data-granularity="${level.id}">
            <div class="granularity-icon">
                <i class="fas ${level.icon}"></i>
            </div>
            <div class="granularity-info">
                <div class="granularity-name">${level.name}</div>
                <div class="granularity-desc">${level.desc}</div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.granularity-option').forEach(option => {
        option.addEventListener('click', () => setGranularity(option.dataset.granularity));
    });
}

function updateActiveGranularity() {
    document.querySelectorAll('.granularity-option').forEach(option => {
        option.classList.toggle('active', option.dataset.granularity === state.granularity);
    });
}

function renderFilterList() {
    const container = document.getElementById('filterList');
    if (!container) return;

    // Render only standard node types (not RAG types)
    container.innerHTML = NODE_TYPES.map(type => `
        <div class="filter-item ${state.filters[type.type] ? 'active' : ''}" 
             data-type="${type.type}">
            <div class="filter-color" style="background-color: ${type.color}; color: ${type.color}"></div>
            <span class="filter-label">${type.label}</span>
            <span class="filter-count" id="count-${type.type}">0</span>
            <div class="filter-toggle"></div>
        </div>
    `).join('');

    container.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', () => toggleFilter(item.dataset.type));
    });
    
    // Render RAG filter list (hidden by default)
    renderRagFilterList();
    
    // Setup RAG toggle
    const ragToggle = document.getElementById('ragToggle');
    if (ragToggle) {
        ragToggle.checked = state.showRagFilters;
        ragToggle.addEventListener('change', (e) => {
            state.showRagFilters = e.target.checked;
            const ragList = document.getElementById('ragFilterList');
            if (ragList) {
                ragList.classList.toggle('visible', state.showRagFilters);
            }
        });
    }
}

function renderRagFilterList() {
    const container = document.getElementById('ragFilterList');
    if (!container) return;

    container.innerHTML = RAG_NODE_TYPES.map(type => `
        <div class="rag-filter-item filter-item ${state.filters[type.type] ? 'active' : ''}" 
             data-type="${type.type}">
            <div class="filter-color" style="background-color: ${type.color}; color: ${type.color}"></div>
            <span class="filter-label">${type.label}</span>
            <span class="filter-count" id="count-${type.type}">0</span>
            <div class="filter-toggle"></div>
        </div>
    `).join('');

    container.querySelectorAll('.rag-filter-item').forEach(item => {
        item.addEventListener('click', () => toggleFilter(item.dataset.type));
    });
    
    // Set initial visibility
    container.classList.toggle('visible', state.showRagFilters);
}

function renderLegend() {
    const container = document.getElementById('legendList');
    if (!container) return;

    // Show all node types in legend (including RAG when enabled)
    const typesToShow = state.showRagFilters ? ALL_NODE_TYPES : NODE_TYPES;
    container.innerHTML = typesToShow.map(type => `
        <div class="legend-item">
            <div class="legend-node glow" style="background-color: ${type.color}; color: ${type.color}"></div>
            <span class="legend-label">${type.label}</span>
        </div>
    `).join('');
}

function updateActiveLayout() {
    document.querySelectorAll('.layout-option').forEach(option => {
        option.classList.toggle('active', option.dataset.layout === state.currentLayout);
    });
}

// ===== Node Interaction =====
function handleNodeTap(event) {
    const node = event.target;
    state.selectedNode = node;
    
    if (state.mode === 'reachability') {
        highlightReachable(node);
    } else {
        highlightSCC(node);
    }
}

function handleNodeHover(event) {
    const node = event.target;
    showTooltip(node, event.renderedPosition);
}

function handleNodeHoverEnd() {
    hideTooltip();
}

function handleNodeContextMenu(event) {
    event.preventDefault();
    const node = event.target;
    showContextMenu(node, event.renderedPosition);
}

function handleCanvasContextMenu(event) {
    event.preventDefault();
    showCanvasContextMenu(event.renderedPosition);
}

function highlightReachable(node) {
    cy.elements().removeClass('dimmed path-node path-edge');
    cy.elements().addClass('dimmed');
    
    const visited = new Set();
    const queue = [node];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current.id())) continue;
        
        visited.add(current.id());
        current.removeClass('dimmed');
        current.addClass('path-node');
        
        current.outgoers('edge').forEach(edge => {
            edge.removeClass('dimmed');
            edge.addClass('path-edge');
            const target = edge.target();
            if (!visited.has(target.id())) {
                queue.push(target);
            }
        });
    }
    
    showNotification(`Found ${visited.size} reachable nodes`, 'info');
}

function highlightSCC(node) {
    const sccId = node.data('sccId');
    if (sccId === undefined) return;
    
    cy.elements().removeClass('dimmed path-node path-edge');
    cy.elements().addClass('dimmed');
    
    let sccCount = 0;
    cy.nodes().forEach(n => {
        if (n.data('sccId') === sccId) {
            n.removeClass('dimmed');
            n.addClass('path-node');
            sccCount++;
        }
    });
    
    cy.edges().forEach(edge => {
        const source = edge.source();
        const target = edge.target();
        if (source.data('sccId') === sccId && target.data('sccId') === sccId) {
            edge.removeClass('dimmed');
            edge.addClass('path-edge');
        }
    });
    
    showNotification(`SCC contains ${sccCount} nodes`, 'info');
}

function clearSelection() {
    state.selectedNode = null;
    cy.elements().removeClass('dimmed path-node path-edge highlighted');
    hideTooltip();
}

// ===== Tooltip =====
let tooltipTimeout = null;
let isTooltipHovered = false;

function showTooltip(node, position) {
    // Clear any pending hide
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    
    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
        
        // Keep tooltip visible when hovering over it
        tooltip.addEventListener('mouseenter', () => {
            isTooltipHovered = true;
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
        });
        
        tooltip.addEventListener('mouseleave', () => {
            isTooltipHovered = false;
            hideTooltipWithDelay(100);
        });
    }
    
    const data = node.data();
    const kinds = Array.isArray(data.kind) ? data.kind : [data.kind];
    const kindColor = NODE_TYPES.find(t => kinds.includes(t.type))?.color || '#ffffff';
    
    tooltip.innerHTML = `
        <div class="tooltip-header">
            <div class="tooltip-icon" style="background-color: ${kindColor}20; color: ${kindColor}">
                <i class="fas fa-code"></i>
            </div>
            <div class="tooltip-title">${data.fullName || data.id}</div>
        </div>
        <div class="tooltip-body">
            <div class="tooltip-row">
                <span class="tooltip-label">SCC ID</span>
                <span class="tooltip-value">${data.sccId || 'N/A'}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Connections</span>
                <span class="tooltip-value">${node.degree()}</span>
            </div>
            <div class="tooltip-tags">
                ${kinds.filter(k => k).map(k => `<span class="tooltip-tag">${k}</span>`).join('')}
            </div>
        </div>
        ${data.path ? `
        <div class="tooltip-actions">
            <a href="vscode://file/${data.path}" class="tooltip-btn primary" target="_blank">
                <i class="fas fa-external-link-alt"></i>
                Go to file
            </a>
        </div>
        ` : ''}
    `;
    
    // Position tooltip
    const x = Math.min(position.x + 15, window.innerWidth - 270);
    const y = Math.min(position.y + 15, window.innerHeight - 200);
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add('visible');
}

function hideTooltipWithDelay(delay = 300) {
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    tooltipTimeout = setTimeout(() => {
        if (!isTooltipHovered) {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.classList.remove('visible');
            }
        }
    }, delay);
}

function hideTooltip() {
    hideTooltipWithDelay(300);
}

// ===== Context Menu =====
function showContextMenu(node, position) {
    hideContextMenu();
    
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu';
    
    const data = node.data();
    
    menu.innerHTML = `
        <div class="context-menu-item" data-action="highlight">
            <i class="fas fa-highlighter"></i>
            Highlight Reachable
        </div>
        <div class="context-menu-item" data-action="scc">
            <i class="fas fa-project-diagram"></i>
            Show SCC
        </div>
        <div class="context-menu-item" data-action="center">
            <i class="fas fa-crosshairs"></i>
            Center on Node
        </div>
        ${data.path ? `
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="goto">
            <i class="fas fa-external-link-alt"></i>
            Go to Definition
        </div>
        ` : ''}
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="hide">
            <i class="fas fa-eye-slash"></i>
            Hide Node
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Position
    const x = Math.min(position.x, window.innerWidth - 180);
    const y = Math.min(position.y + 60, window.innerHeight - 250);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    requestAnimationFrame(() => menu.classList.add('visible'));
    
    // Handle actions
    menu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            
            switch (action) {
                case 'highlight':
                    highlightReachable(node);
                    break;
                case 'scc':
                    highlightSCC(node);
                    break;
                case 'center':
                    cy.center(node);
                    cy.zoom(2);
                    break;
                case 'goto':
                    window.open(`vscode://file/${data.path}`, '_blank');
                    break;
                case 'hide':
                    node.addClass('hidden');
                    showNotification('Node hidden', 'info');
                    break;
            }
            
            hideContextMenu();
        });
    });
}

function showCanvasContextMenu(position) {
    hideContextMenu();
    
    const menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.className = 'context-menu';
    
    menu.innerHTML = `
        <div class="context-menu-item" data-action="fit">
            <i class="fas fa-expand"></i>
            Fit to Screen
        </div>
        <div class="context-menu-item" data-action="reset">
            <i class="fas fa-undo"></i>
            Reset View
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="showAll">
            <i class="fas fa-eye"></i>
            Show All Nodes
        </div>
    `;
    
    document.body.appendChild(menu);
    
    const x = Math.min(position.x, window.innerWidth - 180);
    const y = Math.min(position.y + 60, window.innerHeight - 150);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    requestAnimationFrame(() => menu.classList.add('visible'));
    
    menu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            
            switch (action) {
                case 'fit':
                    cy.fit(50);
                    break;
                case 'reset':
                    resetView();
                    break;
                case 'showAll':
                    cy.elements().removeClass('hidden');
                    showNotification('All nodes visible', 'info');
                    break;
            }
            
            hideContextMenu();
        });
    });
}

function hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) {
        menu.remove();
    }
}

// ===== Search =====
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        clearSearch();
        return;
    }
    
    cy.elements().removeClass('highlighted dimmed');
    
    const matches = cy.nodes().filter(node => {
        const id = node.id().toLowerCase();
        const label = (node.data('label') || '').toLowerCase();
        return id.includes(query) || label.includes(query);
    });
    
    if (matches.length > 0) {
        cy.elements().addClass('dimmed');
        matches.removeClass('dimmed').addClass('highlighted');
        cy.fit(matches, 100);
        showNotification(`Found ${matches.length} matching nodes`, 'success');
    } else {
        showNotification('No matching nodes found', 'error');
    }
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    cy.elements().removeClass('highlighted dimmed');
}

// ===== Filters =====
function toggleFilter(type) {
    state.filters[type] = !state.filters[type];
    
    document.querySelector(`.filter-item[data-type="${type}"]`)
        ?.classList.toggle('active', state.filters[type]);
    
    cy.nodes().forEach(node => {
        const kinds = node.data('kind') || [];
        const nodeTypes = Array.isArray(kinds) ? kinds : [kinds];
        const shouldShow = nodeTypes.some(t => state.filters[t]);
        node.toggleClass('hidden', !shouldShow);
    });
}

// ===== Mode =====
function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.toggle('active', option.dataset.mode === mode);
    });
}

// ===== Stats =====
function updateStatsFromData(data) {
    state.counts.nodes = data.nodes.length;
    state.counts.edges = data.edges.length;
    
    // Reset kind counts
    ALL_NODE_TYPES.forEach(type => state.counts[type.type] = 0);
    
    // Collect structural information
    const packages = new Set();
    const compilationUnits = new Set();
    const classes = new Set();
    const inDegree = new Map();
    const outDegree = new Map();
    
    data.nodes.forEach(node => {
        const kinds = Array.isArray(node.kind) ? node.kind : [node.kind];
        kinds.forEach(k => {
            if (state.counts[k] !== undefined) state.counts[k]++;
        });
        
        // Parse method name to extract structure
        const parsed = parseMethodName(node.methodName);
        packages.add(parsed.package);
        compilationUnits.add(parsed.compilationUnit);
        classes.add(parsed.className);
        
        // Initialize degree counts
        inDegree.set(node.methodName, 0);
        outDegree.set(node.methodName, 0);
    });
    
    // Calculate degrees from edges
    data.edges.forEach(edge => {
        outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    // Calculate graph metrics
    let maxInDeg = 0, maxOutDeg = 0, totalDegree = 0;
    let leafNodes = 0, rootNodes = 0;
    
    data.nodes.forEach(node => {
        const inDeg = inDegree.get(node.methodName) || 0;
        const outDeg = outDegree.get(node.methodName) || 0;
        
        maxInDeg = Math.max(maxInDeg, inDeg);
        maxOutDeg = Math.max(maxOutDeg, outDeg);
        totalDegree += inDeg + outDeg;
        
        if (outDeg === 0) leafNodes++;
        if (inDeg === 0) rootNodes++;
    });
    
    const nodeCount = data.nodes.length;
    const edgeCount = data.edges.length;
    const avgDegree = nodeCount > 0 ? (totalDegree / nodeCount).toFixed(1) : 0;
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const density = maxPossibleEdges > 0 ? ((edgeCount / maxPossibleEdges) * 100).toFixed(1) : 0;
    
    // Count SCCs
    const sccCount = state.sccNodesMap.size;
    let maxSccSize = 0;
    state.sccNodesMap.forEach(nodes => {
        maxSccSize = Math.max(maxSccSize, nodes.length);
    });
    
    // Count circular nodes (nodes in SCCs with more than 1 node)
    let circularCount = 0;
    state.sccNodesMap.forEach(nodes => {
        if (nodes.length > 1) circularCount += nodes.length;
    });
    
    // Update state.stats
    state.stats = {
        packages: packages.size,
        compilationUnits: compilationUnits.size,
        classes: classes.size,
        methods: nodeCount,
        edges: edgeCount,
        sccs: sccCount,
        maxSccSize: maxSccSize,
        avgDegree: avgDegree,
        maxInDegree: maxInDeg,
        maxOutDegree: maxOutDeg,
        density: density,
        entryPoints: state.counts['entry-point'] || 0,
        leafNodes: leafNodes,
        rootNodes: rootNodes,
        circularNodes: circularCount
    };
    
    updateStats();
}

function updateStats() {
    // Update filter counts
    ALL_NODE_TYPES.forEach(type => {
        const el = document.getElementById(`count-${type.type}`);
        if (el) el.textContent = state.counts[type.type] || 0;
    });
    
    // Update structure stats
    const statElements = {
        'statPackages': state.stats.packages,
        'statFiles': state.stats.compilationUnits,
        'statClasses': state.stats.classes,
        'statMethods': state.stats.methods,
        'statNodes': state.counts.nodes,
        'statEdges': state.counts.edges,
        'statEntryPoints': state.stats.entryPoints,
        'statLeafNodes': state.stats.leafNodes,
        'statSccs': state.stats.sccs,
        'statMaxScc': state.stats.maxSccSize,
        'statAvgDegree': state.stats.avgDegree,
        'statDensity': state.stats.density + '%',
        'statMaxInDegree': state.stats.maxInDegree,
        'statMaxOutDegree': state.stats.maxOutDegree,
        'statRootNodes': state.stats.rootNodes,
        'statCircular': state.stats.circularNodes
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// ===== UI Controls =====
function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', state.sidebarOpen);
    document.getElementById('sidebarToggle').classList.toggle('active', state.sidebarOpen);
}

function toggleMinimap() {
    state.minimapVisible = !state.minimapVisible;
    document.getElementById('minimapContainer')?.classList.toggle('visible', state.minimapVisible);
    document.getElementById('minimapToggle')?.classList.toggle('active', state.minimapVisible);
    
    if (state.minimapVisible && !minimap) {
        initMinimap();
    }
}

function initMinimap() {
    const minimapContainer = document.getElementById('minimap');
    if (!minimapContainer) return;
    if (!cy || cy.nodes().length === 0) return;
    
    // Destroy existing minimap if any
    if (minimap) {
        minimap.destroy();
        minimap = null;
    }
    
    // Create a secondary Cytoscape instance for the minimap
    minimap = cytoscape({
        container: minimapContainer,
        elements: cy.elements().jsons(),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#00d4ff',
                    'width': '4px',
                    'height': '4px',
                    'label': ''
                }
            },
            {
                selector: 'edge',
                style: {
                    'line-color': 'rgba(255, 255, 255, 0.2)',
                    'width': 0.5,
                    'curve-style': 'straight'
                }
            }
        ],
        layout: { name: 'preset' },
        userPanningEnabled: false,
        userZoomingEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true,
        autounselectify: true
    });
    
    minimap.fit(10);
    
    // Add viewport indicator
    updateMinimapViewport();
}

function updateMinimap() {
    if (!minimap || !state.minimapVisible) return;
    
    // Sync elements if needed
    const cyNodeIds = new Set(cy.nodes().map(n => n.id()));
    const minimapNodeIds = new Set(minimap.nodes().map(n => n.id()));
    
    // Check if we need to resync
    if (cyNodeIds.size !== minimapNodeIds.size) {
        minimap.elements().remove();
        minimap.add(cy.elements().jsons());
        minimap.fit(10);
    }
    
    updateMinimapViewport();
}

function updateMinimapViewport() {
    if (!minimap) return;
    
    // Remove existing viewport indicator
    const existing = document.querySelector('.minimap-viewport');
    if (existing) existing.remove();
    
    const minimapContainer = document.getElementById('minimap');
    if (!minimapContainer) return;
    
    // Calculate viewport rectangle
    const ext = cy.extent();
    const pan = minimap.pan();
    const zoom = minimap.zoom();
    
    // Get the bounding box of all elements in the main graph
    const bb = cy.elements().boundingBox();
    if (bb.w === 0 || bb.h === 0) return;
    
    // Calculate the viewport indicator position and size
    const containerRect = minimapContainer.getBoundingClientRect();
    const minimapBB = minimap.elements().boundingBox();
    
    if (minimapBB.w === 0 || minimapBB.h === 0) return;
    
    const scaleX = (containerRect.width - 20) / minimapBB.w;
    const scaleY = (containerRect.height - 10) / minimapBB.h;
    const scale = Math.min(scaleX, scaleY);
    
    const viewportDiv = document.createElement('div');
    viewportDiv.className = 'minimap-viewport';
    viewportDiv.style.cssText = `
        position: absolute;
        border: 2px solid var(--accent-primary);
        background: rgba(0, 212, 255, 0.1);
        pointer-events: none;
        border-radius: 2px;
    `;
    
    // Calculate position based on main cy viewport
    const mainExt = cy.extent();
    const left = ((mainExt.x1 - minimapBB.x1) / minimapBB.w) * (containerRect.width - 20) + 10;
    const top = ((mainExt.y1 - minimapBB.y1) / minimapBB.h) * (containerRect.height - 10) + 28;
    const width = ((mainExt.x2 - mainExt.x1) / minimapBB.w) * (containerRect.width - 20);
    const height = ((mainExt.y2 - mainExt.y1) / minimapBB.h) * (containerRect.height - 10);
    
    viewportDiv.style.left = `${Math.max(0, left)}px`;
    viewportDiv.style.top = `${Math.max(28, top)}px`;
    viewportDiv.style.width = `${Math.min(containerRect.width, Math.max(20, width))}px`;
    viewportDiv.style.height = `${Math.min(containerRect.height - 28, Math.max(10, height))}px`;
    
    minimapContainer.parentElement.appendChild(viewportDiv);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function resetView() {
    clearSelection();
    cy.elements().removeClass('hidden');
    cy.fit(50);
    cy.zoom(1);
    applyLayout(state.currentLayout);
}

function showExportOptions() {
    const png = cy.png({ scale: 2, bg: '#0a0a0f' });
    
    const link = document.createElement('a');
    link.download = 'callgraph.png';
    link.href = png;
    link.click();
    
    showNotification('Graph exported as PNG', 'success');
}

// ===== Modal =====
function showKeyboardShortcuts() {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    
    const content = document.getElementById('shortcutList');
    if (content) {
        content.innerHTML = KEYBOARD_SHORTCUTS.map(shortcut => `
            <div class="shortcut-item">
                <span class="shortcut-desc">${shortcut.desc}</span>
                <div class="shortcut-keys">
                    ${shortcut.keys.map(k => `<span class="key">${k}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }
    
    overlay.classList.add('visible');
}

function hideModal() {
    document.getElementById('modalOverlay')?.classList.remove('visible');
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="notification-text">${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== Loading =====
function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
}

// ===== Utilities =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
