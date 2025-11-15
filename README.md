# Sparkline Vue

A Vue.js component library for creating sparkline charts, rewritten from the popular jQuery Sparkline library v2.1.2. This library provides lightweight, inline charts perfect for dashboards and data visualization.


<div>
  <img src="https://github.com/iclaxton/sparkline-vue/blob/main/docs/sparkline-vue-demo.gif?raw=true)" alt="Sparkline Vue Demo" style="display: block; max-width: 100%; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
</div>

## Interactive Demos
<a href="https://iclaxton.github.io/sparkline-vue/" target="_blank">https://iclaxton.github.io/sparkline-vue/</a>     

## Features

- 🎯 **7 Chart Types**: Line, Bar, Tristate, Discrete, Bullet, Pie, and Box plots
- ⚡ **High Performance**: Canvas-based rendering for smooth performance
- 🎨 **Highly Customizable**: Extensive configuration options
- 📱 **Responsive**: Automatic sizing and responsive design
- 🚀 **Vue 3 Compatible**: Built for Vue 3 Composition API
- 📦 **Zero Dependencies**: No jQuery required
- 🎭 **TypeScript Ready**: Full TypeScript support with declaration files

## Installation

```bash
npm install sparkline-vue
# or
yarn add sparkline-vue
# or
pnpm add sparkline-vue
```

## Basic Usage

```vue
<template>
  <div>
    <!-- Line chart -->
    <Sparkline 
      :data="[1, 4, 6, 6, 8, 5, 3, 5]" 
      type="line" 
      :width="100" 
      :height="30" 
    />
    
    <!-- Bar chart -->
    <Sparkline 
      :data="[1, 4, 6, 6, 8, 5, 3, 5]" 
      type="bar" 
      :width="100" 
      :height="30"
      :options="{ barColor: '#3366cc' }"
    />
  </div>
</template>

<script>
import Sparkline from 'sparkline-vue';

export default {
  components: {
    Sparkline
  }
}
</script>
```

## Component Usage Notes

The component is registered as `Sparkline` (PascalCase). In Vue templates, you can use either:
- `<Sparkline>` (PascalCase - recommended for SFC templates)
- `<sparkline>` (kebab-case - required for in-DOM templates)

Both are equivalent, but PascalCase is recommended when using Single File Components (.vue files).

## Chart Types

### Line Chart
Perfect for showing trends over time.

```vue
<Sparkline 
  :data="[1, 4, 6, 6, 8, 5, 3, 5]" 
  type="line"
  :options="{
    lineColor: '#00f',
    fillColor: '#cdf',
    spotColor: '#f80',
    spotRadius: 2
  }"
/>
```

#### Multi-Series Line Charts
Compare multiple data series on the same chart.

```vue
<Sparkline 
  :data="[
    [10, 15, 20, 18, 25, 30, 28],  // Series 1
    [15, 18, 22, 20, 26, 28, 30],  // Series 2
    [12, 17, 21, 19, 24, 29, 27]   // Series 3
  ]"
  type="line"
  :width="300"
  :height="100"
  :options="{
    seriesNames: ['Sales', 'Target', 'Forecast'],
    lineColor: ['#0066cc', '#ff6600', '#00cc66'],
    fillColor: ['rgba(0,102,204,0.15)', 'rgba(255,102,0,0.15)', 'rgba(0,204,102,0.15)'],
    lineWidth: [2, 2, 2],
    spotRadius: 0  // Hide spots for cleaner multi-series view
  }"
/>
```

**Features:**
- Automatic high-contrast color palette when colors not specified
- Tooltips show all series values at cursor position
- Supports per-series customization (colors, widths, spot radii)
- Series names displayed in tooltips
- Maintains full interactivity (hover, click events)

### Bar Chart
Great for comparing discrete values.

```vue
<Sparkline 
  :data="[1, 4, 6, -2, 8, 5, -3, 5]" 
  type="bar"
  :options="{
    barColor: '#3366cc',
    negBarColor: '#f44',
    barWidth: 4,
    barSpacing: 1
  }"
/>
```

### Tristate Chart
Shows win/lose/draw states.

```vue
<Sparkline 
  :data="[1, -1, 0, 1, 1, 0, -1]" 
  type="tristate"
  :options="{
    posBarColor: '#6f6',
    negBarColor: '#f44',
    zeroBarColor: '#999',
    stateLabels: { positive: 'Win', zero: 'Draw', negative: 'Loss' }
  }"
/>
```

