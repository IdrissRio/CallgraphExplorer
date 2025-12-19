/**
 * Callgraph Visualization - Main JavaScript Module
 * 
 * This module handles all the interactive functionality for the callgraph visualization:
 * - Cytoscape graph initialization and configuration
 * - Event handlers for graph interaction
 * - VS Code extension message handling
 * - Menu and UI controls
 */

// ===== Constants =====
const NODE_TYPES = [
    { type: 'syn', label: 'Synthesized', color: 'rgb(91, 154, 139)' },
    { type: 'inh', label: 'Inherited', color: 'rgb(247, 233, 135)' },
    { type: 'entry-point', label: 'Entry Point', color: 'rgb(205, 44, 108)' },
    { type: 'collection', label: 'Collection', color: 'transparent', borderColor: 'red' },
    { type: 'method', label: 'Method', color: 'rgb(255, 255, 255)' },
    { type: 'circular', label: 'Circular', color: 'rgb(178, 6, 0)', borderColor: 'rgb(178, 6, 0)' }
];

const LAYOUT_OPTIONS = {
    cola: {
        name: 'cola',
        animate: false,
        directed: true,
        flow: { axis: 'y', minSeparation: 30 },
        edgeSymDiffLength: 10
    },
    cose: {
        name: 'cose',
        animate: false,
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
    },
    concentric: {
        name: 'concentric',
        animate: true,
        animationDuration: 500
    },
    breadthfirst: {
        name: 'breadthfirst',
        animate: false,
        directed: true,
        flow: { axis: 'y', minSeparation: 100 },
        edgeSymDiffLength: 5
    },
    circle: {
        name: 'circle',
        animate: false,
        directed: true
    },
    grid: {
        name: 'grid',
        animate: false,
        directed: true
    }
};

const CYTOSCAPE_STYLES = [
    {
        selector: 'node',
        style: {
            'background-color': 'white',
            'width': '20px',
            'height': '20px',
            'label': 'data(id)',
            'font-family': 'sans-serif',
            'font-size': '7px',
            'color': 'white',
            'text-valign': 'bottom',
            'text-background-color': 'black',
            'text-background-opacity': 0.7,
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle'
        }
    },
    {
        selector: '.syn',
        style: { 'background-color': 'rgb(91, 154, 139)' }
    },
    {
        selector: '.inh',
        style: { 'background-color': 'rgb(247, 233, 135)' }
    },
    {
        selector: '.entry-point',
        style: { 'background-color': 'rgb(205, 44, 108)' }
    },
    {
        selector: '.collection',
        style: {
            'border-color': 'red',
            'border-width': '2px',
            'border-style': 'solid'
        }
    },
    {
        selector: '.circular',
        style: {
            'background-color': 'rgb(178, 6, 0)',
            'color': 'white',
            'border-color': 'rgb(178, 6, 0)',
            'border-width': '2px',
            'border-style': 'solid'
        }
    },
    {
        selector: 'edge',
        style: {
            'line-color': '#aaa',
            'target-arrow-color': '#aaa',
            'target-arrow-shape': 'triangle',
            'width': 0.5,
            'curve-style': 'straight',
            'arrow-scale': 0.5
        }
    },
    {
        selector: '.highlighted',
        style: {
            'border-color': 'rgb(205, 44, 108)',
            'background-color': 'rgb(247, 233, 135)',
            'border-width': '2px',
            'border-style': 'solid'
        }
    },
    {
        selector: '.hidden',
        style: { 'display': 'none' }
    }
];

// ===== State Management =====
class CallgraphState {
    constructor() {
        this.sccNodesMap = new Map();
        this.tooltip = null;
        this.tooltipVisible = false;
    }
}

// ===== Cytoscape Manager =====
class CytoscapeManager {
    constructor(containerId) {
        this.cy = cytoscape({
            container: document.getElementById(containerId),
            elements: [],
            style: CYTOSCAPE_STYLES
        });
        this.state = new CallgraphState();
    }

    applyLayout(layoutName) {
        const options = LAYOUT_OPTIONS[layoutName] || {
            name: layoutName,
            animate: false,
            directed: true,
            flow: { axis: 'y', minSeparation: 100 },
            edgeSymDiffLength: 5
        };
        this.cy.layout(options).run();
    }

