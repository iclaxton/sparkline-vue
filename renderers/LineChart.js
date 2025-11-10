// LineChart.js
// Line chart implementation

import { BaseChart } from './BaseChart.js';

/**
 * LineChart renderer for sparkline line charts
 * Supports single-series and multi-series line charts with fills, spots, and highlighting
 * @extends BaseChart
 */
export class LineChart extends BaseChart {
  /**
   * Default high-contrast color palette for multi-series charts
   * @type {string[]}
   * @static
   */
  static DEFAULT_SERIES_COLORS = [
    '#0066cc', // Blue
    '#ff6600', // Orange
    '#00cc66', // Green
    '#cc00cc', // Magenta
    '#cc6600', // Brown
    '#0099cc', // Cyan
    '#cc0066', // Pink
    '#66cc00'  // Lime
  ];

  /**
   * Get default options for line charts
   * @returns {Object} Default options object
   */
  static getDefaults(isMulti = false) {
    return {
      ...super.getDefaults(),
      type: 'line',
      lineColor: !isMulti ? '#0000ff' : LineChart.DEFAULT_SERIES_COLORS,
      fillColor: undefined,
      lineWidth: !isMulti ? 1 : [1],
      spotColor: '#f80',
      minSpotColor: '#f44',
      maxSpotColor: '#4f4',
      spotRadius: !isMulti ? 1.5 : [1.5],
      valueSpots: {},
      chartRangeClip: false,
      chartRangeMinX: undefined,
      chartRangeMaxX: undefined,
      xvalues: undefined,
      seriesNames: undefined,  // Optional array of series names
      dataLabels: undefined,   // Optional array of labels OR callback function(index) => label for data points (shown in tooltips)
      highlightSpotColor: undefined,    // Option spot highlight colour
      getPointDataLabel: undefined  // Alternative: callback function(index) => label for high-performance scenarios
    };
  }

  /**
   * Process input data and detect single-series vs multi-series format
   * Single-series: [1, 2, 3] or [[x1, y1], [x2, y2], ...]
   * Multi-series: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
   * @param {Array} data - Input data array
   * @returns {Array} Processed values array
   */
  processValues(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    // Detect multi-series data: [[1,2,3], [4,5,6], [7,8,9]]
    // Check if:
    // 1. Data has at least 2 elements
    // 2. First element is an array
    // 3. Second element is also an array (at least 2 series)
    // 4. First element of first array is NOT an array (not [[x,y], [x,y]] format)
    const isMultiSeries = data.length >= 2 &&
                          Array.isArray(data[0]) && 
                          Array.isArray(data[1]) &&
                          data[0].length > 0 &&
                          !Array.isArray(data[0][0]);
    
    if (isMultiSeries) {
      return this.processMultiSeriesValues(data);
    }

    // Single series processing
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
    this.isMultiSeries = false;
    return processed;
  }