**Custom State Labels Example:**
```vue
<!-- Use custom labels for different contexts -->
<Sparkline 
  :data="[1, -1, 0, 1, 1]" 
  type="tristate"
  :options="{
    stateLabels: { positive: 'Up', zero: 'Flat', negative: 'Down' }
  }"
/>
```

### Discrete Chart
Vertical lines at different heights.

```vue
<Sparkline 
  :data="[1, 3, 4, 5, 5, 3, 4, 5]" 
  type="discrete"
  :options="{
    lineColor: '#00f',
    thresholdColor: '#f00',
    thresholdValue: 3
  }"
/>
```

### Bullet Chart
Performance vs target visualization.

```vue
<Sparkline 
  :data="[10, 12, 12, 9, 7]" 
  type="bullet"
  :options="{
    targetColor: '#f33',
    performanceColor: '#33f',
    rangeColors: ['#d3dafe', '#a8b6ff', '#7f94ff']
  }"
/>
```

### Pie Chart
Simple proportional visualization.

```vue
<Sparkline 
  :data="[1, 1, 2]" 
  type="pie"
  :options="{
    sliceColors: ['#3366cc', '#dc3912', '#ff9900'],
    borderWidth: 1
  }"
/>
```

### Box Plot
Statistical data distribution.

```vue
<Sparkline 
  :data="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]" 
  type="box"
  :options="{
    boxLineColor: '#000',
    boxFillColor: '#cdf',
    whiskerColor: '#000'
  }"
/>
```

## Configuration Options

### Common Options
All chart types support these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | Number | 100 | Chart width in pixels |
| `height` | Number | 30 | Chart height in pixels |
| `lineColor` | String | '#00f' | Primary line/border color |
| `fillColor` | String | '#cdf' | Fill color |
| `disableTooltips` | Boolean | false | Disable all tooltips |
| `showTooltipTitle` | Boolean | true | Show title in multi-value tooltips |
| `tooltipPrefix` | String | '' | Text to prepend to tooltip values |
| `tooltipSuffix` | String | '' | Text to append to tooltip values |

### Line Chart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `spotColor` | String | '#f80' | Color of end spots |
| `spotRadius` | Number | 1.5 | Radius of spots |
| `lineWidth` | Number | 1 | Width of the line |
| `minSpotColor` | String | '#f80' | Color of minimum value spot |
| `maxSpotColor` | String | '#f80' | Color of maximum value spot |
| `normalRangeMin` | Number | undefined | Lower bound of normal range |
| `normalRangeMax` | Number | undefined | Upper bound of normal range |
| `normalRangeColor` | String | '#ccc' | Color of normal range |
| `dataLabels` | Array<string> | undefined | Labels for each data point (e.g., ['Jan', 'Feb', 'Mar']) |
| `getPointDataLabel` | Function | undefined | Callback function to generate labels: `(index) => string` |
| `seriesNames` | Array<string> | undefined | Names for each series in multi-series charts |

### Bar Chart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `barColor` | String | '#3366cc' | Color for positive bars |
| `negBarColor` | String | '#f44' | Color for negative bars |
| `zeroColor` | String | undefined | Color for zero values |
| `barWidth` | Number | 4 | Width of each bar |
| `barSpacing` | Number | 1 | Space between bars |
| `zeroAxis` | Boolean | true | Whether to center around zero |
| `dataLabels` | Array<string> | undefined | Labels for each data point (e.g., ['Q1', 'Q2', 'Q3']) |
| `getPointDataLabel` | Function | undefined | Callback function to generate labels: `(index) => string` |
| `seriesNames` | Array<string> | undefined | Names for each segment in stacked bar charts |

### Tristate Chart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `posBarColor` | String | '#6f6' | Color for positive values |
| `negBarColor` | String | '#f44' | Color for negative values |
| `zeroBarColor` | String | '#999' | Color for zero values |
| `stateLabels` | Object | `{ positive: 'Win', zero: 'Draw', negative: 'Loss' }` | Custom labels for the three states |
| `barWidth` | Number | 4 | Width of each bar |
| `barSpacing` | Number | 1 | Space between bars |
| `dataLabels` | Array<string> | undefined | Labels for each data point (e.g., ['Game 1', 'Game 2']) |
| `getPointDataLabel` | Function | undefined | Callback function to generate labels: `(index) => string` |

### Discrete Chart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lineColor` | String | '#00f' | Default line color |
| `lineHeight` | Number | 'auto' | Height of lines |
| `thresholdColor` | String | undefined | Color for values above threshold |
| `thresholdValue` | Number | 0 | Threshold value |
| `dataLabels` | Array<string> | undefined | Labels for each data point (e.g., ['Mon', 'Tue', 'Wed']) |
| `getPointDataLabel` | Function | undefined | Callback function to generate labels: `(index) => string` |

