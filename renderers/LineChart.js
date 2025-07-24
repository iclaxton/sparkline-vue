// LineChart.js
// Line chart implementation

import { BaseChart } from './BaseChart.js';

export class LineChart extends BaseChart {
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'line',
      spotColor: '#f80',
      minSpotColor: '#f44',
      maxSpotColor: '#4f4',
      valueSpots: {},
      chartRangeClip: false,
      chartRangeMinX: undefined,
      chartRangeMaxX: undefined,
      xvalues: undefined
    };
  }

  processValues(data) {
    const processed = [];
    const xvals = [];
    const yvals = [];

    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      
      if (val === null || val === undefined) {
        processed.push(null);
        xvals.push(i);
        yvals.push(null);
      } else if (Array.isArray(val) && val.length === 2) {
        // Handle [x, y] pairs
        processed.push(val);
        xvals.push(val[0]);
        yvals.push(val[1]);
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          processed.push(num);
          xvals.push(i);
          yvals.push(num);
        }
      }
    }

    this.xvalues = xvals;
    this.yvalues = yvals;
    return processed;
  }

  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { lineColor, fillColor, lineWidth, spotRadius, spotColor } = this.options;

    // Calculate ranges
    const yVals = this.yvalues.filter(v => v !== null);
    if (yVals.length === 0) return;

    const minY = this.options.chartRangeMin !== undefined ? this.options.chartRangeMin : Math.min(...yVals);
    const maxY = this.options.chartRangeMax !== undefined ? this.options.chartRangeMax : Math.max(...yVals);
    const minX = Math.min(...this.xvalues);
    const maxX = Math.max(...this.xvalues);

    const rangeY = maxY - minY || 1;
    const rangeX = maxX - minX || 1;

    // Draw normal range if specified
    this.drawNormalRange(ctx, minY, maxY, rangeY, topOffset);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillColor;

    // Build path and store points for interaction
    ctx.beginPath();
    let lastWasNull = true; // Start as if last was null to force initial moveTo
    const points = [];
    this.regions = []; // Clear previous regions

    for (let i = 0; i < this.values.length; i++) {
      if (this.yvalues[i] !== null) {
        const x = ((this.xvalues[i] - minX) / rangeX) * this.width;
        const y = topOffset + height - ((this.yvalues[i] - minY) / rangeY) * height;
        
        const point = { x, y, value: this.yvalues[i], index: i };
        points.push(point);
        
        // Store region for mouse interaction
        this.regions.push({
          x: x - 5, // 5px tolerance
          y: y - 5,
          width: 10,
          height: 10,
          index: i,
          value: this.yvalues[i]
        });

        // If the previous value was null, or this is the first point, use moveTo
        // Otherwise, continue the line with lineTo
        if (lastWasNull) {
          ctx.moveTo(x, y);
          lastWasNull = false;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        // Current value is null - set flag to break the line
        lastWasNull = true;
      }
    }

    // Fill area if fillColor is specified
    if (fillColor && fillColor !== 'transparent' && fillColor !== '' && points.length > 0) {
      // Group points into continuous segments (separated by nulls)
      const segments = [];
      let currentSegment = [];
      
      // Rebuild segments by checking original data for nulls
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const dataIndex = point.index;
        
        // Check if there was a null before this point (breaking continuity)
        if (currentSegment.length > 0) {
          const lastPointIndex = currentSegment[currentSegment.length - 1].index;
          let hasNullBetween = false;
          for (let j = lastPointIndex + 1; j < dataIndex; j++) {
            if (this.yvalues[j] === null) {
              hasNullBetween = true;
              break;
            }
          }
          if (hasNullBetween) {
            // Finish current segment and start new one
            if (currentSegment.length > 0) {
              segments.push([...currentSegment]);
            }
            currentSegment = [];
          }
        }
        
        currentSegment.push(point);
      }
      
      // Add final segment
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      
      // Fill each continuous segment
      ctx.save();
      segments.forEach(segment => {
        if (segment.length > 1) { // Need at least 2 points to fill
          ctx.beginPath();
          
          // Draw the line for this segment
          segment.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          
          // Close the area
          const lastPoint = segment[segment.length - 1];
          const firstPoint = segment[0];
          ctx.lineTo(lastPoint.x, this.height - bottomOffset);
          ctx.lineTo(firstPoint.x, this.height - bottomOffset);
          ctx.closePath();
          ctx.fill();
        }
      });
      ctx.restore();
      
      // Redraw the line on top - rebuild the path with gaps
      ctx.beginPath();
      let lastWasNullForRedraw = true;
      for (let i = 0; i < this.values.length; i++) {
        if (this.yvalues[i] !== null) {
          const x = ((this.xvalues[i] - minX) / rangeX) * this.width;
          const y = topOffset + height - ((this.yvalues[i] - minY) / rangeY) * height;
          
          if (lastWasNullForRedraw) {
            ctx.moveTo(x, y);
            lastWasNullForRedraw = false;
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          lastWasNullForRedraw = true;
        }
      }
    }

    ctx.stroke();

    // Store points for highlighting
    this.points = points;

    // Draw spots
    if (spotRadius > 0 && spotColor) {
      ctx.fillStyle = spotColor;
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, spotRadius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw min/max spots if specified
    this.drawMinMaxSpots(points, minY, maxY);
  }

  drawNormalRange(ctx, minY, maxY, rangeY, topOffset) {
    const { normalRangeMin, normalRangeMax, normalRangeColor } = this.options;
    
    if (normalRangeMin !== undefined && normalRangeMax !== undefined && normalRangeColor) {
      const { height } = this.getDrawingDimensions();
      const yMin = topOffset + height - ((normalRangeMin - minY) / rangeY) * height;
      const yMax = topOffset + height - ((normalRangeMax - minY) / rangeY) * height;
      
      ctx.fillStyle = normalRangeColor;
      ctx.fillRect(0, yMax, this.width, yMin - yMax);
    }
  }

  drawMinMaxSpots(points, minY, maxY) {
    const { minSpotColor, maxSpotColor, spotRadius } = this.options;
    const ctx = this.ctx;
    
    if (!minSpotColor && !maxSpotColor) return;

    points.forEach(point => {
      if (point.value === minY && minSpotColor) {
        ctx.fillStyle = minSpotColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, spotRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (point.value === maxY && maxSpotColor) {
        ctx.fillStyle = maxSpotColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, spotRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }

  // Get region at specific point for interaction
  getRegionAtPoint(x, y) {
    if (!this.regions) return null;
    
    for (let i = 0; i < this.regions.length; i++) {
      const region = this.regions[i];
      if (x >= region.x && x <= region.x + region.width &&
          y >= region.y && y <= region.y + region.height) {
        return region.index;
      }
    }
    return null;
  }

  // Get nearest region to mouse cursor for smooth tooltip following
  getNearestRegion(x, y) {
    if (!this.points || this.points.length === 0) return null;
    
    let nearestIndex = null;
    let nearestDistance = Infinity;
    
    // Find the nearest point based on horizontal distance primarily
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      // Prioritize horizontal distance for better line chart behavior
      const distance = Math.abs(point.x - x) + Math.abs(point.y - y) * 0.1;
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = point.index;
      }
    }
    
    return nearestIndex;
  }

  // Draw highlight for hovered point
  drawHighlight(regionIndex) {
    if (!this.points || regionIndex >= this.points.length) return;
    
    const point = this.points.find(p => p.index === regionIndex);
    if (!point) return;

    const ctx = this.ctx;
    const { highlightSpotColor, highlightLineColor } = this.options;
    
    // Highlight spot
    if (highlightSpotColor) {
      ctx.fillStyle = highlightSpotColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, (this.options.spotRadius || 1.5) + 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Highlight vertical line
    if (highlightLineColor) {
      ctx.strokeStyle = highlightLineColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(point.x, 0);
      ctx.lineTo(point.x, this.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Get tooltip content - override to use yvalues for bounds checking
  getTooltipContent(region) {
    // For single-value tooltips, try to get color information
    const color = this.getRegionColor(region);
    if (color && typeof region === 'number' && region >= 0 && region < this.yvalues.length) {
      const value = this.yvalues[region];
      
      // Check if this is a min/max value
      const yVals = this.yvalues.filter(v => v !== null);
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);
      const isMin = value === minY && value !== maxY && this.options.minSpotColor;
      const isMax = value === maxY && value !== minY && this.options.maxSpotColor;
      
      // If there's a custom formatter, pass additional context about min/max
      let label;
      if (this.options.tooltipFormatter && typeof this.options.tooltipFormatter === 'function') {
        try {
          // Pass min/max information as additional parameters to the formatter
          const result = this.options.tooltipFormatter(value, region, this, {
            isMin: isMin,
            isMax: isMax,
            minValue: minY,
            maxValue: maxY
          });
          label = this.sanitizeTooltipContent(result);
        } catch (error) {
          console.warn('Custom tooltip formatter error:', error);
          const defaultFormatted = this.getDefaultTooltipFormat(value, region);
          label = `${this.options.tooltipPrefix}${defaultFormatted}${this.options.tooltipSuffix}`;
        }
      } else {
        // No custom formatter - use default formatting with min/max labels
        const formattedValue = this.formatTooltipValue(value, region);
        const fullFormattedValue = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
        
        if (isMin) {
          label = `Min: ${fullFormattedValue}`;
        } else if (isMax) {
          label = `Max: ${fullFormattedValue}`;
        } else {
          label = fullFormattedValue;
        }
      }
      
      return {
        items: [{
          label: label,
          color: color
        }]
      };
    }
    
    return null; // Use default single-value tooltip without color
  }

  // Get color for a specific region
  getRegionColor(region) {
    if (typeof region === 'number' && region >= 0 && region < this.yvalues.length) {
      const value = this.yvalues[region]; // Use yvalues, not values
      const { minSpotColor, maxSpotColor, spotColor, lineColor } = this.options;
      
      // Check if this is a special spot
      const yVals = this.yvalues.filter(v => v !== null);
      if (yVals.length === 0) return lineColor;
      
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);
      
      if (value === minY && minSpotColor && value !== maxY) {
        return minSpotColor;
      }
      if (value === maxY && maxSpotColor && value !== minY) {
        return maxSpotColor;
      }
      // For tooltips, always show spot color even if spotRadius is 0
      if (spotColor) {
        return spotColor;
      }
      
      return lineColor;
    }
    return null;
  }

  // Format tooltip value for line charts - only used when no template format is specified
  getDefaultTooltipFormat(value, region) {
    // Only use coordinate format when explicitly no template format is provided
    if (!this.options.tooltipFormat || this.options.tooltipFormat === '') {
      const xValue = this.xvalues[region];
      return `(${xValue}, ${value})`;
    }
    
    // Otherwise use the base class default formatting
    return super.getDefaultTooltipFormat(value, region);
  }

  // Get enhanced data for line chart tooltips
  getTooltipData(value, region) {
    return {
      ...super.getTooltipData(value, region),
      x: this.xvalues[region],
      y: value,
      point: region + 1,
      total: this.values.length
    };
  }

  // Override getRegionFields for line chart compliance
  getRegionFields(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      return {
        isNull: value === null,
        value: value,
        index: region,
        x: this.xvalues[region],
        y: value,
        color: this.options.lineColor,
        fillColor: this.options.fillColor,
        offset: region
      };
    }
    
    return super.getRegionFields(region);
  }
}
