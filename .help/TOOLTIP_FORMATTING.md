# 🎯 Tooltip Formatting Guide

## Overview
Your Vue Sparkline library supports multiple ways to customize tooltip content and formatting.

## 📋 **Formatting Options**

### **1. Simple Prefix/Suffix**
The easiest way to add context to your tooltips:

```vue
<spark-line 
  :data="[10, 20, 30]"
  :options="{
    tooltipPrefix: 'Sales: $',
    tooltipSuffix: 'K'
  }"
/>
<!-- Result: "Sales: $20K" -->
```

### **2. Template String Formatting**
Use `{{variable}}` syntax for dynamic content:

```vue
<spark-line 
  :data="[10, 20, 30]"
  :options="{
    tooltipFormat: 'Day {{point}}: ${{value.2}}'
  }"
/>
<!-- Result: "Day 2: $20.00" -->
```

#### Available Template Variables:
- `{{value}}` - The data point value
- `{{value.2}}` - Value with 2 decimal places (specify any number)
- `{{index}}` - Zero-based index of the data point
- `{{x}}` - X-coordinate value (for line charts)
- `{{y}}` - Y-coordinate value

#### Chart-Specific Variables:

**Line Charts:**
- `{{point}}` - One-based point number (index + 1)
- `{{total}}` - Total number of data points
- `{{x}}` - X-axis value
- `{{y}}` - Y-axis value

**Bar Charts:**
- `{{bar}}` - Bar number (1-based)
- `{{total}}` - Total number of data points
- `{{isPositive}}` - true if value > 0
- `{{isNegative}}` - true if value < 0
- `{{isZero}}` - true if value === 0

### **3. Custom Formatter Functions**
For complex formatting logic:

```vue
<template>
  <spark-line 
    :data="[100, 115, 108, 125]"
    :options="{ tooltipFormatter: customFormatter }"
  />
</template>

<script>
export default {
  methods: {
    customFormatter(value, region, chart) {
      // value: current data point value
      // region: index of the data point
      // chart: reference to chart instance
      
      const prevValue = region > 0 ? chart.values[region - 1] : value;
      const change = region > 0 ? ((value - prevValue) / prevValue * 100) : 0;
      const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️';
      
      return `$${value}K ${arrow} ${Math.abs(change).toFixed(1)}%`;
    }
  }
}
</script>
```

#### Min/Max Value Detection (Line Charts Only)
For **line charts** with `minSpotColor` and/or `maxSpotColor` options, the tooltip formatter receives additional min/max context:

```javascript
tooltipFormatter: (value, region, chart, extra) => {
  // Check if this data point is the minimum or maximum value
  if (extra && extra.isMin) {
    return `[MIN] $${value}K - Lowest point`;
  }
  if (extra && extra.isMax) {
    return `[MAX] $${value}K - Highest point`;
  }
  
  // Regular formatting for other points
  return `$${value}K`;
}
```

**Available Min/Max Properties (4th parameter `extra`):**
- `extra.isMin` - `true` if this is the minimum value in the dataset
- `extra.isMax` - `true` if this is the maximum value in the dataset
- `extra.minValue` - The actual minimum value in the dataset
- `extra.maxValue` - The actual maximum value in the dataset

**Requirements:**
- Only works with **line charts**
- Requires `minSpotColor` and/or `maxSpotColor` options to be defined
- Min/max detection only applies when spots are configured to be highlighted

**Example with required options:**
```vue
<Sparkline 
  type="line"
  :data="[10, 25, 15, 30, 20]"
  :options="{
    minSpotColor: '#ff4444',
    maxSpotColor: '#44ff44',
    tooltipFormatter: myMinMaxFormatter
  }"
/>
```

## 📊 **Feature Support Status**

### ✅ **Fully Supported**
- ✅ Basic prefix/suffix formatting (`tooltipPrefix`, `tooltipSuffix`)
- ✅ Custom formatter functions (`tooltipFormatter`)
- ✅ Template string formatting (`tooltipFormat`) with basic variables
- ✅ Line chart template variables (`{{point}}`, `{{total}}`, `{{x}}`, `{{y}}`)
- ✅ Bar chart template variables (`{{bar}}`, `{{isPositive}}`, `{{isNegative}}`, `{{isZero}}`)
- ✅ Min/Max detection for line charts (with spot colors)
- ✅ Color-coded tooltips with visual indicators
- ✅ Multi-value tooltips for complex chart types
- ✅ Security sanitization (prevents XSS attacks)

### 🚧 **Planned Features**
- 🚧 Template variables for Tristate charts (win/loss/draw states)
- 🚧 Template variables for Pie charts (percentages, slice data)
- 🚧 Template variables for Bullet charts (target vs actual)
- 🚧 Template variables for Box Plot charts (quartile data)
- 🚧 Min/Max detection for non-line chart types

**Current Implementation Coverage: ~85-90% of documented features**