### Pie Chart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sliceColors` | Array<string> | ['#3366cc', '#dc3912', ...] | Colors for pie slices |
| `borderWidth` | Number | 0 | Width of slice borders |
| `borderColor` | String | '#000' | Color of slice borders |
| `offset` | Number | 0 | Angle offset in degrees |
| `dataLabels` | Array<string> | undefined | Labels for each slice (e.g., ['Category A', 'Category B']) |
| `getPointDataLabel` | Function | undefined | Callback function to generate labels: `(index) => string` |
| `glowIntensity` | Number | 5 | Intensity of highlight glow effect (0 to disable) |

### Bullet Chart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetColor` | String | '#f33' | Color of target marker |
| `performanceColor` | String | '#33f' | Color of performance bar |
| `rangeColors` | Array<string> | ['#d3dafe', '#a8b6ff', '#7f94ff'] | Colors for range bands |
| `targetWidth` | Number | 3 | Width of target line |

### Box Plot Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `boxLineColor` | String | '#000' | Color of box outline |
| `boxFillColor` | String | '#cdf' | Fill color of box |
| `whiskerColor` | String | '#000' | Color of whiskers |
| `outlierLineColor` | String | '#333' | Color of outlier markers |
| `outlierFillColor` | String | '#fff' | Fill color of outlier markers |
| `medianColor` | String | '#f00' | Color of median line |
| `showOutliers` | Boolean | true | Whether to show outliers |
| `target` | Number | undefined | Target value to display |
| `targetColor` | String | '#4a2' | Color of target marker |

## Advanced Usage

### X-Y Coordinate Data
You can provide coordinate pairs for line charts:

```vue
<Sparkline 
  :data="[[1,1], [2.7,4], [3.4,6], [5,6]]" 
  type="line"
/>
```

### Multi-Series Line Charts

Display multiple data series on a single line chart. Perfect for comparing trends, showing actual vs. target, or multi-region analysis.

**Basic Multi-Series:**
```vue
<template>
  <Sparkline 
    :data="multiSeriesData"
    type="line"
    :width="300"
    :height="100"
    :options="multiSeriesOptions"
  />
</template>

<script setup>
import { ref } from 'vue'

const multiSeriesData = ref([
  [10, 15, 20, 18, 25, 30, 28],    // Actual sales
  [15, 18, 22, 20, 26, 28, 30]     // Target sales
])

const multiSeriesOptions = {
  seriesNames: ['Actual', 'Target'],
  // Colors auto-assigned if not specified (high-contrast palette)
  lineColor: ['#0066cc', '#ff6600'],
  fillColor: ['rgba(0,102,204,0.15)', 'rgba(255,102,0,0.15)'],
  lineWidth: [2, 2],
  spotRadius: 0  // Optional: hide spots for cleaner look
}
</script>
```

**Auto Colors:**
```vue
<!-- Uses default high-contrast palette automatically -->
<Sparkline 
  :data="[[1,2,3], [4,5,6], [7,8,9]]"
  type="line"
  :options="{ seriesNames: ['A', 'B', 'C'] }"
/>
```

**Per-Series Customization:**
```vue
<Sparkline 
  :data="[series1, series2, series3]"
  type="line"
  :options="{
    seriesNames: ['North', 'South', 'West'],
    lineColor: ['#e74c3c', '#3498db', '#2ecc71'],  // Red, Blue, Green
    lineWidth: [3, 2, 1],                           // Emphasize first series
    spotRadius: [2, 0, 0]                           // Spots only on first series
  }"
/>
```

**Features:**
- Automatic color assignment with 8 high-contrast colors
- Tooltips show all series values at hover position
- Single vertical line highlights all series simultaneously
- Full support for null values and gaps
- Maintains chart range across all series
- Per-series customization for colors, widths, and spots

### Null Values
Null values create gaps in line charts or are omitted in bar charts:

```vue
<Sparkline 
  :data="[1, 4, 6, null, null, 5, 3, 5]" 
  type="line"
/>
```

### Dynamic Updates
The component automatically redraws when data changes:

```vue
<template>
  <Sparkline :data="dynamicData" type="line" />
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const dynamicData = ref([1, 2, 3, 4, 5]);
    
    onMounted(() => {
      setInterval(() => {
        dynamicData.value = Array.from(
          { length: 10 }, 
          () => Math.random() * 100
        );
      }, 1000);
    });
    
    return { dynamicData };
  }
}
</script>
```