    searchNodes(query) {
        const searchTerm = query.trim().toLowerCase();
        if (!searchTerm) return;

        const matchingNodes = this.cy.nodes().filter(node => 
            node.id().toLowerCase().includes(searchTerm)
        );

        if (matchingNodes.length > 0) {
            this.cy.elements().removeClass('highlighted');
            matchingNodes.addClass('highlighted');
            this.cy.center(matchingNodes);
        } else {
            console.log('No nodes found matching the search criteria');
        }
    }

    highlightReachableNodes(nodeId) {
        this.cy.elements().removeClass('circular');

        const startNode = this.cy.$(`[id="${nodeId}"]`);
        if (startNode.length === 0) return;

        const visited = new Set();
        const queue = [startNode];

        while (queue.length > 0) {
            const currentNode = queue.shift();
            if (visited.has(currentNode.id())) continue;

            visited.add(currentNode.id());
            currentNode.addClass('circular');
            currentNode.removeClass('hidden');

            currentNode.connectedEdges().forEach(edge => {
                const targetNode = edge.target();
                if (!visited.has(targetNode.id())) {
                    queue.push(targetNode);
                    edge.removeClass('hidden');
                    targetNode.removeClass('hidden');
                }
            });
        }
    }

    resetView() {
        this.cy.elements().removeClass('highlighted');
        this.cy.elements().removeClass('circular');
        this.cy.elements().removeClass('hidden');

        this.cy.nodes().forEach(node => {
            const kind = node.data('kind');
            node.style('background-color', '');
            if (kind) node.addClass(kind);
        });

        this.applyLayout('concentric');
    }

    handleNodeClick(clickedNode, isReachabilityMode) {
        if (isReachabilityMode) {
            this.cy.elements().addClass('hidden');
            this.highlightReachableNodes(clickedNode.id());
        } else {
            const sccId = clickedNode.data('sccId');
            if (sccId === undefined) return;

            this.cy.elements().addClass('hidden');

            this.cy.nodes().forEach(node => {
                if (node.data('sccId') === sccId) {
                    node.removeClass('hidden');
                    node.addClass('circular');
                }
            });

            clickedNode.removeClass('hidden');

            this.cy.edges().forEach(edge => {
                const sourceNode = edge.source();
                const targetNode = edge.target();
                if (sourceNode.data('sccId') === sccId && targetNode.data('sccId') === sccId) {
                    edge.removeClass('hidden');
                }
            });
        }
    }

    updateFromCallgraphData(callgraphData, isFullRefresh = false) {
        this.cy.batch(() => {
            const newNodeIds = new Set(callgraphData.nodes.map(node => node.methodName));

            // Remove nodes not in new data
            this.cy.nodes().forEach(node => {
                if (!newNodeIds.has(node.id())) {
                    this.cy.remove(node);
                }
            });

            // Update edge styles
            this.cy.style()
                .selector('edge')
                .style({
                    'curve-style': 'bezier',
                    'control-point-step-size': 40
                })
                .selector('edge[loop]')
                .style({
                    'curve-style': 'unbundled-bezier',
                    'control-point-distances': 30,
                    'control-point-weights': 0.5
                })
                .update();

            const extent = this.cy.extent();
            const newNodes = [];

            // Add new nodes
            callgraphData.nodes.forEach(node => {
                const nodeId = node.methodName;
                if (this.cy.getElementById(nodeId).length === 0) {
                    const position = {
                        x: Math.random() * (extent.x2 - extent.x1) + extent.x1 + 100,
                        y: Math.random() * (extent.y2 - extent.y1) + extent.y1 + 100
                    };
                    const newNode = this.cy.add({
                        data: {
                            id: nodeId,
                            sccId: node.sccId,
                            kind: node.kind,
                            evaluation: 0,
                            path: node.path
                        },
                        position
                    });
                    newNodes.push(newNode);
                    this.cy.getElementById(nodeId).addClass(node.kind);
                }
            });

            // Handle edges
            const newEdgeIds = new Set(callgraphData.edges.map(edge => `${edge.source}->${edge.target}`));

            this.cy.edges().forEach(edge => {
                if (!newEdgeIds.has(edge.id())) {
                    this.cy.remove(edge);
                }
            });

            const newEdges = [];
            callgraphData.edges.forEach(edge => {
                const edgeId = `${edge.source}->${edge.target}`;
                if (this.cy.getElementById(edgeId).length === 0) {
                    newEdges.push(this.cy.add({
                        data: { id: edgeId, source: edge.source, target: edge.target }
                    }));
                }
            });

            // Apply layout
            if (isFullRefresh) {
                this.cy.layout({
                    name: 'cose',
                    animate: true,
                    animationDuration: 500
                }).run();
            } else {
                const elements = this.cy.collection(newNodes.flat()).union(this.cy.collection(newEdges.flat()));
                const layout = elements.layout({
                    name: 'cose',
                    concentric: node => node.degree(),
                    levelWidth: nodes => nodes.maxDegree() / 4
                });

                layout.pon('layoutstop').then(() => this.cy.fit());
                layout.run();
            }
        });

        return callgraphData.nodes.length;
    }

