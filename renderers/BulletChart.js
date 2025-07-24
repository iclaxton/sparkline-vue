// BulletChart.js
// Bullet chart implementation

import { BaseChart } from './BaseChart.js';

export class BulletChart extends BaseChart {
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'bullet',
      targetColor: '#f33',
      targetWidth: 3,
      performanceColor: '#33f',
      rangeColors: ['#d3dafe', '#a8b6ff', '#7f94ff'],
      base: undefined
    };
  }

  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      targetColor, targetWidth, performanceColor, 
      rangeColors, base 
    } = this.options;

    // Bullet chart expects values in order: target, performance, range1, range2, range3...
    const target = this.values[0];
    const performance = this.values[1];
    const ranges = this.values.slice(2);

    if (target === null || performance === null) return;

    // Calculate scale
    const maxVal = Math.max(target, performance, ...ranges.filter(v => v !== null));
    const minVal = base !== undefined ? base : 0;
    const range = maxVal - minVal;

    if (range <= 0) return;

    // Draw qualitative ranges (backgrounds) as distinct segments
    // Sort ranges in descending order to draw from largest to smallest
    const sortedRanges = ranges.map((val, idx) => ({ value: val, index: idx }))
      .filter(entry => entry.value !== null)
      .sort((a, b) => b.value - a.value);
    
    sortedRanges.forEach((entry, drawIndex) => {
      if (!rangeColors[entry.index]) return;

      const rangeWidth = ((entry.value - minVal) / range) * this.width;
      ctx.fillStyle = rangeColors[entry.index];
      ctx.fillRect(0, topOffset, rangeWidth, height);
      
      // Add a subtle border to make ranges more distinguishable
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, topOffset, rangeWidth, height);
    });

    // Draw performance bar (main measure)
    const performanceWidth = ((performance - minVal) / range) * this.width;
    const barHeight = height * 0.4; // 40% of total height
    const barY = topOffset + (height - barHeight) / 2;

    ctx.fillStyle = performanceColor;
    ctx.fillRect(0, barY, performanceWidth, barHeight);

    // Draw target marker (vertical line)
    const targetX = ((target - minVal) / range) * this.width;
    const targetHeight = height * 0.8; // 80% of total height
    const targetY = topOffset + (height - targetHeight) / 2;

    ctx.fillStyle = targetColor;
    ctx.fillRect(targetX - targetWidth / 2, targetY, targetWidth, targetHeight);
  }

  // Get color for a specific region  
  getRegionColor(region) {
    if (typeof region === 'number') {
      const { targetColor, performanceColor, rangeColors } = this.options;
      
      if (region === 0) return targetColor; // Target
      if (region === 1) return performanceColor; // Performance
      if (region >= 2 && rangeColors[region - 2]) {
        return rangeColors[region - 2]; // Range colors
      }
    }
    return null;
  }

  getRegionAtPoint(x, y) {
    // For bullet charts, we can detect hover over different components
    if (this.values.length < 2) return null;
    
    const target = this.values[0];
    const performance = this.values[1];
    const ranges = this.values.slice(2);
    
    if (target === null || performance === null) return null;
    
    const { height, topOffset } = this.getDrawingDimensions();
    
    // Calculate scale (same logic as draw method)
    const maxVal = Math.max(target, performance, ...ranges.filter(v => v !== null));
    const minVal = this.options.base !== undefined ? this.options.base : 0;
    const range = maxVal - minVal;
    
    if (range <= 0) return null;
    
    // Check if hovering over the target marker
    const targetX = ((target - minVal) / range) * this.width;
    const targetWidth = this.options.targetWidth;
    
    if (Math.abs(x - targetX) <= targetWidth / 2 + 2) {
      return { type: 'target', index: 0, value: target, fieldkey: 'target' };
    }
    
    // Check if hovering over the performance bar
    const performanceWidth = ((performance - minVal) / range) * this.width;
    const barHeight = height * 0.4;
    const barY = topOffset + (height - barHeight) / 2;
    
    if (x >= 0 && x <= performanceWidth && y >= barY && y <= barY + barHeight) {
      return { type: 'performance', index: 1, value: performance, fieldkey: 'performance' };
    }
    
    // Check if hovering over any range - check from smallest to largest for better accessibility
    // Sort ranges by value to prioritize smaller ranges that might be hidden behind larger ones
    const rangeEntries = ranges.map((val, idx) => ({ value: val, index: idx }))
      .filter(entry => entry.value !== null)
      .sort((a, b) => a.value - b.value);
    
    for (const entry of rangeEntries) {
      const rangeVal = entry.value;
      const rangeIndex = entry.index;
      
      const rangeWidth = ((rangeVal - minVal) / range) * this.width;
      // Create a larger hit area for ranges to make them easier to hover
      const hitMargin = 5; // pixels
      if (x >= Math.max(0, rangeWidth - hitMargin) && x <= rangeWidth + hitMargin) {
        return { type: 'range', index: rangeIndex + 2, value: rangeVal, rangeIndex: rangeIndex, fieldkey: `range${rangeIndex + 1}` };
      }
    }
    
    return null;
  }

  // Get nearest region to mouse cursor for smooth tooltip following
  getNearestRegion(x, y) {
    // For bullet charts, find the nearest component
    if (this.values.length < 2) return null;
    
    const target = this.values[0];
    const performance = this.values[1];
    const ranges = this.values.slice(2);
    
    if (target === null || performance === null) return null;
    
    // Calculate scale
    const maxVal = Math.max(target, performance, ...ranges.filter(v => v !== null));
    const minVal = this.options.base !== undefined ? this.options.base : 0;
    const range = maxVal - minVal;
    
    if (range <= 0) return null;
    
    const targetX = ((target - minVal) / range) * this.width;
    const performanceWidth = ((performance - minVal) / range) * this.width;
    
    let nearest = null;
    let minDistance = Infinity;
    
    // Check distance to target
    const targetDistance = Math.abs(x - targetX);
    if (targetDistance < minDistance) {
      minDistance = targetDistance;
      nearest = { type: 'target', index: 0, value: target, fieldkey: 'target' };
    }
    
    // Check distance to performance (center of bar)
    const performanceDistance = Math.abs(x - performanceWidth / 2);
    if (performanceDistance < minDistance) {
      minDistance = performanceDistance;
      nearest = { type: 'performance', index: 1, value: performance, fieldkey: 'performance' };
    }
    
    // Check distance to ranges (use edge of each range for better detection)
    ranges.forEach((rangeVal, i) => {
      if (rangeVal === null) return;
      
      const rangeWidth = ((rangeVal - minVal) / range) * this.width;
      // For ranges, check distance to the right edge (end of the range)
      const rangeDistance = Math.abs(x - rangeWidth);
      if (rangeDistance < minDistance) {
        minDistance = rangeDistance;
        nearest = { type: 'range', index: i + 2, value: rangeVal, rangeIndex: i, fieldkey: `range${i + 1}` };
      }
    });
    
    return nearest;
  }

  // Override formatTooltipValue to ensure bullet chart always uses custom formatting
  formatTooltipValue(value, region) {
    if (value === null) return 'null';
    
    // Check if custom formatter function is provided
    if (this.options.tooltipFormatter && typeof this.options.tooltipFormatter === 'function') {
      return this.options.tooltipFormatter(value, region, this);
    }
    
    // For bullet charts, always use the default format regardless of tooltipFormat option
    return this.getDefaultTooltipFormat(value, region);
  }

  // Override tooltip formatting for bullet chart components
  getDefaultTooltipFormat(value, region) {
    if (!region || typeof region !== 'object') {
      return typeof value === 'number' ? value.toFixed(2) : value.toString();
    }
    
    const formattedValue = typeof region.value === 'number' ? region.value.toFixed(2) : region.value.toString();
    
    // Use the same field keys as the original jquery.sparkline
    const fieldKey = region.fieldkey || region.type;
    
    switch (region.type) {
      case 'target':
        return `target: ${formattedValue}`;
      case 'performance':
        return `performance: ${formattedValue}`;
      case 'range':
        const rangeIndex = region.rangeIndex + 1;
        return `range${rangeIndex}: ${formattedValue}`;
      default:
        return `${fieldKey}: ${formattedValue}`;
    }
  }

  // Override tooltip data for bullet chart
  getTooltipData(value, region) {
    if (!region || typeof region !== 'object') {
      return super.getTooltipData(value, region);
    }
    
    return {
      value: region.value,
      index: region.index,
      type: region.type,
      fieldkey: region.fieldkey,
      rangeIndex: region.rangeIndex,
      target: this.values[0],
      performance: this.values[1],
      ranges: this.values.slice(2)
    };
  }

  // Draw highlight for hovered component
  drawHighlight(region) {
    if (!region || typeof region !== 'object') return;
    
    const ctx = this.ctx;
    const { height, topOffset } = this.getDrawingDimensions();
    
    const target = this.values[0];
    const performance = this.values[1];
    const ranges = this.values.slice(2);
    
    // Calculate scale
    const maxVal = Math.max(target, performance, ...ranges.filter(v => v !== null));
    const minVal = this.options.base !== undefined ? this.options.base : 0;
    const range = maxVal - minVal;
    
    if (range <= 0) return;
    
    // Save current style
    ctx.save();
    
    switch (region.type) {
      case 'target':
        // Highlight target marker with a glow effect
        const targetX = ((target - minVal) / range) * this.width;
        const targetHeight = height * 0.8;
        const targetY = topOffset + (height - targetHeight) / 2;
        
        // Draw glow effect
        ctx.shadowColor = '#ff6666';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(targetX - this.options.targetWidth, targetY - 3, this.options.targetWidth * 2, targetHeight + 6);
        
        // Reset shadow for crisp overlay
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(targetX - this.options.targetWidth / 2, targetY, this.options.targetWidth, targetHeight);
        break;
        
      case 'performance':
        // Highlight performance bar with enhanced visibility
        const performanceWidth = ((performance - minVal) / range) * this.width;
        const barHeight = height * 0.4;
        const barY = topOffset + (height - barHeight) / 2;
        
        // Draw glow effect
        ctx.shadowColor = '#6666ff';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#6666ff';
        ctx.fillRect(-2, barY - 3, performanceWidth + 4, barHeight + 6);
        
        // Reset shadow and draw solid overlay
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(0, barY, performanceWidth, barHeight);
        break;
        
      case 'range':
        // Highlight specific range with border and slight color change
        const rangeVal = region.value;
        const rangeWidth = ((rangeVal - minVal) / range) * this.width;
        
        // Draw enhanced border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-1, topOffset - 2, rangeWidth + 2, height + 4);
        
        // Add subtle overlay to darken the range
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, topOffset, rangeWidth, height);
        
        // Add a colored left border to indicate the active range
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(Math.max(0, rangeWidth - 3), topOffset, 3, height);
        break;
    }
    
    // Restore style
    ctx.restore();
  }

  // Override updateTooltip to handle bullet chart's object-based regions
  updateTooltip(event, region) {
    if (this.options.disableTooltips || region === null) {
      this.hideTooltip();
      return;
    }

    if (!this.tooltip) {
      this.createTooltip();
    }

    // For bullet charts, region is an object, not an index
    let value, formattedValue;
    if (typeof region === 'object' && region !== null) {
      value = region.value;
      formattedValue = this.formatTooltipValue(value, region);
    } else {
      // Fallback to default behavior for numeric regions
      value = this.values[region];
      formattedValue = this.formatTooltipValue(value, region);
    }
    
    // Use textContent for multi-line support with white-space: pre-line CSS
    this.tooltip.textContent = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
    
    // Use the same touch-aware positioning logic as BaseChart
    this.updateTooltipPosition(event);
    this.tooltip.style.display = 'block';
  }

  // Override getRegionFields for bullet chart compliance
  getRegionFields(region) {
    if (typeof region === 'object' && region !== null) {
      return {
        isNull: region.value === null,
        value: region.value,
        index: region.index,
        fieldkey: region.fieldkey,
        x: region.index,
        y: region.value,
        offset: region.index,
        type: region.type,
        target: this.values[0],
        performance: this.values[1],
        ranges: this.values.slice(2)
      };
    }
    
    return super.getRegionFields(region);
  }
}