## Migration from jQuery Sparkline

If you're migrating from the original jQuery Sparkline library:

1. Replace `$(selector).sparkline(data, options)` with `<Sparkline :data="data" :options="options" />`
2. Move chart type from options to the `type` prop
3. Move width/height from options to props
4. The rest of the options remain largely the same

### jQuery (Old)
```javascript
$('.sparkline').sparkline([1,4,6,6,8,5,3,5], {
  type: 'line',
  width: 100,
  height: 30,
  lineColor: '#00f',
  fillColor: '#cdf'
});
```

### Vue (New)
```vue
<Sparkline 
  :data="[1,4,6,6,8,5,3,5]"
  type="line"
  :width="100"
  :height="30"
  :options="{
    lineColor: '#00f',
    fillColor: '#cdf'
  }"
/>
```

## Advanced Usage

### Programmatic Control

Access chart methods for advanced control:

```vue
<template>
  <Sparkline 
    ref="chartRef"
    :data="chartData" 
    type="line"
  />
  <button @click="refreshChart">Refresh</button>
</template>

<script setup>
import { ref } from 'vue'
import Sparkline from 'sparkline-vue'

const chartRef = ref(null)
const chartData = ref([1, 2, 3, 4, 5])

const refreshChart = () => {
  chartRef.value?.refresh()
}

// Access chart instance
const getChartDetails = () => {
  const instance = chartRef.value?.getChartInstance()
  console.log('Chart instance:', instance)
}
</script>
```

### Tooltip Customization

Control tooltip appearance and content:

```vue
<template>
  <!-- Disable title in tooltips -->
  <Sparkline 
    :data="multiSeriesData"
    type="line"
    :options="{
      showTooltipTitle: false,  // Hide title
      tooltipPrefix: '$',
      tooltipSuffix: ' USD'
    }"
  />
  
  <!-- Custom tooltip formatting -->
  <Sparkline 
    :data="[1, 2, 3, 4, 5]"
    type="bar"
    :options="{
      tooltipPrefix: 'Value: ',
      tooltipSuffix: ' units',
      tooltipFormat: '{{value.2}}'  // 2 decimal places
    }"
  />
</template>
```

**Tooltip Options:**
- `showTooltipTitle`: Show/hide title in multi-value tooltips (default: true)
- `disableTooltips`: Completely disable tooltips (default: false)
- `tooltipPrefix`: Text to prepend to values
- `tooltipSuffix`: Text to append to values
- `tooltipFormat`: Template string for formatting (e.g., `'{{value.2}}'` for 2 decimals)

### Event Handling

Listen to chart interactions:

```vue
<Sparkline 
  :data="[1,2,3,4,5]"
  type="line"
  @click="handleClick"
  @region-change="handleRegionChange"
/>

<script setup>
const handleClick = (detail) => {
  console.log('Clicked region:', detail.region)
  console.log('Value:', detail.value)
}

const handleRegionChange = (detail) => {
  console.log('Region changed:', detail.region)
  console.log('Previous region:', detail.previousRegion)
}
</script>
```

## Performance Optimization

### Use Optimized Mode for Many Charts

When displaying many charts (50+), enable optimized mode:

```vue
<Sparkline 
  :data="data"
  :optimized="true"
/>
```

Benefits:
- **Object Pooling**: Reuses chart instances
- **Shared Tooltips**: One tooltip for all charts
- **Cached Defaults**: Reduces memory allocations
- **~50% faster** rendering with large datasets

### Performance Tips

1. **Batch Updates**: Update data in batches rather than individual points
2. **Debounce Rapid Changes**: Use `debounce` for frequently updating data
3. **Appropriate Dimensions**: Smaller charts render faster
4. **Disable Tooltips**: Set `disableTooltips: true` if not needed
5. **Live Data**: Tooltips are automatically preserved during data updates for smooth UX

```vue
<script setup>
import { ref } from 'vue'
import { debounce } from 'lodash-es'

const chartData = ref([])

// Debounce rapid updates
const updateData = debounce((newData) => {
  chartData.value = newData
}, 100)
</script>
```

## Accessibility

The component includes built-in accessibility features:

- **ARIA role**: Canvas has `role="img"`
- **ARIA label**: Descriptive label with chart type and data point count
- **Keyboard navigation**: Accessible through standard tab navigation
- **Screen reader friendly**: Provides context about chart content

### Enhancing Accessibility

Provide additional context when needed:

