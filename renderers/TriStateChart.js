// TriStateChart.js
// Tristate chart implementation (win/lose/draw)

import { BaseChart } from './BaseChart.js';

/**
 * TriStateChart renderer for win/loss/draw sparkline charts
 * Renders three-state values (positive, negative, zero) as colored bars
 * @extends BaseChart
 */
export class TriStateChart extends BaseChart {
  /**
   * Get default options for tristate chart
   * @returns {Object} Default options object
   */
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'tristate',
      barWidth: 'auto',
      barSpacing: 1,
      posBarColor: '#0f0',
      negBarColor: '#f00',
      zeroBarColor: '#999',
      colorMap: {},
      stateLabels: { positive: 'Win', zero: 'Draw', negative: 'Loss' }, // Labels for the three states
      dataLabels: undefined,   // Optional array of labels OR callback function(index) => label for data points (shown in tooltips)
      getPointDataLabel: undefined  // Alternative: callback function(index) => label for high-performance scenarios
    };
  }

  /**
   * Draw the tristate chart with win/loss/draw bars centered on zero line
   */
  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      barWidth, barSpacing, posBarColor, negBarColor, 
      zeroBarColor, colorMap 
    } = this.options;

    // Handle barWidth calculation (same logic as BarChart)
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

    const normalBarHeight = height / 6; // Make bars even shorter - was height / 4
    const zeroBarHeight = 3; // Make zero state only 3px high
    const zeroLine = topOffset + height / 2; // Zero line in the middle of the chart

    // Clear regions for interaction
    this.regions = [];

    // Draw bars
    this.values.forEach((value, index) => {
      if (value === null || value === undefined) return;

      let x;
      if (barWidth === 'fill' || (typeof barWidth === 'string' && barWidth !== 'auto')) {
        // Fill mode: use old positioning logic (no spacing)
        x = (index * this.width / this.values.length) + 
            (this.width / this.values.length - barWidthFinal) / 2;
      } else {
        // Auto or numeric mode: use spacing-aware positioning
        x = centerOffset + index * (barWidthFinal + barSpacing);
      }

      let color, y, currentBarHeight;
      
      // All bars start from the zero line, with different extensions
      if (value > 0) {
        color = colorMap[value] !== undefined ? colorMap[value] : posBarColor;
        // Positive: bar extends upward from top of zero bar area
        y = zeroLine - zeroBarHeight / 2 - normalBarHeight;
        currentBarHeight = normalBarHeight;
      } else if (value < 0) {
        color = colorMap[value] !== undefined ? colorMap[value] : negBarColor;
        // Negative: bar extends downward from bottom of zero bar area
        y = zeroLine + zeroBarHeight / 2;
        currentBarHeight = normalBarHeight;
      } else {
        color = colorMap[value] !== undefined ? colorMap[value] : zeroBarColor;
        // Zero: small visible bar centered on zero line
        y = zeroLine - zeroBarHeight / 2;
        currentBarHeight = zeroBarHeight;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidthFinal, currentBarHeight);

      // No need for transparent bar since we're positioning correctly

      // Store region for interaction (tooltips)
      this.regions.push({
        x: x,
        y: y,
        width: barWidthFinal,
        height: currentBarHeight,
        index: index,
        value: value,
        color: color
      });
    });
  }

  /**
   * Get the region at a specific point for interaction detection
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Region index or null
   */
  getRegionAtPoint(x, y) {
    if (this.values.length === 0) return null;
    
    const { barWidth, barSpacing } = this.options;
    
    // Handle barWidth calculation (same logic as draw method)
    let barWidthFinal = barWidth;
    let centerOffset = 0;
    
    if (barWidth === 'auto') {
      barWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * barSpacing) / this.values.length));
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (barWidth === 'fill' || typeof barWidth === 'string') {
      barWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0;
    } else {
      barWidthFinal = barWidth;
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }
    
    // Find which bar was clicked
    for (let index = 0; index < this.values.length; index++) {
      if (this.values[index] === null) continue;
      
      let barX;
      if (barWidth === 'fill' || (typeof barWidth === 'string' && barWidth !== 'auto')) {
        barX = (index * this.width / this.values.length) + 
               (this.width / this.values.length - barWidthFinal) / 2;
      } else {
        barX = centerOffset + index * (barWidthFinal + barSpacing);
      }
      
      if (x >= barX && x <= barX + barWidthFinal) {
        return index;
      }
    }
    
    return null;
  }

  /**
   * Get the nearest region to the mouse cursor for smooth tooltip following
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Nearest region index or null
   */
  getNearestRegion(x, y) {
    if (this.values.length === 0) return null;
    
    const { barWidth, barSpacing } = this.options;
    
    // Handle barWidth calculation (same logic as draw method)
    let barWidthFinal = barWidth;
    let centerOffset = 0;
    
    if (barWidth === 'auto') {
      barWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * barSpacing) / this.values.length));
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (barWidth === 'fill' || typeof barWidth === 'string') {
      barWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0;
    } else {
      barWidthFinal = barWidth;
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }
    
    // Find the nearest bar center
    let nearestIndex = -1;
    let minDistance = Infinity;
    
    for (let index = 0; index < this.values.length; index++) {
      if (this.values[index] === null) continue;
      
      let barX;
      if (barWidth === 'fill' || (typeof barWidth === 'string' && barWidth !== 'auto')) {
        barX = (index * this.width / this.values.length) + 
               (this.width / this.values.length - barWidthFinal) / 2;
      } else {
        barX = centerOffset + index * (barWidthFinal + barSpacing);
      }
      
      const barCenter = barX + barWidthFinal / 2;
      const distance = Math.abs(x - barCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    }
    
    return nearestIndex >= 0 ? nearestIndex : null;
  }

  /**
   * Get standardized fields for a region (sparkline.js compliance)
   * @param {number} region - Region index
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
        color: this.getBarColor(value),
        offset: region
      };
    }
    
    return super.getRegionFields(region);
  }

  /**
   * Get the color for a specific region based on its tristate value
   * @param {number} region - Region index
   * @returns {string|null} Color hex code or null
   */
  getRegionColor(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      return this.getBarColor(value);
    }
    return null;
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
    
    // Default: "Point {n}"
    return `Point ${index + 1}`;
  }

  /**
   * Get tooltip content with current state and win/loss/draw summary
   * @param {number} region - Region index
   * @returns {Object|null} Tooltip content with items array
   */
  getTooltipContent(region) {
    const { stateLabels } = this.options;
    
    // For tristate charts, we can show a summary of all states when hovering over any bar
    const positive = this.values.filter(v => v > 0).length;
    const negative = this.values.filter(v => v < 0).length;
    const zero = this.values.filter(v => v === 0).length;
    
    if (typeof region === 'number') {
      const currentValue = this.values[region];
      const pointLabel = this.getPointLabel(region);
      const items = [];
      
      // Add current state info
      if (currentValue > 0) {
        items.push({
          label: stateLabels.positive || 'Win',
          color: this.options.posBarColor
        });
      } else if (currentValue < 0) {
        items.push({
          label: stateLabels.negative || 'Loss',
          color: this.options.negBarColor
        });
      } else {
        items.push({
          label: stateLabels.zero || 'Draw',
          color: this.options.zeroBarColor
        });
      }
      
      // Add separator before summary stats
      items.push({
        isSeparator: true
      });
      
      // Add summary stats
      if (positive > 0) {
        items.push({
          label: `Total ${stateLabels.positive || 'Wins'}: ${positive}`,
          color: this.options.posBarColor
        });
      }
      
      if (negative > 0) {
        items.push({
          label: `Total ${stateLabels.negative || 'Losses'}: ${negative}`,
          color: this.options.negBarColor
        });
      }
      
      if (zero > 0) {
        items.push({
          label: `Total ${stateLabels.zero || 'Draws'}: ${zero}`,
          color: this.options.zeroBarColor
        });
      }
      
      return { 
        title: pointLabel,
        items 
      };
    }
    
    return null;
  }

  /**
   * Custom tooltip formatting for tristate charts (Win/Loss/Draw)
   * @param {number} value - Value to format (1=Win, 0=Draw, -1=Loss)
   * @param {number} region - Region index
   * @returns {string} Formatted tooltip text
   */
  getDefaultTooltipFormat(value, region) {
    const { stateLabels } = this.options;
    
    // Use custom state labels
    if (value > 0) return stateLabels.positive || 'Win';
    if (value === 0) return stateLabels.zero || 'Draw';  
    if (value < 0) return stateLabels.negative || 'Loss';
    return `Tristate: ${value}`; // Fallback that shows it's working
  }

  /**
   * Format tooltip value using custom tristate format
   * @param {number} value - Value to format
   * @param {number} region - Region index
   * @returns {string} Formatted tooltip text
   */
  formatTooltipValue(value, region) {
    return this.getDefaultTooltipFormat(value, region);
  }

  /**
   * Get bar color based on tristate value and colorMap
   * @param {number} value - Bar value (positive/negative/zero)
   * @returns {string} Color hex code
   * @private
   */
  getBarColor(value) {
    const { posBarColor, negBarColor, zeroBarColor, colorMap } = this.options;
    
    if (colorMap[value] !== undefined) {
      return colorMap[value];
    } else if (value > 0) {
      return posBarColor;
    } else if (value < 0) {
      return negBarColor;
    } else {
      return zeroBarColor;
    }
  }

  /**
   * Draw highlight overlay for the hovered tristate bar
   * @param {number} region - Region index to highlight
   */
  drawHighlight(region) {
    if (typeof region !== 'number' || this.values[region] === null) return;
    
    const ctx = this.ctx;
    const { width, height, topOffset } = this.getDrawingDimensions();
    const { barWidth, barSpacing } = this.options;
    
    // Handle barWidth calculation (same logic as draw method)
    let barWidthFinal = barWidth;
    let centerOffset = 0;
    
    if (barWidth === 'auto') {
      barWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * barSpacing) / this.values.length));
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (barWidth === 'fill' || typeof barWidth === 'string') {
      barWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0;
    } else {
      barWidthFinal = barWidth;
      const totalChartWidth = this.values.length * barWidthFinal + (this.values.length - 1) * barSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }
    
    const normalBarHeight = height / 6; // Make bars even shorter - was height / 4
    const zeroBarHeight = 3; // Make zero state only 3px high
    const zeroLine = topOffset + height / 2; // Zero line in the middle of the chart

    let x;
    if (barWidth === 'fill' || (typeof barWidth === 'string' && barWidth !== 'auto')) {
      x = (region * this.width / this.values.length) + 
          (this.width / this.values.length - barWidthFinal) / 2;
    } else {
      x = centerOffset + region * (barWidthFinal + barSpacing);
    }

    let y, currentBarHeight;
    const value = this.values[region];
    if (value > 0) {
      // Positive: bar extends upward from top of zero bar area
      y = zeroLine - zeroBarHeight / 2 - normalBarHeight;
      currentBarHeight = normalBarHeight;
    } else if (value < 0) {
      // Negative: bar extends downward from bottom of zero bar area
      y = zeroLine + zeroBarHeight / 2;
      currentBarHeight = normalBarHeight;
    } else {
      // Zero: small grey bar centered on zero line
      y = zeroLine - zeroBarHeight / 2;
      currentBarHeight = zeroBarHeight;
    }

    ctx.save();
    
    // Apply lighten effect to the bar color
    const barColor = this.getBarColor(value);
    const highlightColor = this.lightenColor(barColor, this.options.highlightLighten);
    
    // Redraw the bar with lightened color (replacing the original)
    ctx.fillStyle = highlightColor;
    ctx.fillRect(x, y, barWidthFinal, currentBarHeight);
    
    // Optional: Add a subtle border to make the highlight more visible
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, barWidthFinal, currentBarHeight);
    
    ctx.restore();
  }
}
