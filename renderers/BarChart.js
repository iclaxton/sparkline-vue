// BarChart.js
// Bar chart implementation

import { BaseChart } from './BaseChart.js';

/**
 * BarChart renderer for sparkline bar charts
 * Supports single-value bars and stacked bars with automatic width calculation
 * @extends BaseChart
 */
export class BarChart extends BaseChart {
  /**
   * Get default options for bar charts
   * @returns {Object} Default options object
   */
  static getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'bar',
      barColor: '#3366cc',
      negBarColor: '#f44',
      zeroColor: '#909090',
      nullColor: undefined,
      zeroAxis: true,
      barWidth: 'auto',
      barSpacing: 1,
      chartRangeClip: false,
      colorMap: undefined,
      stackedBarColor: undefined,
      dataLabels: undefined,   // Optional array of labels OR callback function(index) => label for data points (shown in tooltips)
      getPointDataLabel: undefined,  // Alternative: callback function(index) => label for high-performance scenarios
      seriesNames: undefined   // Optional array of series names for stacked bar segments
    };
  }

  /**
   * Draw the bar chart on the canvas
   * Handles both single-value and stacked bar rendering
   */
  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    
    const { 
      barColor, negBarColor, zeroColor, nullColor, 
      barWidth, barSpacing, zeroAxis, chartRangeClip,
      colorMap, stackedBarColor
    } = this.options;

    // Check if this is stacked data (array of arrays)
    const isStacked = Array.isArray(this.values[0]);
    
    if (isStacked) {
      this.drawStackedBars();
      return;
    }

    // Original single-value bar chart logic
    const numValues = this.values.filter(v => v !== null).length;
    if (numValues === 0) return;

    const minVal = this.options.chartRangeMin !== undefined ? 
      this.options.chartRangeMin : Math.min(...this.values.filter(v => v !== null));
    const maxVal = this.options.chartRangeMax !== undefined ? 
      this.options.chartRangeMax : Math.max(...this.values.filter(v => v !== null));

    let range = maxVal - minVal;
    if (range === 0) range = 1;

    // Handle barWidth calculation
    let barWidthFinal = barWidth;
    let centerOffset = 0;
    
    if (barWidth === 'auto') {
      // Auto mode: calculate width considering spacing, then center
      barWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * barSpacing) / this.values.length));
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (barWidth === 'fill' || typeof barWidth === 'string') {
      // Fill mode: distribute entire width equally (old behavior)
      barWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0; // No centering, fill entire width
    } else {
      // Numeric mode: use specified width and center
      barWidthFinal = barWidth;
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }

    // Determine zero line position
    let zeroLine = topOffset + height;
    if (zeroAxis) {
      if (minVal < 0 && maxVal > 0) {
        zeroLine = topOffset + height - ((-minVal / range) * height);
      } else if (maxVal <= 0) {
        zeroLine = topOffset;
      }
    }

    // Clear regions for interaction
    this.regions = [];

    // Draw bars
    this.values.forEach((value, index) => {
      let x;
      if (barWidth === 'fill' || (typeof barWidth === 'string' && barWidth !== 'auto')) {
        // Fill mode: use old positioning logic (no spacing)
        x = (index * this.width / this.values.length) + 
            (this.width / this.values.length - barWidthFinal) / 2;
      } else {
        // Auto or numeric mode: use spacing-aware positioning
        x = centerOffset + index * (barWidthFinal + barSpacing);
      }

      if (value === null) {
        if (nullColor) {
          ctx.fillStyle = nullColor;
          ctx.fillRect(x, topOffset, barWidthFinal, height);
        }
        // Add region even for null values
        this.regions.push({
          x: x,
          y: topOffset,
          width: barWidthFinal,
          height: height,
          index: index,
          value: value
        });
        return;
      }

      let clippedValue = value;
      if (chartRangeClip) {
        clippedValue = Math.max(minVal, Math.min(maxVal, value));
      }

      // Determine bar color
      let color = barColor;
      if (colorMap) {
        if (Array.isArray(colorMap)) {
          color = colorMap[index % colorMap.length];
        } else if (typeof colorMap === 'object') {
          color = colorMap[value] || color;
        }
      } else {
        if (value < 0) {
          color = negBarColor;
        } else if (value === 0 && zeroColor) {
          color = zeroColor;
        }
      }

      ctx.fillStyle = color;

      // Calculate bar position and height
      let barTop, barHeight;
      
      if (zeroAxis && minVal < 0 && maxVal > 0) {
        // Chart spans both positive and negative
        if (clippedValue > 0) {
          barTop = topOffset + height - ((clippedValue - minVal) / range) * height;
          barHeight = zeroLine - barTop;
        } else {
          barTop = zeroLine;
          barHeight = topOffset + height - ((clippedValue - minVal) / range) * height - zeroLine;
        }
      } else {
        // All positive or all negative values - simplified approach
        barHeight = Math.abs((clippedValue - minVal) / range) * height;
        barTop = topOffset + height - barHeight;
        
        if (maxVal <= 0 && zeroAxis) {
          barTop = topOffset + ((clippedValue - minVal) / range) * height;
        }
      }

      // Ensure valid dimensions
      barHeight = Math.max(1, Math.abs(barHeight));
      barTop = Math.max(topOffset, Math.min(topOffset + height - barHeight, barTop));
      
      // Always draw the bar
      ctx.fillRect(x, barTop, barWidthFinal, barHeight);

      // Store region for interaction
      this.regions.push({
        x: x,
        y: barTop,
        width: barWidthFinal,
        height: barHeight,
        index: index,
        value: value,
        color: color
      });
    });

    // Draw zero line if applicable
    if (zeroAxis && minVal < 0 && maxVal > 0 && zeroLine !== (topOffset + height) && zeroLine !== topOffset) {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, zeroLine);
      ctx.lineTo(this.width, zeroLine);
      ctx.stroke();
    }
  }

  /**
   * Draw stacked bar chart where each bar is made up of multiple segments
   * @private
   */
  drawStackedBars() {
    const ctx = this.ctx;
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      barWidth, barSpacing, stackedBarColor, barColor
    } = this.options;

    // Flatten all values to find global min/max
    const allValues = [];
    const stackTotals = [];
    
    this.values.forEach(stack => {
      if (Array.isArray(stack)) {
        let stackTotal = 0;
        stack.forEach(val => {
          if (val !== null && val !== undefined) {
            allValues.push(val);
            stackTotal += val;
          }
        });
        stackTotals.push(stackTotal);
      }
    });

    if (allValues.length === 0) return;

    // Use stack totals for range calculation
    const minVal = Math.min(0, ...stackTotals);  // Include 0 for baseline
    const maxVal = Math.max(...stackTotals);
    let range = maxVal - minVal;
    if (range === 0) range = 1;

    // Store stack totals for tooltip use
    this.stackTotals = stackTotals;

    // Calculate bar dimensions
    let barWidthFinal = barWidth;
    let centerOffset = 0;
    
    if (barWidth === 'auto') {
      // Auto mode: calculate width considering spacing, then center
      barWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * barSpacing) / this.values.length));
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (barWidth === 'fill' || typeof barWidth === 'string') {
      // Fill mode: distribute entire width equally (old behavior)
      barWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0; // No centering, fill entire width
    } else {
      // Numeric mode: use specified width and center
      barWidthFinal = barWidth;
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }

    // Clear regions for interaction
    this.regions = [];

    // Draw stacked bars
    this.values.forEach((stack, stackIndex) => {
      if (!Array.isArray(stack)) return;
      
      let x;
      if (barWidth === 'fill' || (typeof barWidth === 'string' && barWidth !== 'auto')) {
        // Fill mode: use old positioning logic (no spacing)
        x = (stackIndex * this.width / this.values.length) + 
            (this.width / this.values.length - barWidthFinal) / 2;
      } else {
        // Auto or numeric mode: use spacing-aware positioning
        x = centerOffset + stackIndex * (barWidthFinal + barSpacing);
      }

      let currentY = topOffset + height; // Start from bottom
      
      stack.forEach((value, segmentIndex) => {
        if (value === null || value === undefined || value <= 0) return;

        // Calculate segment height
        const segmentHeight = (value / range) * height;
        const segmentTop = currentY - segmentHeight;

        // Determine color
        let color = barColor;
        if (stackedBarColor && Array.isArray(stackedBarColor)) {
          color = stackedBarColor[segmentIndex % stackedBarColor.length];
        }

        // Draw segment
        ctx.fillStyle = color;
        ctx.fillRect(x, segmentTop, barWidthFinal, segmentHeight);

        // Store region for interaction
        this.regions.push({
          x: x,
          y: segmentTop,
          width: barWidthFinal,
          height: segmentHeight,
          stackIndex: stackIndex,
          segmentIndex: segmentIndex,
          value: value,
          color: color,
          index: stackIndex * 100 + segmentIndex // Unique index for interaction
        });

        currentY = segmentTop; // Move up for next segment
      });
    });
  }

  /**
   * Get the region at a specific point for interaction detection
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Region index for regular bars, or stack index for stacked bars
   */
  getRegionAtPoint(x, y) {
    if (!this.regions) return null;
    
    // Check if this is stacked data
    const isStacked = this.regions.length > 0 && this.regions[0].stackIndex !== undefined;
    
    if (isStacked) {
      // For stacked bars, find which stack column we're hovering over
      // and return the stack index, not individual segment
      for (let i = 0; i < this.regions.length; i++) {
        const region = this.regions[i];
        if (x >= region.x && x <= region.x + region.width) {
          // Found the correct stack column, now check if we're within any segment's Y range
          const stackRegions = this.regions.filter(r => r.stackIndex === region.stackIndex);
          const topY = Math.min(...stackRegions.map(r => r.y));
          const bottomY = Math.max(...stackRegions.map(r => r.y + r.height));
          
          if (y >= topY && y <= bottomY) {
            // Return the stack index as the region (not individual segment)
            return region.stackIndex;
          }
        }
      }
    } else {
      // Regular bars - check individual regions
      for (let i = this.regions.length - 1; i >= 0; i--) {
        const region = this.regions[i];
        if (x >= region.x && x <= region.x + region.width &&
            y >= region.y && y <= region.y + region.height) {
          return region.index;
        }
      }
    }
    
    return null;
  }

  /**
   * Get the nearest region to the mouse cursor for smooth tooltip following
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Nearest region index or stack index
   */
  getNearestRegion(x, y) {
    if (!this.regions || this.regions.length === 0) return null;
    
    // Check if this is stacked data
    const isStacked = this.regions.length > 0 && this.regions[0].stackIndex !== undefined;
    
    if (isStacked) {
      // For stacked bars, find the nearest stack column
      let nearestStackIndex = null;
      let nearestDistance = Infinity;
      
      // Group regions by stack to find stack centers
      const stackCenters = new Map();
      this.regions.forEach(region => {
        if (!stackCenters.has(region.stackIndex)) {
          stackCenters.set(region.stackIndex, {
            x: region.x + region.width / 2,
            stackIndex: region.stackIndex
          });
        }
      });
      
      // Find nearest stack center
      stackCenters.forEach(stackCenter => {
        const distance = Math.abs(stackCenter.x - x);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestStackIndex = stackCenter.stackIndex;
        }
      });
      
      return nearestStackIndex;
    } else {
      // Regular bars - find nearest bar
      let nearestRegion = null;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < this.regions.length; i++) {
        const region = this.regions[i];
        const barCenterX = region.x + region.width / 2;
        const distance = Math.abs(barCenterX - x);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestRegion = region.index;
        }
      }
      
      return nearestRegion;
    }
  }

  /**
   * Draw highlight overlay for the hovered bar or stacked bar
   * @param {number} region - Region index or stack index to highlight
   */
  drawHighlight(region) {
    if (!this.regions) return;
    
    const ctx = this.ctx;
    
    // Check if this is stacked data
    const isStacked = this.regions.length > 0 && this.regions[0].stackIndex !== undefined;
    
    if (isStacked && typeof region === 'number') {
      // Stacked bar - highlight the entire stack
      const stackRegions = this.regions.filter(r => r.stackIndex === region);
      
      stackRegions.forEach(stackRegion => {
        const highlightColor = this.lightenColor(stackRegion.color || this.options.barColor, this.options.highlightLighten);
        
        // Draw highlighted segment
        ctx.fillStyle = highlightColor;
        ctx.fillRect(stackRegion.x, stackRegion.y, stackRegion.width, stackRegion.height);
        
        // Draw border around highlighted segment
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(stackRegion.x, stackRegion.y, stackRegion.width, stackRegion.height);
      });
    } else if (!isStacked) {
      // Regular bar - find by index
      const targetRegion = this.regions.find(r => r.index === region);
      
      if (targetRegion) {
        const highlightColor = this.lightenColor(targetRegion.color || this.options.barColor, this.options.highlightLighten);
        
        // Draw highlighted bar
        ctx.fillStyle = highlightColor;
        ctx.fillRect(targetRegion.x, targetRegion.y, targetRegion.width, targetRegion.height);
        
        // Draw border around highlighted bar
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(targetRegion.x, targetRegion.y, targetRegion.width, targetRegion.height);
      }
    }
  }

  /**
   * Get data label for a specific point index
   * Supports both array (dataLabels) and callback (getPointDataLabel)
   * @param {number} index - The data point index
   * @returns {string|null} The label for this point, or null if none
   */
  getPointLabel(index) {
    // Priority 1: callback function (for performance)
    if (this.options.getPointDataLabel && typeof this.options.getPointDataLabel === 'function') {
      try {
        return this.options.getPointDataLabel(index);
      } catch (error) {
        console.warn('Error in getPointDataLabel callback:', error);
      }
    }
    
    // Priority 2: array of labels
    if (Array.isArray(this.options.dataLabels) && index < this.options.dataLabels.length) {
      return this.options.dataLabels[index];
    }
    
    // Default: "Bar {n}"
    return `Bar ${index + 1}`;
  }

  /**
   * Get tooltip content with colors for bars
   * Overrides base implementation to support multi-value stacked bars
   * @param {number} region - Region index or stack index
   * @returns {Object|null} Tooltip content with items array containing labels and colors
   */
  getTooltipContent(region) {
    // Check if this is stacked data
    const isStacked = this.regions.length > 0 && this.regions[0].stackIndex !== undefined;
    
    if (isStacked) {
      // Multi-value tooltip for stacked bars
      // Region here is the stackIndex (which column)
      const stackedRegions = this.regions.filter(r => r.stackIndex === region);
      
      if (stackedRegions.length === 0) return null;
      
      // Get the point label (date, month, etc.) to use as title
      const pointLabel = this.getPointLabel(region);
      
      // Calculate the total for this stack (use pre-calculated if available)
      const stackTotal = this.stackTotals && this.stackTotals[region] !== undefined 
        ? this.stackTotals[region] 
        : stackedRegions.reduce((sum, r) => sum + (r.value || 0), 0);
      
      // Sort by segmentIndex to show in visual order (bottom to top)
      stackedRegions.sort((a, b) => a.segmentIndex - b.segmentIndex);
      
      const seriesNames = this.options.seriesNames || [];
      const items = stackedRegions.map(r => {
        const stackValue = r.value; // Value is stored directly in the region
        const formattedValue = this.formatTooltipValue(stackValue, r.stackIndex);
        const seriesName = seriesNames[r.segmentIndex] || `Segment ${r.segmentIndex + 1}`;
        // Include series name before the value
        return {
          label: `${seriesName}: ${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`,
          color: r.color // Color is stored directly in the region
        };
      });
      
      // Add total as the last item
      const formattedTotal = this.formatTooltipValue(stackTotal, region);
      items.push({
        label: `Total: ${this.options.tooltipPrefix}${formattedTotal}${this.options.tooltipSuffix}`,
        color: '#666' // Gray color for total
      });
      
      return { 
        title: pointLabel,  // Show label as title above all segments
        items 
      };
    } else {
      // Single-value tooltip for regular bars - use title + items like stacked bars
      const color = this.getRegionColor(region);
      if (color && typeof region === 'number' && region >= 0 && region < this.values.length) {
        const value = this.values[region];

        // Get the point label (date, month, etc.)
        const pointLabel = this.getPointLabel(region);

        // Build item label (do not repeat pointLabel)
        let itemLabel;
        if (this.options.tooltipFormatter && typeof this.options.tooltipFormatter === 'function') {
          try {
            const result = this.options.tooltipFormatter(value, region, this, { pointLabel });
            itemLabel = this.sanitizeTooltipContent(result);
          } catch (error) {
            console.warn('Custom tooltip formatter error:', error);
            itemLabel = `${this.options.tooltipPrefix}${this.formatTooltipValue(value, region)}${this.options.tooltipSuffix}`;
          }
        } else {
          itemLabel = `${this.options.tooltipPrefix}${this.formatTooltipValue(value, region)}${this.options.tooltipSuffix}`;
        }

        return {
          title: pointLabel,
          items: [{
            label: itemLabel,
            color: color
          }]
        };
      }
    }
    
    return null; // Use default tooltip without color
  }

  /**
   * Get the color for a specific bar region
   * @param {number} region - Region index
   * @returns {string|null} Color hex code or null
   */
  getRegionColor(region) {
    if (typeof region === 'number' && region >= 0 && region < this.values.length) {
      // Check if this is stacked data
      const isStacked = this.regions.length > 0 && this.regions[0].stackIndex !== undefined;
      
      if (!isStacked) {
        // Regular bar - get the bar color for this value
        const value = this.values[region];
        return this.getBarColor(value, region);
      }
    }
    return null; // Stacked bars handle colors in their own getTooltipContent
  }

  /**
   * Format tooltip value for bar charts with default format
   * @param {number} value - Value to format
   * @param {number|Object} region - Region index or stacked bar region object
   * @returns {string} Formatted tooltip text
   */
  getDefaultTooltipFormat(value, region) {
    if (typeof region === 'object' && region.stackIndex !== undefined) {
      return `Stack ${region.stackIndex + 1}, Segment ${region.segmentIndex + 1}: ${region.value}`;
    }
    return `Bar ${region + 1}: ${value}`;
  }

  /**
   * Get enhanced data for bar chart tooltips
   * @param {number} value - Value of the region
   * @param {number|Object} region - Region index or stacked bar region object
   * @returns {Object} Enhanced tooltip data object
   */
  getTooltipData(value, region) {
    if (typeof region === 'object' && region.stackIndex !== undefined) {
      return {
        value: region.value,
        stackIndex: region.stackIndex,
        segmentIndex: region.segmentIndex,
        stack: region.stackIndex + 1,
        segment: region.segmentIndex + 1,
        color: region.color
      };
    }
    
    return {
      ...super.getTooltipData(value, region),
      bar: region + 1,
      total: this.values.length,
      isPositive: value > 0,
      isNegative: value < 0,
      isZero: value === 0
    };
  }

  /**
   * Get standardized fields for a region (sparkline.js compliance)
   * @param {number|Object} region - Region index or stacked bar region object
   * @returns {Object} Region fields object
   */
  getRegionFields(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      return {
        isNull: value === null,
        value: value,
        index: region,
        x: region,
        y: value,
        color: this.getBarColor(value, region),
        offset: region
      };
    }

    // For stacked bars, region is an object
    if (typeof region === 'object' && region !== null) {
      return {
        isNull: region.value === null,
        value: region.value,
        index: region.segmentIndex,
        x: region.stackIndex,
        y: region.value,
        color: region.color,
        offset: region.stackIndex,
        stackIndex: region.stackIndex,
        segmentIndex: region.segmentIndex
      };
    }

    return super.getRegionFields(region);
  }

  /**
   * Helper method to determine bar color based on value and options
   * @param {number|null} value - Bar value
   * @param {number} index - Bar index for colorMap lookup
   * @returns {string} Color hex code
   * @private
   */
  getBarColor(value, index) {
    const { barColor, negBarColor, zeroColor, nullColor, colorMap } = this.options;
    
    if (value === null) return nullColor;
    if (value === 0 && zeroColor) return zeroColor;
    
    if (colorMap) {
      if (Array.isArray(colorMap)) {
        return colorMap[index % colorMap.length];
      } else if (typeof colorMap === 'object') {
        return colorMap[value] || barColor;
      }
    }
    
    return value < 0 ? negBarColor : barColor;
  }
}
