// BoxChart.js
// Box plot implementation

import { BaseChart } from './BaseChart.js';

/**
 * BoxChart renderer for sparkline box plot charts
 * Renders statistical distributions with quartiles, whiskers, and outliers
 * @extends BaseChart
 */
export class BoxChart extends BaseChart {
  /**
   * Constructor for BoxChart
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} props - Chart properties
   */
  constructor(ctx, props) {
    super(ctx, props);
    this._cachedStats = null;
    this._cachedStatsData = null;
  }

  /**
   * Get default options for box plot chart
   * @returns {Object} Default options object
   */
  static getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'box',
      raw: false,
      boxLineColor: '#2c3e50', // Professional dark blue-gray (replaces pure black)
      boxFillColor: '#e8f4f8', // Soft light blue-gray (replaces bright #cdf)
      whiskerColor: '#2c3e50', // Match box line for consistency
      outlierLineColor: '#7f8c8d', // Medium gray (replaces #333)
      outlierFillColor: '#ecf0f1', // Very light gray (replaces white for subtlety)
      medianColor: '#c0392b', // Professional deep red (replaces bright #f00)
      showOutliers: true,
      outlierIQR: 1.5,
      spotRadius: 1.5,
      target: undefined,
      targetColor: '#27ae60', // Professional green (replaces bright #4a2)
      minValue: undefined,
      maxValue: undefined,
      highlightSpotColor: '#3498db', // Refined blue for hover
      isHorizontal: true, // Default to horizontal orientation
      showMean: false, // Show mean indicator
      meanColor: '#8e44ad', // Professional purple (replaces bright blue, colorblind-friendly)
      meanSymbol: 'diamond', // Symbol for mean: 'diamond', 'circle', 'line'
      boxWidth: 0.5, // Box width as fraction of chart height/width (0.1 to 1.0)
      borderRadius: 2, // Corner radius in pixels for rounded box
      whiskerStyle: 'tbar' // Whisker end style: 'tbar', 'line', 'none'
    };
  }

  /**
   * Calculate box plot statistics from raw values
   * @param {number[]} values - Array of numeric values
   * @returns {Object|null} Statistics object with q1, q2 (median), q3, whiskers, and outliers
   * @private
   */
  calculateBoxPlotStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    if (n === 0) return null;

    const q1Index = Math.floor(n * 0.25);
    const q2Index = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);

    const q1 = sorted[q1Index];
    const q2 = n % 2 === 0 ? (sorted[q2Index - 1] + sorted[q2Index]) / 2 : sorted[q2Index];
    const q3 = sorted[q3Index];

    const iqr = q3 - q1;
    const lowerFence = q1 - this.options.outlierIQR * iqr;
    const upperFence = q3 + this.options.outlierIQR * iqr;

    // Find whisker ends (min/max values within fences)
    const lowerWhisker = sorted.find(v => v >= lowerFence) || q1;
    const upperWhisker = sorted.slice().reverse().find(v => v <= upperFence) || q3;

    // Find outliers
    const outliers = sorted.filter(v => v < lowerFence || v > upperFence);

    // Calculate mean
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    return {
      q1,
      q2, // median
      q3,
      lowerWhisker,
      upperWhisker,
      outliers,
      mean,
      count: n
    };
  }

  /**
   * Get box plot statistics with caching for performance
   * Supports both raw mode (pre-calculated stats) and computed mode
   * @returns {Object|null} Statistics object or null if no data
   * @private
   */
  getStats() {
    const { raw } = this.options;
    
    // For raw mode, always compute directly (no caching needed as it's just array access)
    if (raw && this.values.length >= 7) {
      const allValues = this.values.filter(v => v !== null);
      const mean = allValues.length > 0 ? allValues.reduce((sum, v) => sum + v, 0) / allValues.length : 0;
      
      return {
        q1: this.values[2],
        q2: this.values[3], // median
        q3: this.values[4],
        lowerWhisker: this.values[1],
        upperWhisker: this.values[5],
        outliers: [this.values[0], this.values[6]].filter(v => v !== null),
        mean,
        count: allValues.length
      };
    }

    // For computed mode, use caching
    const validValues = this.values.filter(v => v !== null);
    if (validValues.length === 0) return null;

    // Check if we can use cached result
    if (this._cachedStats && this._cachedStatsData && 
        this._cachedStatsData.length === validValues.length &&
        this._cachedStatsData.every((val, i) => val === validValues[i])) {
      return this._cachedStats;
    }

    // Calculate and cache
    this._cachedStats = this.calculateBoxPlotStats(validValues);
    this._cachedStatsData = [...validValues]; // Store copy for comparison
    return this._cachedStats;
  }

  /**
   * Draw the box plot with quartiles, whiskers, median, and outliers
   */
  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      boxLineColor, boxFillColor, whiskerColor, 
      medianColor, outlierLineColor, outlierFillColor,
      showOutliers, spotRadius, target, targetColor, raw, isHorizontal
    } = this.options;

    let stats;
    
    if (raw) {
      // Pre-computed values: [low_outlier, low_whisker, q1, median, q3, high_whisker, high_outlier]
      if (this.values.length < 7) return;
      stats = {
        q1: this.values[2],
        q2: this.values[3], // median
        q3: this.values[4],
        lowerWhisker: this.values[1],
        upperWhisker: this.values[5],
        outliers: [this.values[0], this.values[6]].filter(v => v !== null)
      };
    } else {
      // Use cached computation
      stats = this.getStats();
    }

    if (!stats) return;

    // Calculate scale
    const allValues = [
      stats.lowerWhisker, stats.q1, stats.q2, stats.q3, stats.upperWhisker,
      ...stats.outliers
    ].filter(v => v !== null);
    
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;

    // Helper functions to get coordinates based on orientation
    const getY = (value) => topOffset + height - ((value - minVal) / range) * height;
    const getX = (value) => ((value - minVal) / range) * width;

    if (isHorizontal) {
      // Horizontal orientation
      const boxHeight = Math.max(Math.min(this.height * this.options.boxWidth, this.height * 0.9), 10);
      const boxTop = (this.height - boxHeight) / 2;
      const boxBottom = boxTop + boxHeight;

      // Draw box with rounded corners
      const boxLeft = getX(stats.q1);
      const boxRight = getX(stats.q3);
      const boxWidth = boxRight - boxLeft;
      const radius = Math.min(this.options.borderRadius, boxHeight / 2, boxWidth / 2);

      ctx.fillStyle = boxFillColor;
      ctx.beginPath();
      ctx.moveTo(boxLeft + radius, boxTop);
      ctx.lineTo(boxRight - radius, boxTop);
      ctx.arcTo(boxRight, boxTop, boxRight, boxTop + radius, radius);
      ctx.lineTo(boxRight, boxBottom - radius);
      ctx.arcTo(boxRight, boxBottom, boxRight - radius, boxBottom, radius);
      ctx.lineTo(boxLeft + radius, boxBottom);
      ctx.arcTo(boxLeft, boxBottom, boxLeft, boxBottom - radius, radius);
      ctx.lineTo(boxLeft, boxTop + radius);
      ctx.arcTo(boxLeft, boxTop, boxLeft + radius, boxTop, radius);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = boxLineColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw median line
      const medianX = getX(stats.q2);
      ctx.strokeStyle = medianColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(medianX, boxTop);
      ctx.lineTo(medianX, boxBottom);
      ctx.stroke();

      // Draw whiskers
      ctx.strokeStyle = whiskerColor;
      ctx.lineWidth = 1;

      const centerY = this.height / 2;
      const whiskerHeight = boxHeight * 0.6;
      const whiskerTop = centerY - whiskerHeight / 2;
      const whiskerBottom = centerY + whiskerHeight / 2;

      // Left whisker
      const lowerWhiskerX = getX(stats.lowerWhisker);
      ctx.beginPath();
      ctx.moveTo(boxLeft, centerY);
      ctx.lineTo(lowerWhiskerX, centerY);
      ctx.stroke();
      
      // Left whisker cap (T-bar)
      if (this.options.whiskerStyle === 'tbar') {
        ctx.beginPath();
        ctx.moveTo(lowerWhiskerX, whiskerTop);
        ctx.lineTo(lowerWhiskerX, whiskerBottom);
        ctx.stroke();
      }

      // Right whisker
      const upperWhiskerX = getX(stats.upperWhisker);
      ctx.beginPath();
      ctx.moveTo(boxRight, centerY);
      ctx.lineTo(upperWhiskerX, centerY);
      ctx.stroke();
      
      // Right whisker cap (T-bar)
      if (this.options.whiskerStyle === 'tbar') {
        ctx.beginPath();
        ctx.moveTo(upperWhiskerX, whiskerTop);
        ctx.lineTo(upperWhiskerX, whiskerBottom);
        ctx.stroke();
      }

      // Draw outliers
      if (showOutliers && stats.outliers.length > 0) {
        ctx.strokeStyle = outlierLineColor;
        ctx.fillStyle = outlierFillColor;
        ctx.lineWidth = 1;

        stats.outliers.forEach(outlier => {
          const x = getX(outlier);
          ctx.beginPath();
          ctx.arc(x, centerY, spotRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
      }

      // Draw target if specified
      if (target !== undefined && targetColor) {
        const targetX = getX(target);
        ctx.strokeStyle = targetColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(targetX, 0);
        ctx.lineTo(targetX, this.height);
        ctx.stroke();
      }

      // Draw mean indicator if enabled
      if (this.options.showMean && stats.mean !== undefined) {
        const meanX = getX(stats.mean);
        this.drawMeanIndicator(ctx, meanX, centerY, boxHeight, true);
      }
    } else {
      // Vertical orientation
      const boxWidth = Math.max(Math.min(this.width * this.options.boxWidth, this.width * 0.9), 10);
      const boxLeft = (this.width - boxWidth) / 2;
      const boxRight = boxLeft + boxWidth;

      // Draw box with rounded corners
      const boxTop = getY(stats.q3);
      const boxBottom = getY(stats.q1);
      const boxHeight = boxBottom - boxTop;
      const radius = Math.min(this.options.borderRadius, boxWidth / 2, boxHeight / 2);

      ctx.fillStyle = boxFillColor;
      ctx.beginPath();
      ctx.moveTo(boxLeft + radius, boxTop);
      ctx.lineTo(boxRight - radius, boxTop);
      ctx.arcTo(boxRight, boxTop, boxRight, boxTop + radius, radius);
      ctx.lineTo(boxRight, boxBottom - radius);
      ctx.arcTo(boxRight, boxBottom, boxRight - radius, boxBottom, radius);
      ctx.lineTo(boxLeft + radius, boxBottom);
      ctx.arcTo(boxLeft, boxBottom, boxLeft, boxBottom - radius, radius);
      ctx.lineTo(boxLeft, boxTop + radius);
      ctx.arcTo(boxLeft, boxTop, boxLeft + radius, boxTop, radius);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = boxLineColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw median line
      const medianY = getY(stats.q2);
      ctx.strokeStyle = medianColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxLeft, medianY);
      ctx.lineTo(boxRight, medianY);
      ctx.stroke();

      // Draw whiskers
      ctx.strokeStyle = whiskerColor;
      ctx.lineWidth = 1;

      const centerX = this.width / 2;
      const whiskerWidth = boxWidth * 0.6;
      const whiskerLeft = centerX - whiskerWidth / 2;
      const whiskerRight = centerX + whiskerWidth / 2;

      // Upper whisker
      const upperWhiskerY = getY(stats.upperWhisker);
      ctx.beginPath();
      ctx.moveTo(centerX, boxTop);
      ctx.lineTo(centerX, upperWhiskerY);
      ctx.stroke();
      
      // Upper whisker cap (T-bar)
      if (this.options.whiskerStyle === 'tbar') {
        ctx.beginPath();
        ctx.moveTo(whiskerLeft, upperWhiskerY);
        ctx.lineTo(whiskerRight, upperWhiskerY);
        ctx.stroke();
      }

      // Lower whisker
      const lowerWhiskerY = getY(stats.lowerWhisker);
      ctx.beginPath();
      ctx.moveTo(centerX, boxBottom);
      ctx.lineTo(centerX, lowerWhiskerY);
      ctx.stroke();
      
      // Lower whisker cap (T-bar)
      if (this.options.whiskerStyle === 'tbar') {
        ctx.beginPath();
        ctx.moveTo(whiskerLeft, lowerWhiskerY);
        ctx.lineTo(whiskerRight, lowerWhiskerY);
        ctx.stroke();
      }

      // Draw outliers
      if (showOutliers && stats.outliers.length > 0) {
        ctx.strokeStyle = outlierLineColor;
        ctx.fillStyle = outlierFillColor;
        ctx.lineWidth = 1;

        stats.outliers.forEach(outlier => {
          const y = getY(outlier);
          ctx.beginPath();
          ctx.arc(centerX, y, spotRadius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
      }

      // Draw target if specified
      if (target !== undefined && targetColor) {
        const targetY = getY(target);
        ctx.strokeStyle = targetColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, targetY);
        ctx.lineTo(this.width, targetY);
        ctx.stroke();
      }

      // Draw mean indicator if enabled
      if (this.options.showMean && stats.mean !== undefined) {
        const meanY = getY(stats.mean);
        const centerX = this.width / 2;
        this.drawMeanIndicator(ctx, centerX, meanY, boxWidth, false);
      }
    }
  }

  /**
   * Draw mean indicator with different symbol options
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} size - Size reference (boxWidth or boxHeight)
   * @param {boolean} isHorizontal - Orientation
   * @private
   */
  drawMeanIndicator(ctx, x, y, size, isHorizontal) {
    const { meanColor, meanSymbol } = this.options;
    
    ctx.save();
    ctx.fillStyle = meanColor;
    ctx.strokeStyle = meanColor;
    ctx.lineWidth = 2;
    
    const symbolSize = Math.min(size * 0.4, 6); // Max 6px
    
    switch (meanSymbol) {
      case 'diamond':
        // Draw diamond shape
        ctx.beginPath();
        ctx.moveTo(x, y - symbolSize);
        ctx.lineTo(x + symbolSize, y);
        ctx.lineTo(x, y + symbolSize);
        ctx.lineTo(x - symbolSize, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'circle':
        // Draw filled circle
        ctx.beginPath();
        ctx.arc(x, y, symbolSize / 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'line':
        // Draw line across the box
        if (isHorizontal) {
          ctx.beginPath();
          ctx.moveTo(x, y - size * 0.4);
          ctx.lineTo(x, y + size * 0.4);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(x - size * 0.4, y);
          ctx.lineTo(x + size * 0.4, y);
          ctx.stroke();
        }
        break;
    }
    
    ctx.restore();
  }

  /**
   * Get the nearest region to the mouse cursor for smooth tooltip following
   * For box plots, always shows summary when mouse is over the chart
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Region index (always 0 for box plots) or null
   */
  getNearestRegion(x, y) {
    // For box plots, always show the summary when mouse is over the chart
    const { width, height } = this;
    
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      return 0; // Always return 0 to show box plot summary
    }
    
    return null;
  }

  /**
   * Get tooltip content with detailed box plot statistics
   * @param {number} region - Region index
   * @returns {Object|null} Tooltip content with items array containing all stats
   */
  getTooltipContent(region) {
    const stats = this.getStats();
    if (!stats) return null;
    
    // Use orientation-aware labels
    const { isHorizontal } = this.options;
    const lowerLabel = isHorizontal ? 'Min' : 'Lower';
    const upperLabel = isHorizontal ? 'Max' : 'Upper';
    
    const items = [
      {
        label: `${lowerLabel} Whisker: ${stats.lowerWhisker.toFixed(2)}`,
        color: this.options.whiskerColor
      },
      {
        label: `Q1 (25th %ile): ${stats.q1.toFixed(2)}`,
        color: this.options.boxFillColor
      },
      {
        label: `Median (50th %ile): ${stats.q2.toFixed(2)}`,
        color: this.options.medianColor
      },
      {
        label: `Q3 (75th %ile): ${stats.q3.toFixed(2)}`,
        color: this.options.boxFillColor
      },
      {
        label: `${upperLabel} Whisker: ${stats.upperWhisker.toFixed(2)}`,
        color: this.options.whiskerColor
      }
    ];
    
    // Add outliers if present
    if (stats.outliers && stats.outliers.length > 0) {
      stats.outliers.forEach((outlier, index) => {
        items.push({
          label: `Outlier ${index + 1}: ${outlier.toFixed(2)}`,
          color: this.options.outlierFillColor
        });
      });
    }
    
    // Add mean if available
    if (stats.mean !== undefined) {
      items.push({
        label: `Mean: ${stats.mean.toFixed(2)}`,
        color: this.options.meanColor
      });
    }
    
    // Add IQR and range info
    const iqr = stats.q3 - stats.q1;
    const range = stats.upperWhisker - stats.lowerWhisker;
    items.push({
      label: `IQR: ${iqr.toFixed(2)}`,
      color: '#999'
    });
    items.push({
      label: `Range: ${range.toFixed(2)}`,
      color: '#999'
    });
    
    // Add sample size if available
    if (stats.count !== undefined) {
      items.push({
        label: `n = ${stats.count}`,
        color: '#666'
      });
    }
    
    return { items };
  }

  /**
   * Default tooltip formatting for box plots (jquery.sparkline compatible)
   * @param {number} value - Value to format
   * @param {number} region - Region index
   * @returns {string} Formatted multi-line tooltip text
   */
  getDefaultTooltipFormat(value, region) {
    const stats = this.getStats();
    if (!stats) return 'No data';
    
    // Use orientation-aware labels
    const { isHorizontal } = this.options;
    const lowerLabel = isHorizontal ? 'Min' : 'Lower';
    const upperLabel = isHorizontal ? 'Max' : 'Upper';
    
    // Format with modern statistical notation
    return `Q1 (25th %ile): ${stats.q1.toFixed(2)}
Median (50th %ile): ${stats.q2.toFixed(2)}  
Q3 (75th %ile): ${stats.q3.toFixed(2)}
${lowerLabel} Whisker: ${stats.lowerWhisker.toFixed(2)}
${upperLabel} Whisker: ${stats.upperWhisker.toFixed(2)}`;
  }

  /**
   * Get the region at a specific point for interaction detection
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Region index (always 0 for box plots) or null
   */
  getRegionAtPoint(x, y) {
    // For box plots, we could detect different regions (quartiles, whiskers, etc.)
    // For now, return 0 if within the chart area
    const { topOffset } = this.getDrawingDimensions();
    if (x >= 0 && x <= this.width && y >= topOffset && y <= this.height - topOffset) {
      return 0;
    }
    return null;
  }

  /**
   * Get standardized fields for a box plot region (sparkline.js compliance)
   * @param {number} region - Region index
   * @returns {Object|null} Region fields object with quartiles and whiskers
   */
  getRegionFields(region) {
    if (region === 0) {
      const stats = this.getStats();
      if (!stats) return null;
      
      return {
        isNull: false,
        value: stats.q2, // median as primary value
        index: 0,
        field: 'med',
        x: 0,
        y: stats.q2,
        lq: stats.q1,
        med: stats.q2,
        uq: stats.q3,
        lw: stats.lowerWhisker,
        rw: stats.upperWhisker,
        lo: stats.outliers.length > 0 ? Math.min(...stats.outliers) : null,
        ro: stats.outliers.length > 0 ? Math.max(...stats.outliers) : null
      };
    }
    
    return super.getRegionFields(region);
  }

  /**
   * Draw highlight overlay for the hovered box plot
   * Highlights the box outline and median line
   * @param {number} region - Region index to highlight
   */
  drawHighlight(region) {
    if (region === null || region === undefined) return;
    
    const ctx = this.ctx;
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { isHorizontal } = this.options;
    
    // Get the box plot stats using cached method
    const stats = this.getStats();
    if (!stats) return;
    
    // Calculate scale (same as in draw method)
    const allValues = [
      stats.lowerWhisker, stats.q1, stats.q2, stats.q3, stats.upperWhisker,
      ...stats.outliers
    ].filter(v => v !== null);
    
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    
    const getY = (value) => topOffset + height - ((value - minVal) / range) * height;
    const getX = (value) => ((value - minVal) / range) * width;
    
    ctx.save();
    
    if (isHorizontal) {
      // Horizontal orientation highlight (match actual box dimensions)
      const boxHeight = Math.max(Math.min(this.height * this.options.boxWidth, this.height * 0.9), 10);
      const boxTop = (this.height - boxHeight) / 2;
      const boxBottom = boxTop + boxHeight;
      const boxLeft = getX(stats.q1);
      const boxRight = getX(stats.q3);
      const boxWidth = boxRight - boxLeft;
      const radius = Math.min(this.options.borderRadius, boxHeight / 2, boxWidth / 2);
      
      // Draw a subtle highlight outline around the box with rounded corners
      ctx.strokeStyle = this.options.highlightSpotColor || '#3498db';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(boxLeft + radius, boxTop);
      ctx.lineTo(boxRight - radius, boxTop);
      ctx.arcTo(boxRight, boxTop, boxRight, boxTop + radius, radius);
      ctx.lineTo(boxRight, boxBottom - radius);
      ctx.arcTo(boxRight, boxBottom, boxRight - radius, boxBottom, radius);
      ctx.lineTo(boxLeft + radius, boxBottom);
      ctx.arcTo(boxLeft, boxBottom, boxLeft, boxBottom - radius, radius);
      ctx.lineTo(boxLeft, boxTop + radius);
      ctx.arcTo(boxLeft, boxTop, boxLeft + radius, boxTop, radius);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Vertical orientation highlight (match actual box dimensions)
      const boxWidth = Math.max(Math.min(this.width * this.options.boxWidth, this.width * 0.9), 10);
      const boxLeft = (this.width - boxWidth) / 2;
      const boxRight = boxLeft + boxWidth;
      const boxTop = getY(stats.q3);
      const boxBottom = getY(stats.q1);
      const boxHeight = boxBottom - boxTop;
      const radius = Math.min(this.options.borderRadius, boxWidth / 2, boxHeight / 2);
      
      // Draw a subtle highlight outline around the box with rounded corners
      ctx.strokeStyle = this.options.highlightSpotColor || '#3498db';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(boxLeft + radius, boxTop);
      ctx.lineTo(boxRight - radius, boxTop);
      ctx.arcTo(boxRight, boxTop, boxRight, boxTop + radius, radius);
      ctx.lineTo(boxRight, boxBottom - radius);
      ctx.arcTo(boxRight, boxBottom, boxRight - radius, boxBottom, radius);
      ctx.lineTo(boxLeft + radius, boxBottom);
      ctx.arcTo(boxLeft, boxBottom, boxLeft, boxBottom - radius, radius);
      ctx.lineTo(boxLeft, boxTop + radius);
      ctx.arcTo(boxLeft, boxTop, boxLeft + radius, boxTop, radius);
      ctx.closePath();
      ctx.stroke();
    }
    
    ctx.restore();
  }
}
