// BarChart.js
// Bar chart implementation

import { BaseChart } from './BaseChart.js';

export class BarChart extends BaseChart {
  getDefaults() {
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
      stackedBarColor: undefined
    };
  }

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

  // Get region at specific point for interaction
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

  // Get nearest region to mouse cursor for smooth tooltip following
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

  // Draw highlight for hovered bar
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

  // Get tooltip content - override for multi-value stacked bars and single-value bars
  getTooltipContent(region) {
    // Check if this is stacked data
    const isStacked = this.regions.length > 0 && this.regions[0].stackIndex !== undefined;
    
    if (isStacked) {
      // Multi-value tooltip for stacked bars
      const stackedRegions = this.regions.filter(r => r.valueIndex === region);
      
      if (stackedRegions.length === 0) return null;
      
      // Sort by stackIndex to show in visual order (top to bottom)
      stackedRegions.sort((a, b) => b.stackIndex - a.stackIndex);
      
      const items = stackedRegions.map(r => {
        const stackValue = this.stackedValues[r.valueIndex][r.stackIndex];
        const formattedValue = this.formatTooltipValue(stackValue, r.valueIndex);
        return {
          label: `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`,
          color: this.getBarColor(stackValue, r.valueIndex, r.stackIndex)
        };
      });
      
      return { items };
    } else {
      // Single-value tooltip for regular bars
      const color = this.getRegionColor(region);
      if (color && typeof region === 'number' && region >= 0 && region < this.values.length) {
        const value = this.values[region];
        const formattedValue = this.formatTooltipValue(value, region);
        const fullLabel = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
        
        return {
          items: [{
            label: fullLabel,
            color: color
          }]
        };
      }
    }
    
    return null; // Use default tooltip without color
  }

  // Get color for a specific region
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

  // Format tooltip value for bar charts
  getDefaultTooltipFormat(value, region) {
    if (typeof region === 'object' && region.stackIndex !== undefined) {
      return `Stack ${region.stackIndex + 1}, Segment ${region.segmentIndex + 1}: ${region.value}`;
    }
    return `Bar ${region + 1}: ${value}`;
  }

  // Get enhanced data for bar chart tooltips
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

  // Override getRegionFields for bar chart compliance
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

  // Helper method to get bar color
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
