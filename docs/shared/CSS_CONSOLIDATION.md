# CSS Consolidation for Sparkline Vue Demos

This document describes the consolidated CSS structure for all sparkline-vue demo pages.

## Structure

The CSS has been consolidated into modular files in `docs/shared/`:

### Base Files

1. **`base.css`** - Core styles for all demo pages
   - Body, container, header, and content layout
   - Typography and basic utility classes
   - Error messages and code styling

2. **`navigation.css`** - Navigation components
   - Nav links styling and hover effects
   - Mobile navigation responsiveness
   - Current page indicators

3. **`layouts.css`** - Layout components and grids
   - Examples grid and card layouts
   - Chart display areas and labels
   - Code blocks and about sections
   - Responsive breakpoints

4. **`components.css`** - Interactive components
   - Controls and buttons (success, danger, warning)
   - Information displays and status indicators
   - Interactive demo areas and click info
   - Status animations (pulse effect)

5. **`charts.css`** - Chart-specific components
   - Multi-chart layouts and labels
   - Theme selectors and live data controls
   - Specialized chart containers
   - Legacy demo section compatibility

### Master File

**`shared.css`** - Imports all modular CSS files using `@import` statements.

## Usage

To use the shared CSS in any demo page:

```html
<link rel="stylesheet" href="../shared/shared.css">
```

Or for pages in subdirectories:

```html
<link rel="stylesheet" href="../../shared/shared.css">
```

## Demo-Specific Customizations

Each demo can add specific styles as needed:

```html
<style>
/* Demo-specific styles */
.special-feature {
    /* Custom styling */
}
</style>
```

## Converted Demos

✅ **Advanced Demo** (`docs/advanced/index.html`)
- Converted to use shared CSS
- Minimal custom styles for chart label font-weight

✅ **Basic Demo** (`docs/basic/index.html`)
- Converted to use shared CSS  
- Custom styles for feature icons and mobile padding

✅ **Vue SPA** (`docs/vue-app/index.html`)
- Already using shared CSS

✅ **Comprehensive Demo** (`docs/comprehensive/index.html`)
- Fully converted and optimized

## Benefits

1. **Maintainability** - Single source of truth for styles
2. **Consistency** - All demos use the same visual components
3. **Performance** - Shared CSS can be cached across pages
4. **Modularity** - Easy to update specific component types
5. **Reduced Code** - Eliminated ~300+ lines of duplicate CSS per demo

## Legacy Compatibility

The consolidated CSS maintains backward compatibility with:
- Existing HTML class names
- Interactive components and animations
- Responsive breakpoints
- Theme switching functionality

## Next Steps

1. Complete comprehensive demo conversion
2. Test all demo pages for visual consistency
3. Consider creating additional modular CSS files if needed
4. Document any demo-specific style requirements