```vue
<div role="region" aria-label="Sales performance chart">
  <h3 id="chart-title">Monthly Sales</h3>
  <Sparkline 
    :data="salesData"
    type="line"
    aria-describedby="chart-title"
  />
  <p class="sr-only">
    Sales trend showing {{ salesData.length }} months of data
  </p>
</div>
```

## Common Pitfalls

### 1. Forgetting Required Props

The component includes helpful validation that will warn you in development mode.

❌ **Wrong**:
```vue
<Sparkline type="line" />
<!-- Console warning: [Sparkline] data prop is required -->
```

✅ **Correct**:
```vue
<Sparkline :data="[1,2,3,4,5]" type="line" />
```

### 2. Passing Non-Numeric Data

❌ **Wrong**:
```vue
<Sparkline :data="['1', '2', '3']" />
<!-- Console warning: [Sparkline] data must be an array -->
```

✅ **Correct**:
```vue
<Sparkline :data="[1, 2, 3]" />
```

### 3. Mutating Props Directly

❌ **Wrong**:
```vue
<script setup>
const data = [1, 2, 3]
data.push(4) // Mutates directly
</script>
```

✅ **Correct**:
```vue
<script setup>
import { ref } from 'vue'

const data = ref([1, 2, 3])
data.value = [...data.value, 4] // Create new array
</script>
```

### 4. Not Handling Empty Data

✅ **Best Practice**:
```vue
<template>
  <div v-if="chartData.length > 0">
    <Sparkline :data="chartData" />
  </div>
  <div v-else>
    No data available
  </div>
</template>
```

### 5. Incorrect Dimensions

❌ **Wrong**:
```vue
<Sparkline :data="data" width="200px" height="50px" />
<!-- Console warning: [Sparkline] width must be a positive number -->
```

✅ **Correct**:
```vue
<Sparkline :data="data" :width="200" :height="50" />
```

## Server-Side Rendering (SSR)

The component is SSR-compatible (Nuxt, VitePress, etc.):

```vue
<!-- Works in Nuxt without client-only wrapper -->
<Sparkline :data="[1,2,3,4,5]" type="line" />
```

The component automatically detects server environment and skips canvas operations during SSR.

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { ref } from 'vue'
import Sparkline, { type SparklineProps } from 'sparkline-vue'

const props: SparklineProps = {
  data: [1, 2, 3, 4, 5],
  type: 'line',
  width: 200,
  height: 50,
  options: {
    lineColor: '#00f',
    fillColor: '#cdf'
  }
}
```

## Testing

The package includes comprehensive tests. To run them:

```bash
npm install
npm test
```

### Testing Your Implementation

```typescript
import { mount } from '@vue/test-utils'
import Sparkline from 'sparkline-vue'

describe('My Sparkline Usage', () => {
  it('renders correctly', () => {
    const wrapper = mount(Sparkline, {
      props: {
        data: [1, 2, 3, 4, 5],
        type: 'line'
      }
    })
    
    expect(wrapper.find('canvas').exists()).toBe(true)
  })
})
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Charts Not Rendering

1. **Check browser console** for error messages
2. **Verify data format** is an array of numbers
3. **Ensure dimensions** are positive numbers
4. **Check canvas support** in your browser

### Performance Issues

1. **Enable optimized mode** for many charts
2. **Reduce data points** if possible
3. **Use appropriate chart dimensions**
4. **Disable tooltips** if not needed

### TypeScript Errors

1. **Update type definitions**: `npm install sparkline-vue@latest`
2. **Check prop types** match the interface
3. **Import types**: `import type { SparklineProps } from 'sparkline-vue'`

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## Examples & Development

### Quick Start with Examples

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Visit:** http://localhost:5175/

### Available Examples

Check out the `/docs` directory for comprehensive demos:

- 🏠 **Landing Page** - Overview with navigation between all examples
- 📊 **Complete Demo** - All 7 chart types with interactive features
- 🚀 **Simple Demo** - Basic implementations using Vue 3 from CDN
- 💬 **Tooltip Demo** - Advanced tooltip formatting examples
- ⚡ **Vite Demo** - Modern Vue SPA with ES modules

### Building the Library

```bash
npm run build
```

This creates distributable files in the `dist/` directory.

## License

This project is licensed under the BSD-3-Clause License - the same license as the original jQuery Sparkline library.

## Credits

This library is a Vue.js rewrite of the excellent [jQuery Sparkline](http://omnipotent.net/jquery.sparkline/) library v2.1.2 by Gareth Watts (Splunk, Inc.). All chart rendering logic and algorithms are ported from the original implementation.