    loadInitialData(callgraphData) {
        callgraphData.nodes.forEach(node => {
            const sccId = node.sccId;
            if (!this.state.sccNodesMap.has(sccId)) {
                this.state.sccNodesMap.set(sccId, []);
            }
            this.state.sccNodesMap.get(sccId).push(node.methodName);

            this.cy.add({
                data: {
                    id: node.methodName,
                    sccId: node.sccId,
                    kind: node.kind,
                    evaluation: 0
                }
            });
            this.cy.$(`[id="${node.methodName}"]`).addClass(node.kind);
        });

        callgraphData.edges.forEach(edge => {
            this.cy.add({
                data: {
                    id: `${edge.source}->${edge.target}`,
                    source: edge.source,
                    target: edge.target
                }
            });
        });

        this.applyLayout('concentric');
        return callgraphData;
    }
}

// ===== Tooltip Manager =====
class TooltipManager {
    constructor() {
        this.tooltip = null;
        this.visible = false;
    }

    show(node, position) {
        this.hide();

        this.tooltip = document.createElement('div');
        this.tooltip.classList.add('tooltip');
        document.body.appendChild(this.tooltip);

        const sccId = node.data('sccId');
        const kind = node.data('kind');
        const evaluation = node.data('evaluation');
        const path = node.data('path');

        let content = `<strong>Node:</strong> ${node.id()}`;
        if (path) {
            content += `<br><a href="vscode://file/${path}" target="_blank">📂 Go to definition</a>`;
        }
        content += `<br><strong>SCC ID:</strong> ${sccId}`;
        content += `<br><strong>Kind:</strong> ${Array.isArray(kind) ? kind.join(', ') : kind}`;
        content += `<br><strong>Evaluation:</strong> ${evaluation}`;

        this.tooltip.innerHTML = content;
        this.tooltip.style.left = `${position.x + 15}px`;
        this.tooltip.style.top = `${position.y + 15}px`;
        this.tooltip.style.opacity = 1;
        this.visible = true;

        this.tooltip.addEventListener('mouseover', () => this.visible = true);
        this.tooltip.addEventListener('mouseleave', () => this.hide());
    }

    hide() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        this.tooltip = null;
        this.visible = false;
    }
}

// ===== Statistics Manager =====
class StatisticsManager {
    constructor() {
        this.elements = {
            nodeCount: document.getElementById('nodeCount'),
            edgeCount: document.getElementById('edgeCount'),
            kindSynNodeCount: document.getElementById('kindSynNodeCount'),
            kindInhNodeCount: document.getElementById('kindInhNodeCount'),
            kindCircularNodeCount: document.getElementById('kindCircularNodeCount'),
            kindCollectionNodeCount: document.getElementById('kindCollectionNodeCount'),
            kindMethodNodeCount: document.getElementById('kindMethodNodeCount')
        };
    }

    update(callgraphData) {
        this.elements.nodeCount.textContent = callgraphData.nodes.length;
        this.elements.edgeCount.textContent = callgraphData.edges.length;

        const kindCounts = {
            syn: 0,
            inh: 0,
            circular: 0,
            collection: 0,
            method: 0
        };

        callgraphData.nodes.forEach(node => {
            if (Array.isArray(node.kind)) {
                node.kind.forEach(kind => {
                    kindCounts[kind] = (kindCounts[kind] || 0) + 1;
                });
            }
        });

        this.elements.kindSynNodeCount.textContent = kindCounts.syn;
        this.elements.kindInhNodeCount.textContent = kindCounts.inh;
        this.elements.kindCircularNodeCount.textContent = kindCounts.circular;
        this.elements.kindCollectionNodeCount.textContent = kindCounts.collection;
        this.elements.kindMethodNodeCount.textContent = kindCounts.method;
    }
}

