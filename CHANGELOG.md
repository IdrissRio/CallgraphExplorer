# Changelog

All notable changes to the "CAT: Callgraph Analysis Tool" extension will be documented in this file.

## [0.1.0] - 2025-12-22

### Added
- **Futuristic UI Overhaul**: Complete redesign with dark theme, glow effects, and glass-morphism styling
- **Forward/Backward Callgraph**: Toggle between forward (what does this call?) and backward (what calls this?) views
- **Granularity Levels**: View callgraph at 4 levels - Method, Class, File, or Package
- **Comprehensive Statistics**: 16 metrics across 4 categories:
  - Program Structure: packages, files, classes, methods
  - Graph Metrics: nodes, edges, entry points, leaf nodes
  - Connectivity: SCCs, max SCC size, average degree, density
  - Degree Distribution: max in/out degree, root nodes, circular nodes
- **Interactive Minimap**: Overview panel showing current viewport position
- **Search Functionality**: Search for nodes by name with keyboard shortcut (⌘F)
- **Multiple Layout Options**: Force, Radial, Tree, Circle, Grid, and Cola layouts
- **Click Modes**: Reachability highlighting and SCC (Strongly Connected Components) mode
- **Export to PNG**: Download callgraph as image
- **Keyboard Shortcuts**: Various shortcuts for common actions
- **Experimental RAG Filters**: Hidden toggle for RAG-related node types (Synthesized, Inherited, Collection)

### Changed
- Separated CSS and JavaScript into dedicated files
- CAT now loaded as git submodule instead of bundled JAR
- Improved tooltip behavior with delayed hide

### Fixed
- Tooltip no longer disappears before clicking
- Minimap now properly shows graph preview

## [0.0.2] - 2024-XX-XX

### Added
- Initial release with basic callgraph visualization
- CodeLens integration for Java methods
- Entry point-based callgraph generation

## [0.0.1] - 2024-XX-XX

### Added
- Project initialization
