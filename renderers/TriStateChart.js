// TriStateChart.js
// Tristate chart implementation (win/lose/draw)

import { BaseChart } from './BaseChart.js';

export class TriStateChart extends BaseChart {
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'tristate',
      barWidth: 'auto',
      barSpacing: 1,
      posBarColor: '#0f0',
      negBarColor: '#f00',
      zeroBarColor: '#999',
      colorMap: {}
    };
  }

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

  // Get nearest region to mouse cursor for smooth tooltip following
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

  // Get color for a specific region
  getRegionColor(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      return this.getBarColor(value);
    }
    return null;
  }

  // Override getTooltipContent for tristate charts to show win/loss/draw summary
  getTooltipContent(region) {
    // For tristate charts, we can show a summary of all states when hovering over any bar
    const wins = this.values.filter(v => v > 0).length;
    const losses = this.values.filter(v => v < 0).length;
    const draws = this.values.filter(v => v === 0).length;
    
    if (typeof region === 'number') {
      const currentValue = this.values[region];
      const items = [];
      
      // Add current state info
      if (currentValue > 0) {
        items.push({
          label: `Current: Win`,
          color: this.options.posBarColor
        });
      } else if (currentValue < 0) {
        items.push({
          label: `Current: Loss`,
          color: this.options.negBarColor
        });
      } else {
        items.push({
          label: `Current: Draw`,
          color: this.options.zeroBarColor
        });
      }
      
      // Add summary stats
      if (wins > 0) {
        items.push({
          label: `Wins: ${wins}`,
          color: this.options.posBarColor
        });
      }
      
      if (losses > 0) {
        items.push({
          label: `Losses: ${losses}`,
          color: this.options.negBarColor
        });
      }
      
      if (draws > 0) {
        items.push({
          label: `Draws: ${draws}`,
          color: this.options.zeroBarColor
        });
      }
      
      return { items };
    }
    
    return null;
  }

  // Custom tooltip formatting for tristate charts
  getDefaultTooltipFormat(value, region) {
    // Force the custom tooltip format
    if (value === 1) return 'Win';
    if (value === 0) return 'Draw';  
    if (value === -1) return 'Loss';
    return `Tristate: ${value}`; // Fallback that shows it's working
  }

  // Also override formatTooltipValue to ensure our custom format is used
  formatTooltipValue(value, region) {
    return this.getDefaultTooltipFormat(value, region);
  }

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
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, barWidthFinal, currentBarHeight);
    ctx.restore();
  }
}
