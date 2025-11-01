// DiscreteChart.js
// Discrete chart implementation (vertical lines)

import { BaseChart } from './BaseChart.js';

/**
 * DiscreteChart renderer for sparkline discrete (vertical line) charts
 * Renders values as vertical lines with configurable height and threshold colors
 * @extends BaseChart
 */
export class DiscreteChart extends BaseChart {
  /**
   * Get default options for discrete chart
   * @returns {Object} Default options object
   */
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'discrete',
      lineColor: '#0000ff',
      lineWidth: 'auto',
      lineSpacing: 1,
      lineHeight: '30%', // Defaults to 30% of graph height per jQuery Sparkline
      thresholdColor: undefined,
      thresholdValue: 0,
      highlightLighten: 1.7,
      dataLabels: undefined,   // Optional array of labels OR callback function(index) => label for data points (shown in tooltips)
      getPointDataLabel: undefined  // Alternative: callback function(index) => label for high-performance scenarios
    };
  }

  /**
   * Draw the discrete chart with vertical lines and store regions for interaction
   */
  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      lineColor, thresholdColor, thresholdValue, 
      lineHeight, chartRangeClip, lineWidth, lineSpacing
    } = this.options;

    // Calculate ranges
    const numValues = this.values.filter(v => v !== null).length;
    if (numValues === 0) return;

    const minVal = this.options.chartRangeMin !== undefined ? 
      this.options.chartRangeMin : Math.min(...this.values.filter(v => v !== null));
    const maxVal = this.options.chartRangeMax !== undefined ? 
      this.options.chartRangeMax : Math.max(...this.values.filter(v => v !== null));

    let range = maxVal - minVal;
    if (range === 0) range = 1;

    // Handle lineWidth calculation (same logic as BarChart)
    let lineWidthFinal = lineWidth;
    let centerOffset = 0;
    
    if (lineWidth === 'auto') {
      // Auto mode: calculate width considering spacing, then center
      lineWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * lineSpacing) / this.values.length));
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (lineWidth === 'fill' || typeof lineWidth === 'string') {
      // Fill mode: distribute entire width equally (old behavior)
      lineWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0; // No centering, fill entire width
    } else {
      // Numeric mode: use specified width and center
      lineWidthFinal = lineWidth;
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }

    // Calculate line height
    let finalLineHeight = lineHeight;
    if (lineHeight === 'auto' || lineHeight === '30%') {
      finalLineHeight = height * 0.3;
    } else if (typeof lineHeight === 'string' && lineHeight.endsWith('%')) {
      const percentage = parseFloat(lineHeight) / 100;
      finalLineHeight = height * percentage;
    }

    // Clear regions for interaction
    this.regions = [];

    // Draw discrete lines
    this.values.forEach((value, index) => {
      // Calculate x position using spacing logic
      let x;
      if (lineWidth === 'fill' || (typeof lineWidth === 'string' && lineWidth !== 'auto')) {
        // Fill mode: use old positioning logic (no spacing)
        x = (index * this.width / this.values.length) + (this.width / this.values.length) / 2;
      } else {
        // Auto or numeric mode: use spacing-aware positioning
        x = centerOffset + index * (lineWidthFinal + lineSpacing) + lineWidthFinal / 2;
      }

      if (value === null) {
        // Store region even for null values
        this.regions.push({
          x: x,
          y: topOffset,
          width: lineWidthFinal,
          height: height,
          index: index,
          value: value,
          color: lineColor
        });
        return;
      }

      let clippedValue = value;
      if (chartRangeClip) {
        clippedValue = Math.max(minVal, Math.min(maxVal, value));
      }

      const normalizedValue = (clippedValue - minVal) / range;
      const lineTop = topOffset + height - (normalizedValue * height);
      const lineBottom = lineTop + finalLineHeight;

      // Choose color based on threshold
      let color = lineColor;
      if (thresholdColor && clippedValue < thresholdValue) {
        color = thresholdColor;
      }

      // Calculate the actual line width used for drawing
      const actualLineWidth = Math.max(1, lineWidthFinal - 1);
      
      // Store region information for interaction - store the rect coordinates
      this.regions.push({
        x: x - actualLineWidth / 2,  // Left edge of the rectangle
        y: lineTop,
        width: actualLineWidth,
        height: Math.min(lineBottom, this.height - bottomOffset) - lineTop,
        index: index,
        value: value,
        color: color,
        centerX: x  // Store center for hit detection
      });

      // Draw as filled rectangle for better highlight visibility
      ctx.fillStyle = color;
      const rectX = x - actualLineWidth / 2;
      const rectHeight = Math.min(lineBottom, this.height - bottomOffset) - lineTop;
      ctx.fillRect(rectX, lineTop, actualLineWidth, rectHeight);
    });
  }

  /**
   * Get the color for a specific discrete line region
   * @param {number} region - Region index
   * @returns {string|null} Color hex code or null
   */
  getRegionColor(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      const { lineColor, thresholdColor, thresholdValue } = this.options;
      
      // Check if this value is above/below threshold
      if (thresholdColor && thresholdValue !== undefined && value !== null) {
        return value >= thresholdValue ? lineColor : thresholdColor;
      }
      
      return lineColor;
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
   * Get tooltip content for discrete chart
   * @param {number} region - Region index
   * @returns {Object|null} Tooltip content with title and items
   */
  getTooltipContent(region) {
    const color = this.getRegionColor(region);
    if (color && typeof region === 'number' && region >= 0 && region < this.values.length) {
      const value = this.values[region];
      const pointLabel = this.getPointLabel(region);
      const formattedValue = this.formatTooltipValue(value, region);
      
      return {
        title: pointLabel,
        items: [{
          label: `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`,
          color: color
        }]
      };
    }
    return null;
  }

  /**
   * Get the region at a specific point for interaction detection
   * Uses wider hit area for better usability with thin lines
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Region index or null
   */
  getRegionAtPoint(x, y) {
    if (!this.regions || this.regions.length === 0) return null;
    
    // Check each stored region for a hit
    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      
      // For discrete charts, we want a wider hit area around each line
      const hitWidth = Math.max(region.width * 0.8, 8); // At least 8px wide or 80% of line width
      
      // Check if mouse is within the hit area horizontally (use centerX)
      if (Math.abs(x - region.centerX) <= hitWidth / 2) {
        return region.index;
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
    if (!this.regions || this.regions.length === 0) return null;
    
    // Find the nearest line center
    let nearestIndex = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      const distance = Math.abs(x - region.centerX);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = region.index;
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
      const { thresholdColor, thresholdValue } = this.options;
      
      return {
        isNull: value === null,
        value: value,
        index: region,
        x: region,
        y: value,
        color: (thresholdColor && value < thresholdValue) ? thresholdColor : this.options.lineColor,
        offset: region
      };
    }
    
    return super.getRegionFields(region);
  }

  /**
   * Draw highlight overlay for the hovered discrete line
   * @param {number} region - Region index to highlight
   */
  drawHighlight(region) {
    if (!this.regions) return;
    
    const ctx = this.ctx;
    const targetRegion = this.regions.find(r => r.index === region);
    
    if (targetRegion) {
      const highlightColor = this.lightenColor(targetRegion.color || this.options.lineColor, this.options.highlightLighten);
      
      // Draw highlighted bar (exactly like BarChart)
      ctx.fillStyle = highlightColor;
      ctx.fillRect(targetRegion.x, targetRegion.y, targetRegion.width, targetRegion.height);
    }
  }
}