// ===== Legend Manager =====
class LegendManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render() {
        NODE_TYPES.forEach(nodeType => {
            const legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');

            const legendNode = document.createElement('div');
            legendNode.classList.add('legend-node');
            legendNode.style.backgroundColor = nodeType.color || 'transparent';
            legendNode.style.borderColor = nodeType.borderColor || 'transparent';

            const legendLabel = document.createElement('span');
            legendLabel.textContent = nodeType.label;

            legendItem.appendChild(legendNode);
            legendItem.appendChild(legendLabel);
            this.container.appendChild(legendItem);
        });
    }
}

// ===== Menu Manager =====
class MenuManager {
    constructor(buttonId, menuId) {
        this.button = document.getElementById(buttonId);
        this.menu = document.getElementById(menuId);
        this.isOpen = false;

        this.init();
    }

    init() {
        this.button.addEventListener('click', () => this.toggle());
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.menu.classList.toggle('open', this.isOpen);
        this.button.classList.toggle('active', this.isOpen);
    }

    close() {
        this.isOpen = false;
        this.menu.classList.remove('open');
        this.button.classList.remove('active');
    }
}

// ===== Main Application =====
class CallgraphApp {
    constructor() {
        this.cyManager = new CytoscapeManager('cy');
        this.tooltipManager = new TooltipManager();
        this.statsManager = new StatisticsManager();
        this.legendManager = new LegendManager('legendItems');
        this.menuManager = new MenuManager('menuButton', 'hamburgerMenu');

        this.vscode = null;
        try {
            this.vscode = acquireVsCodeApi();
        } catch (e) {
            console.log('Running outside VS Code context');
        }

        this.init();
    }

    init() {
        this.legendManager.render();
        this.setupEventListeners();
        this.setupVSCodeMessageHandler();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Search functionality
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('searchInput');

        searchButton.addEventListener('click', () => {
            this.cyManager.searchNodes(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.cyManager.searchNodes(searchInput.value);
            }
        });

        // Layout dropdown
        const layoutDropdown = document.getElementById('layoutDropdown');
        layoutDropdown.addEventListener('change', () => {
            this.cyManager.applyLayout(layoutDropdown.value);
        });

        // Node hover tooltip
        this.cyManager.cy.on('mouseover', 'node', (event) => {
            const node = event.target;
            const position = node.renderedPosition();
            this.tooltipManager.show(node, position);
        });

        this.cyManager.cy.on('mouseout', 'node', () => {
            if (!this.tooltipManager.visible) {
                this.tooltipManager.hide();
            }
        });

        // Node click
        this.cyManager.cy.on('click', 'node', (event) => {
            const reachabilityCheckbox = document.getElementById('reachabilityCheckbox');
            this.cyManager.handleNodeClick(event.target, reachabilityCheckbox.checked);
        });

        // Right-click reset
        this.cyManager.cy.on('cxttap', () => {
            const reachabilityCheckbox = document.getElementById('reachabilityCheckbox');
            const layoutDropdown = document.getElementById('layoutDropdown');

            reachabilityCheckbox.checked = true;
            layoutDropdown.selectedIndex = 0;

            this.cyManager.resetView();
        });
    }

    setupVSCodeMessageHandler() {
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.command === 'updateCallgraph' || message.command === 'showCallgraph') {
                const callgraphData = JSON.parse(message.data);
                const isFullRefresh = message.command === 'showCallgraph';
                const nodeCount = this.cyManager.updateFromCallgraphData(callgraphData, isFullRefresh);
                document.getElementById('nodeCount').textContent = nodeCount;
            }
        });
    }

    loadInitialData() {
        fetch('/getCallgraphData')
            .then(response => response.json())
            .then(callgraphData => {
                console.log('Loaded callgraph data:', callgraphData);
                this.cyManager.loadInitialData(callgraphData);
                this.statsManager.update(callgraphData);
            })
            .catch(error => {
                console.error('Error fetching callgraph data:', error);
            });
    }
}

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', () => {
    window.callgraphApp = new CallgraphApp();
});
