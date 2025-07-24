// BoxChart.js
// Box plot implementation

import { BaseChart } from './BaseChart.js';

export class BoxChart extends BaseChart {
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'box',
      raw: false,
      boxLineColor: '#000',
      boxFillColor: '#cdf',
      whiskerColor: '#000',
      outlierLineColor: '#333',
      outlierFillColor: '#fff',
      medianColor: '#f00',
      showOutliers: true,
      outlierIQR: 1.5,
      spotRadius: 1.5,
      target: undefined,
      targetColor: '#4a2',
      minValue: undefined,
      maxValue: undefined
    };
  }

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

    return {
      q1,
      q2, // median
      q3,
      lowerWhisker,
      upperWhisker,
      outliers
    };
  }

  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      boxLineColor, boxFillColor, whiskerColor, 
      medianColor, outlierLineColor, outlierFillColor,
      showOutliers, spotRadius, target, targetColor, raw
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
      // Compute from raw data
      const validValues = this.values.filter(v => v !== null);
      if (validValues.length === 0) return;
      stats = this.calculateBoxPlotStats(validValues);
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

    // Helper function to get y coordinate
    const getY = (value) => topOffset + height - ((value - minVal) / range) * height;

    // Box dimensions - much narrower like the original
    const boxWidth = Math.min(this.width * 0.3, 20); // Max 20px wide
    const boxLeft = (this.width - boxWidth) / 2;
    const boxRight = boxLeft + boxWidth;

    // Draw box
    const boxTop = getY(stats.q3);
    const boxBottom = getY(stats.q1);
    const boxHeight = boxBottom - boxTop;

    ctx.fillStyle = boxFillColor;
    ctx.fillRect(boxLeft, boxTop, boxWidth, boxHeight);
    
    ctx.strokeStyle = boxLineColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);

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
    const whiskerWidth = Math.min(boxWidth * 0.8, 16); // Proportional to box width
    const whiskerLeft = centerX - whiskerWidth / 2;
    const whiskerRight = centerX + whiskerWidth / 2;

    // Upper whisker
    const upperWhiskerY = getY(stats.upperWhisker);
    ctx.beginPath();
    ctx.moveTo(centerX, boxTop);
    ctx.lineTo(centerX, upperWhiskerY);
    ctx.moveTo(whiskerLeft, upperWhiskerY);
    ctx.lineTo(whiskerRight, upperWhiskerY);
    ctx.stroke();

    // Lower whisker
    const lowerWhiskerY = getY(stats.lowerWhisker);
    ctx.beginPath();
    ctx.moveTo(centerX, boxBottom);
    ctx.lineTo(centerX, lowerWhiskerY);
    ctx.moveTo(whiskerLeft, lowerWhiskerY);
    ctx.lineTo(whiskerRight, lowerWhiskerY);
    ctx.stroke();

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
  }

  getRegionAtPoint(x, y) {
    // For box plots, we can return a special region indicator
    // Since it's not really an indexed data series, we'll return 0 to show summary stats
    const { width, height } = this;
    
    // Check if the point is within the chart bounds
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      return 0; // Return 0 to show box plot summary
    }
    
    return null;
  }

  // Get nearest region to mouse cursor for smooth tooltip following
  getNearestRegion(x, y) {
    // For box plots, always show the summary when mouse is over the chart
    const { width, height } = this;
    
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      return 0; // Always return 0 to show box plot summary
    }
    
    return null;
  }

  // Override getTooltipContent for box plots to show detailed statistics
  getTooltipContent(region) {
    const { raw } = this.options;
    let stats;
    
    if (raw && this.values.length >= 7) {
      stats = {
        q1: this.values[2],
        q2: this.values[3], // median
        q3: this.values[4],
        lowerWhisker: this.values[1],
        upperWhisker: this.values[5],
        outliers: [this.values[0], this.values[6]].filter(v => v !== null)
      };
    } else {
      const validValues = this.values.filter(v => v !== null);
      if (validValues.length === 0) return null;
      stats = this.calculateBoxPlotStats(validValues);
    }
    
    if (!stats) return null;
    
    const items = [
      {
        label: `Lower Quartile: ${stats.q1.toFixed(2)}`,
        color: this.options.boxFillColor
      },
      {
        label: `Median: ${stats.q2.toFixed(2)}`,
        color: this.options.medianColor
      },
      {
        label: `Upper Quartile: ${stats.q3.toFixed(2)}`,
        color: this.options.boxFillColor
      },
      {
        label: `Left Whisker: ${stats.lowerWhisker.toFixed(2)}`,
        color: this.options.whiskerColor
      },
      {
        label: `Right Whisker: ${stats.upperWhisker.toFixed(2)}`,
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
    
    return { items };
  }

  // Override tooltip formatting for box plots - matches original jquery.sparkline format
  getDefaultTooltipFormat(value, region) {
    const { raw } = this.options;
    let stats;
    
    if (raw && this.values.length >= 7) {
      stats = {
        q1: this.values[2],
        q2: this.values[3], // median
        q3: this.values[4],
        lowerWhisker: this.values[1],
        upperWhisker: this.values[5],
        outliers: [this.values[0], this.values[6]].filter(v => v !== null)
      };
    } else {
      const validValues = this.values.filter(v => v !== null);
      if (validValues.length === 0) return 'No data';
      stats = this.calculateBoxPlotStats(validValues);
    }
    
    if (!stats) return 'No data';
    
    // Format exactly like original jquery.sparkline: field names mapped to descriptive labels
    return `Lower Quartile: ${stats.q1.toFixed(2)}
Median: ${stats.q2.toFixed(2)}  
Upper Quartile: ${stats.q3.toFixed(2)}
Left Whisker: ${stats.lowerWhisker.toFixed(2)}
Right Whisker: ${stats.upperWhisker.toFixed(2)}`;
  }

  getRegionAtPoint(x, y) {
    // For box plots, we could detect different regions (quartiles, whiskers, etc.)
    // For now, return 0 if within the chart area
    const { topOffset } = this.getDrawingDimensions();
    if (x >= 0 && x <= this.width && y >= topOffset && y <= this.height - topOffset) {
      return 0;
    }
    return null;
  }

  getNearestRegion(x, y) {
    return this.getRegionAtPoint(x, y);
  }

  getRegionFields(region) {
    if (region === 0) {
      const { raw } = this.options;
      let stats;
      
      if (raw) {
        stats = {
          q1: this.values[2],
          q2: this.values[3], 
          q3: this.values[4],
          lowerWhisker: this.values[1],
          upperWhisker: this.values[5],
          outliers: [this.values[0], this.values[6]].filter(v => v !== null)
        };
      } else {
        const validValues = this.values.filter(v => v !== null);
        stats = this.calculateBoxPlotStats(validValues);
      }
      
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

  drawHighlight(region) {
    // Box plots don't typically have highlighting
    // Could be implemented to highlight different parts of the box
  }
}
