// DiscreteChart.js
// Discrete chart implementation (vertical lines)

import { BaseChart } from './BaseChart.js';

export class DiscreteChart extends BaseChart {
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'discrete',
      lineWidth: 'auto',
      lineSpacing: 1,
      lineHeight: '30%', // Defaults to 30% of graph height per jQuery Sparkline
      thresholdColor: undefined,
      thresholdValue: 0,
      chartRangeClip: false
    };
  }

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

    // Draw discrete lines
    this.values.forEach((value, index) => {
      if (value === null) return;

      let clippedValue = value;
      if (chartRangeClip) {
        clippedValue = Math.max(minVal, Math.min(maxVal, value));
      }

      // Calculate x position using spacing logic
      let x;
      if (lineWidth === 'fill' || (typeof lineWidth === 'string' && lineWidth !== 'auto')) {
        // Fill mode: use old positioning logic (no spacing)
        x = (index * this.width / this.values.length) + (this.width / this.values.length) / 2;
      } else {
        // Auto or numeric mode: use spacing-aware positioning
        x = centerOffset + index * (lineWidthFinal + lineSpacing) + lineWidthFinal / 2;
      }

      const normalizedValue = (clippedValue - minVal) / range;
      const lineTop = topOffset + height - (normalizedValue * height);
      const lineBottom = lineTop + finalLineHeight;

      // Choose color based on threshold
      let color = lineColor;
      if (thresholdColor && clippedValue < thresholdValue) {
        color = thresholdColor;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, lineWidthFinal - 1);
      ctx.beginPath();
      ctx.moveTo(x, lineTop);
      ctx.lineTo(x, Math.min(lineBottom, this.height - bottomOffset));
      ctx.stroke();
    });
  }

  // Get color for a specific region
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

  getRegionAtPoint(x, y) {
    if (this.values.length === 0) return null;
    
    const { lineWidth, lineSpacing } = this.options;
    
    // Handle lineWidth calculation (same logic as draw method)
    let lineWidthFinal = lineWidth;
    let centerOffset = 0;
    
    if (lineWidth === 'auto') {
      lineWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * lineSpacing) / this.values.length));
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (lineWidth === 'fill' || typeof lineWidth === 'string') {
      lineWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0;
    } else {
      lineWidthFinal = lineWidth;
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }
    
    // Find which line was clicked
    for (let index = 0; index < this.values.length; index++) {
      if (this.values[index] === null) continue;
      
      let lineX;
      if (lineWidth === 'fill' || (typeof lineWidth === 'string' && lineWidth !== 'auto')) {
        lineX = (index * this.width / this.values.length) + (this.width / this.values.length) / 2;
      } else {
        lineX = centerOffset + index * (lineWidthFinal + lineSpacing) + lineWidthFinal / 2;
      }
      
      // For discrete charts, we want a wider hit area around each line
      const hitWidth = Math.max(lineWidthFinal * 0.8, 8); // At least 8px wide or 80% of line width
      
      // Check if mouse is within the hit area horizontally
      if (Math.abs(x - lineX) <= hitWidth / 2) {
        return index;
      }
    }
    
    return null;
  }

  // Get nearest region to mouse cursor for smooth tooltip following
  getNearestRegion(x, y) {
    if (this.values.length === 0) return null;
    
    const { lineWidth, lineSpacing } = this.options;
    
    // Handle lineWidth calculation (same logic as draw method)
    let lineWidthFinal = lineWidth;
    let centerOffset = 0;
    
    if (lineWidth === 'auto') {
      lineWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * lineSpacing) / this.values.length));
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (lineWidth === 'fill' || typeof lineWidth === 'string') {
      lineWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0;
    } else {
      lineWidthFinal = lineWidth;
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    }
    
    // Find the nearest line center
    let nearestIndex = -1;
    let minDistance = Infinity;
    
    for (let index = 0; index < this.values.length; index++) {
      if (this.values[index] === null) continue;
      
      let lineX;
      if (lineWidth === 'fill' || (typeof lineWidth === 'string' && lineWidth !== 'auto')) {
        lineX = (index * this.width / this.values.length) + (this.width / this.values.length) / 2;
      } else {
        lineX = centerOffset + index * (lineWidthFinal + lineSpacing) + lineWidthFinal / 2;
      }
      
      const distance = Math.abs(x - lineX);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    }
    
    return nearestIndex >= 0 ? nearestIndex : null;
  }

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

  drawHighlight(region) {
    if (typeof region !== 'number' || this.values[region] === null) return;
    
    const ctx = this.ctx;
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { lineHeight, lineColor, thresholdColor, thresholdValue, lineWidth, lineSpacing } = this.options;
    
    // Handle lineWidth calculation (same logic as draw method)
    let lineWidthFinal = lineWidth;
    let centerOffset = 0;
    
    if (lineWidth === 'auto') {
      lineWidthFinal = Math.max(1, Math.floor((this.width - (this.values.length - 1) * lineSpacing) / this.values.length));
      const totalChartWidth = this.values.length * lineWidthFinal + (this.values.length - 1) * lineSpacing;
      centerOffset = Math.max(0, (this.width - totalChartWidth) / 2);
    } else if (lineWidth === 'fill' || typeof lineWidth === 'string') {
      lineWidthFinal = Math.floor(this.width / this.values.length);
      centerOffset = 0;
    } else {
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
    
    // Calculate line center position using spacing logic
    let centerX;
    if (lineWidth === 'fill' || (typeof lineWidth === 'string' && lineWidth !== 'auto')) {
      centerX = (region * this.width / this.values.length) + (this.width / this.values.length) / 2;
    } else {
      centerX = centerOffset + region * (lineWidthFinal + lineSpacing) + lineWidthFinal / 2;
    }
    
    // Calculate the actual line position like in the draw method
    const value = this.values[region];
    const minVal = this.options.chartRangeMin !== undefined ? 
      this.options.chartRangeMin : Math.min(...this.values.filter(v => v !== null));
    const maxVal = this.options.chartRangeMax !== undefined ? 
      this.options.chartRangeMax : Math.max(...this.values.filter(v => v !== null));

    let range = maxVal - minVal;
    if (range === 0) range = 1;
    
    const normalizedValue = (value - minVal) / range;
    const lineTop = topOffset + height - (normalizedValue * height);
    const lineBottom = lineTop + finalLineHeight;
    
    ctx.save();
    
    // Draw a wider highlight background
    const highlightWidth = Math.max(lineWidthFinal * 0.8, 8);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(centerX - highlightWidth/2, topOffset, highlightWidth, height);
    
    // Draw a thicker highlighted line
    ctx.globalAlpha = 0.8;
    let highlightColor = (thresholdColor && value < thresholdValue) ? thresholdColor : lineColor;
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = Math.max(3, Math.max(1, lineWidthFinal - 1) + 2); // Make it 2px thicker
    ctx.beginPath();
    ctx.moveTo(centerX, lineTop);
    ctx.lineTo(centerX, Math.min(lineBottom, this.height - bottomOffset));
    ctx.stroke();
    
    ctx.restore();
  }
}