  /**
   * Process multi-series data format
   * @param {Array<Array>} data - Array of series arrays
   * @returns {Array<Array>} Processed multi-series data
   * @private
   */
  processMultiSeriesValues(data) {
    this.isMultiSeries = true;
    this.seriesData = [];
    
    // Process each series
    data.forEach((series, seriesIndex) => {
      const xvals = [];
      const yvals = [];
      const processed = [];
      
      series.forEach((val, i) => {
        if (val === null || val === undefined) {
          processed.push(null);
          xvals.push(i);
          yvals.push(null);
        } else if (Array.isArray(val) && val.length === 2) {
          // Handle [x, y] pairs within series
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
      });
      
      this.seriesData.push({
        values: processed,
        xvalues: xvals,
        yvalues: yvals,
        seriesIndex: seriesIndex
      });
    });
    
    // Return the original data for compatibility
    return data;
  }

  /**
   * Draw the line chart on the canvas
   * Handles both single-series and multi-series rendering
   */
  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Check if this is multi-series data
    if (this.isMultiSeries) {
      this.drawMultiSeries();
      return;
    }
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { lineColor, fillColor, lineWidth, spotRadius, spotColor } = this.options;

    // Calculate ranges
    const yVals = this.yvalues.filter(v => v !== null);
    if (yVals.length === 0) return;

    const minY = this.options.chartRangeMin !== undefined ? this.options.chartRangeMin : Math.min(...yVals);
    const maxY = this.options.chartRangeMax !== undefined ? this.options.chartRangeMax : Math.max(...yVals);
    const minX = Math.min(...this.xvalues);
    const maxX = Math.max(...this.xvalues);
    
    // Store min/max for highlight to use
    this.minY = minY;
    this.maxY = maxY;

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

  /**
   * Draw multi-series line chart with multiple lines on the same canvas
   * Each series gets its own color from the color palette
   * @private
   */
  drawMultiSeries() {
    if (!this.seriesData || this.seriesData.length === 0) return;

    const ctx = this.ctx;
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    
    // Get or create per-series options
    // For multi-series, check if user provided custom values via getSeriesOption (which handles arrays)
    // If getSeriesOption returns the default, use our multi-series defaults
    const lineColors = this.getSeriesOption('lineColor', LineChart.DEFAULT_SERIES_COLORS);
    const fillColors = this.getSeriesOption('fillColor', [undefined]);
    const lineWidths = this.getSeriesOption('lineWidth', [1]);
    const spotRadii = this.getSeriesOption('spotRadius', [1.5]);

    // Calculate global ranges across all series
    let allYVals = [];
    let allXVals = [];
    
    this.seriesData.forEach(series => {
      allYVals.push(...series.yvalues.filter(v => v !== null));
      allXVals.push(...series.xvalues);
    });
    
    if (allYVals.length === 0) return;

    const minY = this.options.chartRangeMin !== undefined ? this.options.chartRangeMin : Math.min(...allYVals);
    const maxY = this.options.chartRangeMax !== undefined ? this.options.chartRangeMax : Math.max(...allYVals);
    const minX = Math.min(...allXVals);
    const maxX = Math.max(...allXVals);

    const rangeY = maxY - minY || 1;
    const rangeX = maxX - minX || 1;

    // Draw normal range if specified
    this.drawNormalRange(ctx, minY, maxY, rangeY, topOffset);

    // Store all series points for interaction
    this.multiSeriesPoints = [];
    this.regions = [];

    // Draw fills first (in reverse order so first series is on top)
    for (let s = this.seriesData.length - 1; s >= 0; s--) {
      const series = this.seriesData[s];
      const fillColor = fillColors[s % fillColors.length];
      
      if (fillColor && fillColor !== 'transparent' && fillColor !== '') {
        this.drawSeriesFill(ctx, series, minX, maxX, minY, maxY, rangeX, rangeY, fillColor, topOffset, height, bottomOffset);
      }
    }

    // Collect all points across all series for min/max spot detection
    const allPoints = [];

    // Draw lines and collect points
    this.seriesData.forEach((series, seriesIndex) => {
      const lineColor = lineColors[seriesIndex % lineColors.length];
      const lineWidth = lineWidths[seriesIndex % lineWidths.length];
      const spotRadius = spotRadii[seriesIndex % spotRadii.length];
      
      const seriesPoints = this.drawSeriesLine(ctx, series, minX, maxX, minY, maxY, rangeX, rangeY, lineColor, lineWidth, spotRadius, topOffset, height, seriesIndex);
      
      // Add to all points for min/max detection
      allPoints.push(...seriesPoints);
      
      // Calculate min/max for this series
      const seriesYVals = series.yvalues.filter(v => v !== null);
      const seriesMinY = seriesYVals.length > 0 ? Math.min(...seriesYVals) : minY;
      const seriesMaxY = seriesYVals.length > 0 ? Math.max(...seriesYVals) : maxY;
      
      this.multiSeriesPoints.push({
        seriesIndex,
        points: seriesPoints,
        color: lineColor,
        minY: seriesMinY,
        maxY: seriesMaxY
      });
    });
    
    // Draw min/max spots across all series
    if (allPoints.length > 0) {
      this.drawMinMaxSpots(allPoints, minY, maxY);
    }
    
    // Store the actual line colors used for tooltip rendering
    this.multiSeriesLineColors = lineColors;
  }

  /**
   * Get per-series option values
   * If option is an array, use each element for corresponding series
   * If option is a single value, use it for all series
   * @param {string} optionName - Name of the option to retrieve
   * @param {Array} defaultValues - Default values if option not specified
   * @returns {Array} Array of values, one per series
   * @private
   */
  getSeriesOption(optionName, defaultValues) {
    const optionValue = this.options[optionName];
    
    if (Array.isArray(optionValue)) {
      return optionValue;
    } else if (optionValue !== undefined && optionValue !== null) {
      // Check if this is actually the single-series default value
      // If so, use multi-series defaults instead
      const singleSeriesDefaults = LineChart.getDefaults();
      if (singleSeriesDefaults[optionName] === optionValue) {
        // This is the default value, use multi-series defaults
        return defaultValues;
      }
      // User explicitly set this value - use for all series
      return [optionValue];
    }
    
    // For multi-series, use the provided defaults
    // (Don't fall back to BaseChart defaults which are for single series)
    return defaultValues;
  }

  /**
   * Draw filled area under a series line
   * Handles null values by creating separate continuous segments
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} series - Series data object
   * @param {number} minX - Minimum x value
   * @param {number} maxX - Maximum x value
   * @param {number} minY - Minimum y value
   * @param {number} maxY - Maximum y value
   * @param {number} rangeX - X range (maxX - minX)
   * @param {number} rangeY - Y range (maxY - minY)
   * @param {string} fillColor - Fill color for the area
   * @param {number} topOffset - Top padding offset
   * @param {number} height - Drawing height
   * @param {number} bottomOffset - Bottom padding offset
   * @private
   */
  drawSeriesFill(ctx, series, minX, maxX, minY, maxY, rangeX, rangeY, fillColor, topOffset, height, bottomOffset) {
    const points = [];
    
    // Build points array
    for (let i = 0; i < series.values.length; i++) {
      if (series.yvalues[i] !== null) {
        const x = ((series.xvalues[i] - minX) / rangeX) * this.width;
        const y = topOffset + height - ((series.yvalues[i] - minY) / rangeY) * height;
        points.push({ x, y, index: i });
      }
    }

    if (points.length < 2) return;

    // Group into continuous segments
    const segments = [];
    let currentSegment = [];
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      if (currentSegment.length > 0) {
        const lastPointIndex = currentSegment[currentSegment.length - 1].index;
        let hasNullBetween = false;
        for (let j = lastPointIndex + 1; j < point.index; j++) {
          if (series.yvalues[j] === null) {
            hasNullBetween = true;
            break;
          }
        }
        if (hasNullBetween) {
          if (currentSegment.length > 0) {
            segments.push([...currentSegment]);
          }
          currentSegment = [];
        }
      }
      
      currentSegment.push(point);
    }
    
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    // Fill each segment
    ctx.save();
    ctx.fillStyle = fillColor;
    segments.forEach(segment => {
      if (segment.length > 1) {
        ctx.beginPath();
        segment.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        const lastPoint = segment[segment.length - 1];
        const firstPoint = segment[0];
        ctx.lineTo(lastPoint.x, this.height - bottomOffset);
        ctx.lineTo(firstPoint.x, this.height - bottomOffset);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.restore();
  }

  /**
   * Draw a line for a single series in a multi-series chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} series - Series data object
   * @param {number} minX - Minimum x value
   * @param {number} maxX - Maximum x value
   * @param {number} minY - Minimum y value
   * @param {number} maxY - Maximum y value
   * @param {number} rangeX - X range (maxX - minX)
   * @param {number} rangeY - Y range (maxY - minY)
   * @param {string} lineColor - Line color
   * @param {number} lineWidth - Line width in pixels
   * @param {number} spotRadius - Spot radius in pixels
   * @param {number} topOffset - Top padding offset
   * @param {number} height - Drawing height
   * @param {number} seriesIndex - Index of this series
   * @returns {Array<Object>} Array of point objects with {x, y, value, index, seriesIndex}
   * @private
   */
  drawSeriesLine(ctx, series, minX, maxX, minY, maxY, rangeX, rangeY, lineColor, lineWidth, spotRadius, topOffset, height, seriesIndex) {
    const points = [];
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    
    let lastWasNull = true;
    
    for (let i = 0; i < series.values.length; i++) {
      if (series.yvalues[i] !== null) {
        const x = ((series.xvalues[i] - minX) / rangeX) * this.width;
        const y = topOffset + height - ((series.yvalues[i] - minY) / rangeY) * height;
        
        const point = { x, y, value: series.yvalues[i], index: i, seriesIndex };
        points.push(point);
        
        // Store region for interaction
        this.regions.push({
          x: x - 5,
          y: y - 5,
          width: 10,
          height: 10,
          index: i,
          value: series.yvalues[i],
          seriesIndex: seriesIndex
        });
        
        if (lastWasNull) {
          ctx.moveTo(x, y);
          lastWasNull = false;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        lastWasNull = true;
      }
    }
    
    ctx.stroke();
    
    // Draw spots if specified and spotColor is set
    const spotColors = this.getSeriesOption('spotColor', [undefined]);
    const spotColor = spotColors[seriesIndex % spotColors.length];
    
    if (spotRadius > 0 && spotColor) {
      ctx.fillStyle = spotColor;
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, spotRadius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    
    return points;
  }

  /**
   * Draw a shaded normal range band on the chart
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} minY - Minimum y value of chart
   * @param {number} maxY - Maximum y value of chart
   * @param {number} rangeY - Y range (maxY - minY)
   * @param {number} topOffset - Top padding offset
   * @private
   */
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

  /**
   * Draw special colored spots for minimum and maximum values
   * For multi-series: shows only the global min and max across all series
   * For single-series: shows the min and max for that series
   * @param {Array<Object>} points - Array of point objects
   * @param {number} minY - Minimum y value across all data
   * @param {number} maxY - Maximum y value across all data
   * @private
   */
  drawMinMaxSpots(points, minY, maxY) {
    const { minSpotColor, maxSpotColor, spotRadius } = this.options;
    const ctx = this.ctx;
    
    if (!minSpotColor && !maxSpotColor) return;
    if (points.length === 0) return;

    // Find the actual min and max points (there could be multiple points with same value)
    const minPoints = points.filter(p => p.value === minY);
    const maxPoints = points.filter(p => p.value === maxY);

    // Draw min spots
    if (minSpotColor && minY !== maxY) {  // Don't draw if all values are the same
      ctx.fillStyle = minSpotColor;
      minPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, spotRadius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw max spots
    if (maxSpotColor && minY !== maxY) {  // Don't draw if all values are the same
      ctx.fillStyle = maxSpotColor;
      maxPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, spotRadius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  /**
   * Get the region (data point index) at a specific canvas coordinate
   * Used for click and touch interactions
   * @param {number} x - X coordinate on canvas
   * @param {number} y - Y coordinate on canvas
   * @returns {number|null} Index of the data point, or null if none found
   */
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

  /**
   * Get the nearest region (data point index) to cursor position
   * Used for smooth tooltip following behavior
   * Prioritizes horizontal distance for better line chart UX
   * @param {number} x - X coordinate on canvas
   * @param {number} y - Y coordinate on canvas
   * @returns {number|null} Index of the nearest data point, or null if none found
   */
  getNearestRegion(x, y) {
    // For multi-series, find nearest x-position across all series
    if (this.isMultiSeries && this.multiSeriesPoints) {
      let nearestIndex = null;
      let nearestDistance = Infinity;
      
      // Find the nearest x-position across all series
      this.multiSeriesPoints.forEach(seriesPoints => {
        seriesPoints.points.forEach(point => {
          const distance = Math.abs(point.x - x);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = point.index;
          }
        });
      });
      
      return nearestIndex;
    }
    
    // Single series logic
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

  /**
   * Draw highlight for the hovered data point(s)
   * For multi-series: highlights all points at the same x-position with a vertical line
   * For single-series: highlights the point with a spot and vertical line
   * @param {number} regionIndex - Index of the data point to highlight
   */
  drawHighlight(regionIndex) {
    const ctx = this.ctx;
    
    const { highlightLineColor, minSpotColor, maxSpotColor } = this.options;

    // Multi-series highlight - show all points at this index
    if (this.isMultiSeries && this.multiSeriesPoints) {
      let xPosition = null;
      
      const hlSpotColors = this.getSeriesOption('highlightSpotColor', [undefined]);
      const spotRadii = this.getSeriesOption('spotRadius', [1.5]);

      // Calculate global min/max across all series for this specific point
      let globalMin = Infinity;
      let globalMax = -Infinity;
      
      this.multiSeriesPoints.forEach((seriesPoints) => {
        const point = seriesPoints.points.find(p => p.index === regionIndex);
        if (point) {
          globalMin = Math.min(globalMin, point.value);
          globalMax = Math.max(globalMax, point.value);
        }
      });

      this.multiSeriesPoints.forEach((seriesPoints, seriesIndex) => {
        const point = seriesPoints.points.find(p => p.index === regionIndex);
        if (point) {
          xPosition = point.x;

          const highlightSpotColor = hlSpotColors[seriesIndex % hlSpotColors.length];
          
          // Highlight spot for each series
          // If highlightSpotColor is null, use the series color; otherwise use highlightSpotColor
          let spotColor = highlightSpotColor === undefined ? seriesPoints.color : highlightSpotColor;
          
          // Check if this point is the global min or max at this x-position
          if (highlightSpotColor === undefined) {
            const isGlobalMin = point.value === globalMin && globalMin !== globalMax && minSpotColor;
            const isGlobalMax = point.value === globalMax && globalMin !== globalMax && maxSpotColor;
            
            if (isGlobalMin) {
              spotColor = minSpotColor;
            } else if (isGlobalMax) {
              spotColor = maxSpotColor;
            }
          }
          
          if (spotColor) {
            ctx.fillStyle = spotColor;
            ctx.beginPath();                      
            ctx.arc(point.x, point.y, spotRadii[seriesIndex % spotRadii.length] + 1, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      });
      
      // Draw single vertical line at the x position
      if (xPosition !== null && highlightLineColor) {
        ctx.strokeStyle = highlightLineColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(xPosition, 0);
        ctx.lineTo(xPosition, this.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      return;
    }
    
    // Single series highlight
    if (!this.points || regionIndex >= this.points.length) return;
    
    const point = this.points.find(p => p.index === regionIndex);
    if (!point) return;

    const { highlightSpotColor } = this.options;
    
    // Highlight spot
    // If highlightSpotColor is null, use the spot color; otherwise use highlightSpotColor
    let spotColor = highlightSpotColor === undefined ? this.options.spotColor : highlightSpotColor;
    
    // Check if this point is a min or max and use appropriate color if highlightSpotColor is null
    if (highlightSpotColor === undefined && this.minY !== undefined && this.maxY !== undefined) {
      if (point.value === this.minY && minSpotColor) {
        spotColor = minSpotColor;
      } else if (point.value === this.maxY && maxSpotColor) {
        spotColor = maxSpotColor;
      }
    }
    
    if (spotColor) {
      ctx.fillStyle = spotColor;
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
   * Get tooltip content for a data point
   * For multi-series: shows all series values at the same x-position
   * For single-series: shows the value with min/max labels if applicable
   * @param {number} region - Index of the data point
   * @returns {Object|null} Tooltip content object with items array, or null if invalid
   */
  getTooltipContent(region) {
    // Multi-series tooltip - show all series at this index
    if (this.isMultiSeries && this.multiSeriesPoints && typeof region === 'number') {
      const items = [];
      const seriesNames = this.options.seriesNames || [];
      // Use the colors that were actually used during drawing
      const lineColors = this.multiSeriesLineColors || LineChart.DEFAULT_SERIES_COLORS;
      
      // Get the point label (date, month, etc.) to use as title
      const pointLabel = this.getPointLabel(region);
      
      // Calculate GLOBAL min/max across ALL data points in ALL series
      let globalMin = Infinity;
      let globalMax = -Infinity;
      
      this.multiSeriesPoints.forEach((seriesPoints) => {
        seriesPoints.points.forEach(point => {
          globalMin = Math.min(globalMin, point.value);
          globalMax = Math.max(globalMax, point.value);
        });
      });
      
      this.multiSeriesPoints.forEach((seriesPoints, idx) => {
        const point = seriesPoints.points.find(p => p.index === region);
        if (point) {
          const seriesName = seriesNames[idx] || `Series ${idx + 1}`;
          const value = point.value;
          const formattedValue = this.formatTooltipValue(value, region);
          
          // Check if this is the GLOBAL min or max across all data
          const isMin = value === globalMin && globalMin !== globalMax && this.options.minSpotColor;
          const isMax = value === globalMax && globalMin !== globalMax && this.options.maxSpotColor;
          
          let label;
          if (isMin) {
            label = `${seriesName}: ${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix} (Min)`;
          } else if (isMax) {
            label = `${seriesName}: ${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix} (Max)`;
          } else {
            label = `${seriesName}: ${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
          }
          
          const color = lineColors[idx % lineColors.length];
          
          items.push({ label, color });
        }
      });
      
      if (items.length > 0) {
        return { 
          title: pointLabel,  // Show label as title above all series
          items 
        };
      }
      
      return null;
    }
    
    // Single series tooltip - use title + items structure to match multi-series
    const color = this.getRegionColor(region);
    if (color && typeof region === 'number' && region >= 0 && region < this.yvalues.length) {
      const value = this.yvalues[region];

      // Check if this is a GLOBAL min/max value across all data
      const yVals = this.yvalues.filter(v => v !== null);
      const minY = Math.min(...yVals);
      const maxY = Math.max(...yVals);
      const isMin = value === minY && value !== maxY && this.options.minSpotColor;
      const isMax = value === maxY && value !== minY && this.options.maxSpotColor;

      // Get the point label (date, month, etc.)
      const pointLabel = this.getPointLabel(region);

      // Build the single item label (without repeating the pointLabel)
      let itemLabel;
      if (this.options.tooltipFormatter && typeof this.options.tooltipFormatter === 'function') {
        try {
          // Allow formatter to return the inner item text; pass context including pointLabel
          const result = this.options.tooltipFormatter(value, region, this, {
            isMin: isMin,
            isMax: isMax,
            minValue: minY,
            maxValue: maxY,
            pointLabel: pointLabel
          });
          itemLabel = this.sanitizeTooltipContent(result);
        } catch (error) {
          console.warn('Custom tooltip formatter error:', error);
          const defaultFormatted = this.getDefaultTooltipFormat(value, region);
          itemLabel = `${this.options.tooltipPrefix}${defaultFormatted}${this.options.tooltipSuffix}`;
        }
      } else {
        const formattedValue = this.formatTooltipValue(value, region);
        const fullFormattedValue = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;

        if (isMin) {
          itemLabel = `Min: ${fullFormattedValue}`;
        } else if (isMax) {
          itemLabel = `Max: ${fullFormattedValue}`;
        } else {
          itemLabel = `${fullFormattedValue}`;
        }
      }

      return {
        title: pointLabel,
        items: [{
          label: itemLabel,
          color: color
        }]
      };
    }
    
    return null; // Use default single-value tooltip without color
  }

  /**
   * Get the color for a specific data point region
   * Returns special colors for min/max points, or default spot/line color
   * @param {number} region - Index of the data point
   * @returns {string|null} Color string, or null if invalid region
   */
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

  /**
   * Get default tooltip format for line charts
   * Uses coordinate format (x, y) when no template format is specified
   * @param {number} value - Y value of the data point
   * @param {number} region - Index of the data point
   * @returns {string} Formatted tooltip string
   */
  getDefaultTooltipFormat(value, region) {
    // Only use coordinate format when explicitly no template format is provided
    if (!this.options.tooltipFormat || this.options.tooltipFormat === '') {
      const xValue = this.xvalues[region];
      return `(${xValue}, ${value})`;
    }
    
    // Otherwise use the base class default formatting
    return super.getDefaultTooltipFormat(value, region);
  }

  /**
   * Get enhanced tooltip data object for line charts
   * Includes x, y coordinates and point number information
   * @param {number} value - Y value of the data point
   * @param {number} region - Index of the data point
   * @returns {Object} Tooltip data object with x, y, point, and total properties
   */
  getTooltipData(value, region) {
    const baseData = {
      ...super.getTooltipData(value, region),
      y: value,
      point: region + 1,
      total: this.values?.length || 0
    };
    
    // Only add x if xvalues exists (single series)
    if (this.xvalues && typeof region === 'number') {
      baseData.x = this.xvalues[region];
    }
    
    return baseData;
  }

  /**
   * Get detailed field information for a specific region
   * Used for custom tooltip formatters and event handlers
   * @param {number} region - Index of the data point
   * @returns {Object} Object with isNull, value, index, x, y, color, fillColor, and offset properties
   */
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

  /**
   * Get additional padding needed for line charts
   * Adds padding for spot radius and highlight radius to prevent clipping at edges
   * Handles both single values and arrays (for multi-series)
   * @returns {Object} Padding object with top, right, bottom, left properties
   */
  getChartPadding() {
    // Get spot radius - could be a single value or array for multi-series
    const spotRadiusOption = this.options.spotRadius;
    let maxSpotRadius = 1.5; // default
    
    if (Array.isArray(spotRadiusOption)) {
      // Multi-series: find the maximum spot radius across all series
      maxSpotRadius = Math.max(...spotRadiusOption);
    } else if (typeof spotRadiusOption === 'number') {
      maxSpotRadius = spotRadiusOption;
    }
    
    // Get highlight spot radius - could also be an array
    const highlightSpotRadiusOption = this.options.highlightSpotRadius;
    let maxHighlightSpotRadius = maxSpotRadius + 1; // default is spotRadius + 1
    
    if (Array.isArray(highlightSpotRadiusOption)) {
      // Multi-series: find the maximum highlight spot radius
      maxHighlightSpotRadius = Math.max(...highlightSpotRadiusOption);
    } else if (typeof highlightSpotRadiusOption === 'number') {
      maxHighlightSpotRadius = highlightSpotRadiusOption;
    }
    
    // Use the larger of spot radius or highlight spot radius
    const maxRadius = Math.max(maxSpotRadius, maxHighlightSpotRadius);
    
    // Add the max radius + 1px safety margin on all sides
    const padding = maxRadius + 1;
    
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }
}
