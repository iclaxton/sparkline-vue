# Sparkline Vue Documentation & Examples

This directory contains interactive examples and documentation for the Sparkline Vue library.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser to:** https://iclaxton.github.io/sparkline-vue/docs/

## Available Examples

### 🏠 [Landing Page](https://iclaxton.github.io/sparkline-vue/docs/)
Overview of all available examples with navigation between all demos.

### � [Basic Examples](https://iclaxton.github.io/sparkline-vue/docs/basic/)
Simple, beginner-friendly examples:
- Line Charts (basic, with colors)
- Bar Charts (positive/negative values)  
- Basic configuration options
- Easy-to-understand code patterns

### ⚡ [Advanced Examples](https://iclaxton.github.io/sparkline-vue/docs/advanced/)
Advanced interactive features:
- Real-time data streaming
- Interactive click events
- Custom tooltip formatting
- Dynamic theming
- Complex chart configurations

### 🎯 [Comprehensive Demo](https://iclaxton.github.io/sparkline-vue/docs/comprehensive/)
Complete showcase of all features:
- All 7 chart types demonstrated
- Color-coded tooltips with indicators
- Multi-value displays
- Enhanced user interactions
- Production-ready examples

### 🎮 [Interactive Demo](https://iclaxton.github.io/sparkline-vue/docs/interactive/)
Visual Studio-style properties panel:
- Real-time chart customization
- Live property editing interface
- All chart type options available
- Visual Studio-inspired UI design

### 📊 [Performance Demo](https://iclaxton.github.io/sparkline-vue/docs/performance/)
Performance optimization showcase:
- Object pooling system demonstration
- Memory usage comparison
- Large dataset handling
- Performance metrics display

### 🔧 [Vue SPA Demo](https://iclaxton.github.io/sparkline-vue/docs/vue-app/)
Modern Vue.js single-page application:
- Vue 3 Composition API usage
- Component architecture patterns
- State management examples
- Modern development practices

### 💬 [Tooltip Testing](https://iclaxton.github.io/sparkline-vue/docs/tooltip-test.html)
Advanced tooltip formatting examples:
- Template-based formatting
- Custom formatter functions  
- Multiple tooltip styles
- Rich content examples

## Development

- **Start dev server:** `npm run dev`
- **Build library:** `npm run build`
- **Build documentation:** `npm run build:docs`
- **Preview build:** `npm run preview`

## Implementation Notes

The examples import the Sparkline Vue library from the parent directory using relative imports:

```javascript
import Sparkline from '../index.js'
import { createChart } from '../renderers/chartFactory.js'
```

For production use, install the library via npm:

```bash
npm install sparkline-vue
```

```javascript
import Sparkline from 'sparkline-vue'
```