## 🎨 **Real-World Examples**

### **Financial Data**
```javascript
// Stock price with change indicator
tooltipFormatter: (value, region, chart) => {
  const prev = region > 0 ? chart.values[region - 1] : value;
  const change = value - prev;
  const sign = change >= 0 ? '+' : '';
  return `$${value.toFixed(2)} (${sign}${change.toFixed(2)})`;
}
```

### **Percentage Data**
```javascript
// Template with percentage formatting
tooltipFormat: 'Progress: {{value}}% ({{point}}/{{total}})'
```

### **Time Series**
```javascript
// Custom date formatting
tooltipFormatter: (value, region, chart) => {
  const date = new Date(2024, 0, region + 1);
  return `${date.toLocaleDateString()}: ${value}`;
}
```

### **Rating System**
```javascript
// Star ratings
tooltipFormatter: (value, region, chart) => {
  const stars = '★'.repeat(Math.floor(value)) + '☆'.repeat(5 - Math.floor(value));
  return `${stars} ${value.toFixed(1)}/5.0`;
}
```

### **Scientific Data**
```javascript
// Scientific notation with units
tooltipFormatter: (value, region, chart) => {
  return `${value.toExponential(2)} molecules/cm³`;
}
```

### **Min/Max Highlighting**
```javascript
// Highlight extreme values with custom styling (Line Charts only)
tooltipFormatter: (value, region, chart, extra) => {
  let prefix = '';
  if (extra && extra.isMin) prefix = '🔻 [MIN] ';
  else if (extra && extra.isMax) prefix = '🔺 [MAX] ';
  
  const change = region > 0 ? value - chart.values[region - 1] : 0;
  const arrow = change > 0 ? '↗' : change < 0 ? '↘' : '→';
  
  return `${prefix}$${value.toFixed(2)} ${arrow}`;
}
```

**Required:** Line chart with `minSpotColor` and/or `maxSpotColor` options defined.

## 🚀 **Usage Examples**

### **Basic Implementation**
```vue
<template>
  <spark-line 
    :data="salesData" 
    type="line"
    :options="tooltipOptions"
  />
</template>

<script>
export default {
  data() {
    return {
      salesData: [100, 120, 110, 140, 135],
      tooltipOptions: {
        tooltipPrefix: 'Revenue: $',
        tooltipSuffix: 'K',
        // OR use template:
        // tooltipFormat: 'Month {{point}}: ${{value}}K'
        // OR use custom function:
        // tooltipFormatter: this.customTooltip
      }
    }
  },
  methods: {
    customTooltip(value, region, chart) {
      return `Quarter ${Math.floor(region / 3) + 1}: $${value}K`;
    }
  }
}
</script>
```

## 🎯 **Priority Order**

The tooltip formatting follows this priority:

1. **tooltipFormatter** (function) - Highest priority
2. **tooltipFormat** (template string)
3. **tooltipPrefix + value + tooltipSuffix** - Default fallback

## 📊 **Testing**

To test different tooltip formats:

1. **Run the demo:** `npm run dev` and visit `http://localhost:5173/`
2. **Hover over charts** to see different formatting styles

## ⚙️ **Configuration Options**

```javascript
const options = {
  // Simple formatting
  tooltipPrefix: 'Value: ',
  tooltipSuffix: ' units',
  
  // Template formatting
  tooltipFormat: '{{point}}/{{total}}: {{value.2}}',
  
  // Custom function
  tooltipFormatter: (value, region, chart) => `Custom: ${value}`,
  
  // Disable tooltips
  disableTooltips: false,
  
  // Tooltip styling (applied automatically)
  // Tooltips use CSS class: 'sparkline-tooltip'
}
```

## 🔒 **Security**

The `tooltipFormatter` function is designed to be secure by default:

- **Input Sanitization**: All return values are automatically sanitized to prevent XSS attacks
- **String-Only Output**: HTML tags, JavaScript, and event handlers are stripped from the output
- **Length Limiting**: Tooltip content is limited to 500 characters to prevent excessive tooltips
- **Error Handling**: If your custom formatter throws an error, it falls back to the default formatting

### ✅ **Safe Usage Examples:**
```javascript
// Safe: Returns plain text strings
tooltipFormatter: (value, region, chart) => `Value: ${value}`,

// Safe: Uses standard string methods
tooltipFormatter: (value) => value.toFixed(2) + ' units',

// Safe: Includes emojis and symbols
tooltipFormatter: (value) => `⭐ ${value} stars`,
```

### ❌ **Prevented Attacks:**
```javascript
// These malicious attempts are automatically sanitized:
tooltipFormatter: () => '<script>alert("hack")</script>',    // HTML stripped
tooltipFormatter: () => 'javascript:alert("hack")',         // Protocol removed
tooltipFormatter: () => '<div onclick="hack()">Click</div>', // Events removed
```
